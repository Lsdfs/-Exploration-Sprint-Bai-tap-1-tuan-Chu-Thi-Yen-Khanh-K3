import {mockRealtime} from './realtime-helper.mjs';
﻿import { test, expect } from '@playwright/test';
async function openMia(page) {
 await page.goto('/'); await page.locator('.robot-launcher').click();
}
async function say(page,text){await page.locator('#help-question').fill(text);await page.locator('.send-button').click();}
test('Mia page has integrated voice, specialty guidance, app help and verified persistent booking',async({page},info)=>{
 await openMia(page);
 await expect(page.locator('.mia-page')).toBeVisible();
 await expect(page.locator('#help-question')).toBeVisible();
 await expect(page.getByRole('button',{name:'Nói với Mia',exact:true})).toBeVisible();
 await page.screenshot({path:`artifacts/mia-reference-${info.project.name}.png`});
 await say(page,'Gợi ý chuyên khoa');
 await expect(page.locator('.chat-messages')).toContainText('Nội tổng quát');
 await say(page,'Đơn thuốc ở đâu?');
 await expect(page.locator('.chat-messages')).toContainText('Trang chủ');
 await say(page,'Đặt giúp tôi khám tim ngày mai chín giờ tại Vinmec Times City, không chọn bác sĩ cụ thể');
 await expect(page.locator('.chat-booking-review')).toContainText('09:00');
 await page.reload(); await page.locator('.robot-launcher').click();
 await expect(page.locator('.chat-booking-review')).toContainText('Tim mạch');
 await expect(page.locator('.appointment-card')).toHaveCount(0);
 await say(page,'Xác nhận đặt lịch');
 await expect(page.locator('.success-content')).toContainText('Chờ xác nhận');
 await page.reload(); await page.locator('.robot-launcher').click();
 await say(page,'Mở trang lịch hẹn giúp tôi');
 await expect(page.locator('.appointment-card')).toHaveCount(1);
});
test('Mia explains a slow response and allows cancelling it',async({page})=>{
 await page.route('**/api/help',async route=>{await new Promise(r=>setTimeout(r,6500));await route.fulfill({json:{title:'Mia',text:'Đã xử lý.',target:null}}).catch(()=>{});});
 await openMia(page); await say(page,'Bấm ở đâu tiếp?');
 await expect(page.locator('.chat-wait')).toContainText('Đang xử lý');
 await expect(page.locator('.chat-wait')).toContainText('lâu hơn',{timeout:6000});
 await page.getByRole('button',{name:'Dừng chờ',exact:true}).click();
 await expect(page.locator('.send-button')).toBeEnabled();
});
test('Voice on the Mia page asks for verification and accepts corrections before saving',async({page})=>{
 await mockRealtime(page);
 await openMia(page);
 async function voice(text){
  await page.getByRole('button',{name:'Nói với Mia',exact:true}).click();
  await page.evaluate(text=>window.__miaVoice.onresult({results:[[{transcript:text}]]}),text);
 }
 await voice('Xác nhận đặt lịch');
 await expect(page.locator('.chat-messages')).toContainText('cần đủ thông tin');
 await voice('Đặt giúp tôi khám tim ngày mai chín giờ tại Vinmec Times City, không chọn bác sĩ cụ thể');
 await expect(page.locator('.chat-booking-review')).toContainText('09:00');
 await voice('Đổi sang tám giờ');
 await expect(page.locator('.chat-booking-review')).toContainText('08:00');
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('mia-appointments')||'[]').length)).toBe(0);
 await voice('Xác nhận đặt lịch');
 await expect(page.locator('.success-content')).toContainText('Chờ xác nhận');
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('mia-appointments'))[0].time)).toBe('08:00');
});
