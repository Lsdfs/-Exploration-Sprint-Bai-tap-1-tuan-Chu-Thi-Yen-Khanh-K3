import {test,expect} from '@playwright/test';
async function boot(page){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('.robot-launcher').click();
 await expect(page.locator('.send-button')).toBeEnabled();return errors;
}
async function say(page,text){await page.locator('#help-question').fill(text);await page.locator('.send-button').click();}
const complete='Đặt giúp tôi khám tim ngày mai chín giờ tại Vinmec Times City, không chọn bác sĩ cụ thể';
for(const phrase of ['Không xác nhận đặt lịch','Chưa xác nhận đặt lịch','Đừng xác nhận đặt lịch','Xác nhận đặt lịch là gì?','Tôi muốn biết xác nhận đặt lịch','Bỏ qua bước xác nhận đặt lịch']){
 test(`Novice does not authorize: ${phrase}`,async({page})=>{
  await boot(page);await say(page,complete);await expect(page.locator('.chat-booking-review')).toBeVisible();
  await say(page,phrase);
  await expect(page.locator('.chat-booking-review')).toBeVisible();
  await expect(page.locator('.success-content')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('mia-appointments')||'[]').length)).toBe(0);
 });
}
test('Novice answers one short phrase at a time and asks for specialty help',async({page})=>{
 const errors=await boot(page);await say(page,'Tôi muốn đặt lịch khám');
 await say(page,'Tôi');await expect(page.locator('.chat-prompt')).toContainText('chuyên khoa');
 await page.getByRole('button',{name:'Tôi chưa biết chọn chuyên khoa',exact:true}).click();
 await expect(page.locator('.chat-messages')).toContainText('Nội tổng quát');
 await say(page,'Mắt');await expect(page.locator('.chat-prompt')).toContainText('cơ sở');
 await say(page,'Times City');await expect(page.locator('.chat-prompt')).toContainText('bác sĩ');
 await say(page,'Không');await expect(page.locator('.chat-prompt')).toContainText('ngày nào');
 await say(page,'Ngày mốt');await expect(page.locator('.chat-prompt')).toContainText('giờ còn trống');
 await say(page,'Tám giờ');await expect(page.locator('.chat-booking-review')).toContainText('08:00');
 await expect(page.locator('.chat-booking-review')).toContainText('Mắt');expect(errors).toEqual([]);
});
for(const [edit,expected] of [['Đổi sang 25 giờ','giờ còn trống'],['Đổi sang ngày 32/10','ngày nào']]){
 test(`Novice corrects invalid edit without keeping old choice: ${edit}`,async({page})=>{
  await boot(page);await say(page,complete);await expect(page.locator('.chat-booking-review')).toBeVisible();
  await say(page,edit);await expect(page.locator('.chat-booking-review')).toHaveCount(0);
  await expect(page.locator('.chat-prompt')).toContainText(expected);
  await say(page,'Xác nhận đặt lịch');await expect(page.locator('.success-content')).toHaveCount(0);
 });
}
for(const scenario of [
 ['Người thân, da liễu, Hạ Long','Đặt lịch cho mẹ khám da liễu tại Vinmec Hạ Long ngày mai tám giờ, không chọn bác sĩ cụ thể','Da liễu','Bác Bình'],
 ['Bản thân, cơ xương khớp, Central Park','Đặt lịch cho tôi khám khớp tại Central Park ngày mai hai giờ chiều, không chọn bác sĩ cụ thể','Cơ xương khớp','Bác An'],
 ['Tai mũi họng và bác sĩ cụ thể','Đặt lịch cho tôi khám tai mũi họng tại Hải Phòng ngày mai chín giờ với Trần Minh Sơn','Tai mũi họng','Bác An'],
 ['Không dấu','Dat lich cho toi kham tong quat tai Smart City ngay mai 15 gio, khong chon bac si cu the','Nội tổng quát','Bác An'],
]){
 test(`Booking scenario: ${scenario[0]}`,async({page})=>{
  const errors=await boot(page);await say(page,scenario[1]);
  await expect(page.locator('.chat-booking-review')).toContainText(scenario[2]);
  await page.locator('[data-chat="confirm"]').click();
  await expect(page.locator('.success-content')).toContainText('Chờ xác nhận');
  await page.locator('#nav-appointments').click();
  await expect(page.locator('.appointment-card')).toContainText(scenario[2]);
  await expect(page.locator('.appointment-card')).toContainText(scenario[3]);expect(errors).toEqual([]);
 });
}
test('Correction to another facility asks again for a compatible doctor',async({page})=>{
 await boot(page);await say(page,'Đặt lịch cho tôi khám tim tại Times City ngày mai chín giờ với Nguyễn Minh Lan');
 await expect(page.locator('.chat-booking-review')).toContainText('Nguyễn Minh Lan');
 await say(page,'Đổi sang Central Park');await expect(page.locator('.chat-prompt')).toContainText('bác sĩ');
 await expect(page.locator('.chat-choices')).not.toContainText('Nguyễn Minh Lan');
 await say(page,'Không chọn bác sĩ cụ thể');await expect(page.locator('.chat-booking-review')).toContainText('Central Park');
});
test('Stop booking clears persisted draft and can restart cleanly',async({page})=>{
 await boot(page);await say(page,complete);await page.locator('[data-chat="booking-stop"]').click();
 expect(await page.evaluate(()=>sessionStorage.getItem('mia-draft'))).toBeNull();
 await say(page,'Tôi muốn đặt lịch khám');await expect(page.locator('.chat-prompt')).toContainText('bản thân');
});
test('Repeated confirmation and reload never create duplicate appointments',async({page})=>{
 await boot(page);await say(page,complete);await page.locator('[data-chat="confirm"]').dblclick();
 await expect(page.locator('.success-content')).toBeVisible();await say(page,'Xác nhận đặt lịch');
 await page.reload();await page.locator('.robot-launcher').click();await say(page,complete);
 await page.locator('[data-chat="confirm"]').click();await expect(page.locator('.chat-note')).toContainText('đã có');
 await page.locator('#nav-appointments').click();await expect(page.locator('.appointment-card')).toHaveCount(1);
});
test('Unavailable time, ambiguous morning and unrelated words ask again',async({page})=>{
 await boot(page);await say(page,'Đặt cho tôi khám tổng quát Times City ngày mai buổi sáng, không chọn bác sĩ cụ thể');
 await expect(page.locator('.chat-prompt')).toContainText('giờ còn trống');
 await expect(page.getByRole('button',{name:'10:00',exact:true})).toBeDisabled();
 await say(page,'Mười giờ');await expect(page.locator('.chat-note')).toContainText('chỗ');
 await say(page,'abc xyz');await expect(page.locator('.chat-note')).toContainText('chưa hiểu');
 await say(page,'Chọn giờ thứ hai');await expect(page.locator('.chat-booking-review')).toContainText('09:00');
});
