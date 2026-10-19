import {test,expect} from '@playwright/test';
async function boot(page){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.locator('.robot-launcher').click();
 await expect(page.locator('.send-button')).toBeEnabled();
 await page.getByRole('button',{name:'Thu gọn hướng dẫn',exact:true}).click();return errors;
}
async function home(page){await page.locator('#nav-home').click();}
async function close(page){await page.locator('#reference-dialog [data-ui="close"]').first().click();}
async function say(page,text){await page.locator('#help-question').fill(text);await page.locator('.send-button').click();}
const complete='Đặt giúp tôi khám tim ngày mai chín giờ tại Times City, không chọn bác sĩ cụ thể';
test('Home utility buttons and every contact button have a real destination or clear boundary',async({page})=>{
 const errors=await boot(page);
 for(const key of ['search','support']){
  await page.locator(`[data-ui="${key}"]`).first().click();
  await expect(page.locator('#reference-dialog')).toContainText('chưa kết nối');await close(page);
 }
 for(let i=0;i<11;i++){
  await page.getByRole('button',{name:'Liên hệ',exact:true}).click();
  await page.locator('.contact-row button[aria-label]').nth(i).click();
  await expect(page.locator('#reference-dialog')).toContainText('chưa kết nối');await close(page);
 }
 for(const key of ['medicine','payment','vaccines','reminders']){
  await home(page);await page.locator(`.service-grid [data-ui="${key}"]`).click();
  await page.locator('main [data-ui="connect"]').click();
  await expect(page.locator('main')).toContainText('Chưa kết nối hồ sơ y tế');
 }
 await home(page);await page.locator('.service-grid [data-ui="medicine"]').click();
 await page.locator('[data-ui="photo"]').click();await expect(page.getByRole('dialog')).toContainText('chưa kết nối');await close(page);
 await home(page);await page.locator('.service-grid [data-ui="mother"]').click();
 await page.locator('[data-ui="mother-detail"]').click();await expect(page.getByRole('dialog')).toContainText('chưa kết nối');expect(errors).toEqual([]);
});
test('Medical category cards, consultation buttons and community search work',async({page})=>{
 const errors=await boot(page);await page.locator('.service-grid [data-ui="medical"]').click();
 for(let i=0;i<7;i++){
  await page.locator('.medical-card').nth(i).locator('[data-detail]').click();
  await expect(page.getByRole('dialog')).toContainText('chưa kết nối');await close(page);
  await page.locator('.medical-card').nth(i).locator('[data-ui="support"]').click();
  await expect(page.getByRole('dialog')).toContainText('chưa kết nối');await close(page);
 }
 await page.locator('#medical-search').fill('khong co danh muc');await expect(page.locator('.medical-card:visible')).toHaveCount(0);
 await page.locator('#medical-search').fill('');await expect(page.locator('.medical-card:visible')).toHaveCount(7);
 await home(page);await page.locator('.service-grid [data-ui="community"]').click();
 const count=await page.locator('.community-list>button').count();expect(count).toBeGreaterThan(0);
 for(let i=0;i<count;i++){
  await page.locator('.community-list>button').nth(i).click();
  await expect(page.getByRole('dialog')).toContainText('chưa kết nối');await close(page);
 }
 await page.locator('#community-search').fill('khong co');await expect(page.locator('.community-list>button:visible')).toHaveCount(0);
 expect(errors).toEqual([]);
});
test('All-services extras, account, benefits connection and profile results respond',async({page})=>{
 const errors=await boot(page);
 for(const index of [0,1]){
  await page.locator('.service-grid [data-ui="all"]').click();
  await page.locator('#reference-dialog .extra-service').nth(index).click();
  await expect(page.getByRole('dialog')).toContainText('chưa kết nối');await close(page);
 }
 await page.locator('.service-grid [data-ui="benefits"]').click();
 await page.locator('#reference-dialog [data-ui="connect"]').click();
 await expect(page.locator('main')).toContainText('Chưa kết nối hồ sơ y tế');
 await page.locator('.ref-bottom [data-ui="account"]').click();
 await expect(page.locator('#page-title')).toContainText('Tài khoản');
 await page.locator('#nav-profile').click();await page.locator('#profile-results').click();
 await page.locator('.result-card').click();await expect(page.getByRole('dialog')).toContainText('Phiếu khám mẫu');await close(page);
 await page.locator('#nav-profile').click();await page.locator('#profile-doctors').click();
 await page.locator('#doctor-search').fill('Tim mạch');await expect(page.locator('.doctor-card:visible')).toHaveCount(2);
 await page.locator('#doctor-search').fill('khong co');await expect(page.locator('.doctor-card:visible')).toHaveCount(0);
 expect(errors).toEqual([]);
});
test('Every Mia feature card can open and close without trapping navigation',async({page})=>{
 const errors=await boot(page);await page.getByRole('button',{name:'Trợ lý sức khỏe AI MIA',exact:true}).click();
 for(const key of ['symptoms','nutrition','connections']){
  await page.locator(`[data-mia="${key}"]`).click();await expect(page.locator('#mia-dialog')).toBeVisible();
  await page.locator('#mia-dialog [data-mia="close"]').first().click();await expect(page.locator('#mia-dialog')).not.toBeVisible();
 }
 await page.locator('[data-mia="book"]').click();await expect(page.locator('#mia-dialog')).toContainText('Thông tin cơ bản');
 await page.keyboard.press('Escape');await expect(page.locator('#mia-dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'Quay lại trang chủ',exact:true}).click();await expect(page.locator('.ref-home')).toBeVisible();
 expect(errors).toEqual([]);
});
test('Chat submission failure keeps selections and retry records exactly one request',async({page})=>{
 await boot(page);await page.getByRole('button',{name:'Công cụ dùng thử',exact:true}).click();
 await page.locator('#simulate-submit-error').check();await page.getByRole('button',{name:'Đóng công cụ',exact:true}).click();
 await page.locator('.robot-launcher').click();await say(page,complete);await page.locator('[data-chat="confirm"]').click();
 await expect(page.locator('.chat-note')).toContainText('Chưa ghi nhận');
 await expect(page.locator('.chat-booking-review')).toContainText('09:00');
 await page.locator('[data-chat="confirm"]').click();await expect(page.locator('.success-content')).toBeVisible();
 await page.locator('#nav-appointments').click();await expect(page.locator('.appointment-card')).toHaveCount(1);
});
test('Reset deletes saved appointments and drafts, including after reload',async({page})=>{
 await boot(page);await page.locator('.robot-launcher').click();await say(page,complete);
 await page.getByRole('button',{name:'Công cụ dùng thử',exact:true}).click();
 await page.getByRole('button',{name:'Bắt đầu phiên mới',exact:true}).click();
 await page.getByRole('button',{name:'Xóa và bắt đầu lại',exact:true}).click();
 expect(await page.evaluate(()=>sessionStorage.getItem('mia-draft'))).toBeNull();
 await page.reload();await page.locator('[data-chat="intro-dismiss"]').click();await page.locator('#nav-appointments').click();await expect(page.locator('.appointment-card')).toHaveCount(0);
});
test('Corrupt storage and config network errors still allow local booking',async({page})=>{
 await page.addInitScript(()=>{sessionStorage.setItem('mia-draft','{broken');sessionStorage.setItem('mia-appointments','null');});
 await page.route('**/api/config',route=>route.abort());
 const errors=await boot(page);await page.locator('.robot-launcher').click();await say(page,complete);
 await expect(page.locator('.chat-booking-review')).toContainText('Tim mạch');expect(errors).toEqual([]);
});
test('Blocked browser storage displays a warning but booking can finish',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError');};});
 const errors=await boot(page);await page.locator('.robot-launcher').click();await say(page,complete);
 await expect(page.locator('.chat-note')).toContainText('Không thể giữ bản nháp');
 await page.locator('[data-chat="confirm"]').click();await expect(page.locator('.success-content')).toBeVisible();expect(errors).toEqual([]);
});
test('Profile input requires validation and cancelling save preserves the old profile',async({page})=>{
 const errors=await boot(page);await page.locator('#nav-profile').click();await page.locator('#profile-personal').click();
 await page.locator('#profile-name').fill('');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await expect(page.locator('#profile-confirm-dialog')).not.toBeVisible();
 await page.locator('#profile-name').fill('Bác Demo');await page.locator('#profile-year').fill('1800');
 await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();await expect(page.locator('#profile-confirm-dialog')).not.toBeVisible();
 await page.locator('#profile-year').fill('1960');await page.getByRole('button',{name:'Lưu thay đổi',exact:true}).click();
 await page.getByRole('button',{name:'Quay lại chỉnh sửa',exact:true}).click();
 await page.locator('#nav-profile').click();await page.locator('#profile-personal').click();await expect(page.locator('#profile-name')).toHaveValue('Bác An');
 expect(errors).toEqual([]);
});
