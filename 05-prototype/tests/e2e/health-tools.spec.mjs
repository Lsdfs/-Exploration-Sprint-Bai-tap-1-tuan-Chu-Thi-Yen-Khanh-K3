import {test,expect} from '@playwright/test';
async function boot(page){await page.goto('/');await page.locator('.robot-launcher').click();}
async function say(page,text){await page.locator('#help-question').fill(text);await page.locator('.send-button').click();}
for(const mode of ['nutrition','symptoms'])test(`${mode} card sends the right mode, streams voice and retains follow-up context`,async({page},info)=>{
 const requests=[];
 await page.addInitScript(()=>{
  window.__spoken=[];
  window.Audio=class{play(){queueMicrotask(()=>this.onended?.());return Promise.resolve();}pause(){}removeAttribute(){}};
  const original=window.fetch.bind(window);window.fetch=(url,options)=>{if(url==='/api/tts'){window.__spoken.push(JSON.parse(options.body).text);return Promise.resolve(new Response('RIFFtestWAVE',{headers:{'content-type':'audio/wav'}}));}return original(url,options);};
  window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},getVoices(){return[{name:'HoaiMy',lang:'vi-VN'}];},speak(item){window.__spoken.push(item.text);item.onend?.();}}});
 });
 await page.route('**/api/help',async route=>{
  requests.push(route.request().postDataJSON());
  await route.fulfill({headers:{'content-type':'application/x-ndjson'},body:[{type:'meta',title:'Mia',target:null,provider:'openai',fallback:false,mode},{type:'delta',text:mode==='nutrition'?'Ước tính bữa ăn khoảng 500–650 kcal. Bạn dùng bao nhiêu dầu?':'Bạn bị đau đầu từ khi nào? Có sốt hoặc yếu tay chân không?'},{type:'done'}].map(e=>JSON.stringify(e)).join('\n')+'\n'});
 });
 await boot(page);await page.locator(`[data-mia="${mode}"]`).click();
 await expect(page.locator('.mia-health-banner')).toContainText(mode==='nutrition'?'Phân tích dinh dưỡng':'Kiểm tra triệu chứng');
 await expect(page.locator('#mia-dialog')).toHaveCount(0);
 await say(page,mode==='nutrition'?'200g cơm và 100g thịt có bao nhiêu calo?':'Tôi đau đầu nhẹ hai ngày');
 await expect(page.locator('.guide-message')).toContainText(mode==='nutrition'?'kcal':'đau đầu');
 await expect(page.locator('.send-button')).toBeEnabled();
 expect(requests[0].mode).toBe(mode);expect(requests[0].history).toEqual([]);
 await say(page,mode==='nutrition'?'Khoảng một thìa cà phê dầu':'Tôi 35 tuổi, không sốt');
 await expect.poll(()=>requests.length).toBe(2);expect(requests[1].history.length).toBe(2);
 expect(await page.evaluate(()=>window.__spoken.length)).toBeGreaterThan(1);
 await page.screenshot({path:`artifacts/mia-${mode}-${info.project.name}.png`});
 await page.locator('[data-chat="health-exit"]').click();await expect(page.locator('.mia-tools')).toBeVisible();
});
test('Health mode unavailable reports the actual limit, then booking still works',async({page})=>{
 await boot(page);await page.locator('[data-mia="nutrition"]').click();await say(page,'Một bát cơm bao nhiêu calo?');
 await expect(page.locator('.guide-message')).toContainText('chưa thể phân tích');
 await page.locator('[data-chat="health-exit"]').click();await page.locator('[data-mia="book"]').click();
 await expect(page.locator('#mia-dialog')).toContainText('Thông tin cơ bản');
});
test('Urgent symptoms bypass unavailable model and do not create an appointment',async({page})=>{
 await boot(page);await page.locator('[data-mia="symptoms"]').click();await say(page,'Đau ngực dữ dội và khó thở');
 await expect(page.locator('.guide-message')).toContainText('cấp cứu ngay');
 expect(await page.evaluate(()=>sessionStorage.getItem('mia-appointments'))).toBeNull();
});
