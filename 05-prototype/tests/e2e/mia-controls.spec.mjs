import {mockRealtime} from './realtime-helper.mjs';
import { test, expect } from '@playwright/test';

test('Real browser microphone button keeps Mia and the current page open', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  await context.clearPermissions();
  await page.route('**/api/config', route => route.fulfill({ json: { provider: 'openai', ready: true } }));
  await page.goto('/');
  await page.locator('.robot-launcher').click();
  const url = page.url();
  const button = page.locator('.voice-button');
  if (await button.isEnabled()) {
    await button.click();
    await expect(page.locator('.voice-status')).toBeVisible();
  }
  await expect(page.locator('.chatbot-panel')).toBeVisible();
  await expect(page.locator('#help-question')).toBeEditable();
  expect(page.url()).toBe(url);
  expect(errors).toEqual([]);
});

test('Microphone startup failure and denied permission keep chat open and allow retry', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mockRealtime(page);
  await page.addInitScript(()=>{window.__failStart=true;});
  await page.goto('/');
  await page.locator('.robot-launcher').click();
  await page.locator('.voice-button').click();
  await expect(page.locator('.voice-status')).toContainText('chưa kết nối được');
  await expect(page.locator('.voice-button')).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => { window.__failStart = false; });
  await page.locator('.voice-button').click();
  await expect(page.locator('.chatbot-panel')).toHaveAttribute('data-status', 'listening');
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError');}; });
  await page.locator('.voice-button').click();
  await page.locator('.voice-button').click();
  await expect(page.locator('.voice-status')).toContainText('Micro chưa được cho phép');
  await expect(page.locator('.chatbot-panel')).toBeVisible();
  await expect(page.locator('#help-question')).toBeEditable();
  expect(errors).toEqual([]);
});

test('Fast double click during microphone startup stops cleanly without leaving chat', async ({ page }) => {
  await mockRealtime(page);
  await page.addInitScript(()=>{window.__holdStart=true;});
  await page.goto('/');
  await page.locator('.robot-launcher').click();
  await page.locator('.voice-button').click();
  await expect(page.locator('.voice-button')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.voice-button').click();
  await expect(page.locator('.voice-button')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.chatbot-panel')).toBeVisible();
});
