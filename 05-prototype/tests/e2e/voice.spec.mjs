import {mockRealtime} from './realtime-helper.mjs';
import { test, expect } from '@playwright/test';
import { availableDates } from '../../src/domain.mjs';

async function boot(page, supported = true) {
  await mockRealtime(page, supported);
  await page.goto('/'); await page.locator('.robot-launcher').click();
  await expect(page.locator('.send-button')).toBeEnabled();
  const open = page.getByRole('button', { name: 'Mở hướng dẫn', exact: true });
  if (await open.isVisible()) await open.click();
}
async function listen(page) {
  await page.getByRole('button', { name: 'Nói với Mia', exact: true }).click();
  await expect(page.locator('.voice-status')).toContainText('Đang nghe');
}
async function say(page, text) {
  await page.evaluate(text => { window.__voice.onresult({ results: [[{ transcript: text }]] }); window.__voice.onend?.(); }, text);
}

test('Interim speech is visible immediately but only the final result runs a command', async ({ page }) => {
  await boot(page); await listen(page);
  await page.evaluate(() => {
    const result = [{ transcript: 'Đặt lịch' }]; result.isFinal = false;
    window.__voice.onresult({ resultIndex: 0, results: [result] });
  });
  await expect(page.locator('.voice-status')).toContainText('Đặt lịch');
  await expect(page.locator('.chat-message.user')).toHaveCount(0);
  await expect(page.locator('.chat-prompt')).toHaveCount(0);
  await say(page, 'Tôi muốn đặt lịch khám');
  await expect(page.locator('.chat-prompt')).toBeVisible();
});

test('Spoken greeting gets a direct reply and repeated final events are ignored', async ({ page }) => {
  await boot(page); await listen(page);
  await page.evaluate(() => {
    const recognition = window.__voice;
    const event = { results: [[{ transcript: 'Xin chào' }]] };
    recognition.onresult(event);
    recognition.onresult(event);
  });
  await expect(page.locator('.chat-message.user')).toHaveCount(1);
  await expect(page.locator('.chat-messages')).toContainText('Mia đang nghe đây');
  await expect(page.locator('.voice-review')).toHaveCount(0);
});
test('Voice starts booking immediately without a transcript confirmation and creates no appointment', async ({ page }) => {
  await boot(page); await listen(page);
  await say(page, 'Tôi muốn đặt lịch khám');
  await expect(page.locator('.voice-review')).toHaveCount(0);
  await expect(page.locator('.chat-prompt')).toContainText('bản thân hay người thân');
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('mia-appointments')||'[]').length)).toBe(0);
});
test('A second spoken request navigates without additional buttons', async ({ page }) => {
  await boot(page); await listen(page);
  await say(page, 'Tôi muốn đặt lịch khám');
  await expect(page.locator('.chat-prompt')).toBeVisible();
  await listen(page);
  await say(page, 'Mở trang lịch hẹn giúp tôi');
  await expect(page.locator('#page-title')).toHaveText('Lịch hẹn thử của cô/chú');
});
test('Spoken khoa noi selects internal medicine and preserves the requested date and hour', async ({ page }) => {
  await boot(page); await listen(page);
  await say(page, 'Đặt giúp tôi khoa nội ngày mai chín giờ tại Vinmec Times City');
  await expect(page.locator('.chat-prompt')).toContainText('bác sĩ');
  await listen(page);
  await say(page, 'Không chọn bác sĩ cụ thể');
  await expect(page.locator('.chat-booking-review')).toContainText('Nội tổng quát');
  await expect(page.locator('.chat-booking-review')).toContainText('Vinmec Times City');
  await expect(page.locator('.chat-booking-review')).toContainText(availableDates()[0].label);
  await expect(page.locator('.chat-booking-review')).toContainText('09:00');
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('mia-appointments')||'[]').length)).toBe(0);
});
test('Denied microphone and network errors allow typing to continue', async ({ page }) => {
  await boot(page); await listen(page);
  await page.evaluate(() => window.__voice.onerror({ error: 'network' }));
  await expect(page.locator('.voice-status')).toContainText('kết nối');
  await listen(page);
  await page.evaluate(() => window.__voice.onerror({ error: 'network' }));
  await expect(page.locator('.voice-status')).toContainText('chưa kết nối được');
  await page.locator('#help-question').fill('Bấm ở đâu tiếp?');
  await expect(page.locator('#help-question')).toHaveValue('Bấm ở đâu tiếp?');
});
test('Unsupported recognition has a clear fallback without a microphone request', async ({ page }) => {
  await boot(page, false);
  await expect(page.getByRole('button', { name: 'Nói với Mia', exact: true })).toBeDisabled();
  await expect(page.locator('.voice-status')).toContainText('chưa hỗ trợ');
  await page.locator('#help-question').fill('Bấm ở đâu tiếp?');
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.locator('.guide-message')).toContainText('Mình bắt đầu từ đây nhé');
});
test('Navigation stops capture and ignores a late recognition result', async ({ page }) => {
  await boot(page); await listen(page);
  await page.getByRole('button',{name:'Quay lại trang chủ',exact:true}).click();
  await page.locator('#nav-appointments').click();
  await expect(page.locator('#page-title')).toHaveText('Lịch hẹn thử của cô/chú');
  await page.evaluate(() => window.__voice.onresult?.({ results: [[{ transcript: 'Tôi muốn đặt lịch khám' }]] }));
  await expect(page.locator('#page-title')).toHaveText('Lịch hẹn thử của cô/chú');
  await expect(page.locator('#voice-transcript')).toHaveCount(0);
  expect(await page.evaluate(() => window.__voice.aborted)).toBe(true);
  expect(await page.evaluate(() => window.__trackStopped)).toBe(true);
});

test('Declining audio sharing never requests the microphone or a session',async({page})=>{
  await boot(page);
  await page.evaluate(()=>{window.confirm=()=>false;navigator.mediaDevices.getUserMedia=()=>{throw Error('Must not capture');};});
  let requests=0;page.on('request',req=>{if(req.url().endsWith('/api/voice'))requests++;});
  await page.locator('.voice-button').click();
  await expect(page.locator('.voice-button')).toHaveAttribute('aria-pressed','false');
  expect(requests).toBe(0);
});

test('Stopping while microphone permission is pending closes a late stream',async({page})=>{
  await boot(page);
  await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{window.__resolveMic=resolve;});});
  await page.locator('.voice-button').click();
  await expect(page.locator('.voice-button')).toHaveAttribute('aria-pressed','true');
  await page.locator('.voice-button').click();
  await page.evaluate(()=>window.__resolveMic({getTracks:()=>[{stop(){window.__lateStopped=true;}}]}));
  await expect.poll(()=>page.evaluate(()=>window.__lateStopped)).toBe(true);
  await expect(page.locator('.voice-button')).toHaveAttribute('aria-pressed','false');
});

test('Session setup error is displayed and the microphone is released',async({page})=>{
  await boot(page);
  await page.route('**/api/voice',route=>route.fulfill({status:503,json:{error:'Micro cần bật OpenAI.'}}));
  await page.locator('.voice-button').click();
  await expect(page.locator('.voice-status')).toContainText('Micro cần bật OpenAI');
  await expect.poll(()=>page.evaluate(()=>window.__trackStopped)).toBe(true);
  await expect(page.locator('#help-question')).toBeEditable();
});
