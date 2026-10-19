import {test,expect} from '@playwright/test';
async function setup(page){
 await page.addInitScript(()=>{
  window.__played=[];window.__paused=0;
  window.Audio=class{constructor(url){this.url=url;}play(){window.__played.push(this.url);queueMicrotask(()=>this.onended?.());return Promise.resolve();}pause(){window.__paused++;}removeAttribute(){}};
  Object.defineProperty(window,'speechSynthesis',{value:{speak(){throw new Error('Browser TTS must not be used');},getVoices(){throw new Error('Browser voices must not be loaded');}}});
 });
 await page.goto('/');await page.locator('.robot-launcher').click();
}
test('Local voice reads each complete streamed sentence before completion',async({page})=>{
 const spoken=[];
 await page.route('**/api/tts',route=>{spoken.push(route.request().postDataJSON().text);return route.fulfill({contentType:'audio/wav',body:Buffer.from('RIFFtestWAVE')});});
 await page.addInitScript(()=>{
  const original=window.fetch.bind(window);window.fetch=(url,options)=>{
   if(url!=='/api/help')return original(url,options);
   const encoder=new TextEncoder();
   return Promise.resolve(new Response(new ReadableStream({start(controller){
    window.__emit=event=>controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));window.__done=()=>controller.close();
    window.__emit({type:'meta',title:'Mia',target:null,provider:'openai',fallback:false});
   }}),{headers:{'content-type':'application/x-ndjson'}}));
  };
 });
 await setup(page);await page.locator('#help-question').fill('Bấm ở đâu tiếp?');await page.locator('.send-button').click();
 await page.evaluate(()=>window.__emit({type:'delta',text:'Bạn chọn '}));
 await expect(page.locator('.guide-message')).toContainText('Bạn chọn');expect(spoken).toHaveLength(0);
 await page.evaluate(()=>window.__emit({type:'delta',text:'ngày nhé. '}));
 await expect.poll(()=>spoken).toEqual(['Bạn chọn ngày nhé. ']);
 await expect.poll(()=>page.evaluate(()=>window.__played.length)).toBe(1);
 await expect(page.locator('.send-button')).toBeDisabled();
 await page.evaluate(()=>{window.__emit({type:'delta',text:'Mia hỏi lại'});window.__emit({type:'done'});window.__done();});
 await expect.poll(()=>spoken.length).toBe(2);await expect(page.locator('.send-button')).toBeEnabled();
});
test('Local voice errors show a clear message, never switch back to system male voice',async({page})=>{
 await page.route('**/api/tts',route=>route.fulfill({status:503,json:{error:'unavailable'}}));
 await setup(page);await page.locator('[data-mia="nutrition"]').click();
 await expect(page.locator('.mia-voice-notice')).toContainText('cục bộ');
 expect(await page.evaluate(()=>window.__played.length)).toBe(0);
});
test('Stop reading aborts prepared local audio',async({page})=>{
 let release;const gate=new Promise(r=>{release=r;});
 await page.route('**/api/tts',async route=>{await gate;await route.fulfill({contentType:'audio/wav',body:Buffer.from('RIFFtestWAVE')}).catch(()=>{});});
 await setup(page);await page.locator('[data-mia="nutrition"]').click();
 await page.getByRole('button',{name:'Dừng đọc',exact:true}).click();release();
 await expect(page.getByRole('button',{name:'Dừng đọc',exact:true})).toHaveCount(0);
 await expect(page.locator('.chat-messages')).toContainText('khẩu phần');
 expect(await page.evaluate(()=>window.__played.length)).toBe(0);
});
