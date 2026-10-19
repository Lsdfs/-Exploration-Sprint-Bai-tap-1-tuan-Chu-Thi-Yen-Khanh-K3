import { test, expect } from '@playwright/test';
test('Entry spotlights the small reference Mia; dismiss keeps chat closed', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('.mia-intro-dimmer')).toBeVisible();
  await expect(page.getByRole('dialog', {name:'Làm quen với Mia'})).toContainText('Nếu bạn cần giúp đỡ thì hãy nói chuyện với Mia nhé!');
  await expect(page.locator('.chatbot-panel')).toBeHidden();
  await expect(page.locator('.robot-launcher img')).toHaveAttribute('src','/assets/mia.png');
  await expect.poll(()=>page.locator('.robot-launcher img').evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
  const image = await page.locator('.robot-launcher').boundingBox();
  const nav = await page.locator('.ref-bottom').boundingBox();
  expect(image.width).toBe(84);
  expect(image.y+image.height).toBeLessThanOrEqual(nav.y);
  await page.screenshot({path:`artifacts/mia-intro-${info.project.name}.png`});
  await page.getByRole('button',{name:'Đã hiểu',exact:true}).click();
  await expect(page.locator('.mia-intro-dimmer')).toHaveCount(0);
  await expect(page.locator('.chatbot-panel')).toBeHidden();
  await page.getByRole('button',{name:'Mở hướng dẫn',exact:true}).click();
  await expect(page.locator('.chatbot-panel')).toBeVisible();
  await page.getByRole('button',{name:'Thu gọn hướng dẫn',exact:true}).click();
  await page.getByRole('button',{name:'Lịch hẹn',exact:true}).first().click();
  await expect(page.locator('.mia-intro-dimmer')).toHaveCount(0);
  await expect(page.locator('.robot-launcher')).toBeVisible();
});
test('Tapping spotlight Mia opens chat directly',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Mở hướng dẫn',exact:true}).click();
  await expect(page.locator('.mia-intro-dimmer')).toHaveCount(0);
  await expect(page.locator('.chatbot-panel')).toBeVisible();
});
