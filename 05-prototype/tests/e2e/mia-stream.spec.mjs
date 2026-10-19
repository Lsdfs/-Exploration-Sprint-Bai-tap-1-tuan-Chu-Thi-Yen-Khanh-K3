import { test, expect } from '@playwright/test';

async function fragmentedStream(page){
  await page.addInitScript(()=>{
    window.__spoken=[];window.__cancelled=0;
    window.Audio=class{play(){return Promise.resolve();}pause(){}removeAttribute(){}};
    window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
    Object.defineProperty(window,'speechSynthesis',{value:{
      getVoices(){return[{name:'HoaiMy',lang:'vi-VN'}];},
      cancel(){window.__cancelled++;},speak(item){window.__spoken.push(item.text);}
    }});
    const original=window.fetch.bind(window);
    window.fetch=(url,options)=>{
      if(url==='/api/tts'){window.__spoken.push(JSON.parse(options.body).text);return Promise.resolve(new Response('RIFFtestWAVE',{headers:{'content-type':'audio/wav'}}));}
      if(url!=='/api/help')return original(url,options);
      const encoder=new TextEncoder();
      return Promise.resolve(new Response(new ReadableStream({start(controller){
        window.__stream=controller;
        window.__emit=event=>controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));
        window.__emit({type:'meta',title:'Mia',target:null,provider:'openai',fallback:false});
      }}),{headers:{'content-type':'application/x-ndjson'}}));
    };
  });
  await page.goto('/');await page.locator('.robot-launcher').click();
  await page.locator('#help-question').fill('Bấm ở đâu tiếp?');await page.locator('.send-button').click();
}

test('Text streams by fragment while voice reads complete sentences, then the final tail',async({page})=>{
  await fragmentedStream(page);
  await page.evaluate(()=>window.__emit({type:'delta',text:'Cô chú chọn '}));
  await expect(page.locator('.guide-message')).toContainText('Cô chú chọn');
  expect(await page.evaluate(()=>window.__spoken)).toEqual([]);
  await page.evaluate(()=>{window.__emit({type:'delta',text:'ngày nhé. '});window.__emit({type:'delta',text:'Sau đó chọn giờ'});});
  await expect.poll(()=>page.evaluate(()=>window.__spoken)).toEqual(['Cô chú chọn ngày nhé. ']);
  await expect(page.locator('.guide-message')).toContainText('Sau đó chọn giờ');
  await page.evaluate(()=>{window.__emit({type:'done'});window.__stream.close();});
  await expect(page.locator('.send-button')).toBeEnabled();
  expect(await page.evaluate(()=>window.__spoken)).toEqual(['Cô chú chọn ngày nhé. ','Sau đó chọn giờ']);
});

test('Fallback replaces partial output, cancels old speech and respects stop reading',async({page})=>{
  await fragmentedStream(page);
  await page.evaluate(()=>window.__emit({type:'delta',text:'Câu cũ. ' }));
  await expect.poll(()=>page.evaluate(()=>window.__spoken.length)).toBe(1);
  await page.getByRole('button',{name:'Dừng đọc',exact:true}).click();
  await page.evaluate(()=>{
    window.__emit({type:'meta',title:'Hướng dẫn dự phòng',target:null,provider:'local',fallback:true,replace:true});
    window.__emit({type:'delta',text:'Bạn có thể thử lại.'});window.__emit({type:'done'});window.__stream.close();
  });
  await expect(page.locator('.guide-message')).toContainText('Bạn có thể thử lại.');
  await expect(page.locator('.guide-message')).not.toContainText('Câu cũ');
  expect(await page.evaluate(()=>window.__spoken)).toEqual(['Câu cũ. ']);
});

test('Navigation cancels speech and prevents late deltas from speaking or appearing',async({page})=>{
  await fragmentedStream(page);
  await page.evaluate(()=>window.__emit({type:'delta',text:'Câu đầu. ' }));
  await expect.poll(()=>page.evaluate(()=>window.__spoken.length)).toBe(1);
  await page.getByRole('button',{name:'Quay lại trang chủ',exact:true}).click();
  await page.locator('#nav-appointments').click();
  await page.evaluate(()=>{window.__emit({type:'delta',text:'CÂU CŨ ĐẾN MUỘN.'});window.__emit({type:'done'});window.__stream.close();});
  await expect(page.locator('#page-title')).toContainText('Lịch hẹn');
  expect(await page.evaluate(()=>window.__spoken)).toEqual(['Câu đầu. ']);
  await expect(page.locator('.chatbot-panel')).not.toContainText('CÂU CŨ ĐẾN MUỘN');
});

test('Reply text and speech start before completion; stop reading also stops later chunks', async ({ page }) => {
  await page.addInitScript(() => {
    window.__spoken = [];
    window.Audio=class{play(){return Promise.resolve();}pause(){}removeAttribute(){}};
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { value: {
      cancel() {}, getVoices() { return [{ name: 'HoaiMy', lang: 'vi-VN' }]; },
      speak(utterance) { window.__spoken.push(utterance.text); },
    } });
    const originalFetch = window.fetch.bind(window);
    window.fetch = (url, options) => {
      if(url==='/api/tts'){window.__spoken.push(JSON.parse(options.body).text);return Promise.resolve(new Response('RIFFtestWAVE',{headers:{'content-type':'audio/wav'}}));}
      if (url !== '/api/help') return originalFetch(url, options);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({ start(controller) {
        window.__stream = controller;
        window.__emit = event => controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        window.__emit({ type: 'meta', title: 'Mia', target: null, provider: 'mock', fallback: false });
        window.__emit({ type: 'delta', text: 'Cô chú cứ nói nhé. ' });
      } });
      return Promise.resolve(new Response(stream, { headers: { 'content-type': 'application/x-ndjson' } }));
    };
  });
  await page.goto('/');
  await page.locator('.robot-launcher').click();
  await page.locator('#help-question').fill('Bấm ở đâu tiếp?');
  await page.locator('.send-button').click();
  await expect(page.locator('.guide-message')).toContainText('Cô chú cứ nói nhé.');
  await expect.poll(() => page.evaluate(() => window.__spoken.includes('Cô chú cứ nói nhé. '))).toBe(true);
  await expect(page.locator('.send-button')).toBeDisabled();
  await page.getByRole('button', { name: 'Dừng đọc', exact: true }).click();
  await page.evaluate(() => {
    window.__emit({ type: 'delta', text: 'Mia vẫn ở đây.' });
    window.__emit({ type: 'done' });
    window.__stream.close();
  });
  await expect(page.locator('.guide-message')).toContainText('Mia vẫn ở đây.');
  await expect(page.locator('.send-button')).toBeEnabled();
  expect(await page.evaluate(() => window.__spoken.includes('Mia vẫn ở đây.'))).toBe(false);
});
