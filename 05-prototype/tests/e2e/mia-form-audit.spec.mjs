import {test,expect} from '@playwright/test';
async function start(page){
 await page.goto('/');await page.locator('.robot-launcher').click();
 await page.getByRole('button',{name:'Thu gọn hướng dẫn',exact:true}).click();
 await page.getByRole('button',{name:'Trợ lý sức khỏe AI MIA',exact:true}).click();
 await page.locator('[data-mia="book"]').click();
}
async function pick(page,field,value){
 await page.locator(`[data-mia="pick-${field}"]`).click();
 await page.locator(`[data-mia-value="${value}"]`).click();
 await page.locator('[data-mia="picker-confirm"]').click();
}
test('Closing a picker returns to the booking form and preserves previous selections',async({page})=>{
 await start(page);await pick(page,'location','times');
 await page.locator('[data-mia="pick-location"]').click();
 await page.locator('#mia-dialog [data-mia="close"]').click();
 await expect(page.locator('#mia-dialog')).toBeVisible();
 await expect(page.locator('#mia-dialog')).toContainText('Thông tin cơ bản');
 await expect(page.locator('[data-mia="pick-location"]')).toContainText('Times City');
 await page.locator('[data-mia="pick-location"]').click();await page.keyboard.press('Escape');
 await expect(page.locator('#mia-dialog')).toContainText('Thông tin cơ bản');
});
test('Pickers search, empty results, back, all review edits and consent reset work',async({page})=>{
 await start(page);
 await expect(page.locator('[data-mia="next"]')).toBeDisabled();
 await page.locator('#mia-reason').fill('');await expect(page.locator('[data-mia="next"]')).toBeDisabled();
 await page.locator('#mia-reason').fill('Khám định kỳ mẫu');
 await page.locator('[data-mia="pick-location"]').click();
 await page.locator('.mia-picker-search').fill('khong co');await expect(page.locator('.mia-picker-list>button:visible')).toHaveCount(0);
 await page.locator('.mia-picker-search').fill('Times City');await expect(page.locator('.mia-picker-list>button:visible')).toHaveCount(1);
 await page.locator('[data-mia-value="times"]').click();await page.locator('[data-mia="picker-confirm"]').click();
 await page.locator('[data-mia="next"]').click();
 await pick(page,'service','heart');await pick(page,'doctor','times-heart-lan');
 await page.locator('[data-mia="pick-schedule"]').click();
 await expect(page.locator('[data-mia="picker-confirm"]')).toBeDisabled();
 await page.locator('[data-mia-date]').first().click();await page.locator('[data-mia-time="09:00"]').click();
 await page.locator('[data-mia="picker-confirm"]').click();await page.locator('[data-mia="next"]').click();
 for(const key of ['profile','reason','location','service','doctor','schedule']){
  await page.locator('#mia-terms').check();await page.locator('#mia-privacy').check();
  await expect(page.locator('[data-mia="confirm"]')).toBeEnabled();
  await page.locator(`[data-mia-edit="${key}"]`).click();
  if(['location','service','doctor','schedule'].includes(key))await page.locator('[data-mia="picker-confirm"]').click();
  while(await page.locator('[data-mia="next"]').count())await page.locator('[data-mia="next"]').click();
  await expect(page.locator('[data-mia="confirm"]')).toBeDisabled();
 }
 await page.locator('[data-mia="previous"]').click();await expect(page.locator('#mia-dialog')).toContainText('Thông tin đặt lịch');
 await page.locator('[data-mia="next"]').click();await page.locator('#mia-terms').check();await page.locator('#mia-privacy').check();
 await page.locator('[data-mia="confirm"]').click();await expect(page.locator('#mia-dialog')).toContainText('Chờ xác nhận');
});
