import {test,expect} from '@playwright/test';
async function boot(page){await page.goto('/');await page.locator('.robot-launcher').click();await expect(page.locator('.send-button')).toBeEnabled();}
async function say(page,text){await page.locator('#help-question').fill(text);await page.locator('.send-button').click();}
test('A real client timeout explains failure, releases the input and keeps booking draft',async({page})=>{
 await page.addInitScript(()=>{
  const original=window.fetch.bind(window);
  window.fetch=(url,options)=>url==='/api/help'?new Promise((resolve,reject)=>{
   options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
  }):original(url,options);
 });
 await boot(page);await say(page,'Đặt lịch cho tôi');
 await expect(page.locator('.chat-prompt')).toContainText('chuyên khoa');
 await say(page,'Giải thích triệu chứng giúp tôi');
 await expect(page.locator('.chat-wait')).toContainText('lâu hơn',{timeout:6000});
 await expect(page.locator('.guide-message')).toContainText('hướng dẫn có sẵn',{timeout:12000});
 await expect(page.locator('.send-button')).toBeEnabled();
 await expect(page.locator('.chat-prompt')).toContainText('chuyên khoa');
});
test('Broken reply stream falls back without losing the ability to submit another request',async({page})=>{
 await page.route('**/api/help',route=>route.fulfill({headers:{'content-type':'application/x-ndjson'},body:'{"type":"meta","title":"Mia","target":null}\n{"type":"delta","text":"Đang hỗ trợ."}\n'}));
 await boot(page);await say(page,'Bấm ở đâu tiếp?');
 await expect(page.locator('.guide-message')).toContainText('hướng dẫn có sẵn');
 await expect(page.locator('.send-button')).toBeEnabled();
 await say(page,'Tôi muốn đặt lịch khám');await expect(page.locator('.chat-prompt')).toContainText('bản thân');
});
test('Cancelling an in-flight answer ignores its late text',async({page})=>{
 await page.addInitScript(()=>{
  const original=window.fetch.bind(window);
  window.fetch=(url,options)=>url==='/api/help'?new Promise(resolve=>{window.__lateHelp=()=>resolve(new Response(JSON.stringify({title:'OLD ANSWER',text:'OLD ANSWER MUST NOT APPEAR',target:null}),{headers:{'content-type':'application/json'}}));}):original(url,options);
 });
 await boot(page);await say(page,'Bấm ở đâu tiếp?');await page.getByRole('button',{name:'Dừng chờ',exact:true}).click();
 await page.evaluate(()=>window.__lateHelp());
 await say(page,'Xin chào');await expect(page.locator('.chat-messages')).toContainText('Mia đang nghe');
 await expect(page.locator('.chatbot-panel')).not.toContainText('OLD ANSWER');await expect(page.locator('.send-button')).toBeEnabled();
});
test('App feature questions in the middle of booking keep all collected details',async({page})=>{
 await boot(page);await say(page,'Đặt lịch cho mẹ khám da liễu tại Hạ Long');
 const initial=await page.evaluate(()=>sessionStorage.getItem('mia-draft'));
 for(const [question,answer] of [
  ['Đơn thuốc ở đâu?','Đơn thuốc'],['Làm sao xem sổ tiêm?','Sổ tiêm'],['Tạm ứng viện phí thế nào?','Tạm ứng viện phí'],
  ['Liên hệ tổng đài ở đâu?','Liên hệ'],['Thông tin có lưu không?','tab này'],['Mia làm được gì?','giọng nói'],
 ]){
  await say(page,question);await expect(page.locator('.chat-messages')).toContainText(answer);
  expect(await page.evaluate(()=>sessionStorage.getItem('mia-draft'))).toBe(initial);
 }
});
