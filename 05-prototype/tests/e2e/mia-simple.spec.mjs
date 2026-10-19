import { test, expect } from '@playwright/test';

test('Short windows show both entry actions without a second scrollbar', async ({ page }) => {
  await page.setViewportSize({ width: 496, height: 640 });
  await page.goto('/');
  await page.locator('.robot-launcher').click();
  const layout = await page.evaluate(() => {
    const composer = document.querySelector('.chat-composer');
    const scroll = document.querySelector('.chatbot-scroll').getBoundingClientRect();
    const actions = document.querySelector('.chat-main-actions').getBoundingClientRect();
    return { overflow: composer.scrollHeight > composer.clientHeight, actionsBottom: actions.bottom, scrollBottom: scroll.bottom };
  });
  expect(layout.overflow).toBe(false);
  expect(layout.actionsBottom).toBeLessThanOrEqual(layout.scrollBottom);
});

test('Mia focuses on the current step and keeps input visible', async ({ page }, info) => {
  await page.goto('/');
  await page.locator('.robot-launcher').click();
  await expect(page.locator('#help-question')).toBeVisible();
  await expect(page.locator('#chat-voice-mode')).not.toBeVisible();
  await expect(page.locator('.guide-message')).not.toBeVisible();
  await page.getByRole('button', { name: 'Đặt lịch khám', exact: true }).first().click();
  await expect(page.locator('.chat-greeting')).not.toBeVisible();
  await expect(page.locator('.chat-main-actions')).not.toBeVisible();
  await expect(page.locator('.chat-prompt')).toContainText('bản thân');
  const input = await page.locator('#help-question').boundingBox();
  const panel = await page.locator('.chatbot-panel').boundingBox();
  expect(input.y + input.height).toBeLessThanOrEqual(panel.y + panel.height);
  await expect(page.locator('.chat-settings')).toHaveCount(0);
  await expect(page.locator('.chat-context')).toHaveCount(0);
  await page.screenshot({ path: `artifacts/mia-simplified-${info.project.name}.png` });
});
