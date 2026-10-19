import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function openHelp(page) {
  const toggle = page.getByRole('button', { name: 'Mở hướng dẫn', exact: true });
  if (await toggle.isVisible()) await toggle.click();
}

async function start(page, person = 'Bác An', location = 'Times City', service = 'Nội tổng quát') {
  const collapse = page.getByRole('button', { name: 'Thu gọn hướng dẫn', exact: true });
  if (await collapse.isVisible()) await collapse.click();
  await page.locator('#start-booking').click();
  await page.getByRole('button', { name: new RegExp(person) }).click();
  await page.locator('#next-step').click();
  await page.getByRole('button', { name: new RegExp(location) }).click();
  await page.locator('#next-step').click();
  await page.getByRole('button', { name: new RegExp(service) }).click();
  await page.locator('#next-step').click();
}
async function toReview(page, person, location, service) {
  await start(page, person, location, service);
  await page.locator('[data-field="date"]').first().click();
  await page.getByRole('button', { name: '09:00', exact: true }).click();
  await page.locator('#next-step').click();
  await expect(page.getByRole('heading', { name: 'Mình kiểm tra lại nhé' })).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await page.goto('/'); await page.locator('.robot-launcher').click();
  await expect(page.locator('.send-button')).toBeEnabled();
  await page.getByRole('button', { name: 'Thu gọn hướng dẫn', exact: true }).click();
});
test('Home renders with readable simulated-data disclosure and no horizontal overflow', async ({ page }, info) => {
  await expect(page.getByText('Bản thử · Lịch giả', { exact: true })).toBeVisible();
  await expect(page.locator('#page-title')).toHaveText('MyVinmec');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: `artifacts/home-${info.project.name}.png`, fullPage: true });
});
test('Books for self only after review and shows pending rather than confirmed', async ({ page }, info) => {
  await toReview(page);
  await page.locator('#submit-booking').click();
  await expect(page.getByRole('alert')).toContainText('tích ô');
  await page.locator('#accept-booking').check();
  await page.locator('#submit-booking').dblclick();
  await expect(page.getByRole('heading', { name: 'Đã gửi yêu cầu thử', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('main .status-pill')).toHaveText('Chờ xác nhận · Mô phỏng');
  await page.locator('#view-appointments').click();
  await expect(page.locator('.appointment-card')).toHaveCount(1);
  await expect(page.locator('.appointment-card')).toContainText('Bác An');
  await expect(page.locator('.appointment-card')).toContainText('09:00');
  await page.screenshot({ path: `artifacts/appointments-${info.project.name}.png`, fullPage: true });
});
test('Books for a family member at another location and specialty', async ({ page }) => {
  await toReview(page, 'Bác Bình', 'Central Park', 'Tim mạch');
  await expect(page.locator('#review-details')).toContainText('Bác Bình');
  await expect(page.locator('#review-details')).toContainText('Central Park');
  await expect(page.locator('#review-details')).toContainText('Tim mạch');
  await page.locator('#accept-booking').check();
  await page.locator('#submit-booking').click();
  await expect(page.getByRole('heading', { name: 'Đã gửi yêu cầu thử', exact: true, level: 1 })).toBeVisible();
});
test('Missing fields prevent advancing and back retains prior choices', async ({ page }) => {
  await page.locator('#start-booking').click();
  for (const [field, choice] of [['profile', /Bác An/], ['location', /Times City/], ['service', /Nội tổng quát/]]) {
    await page.locator('#next-step').click();
    await expect(page.getByRole('alert')).toBeVisible();
    await page.getByRole('button', { name: choice }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.locator('#next-step').click();
  }
  await page.locator('#next-step').click();
  await expect(page.getByRole('alert')).toContainText('chọn một ngày');
  await page.locator('[data-field="date"]').first().click();
  await page.locator('#next-step').click();
  await expect(page.getByRole('alert')).toContainText('chọn một giờ');
  await page.locator('#back-step').click();
  await expect(page.locator('[data-field="service"][aria-pressed="true"]')).toContainText('Nội tổng quát');
});
test('Unavailable slots cannot be selected and changing date resets the selected time', async ({ page }) => {
  await start(page);
  await expect(page.getByRole('button', { name: '09:00', exact: true })).toBeDisabled();
  await page.locator('[data-field="date"]').first().click();
  await expect(page.getByRole('button', { name: '10:00, hết chỗ', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '09:00', exact: true }).click();
  await page.locator('[data-field="date"]').nth(1).click();
  await expect(page.locator('[data-field="time"][aria-pressed="true"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '10:00', exact: true })).toBeEnabled();
});
test('Editing review keeps other fields and requires renewed acceptance', async ({ page }, info) => {
  await toReview(page);
  await page.locator('#accept-booking').check();
  await page.getByRole('button', { name: 'Sửa người khám', exact: true }).click();
  await page.getByRole('button', { name: /Bác Bình/ }).click();
  await page.locator('#next-step').click();
  await expect(page.locator('#review-details')).toContainText('Bác Bình');
  await expect(page.locator('#review-details')).toContainText('Times City');
  await expect(page.locator('#review-details')).toContainText('09:00');
  await expect(page.locator('#accept-booking')).not.toBeChecked();
  await page.screenshot({ path: `artifacts/review-${info.project.name}.png`, fullPage: true });
});
test('Discard asks for confirmation; keeping draft preserves selections', async ({ page }) => {
  await page.locator('#start-booking').click();
  await page.getByRole('button', { name: /Bác An/ }).click();
  await page.getByRole('button', { name: 'Bỏ bản nháp này', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Bỏ bản nháp này?' })).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục đặt lịch', exact: true }).click();
  await expect(page.locator('[data-field="profile"][aria-pressed="true"]')).toContainText('Bác An');
  await page.getByRole('button', { name: 'Bỏ bản nháp này', exact: true }).click();
  await page.getByRole('button', { name: 'Bỏ bản nháp', exact: true }).click();
  await expect(page.locator('#start-booking')).toContainText('Đặt lịch khám');
  await page.locator('#start-booking').click();
  await expect(page.locator('[data-field="profile"][aria-pressed="true"]')).toHaveCount(0);
});
test('Simulated submit error preserves draft and retry creates one request', async ({ page }) => {
  await toReview(page);
  await page.getByRole('button', { name: 'Công cụ dùng thử' }).click();
  await page.locator('#simulate-submit-error').check();
  await page.getByRole('button', { name: 'Đóng công cụ' }).click();
  await page.locator('#accept-booking').check();
  await page.locator('#submit-booking').click();
  await expect(page.getByRole('alert')).toContainText('Chưa ghi nhận');
  await expect(page.locator('#review-details')).toContainText('09:00');
  await page.locator('#submit-booking').click();
  await expect(page.getByRole('heading', { name: 'Đã gửi yêu cầu thử', exact: true, level: 1 })).toBeVisible();
  await page.locator('#view-appointments').click();
  await expect(page.locator('.appointment-card')).toHaveCount(1);
});
test('Duplicate appointment is rejected across separate booking attempts', async ({ page }) => {
  await toReview(page);
  await page.locator('#accept-booking').check();
  await page.locator('#submit-booking').click();
  await expect(page.locator('#view-appointments')).toBeVisible();
  await page.locator('#nav-home').click();
  await toReview(page);
  await page.locator('#accept-booking').check();
  await page.locator('#submit-booking').click();
  await expect(page.getByRole('alert')).toContainText('đã có');
  await page.locator('#nav-appointments').click();
  await expect(page.locator('.appointment-card')).toHaveCount(1);
});
test('Assistant starts a booking conversation without creating an appointment', async ({ page }) => {
  await openHelp(page);
  await page.locator('#help-question').fill('Tôi muốn đặt lịch');
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.locator('.chat-prompt')).toContainText('bản thân hay người thân');
  await expect(page.locator('.chat-choice[data-chat-field="profile"]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Thu gọn hướng dẫn', exact: true }).click();
  await page.locator('#nav-appointments').click();
  await expect(page.getByRole('heading', { name: 'Chưa có yêu cầu thử nào' })).toBeVisible();
});

test('Medical queries and unrelated input do not produce clinical advice', async ({ page }) => {
  await openHelp(page);
  await page.locator('#help-question').fill('Đau ngực thì chọn chuyên khoa nào?');
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.locator('.guide-message')).toContainText('không tư vấn bệnh');
  await page.locator('#help-question').fill('xyz');
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.locator('.guide-message')).toContainText('muốn được giúp phần nào');
});
test('Network failure falls back and navigation discards stale AI replies', async ({ page }) => {
  await openHelp(page);
  await page.route('**/api/help', route => route.abort());
  await page.locator('#help-question').fill('Bấm ở đâu tiếp?');
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.locator('.fallback-note')).toBeVisible();
  await page.unroute('**/api/help');
  await page.route('**/api/help', async route => { await new Promise(resolve => setTimeout(resolve, 500)); await route.fulfill({ json: { title: 'OLD REPLY', text: 'Stale', target: null } }).catch(() => {}); });
  await page.locator('#help-question').fill('Bấm ở đâu tiếp?');
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Gửi câu hỏi', exact: true })).toBeDisabled();
  const collapse = page.getByRole('button', { name: 'Thu gọn hướng dẫn', exact: true });
  if (await collapse.isVisible()) await collapse.click();
  await page.locator('#start-booking').click();
  await expect(page.locator('#page-title')).toContainText('Cô/chú đặt lịch cho ai');
  await page.waitForTimeout(600);
  await expect(page.locator('.guide-message')).toHaveCount(0);
  await expect(page.getByText('OLD REPLY', { exact: true })).toHaveCount(0);
});
test('Guidance off remains a complete usable flow and can be re-enabled', async ({ page }) => {
  await openHelp(page);
  await page.getByRole('button', { name: 'Hướng dẫn: Bật', exact: true }).click();
  await expect(page.getByText('Cô/chú đang tự thao tác')).toBeVisible();
  const collapse = page.getByRole('button', { name: 'Thu gọn hướng dẫn', exact: true });
  if (await collapse.isVisible()) await collapse.click();
  await toReview(page);
  await page.locator('#accept-booking').check();
  await page.locator('#submit-booking').click();
  await expect(page.locator('#view-appointments')).toBeVisible();
  await page.getByRole('button', { name: 'Hướng dẫn: Tắt', exact: true }).click();
  await expect(page.locator('#page-title')).toHaveText('Đã gửi yêu cầu thử');
  await openHelp(page);
  await expect(page.locator('#help-question')).toBeEditable();
});
test('Large text stays within viewport and keyboard can select a profile', async ({ page }) => {
  await page.getByRole('button', { name: 'Dùng chữ lớn hơn', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#start-booking').click();
  await page.getByRole('button', { name: /Bác An/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-field="profile"][aria-pressed="true"]')).toContainText('Bác An');
  await page.locator('#next-step').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('Log export has action counts but no question text, and reset starts an empty session', async ({ page }) => {
  await openHelp(page);
  await page.locator('#help-question').fill('CHUOI_RIENG_TU_DE_KIEM_TRA');
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.locator('.guide-message')).toContainText('muốn được giúp phần nào');
  await page.getByRole('button', { name: 'Công cụ dùng thử' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải log thao tác (JSON)', exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let contents = ''; for await (const chunk of stream) contents += chunk;
  const log = JSON.parse(contents);
  expect(log.events.some(e => e.event === 'assistant_question')).toBe(true);
  expect(contents).not.toContain('CHUOI_RIENG_TU_DE_KIEM_TRA');
  await page.getByRole('button', { name: 'Bắt đầu phiên mới', exact: true }).click();
  await page.getByRole('button', { name: 'Xóa và bắt đầu lại', exact: true }).click();
  await page.locator('#nav-appointments').click();
  await expect(page.getByRole('heading', { name: 'Chưa có yêu cầu thử nào' })).toBeVisible();
});
test('Live mode asks for consent before sending any question', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/config', route => route.fulfill({ json: { provider: 'openai', model: 'gpt-4.1-mini', ready: true } }));
  await page.route('**/api/help', route => { calls++; return route.fulfill({ json: { title: 'Đã hiểu', text: 'Bấm Đặt lịch khám.', target: 'start-booking', provider: 'openai', fallback: false } }); });
  await page.reload();
  await expect(page.locator('.send-button')).toBeEnabled();
  await openHelp(page);
  await page.locator('#help-question').fill('Bấm ở đâu tiếp?');
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.locator('.guide-message')).toContainText('Cần cô/chú đồng ý');
  expect(calls).toBe(0);
  await page.locator('#ai-consent').check();
  await page.locator('#help-question').fill('Bấm ở đâu tiếp?');
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.locator('.guide-message')).toContainText('Đã hiểu');
  expect(calls).toBe(1);
});
