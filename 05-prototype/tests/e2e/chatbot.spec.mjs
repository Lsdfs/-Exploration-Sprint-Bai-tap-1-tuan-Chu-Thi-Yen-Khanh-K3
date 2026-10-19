import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }, info) => {
  if (/voice|Voice/.test(info.title)) await page.route('**/chatbot.mjs', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace("voiceMode:'native'", "voiceMode:'simulation'") });
  }); await page.goto('/'); await page.locator('.robot-launcher').click(); await expect(page.locator('.send-button')).toBeEnabled(); });
async function chat(page, text) {
  await page.locator('#help-question').fill(text);
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click();
  await expect(page.locator('.chatbot-panel')).not.toHaveAttribute('data-status', 'processing');
}
async function voice(page, text) {
  await page.getByRole('button', { name: 'Nói với Mia', exact: true }).click();
  await page.getByLabel('Câu nói mô phỏng').fill(text);
  await page.getByRole('button', { name: 'Nhận câu mô phỏng', exact: true }).click();
  await page.getByRole('button', { name: 'Dùng yêu cầu này', exact: true }).click();
  await expect(page.locator('.chatbot-panel')).not.toHaveAttribute('data-status', 'processing');
}
test('Mia voice books, changes spoken hours and confirms only from review', async ({ page }) => {
  await expect(page.locator('.mia-avatar')).toHaveAttribute('src', '/assets/mia.png');
  await voice(page, 'Xác nhận đặt lịch');
  await expect(page.locator('.chat-messages')).toContainText('cần đủ thông tin');
  await voice(page, 'Đặt giúp tôi khám tim ngày mai chín giờ tại Vinmec Times City');
  await voice(page, 'Không chọn bác sĩ cụ thể');
  await expect(page.locator('.chat-booking-review')).toContainText('09:00');
  await voice(page, 'Đổi sang tám giờ');
  await expect(page.locator('.chat-booking-review')).toContainText('08:00');
  await voice(page, 'Xác nhận đặt lịch');
  await expect(page.locator('.chat-messages')).toContainText('Đã ghi nhận lịch hẹn mô phỏng');
});
test('Voice remains available during a tour and opens the referenced page', async ({ page }) => {
  await voice(page, 'Chỉ tôi cách xem lịch hẹn');
  await expect(page.locator('#nav-appointments')).toHaveClass(/coach-target/);
  await voice(page, 'Mở giúp tôi luôn');
  await expect(page.locator('#page-title')).toHaveText('Lịch hẹn thử của cô/chú');
});
test('Robot greets immediately and conversational booking requires a user confirmation', async ({ page }, info) => {
  await expect(page.locator('.robot-avatar')).toBeVisible();
  await expect(page.locator('.chat-greeting')).toContainText('Xin chào!');
  await page.screenshot({ path: `artifacts/chat-welcome-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Đặt lịch khám', exact: true }).first().click();
  await page.getByRole('button', { name: 'Bản thân · Bác An', exact: true }).click();
  await page.getByRole('button', { name: 'Tim mạch', exact: true }).click();
  await page.getByRole('button', { name: 'Vinmec Times City', exact: true }).click();
  await page.getByRole('button', { name: 'Không chọn bác sĩ cụ thể', exact: true }).click();
  await page.locator('.chat-choice[data-chat-field="date"]').first().click();
  await page.getByRole('button', { name: '09:00', exact: true }).click();
  await expect(page.locator('.chat-booking-review')).toContainText('Bác An');
  await chat(page, 'Xác nhận đặt lịch');
  await expect(page.locator('.chat-messages')).toContainText('Đã ghi nhận lịch hẹn mô phỏng');
  await page.getByRole('button', { name: 'Xem lịch hẹn', exact: true }).click();
  await expect(page.locator('.appointment-card')).toContainText('Tim mạch');
  await expect(page.locator('.appointment-card')).toContainText('09:00');
  await page.screenshot({ path: `artifacts/chat-booking-${info.project.name}.png`, fullPage: true });
});
test('Guide highlights a real target and only advances after the user follows it', async ({ page }) => {
  await chat(page, 'Chỉ tôi cách xem lịch hẹn');
  await expect(page.locator('#nav-appointments')).toHaveClass(/coach-target/);
  await expect(page.locator('.coach-bubble')).toContainText('Lịch hẹn');
  await expect(page.locator('#page-title')).toHaveText('MyVinmec');
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await expect(page.locator('#page-title')).toHaveText('MyVinmec');
  await page.locator('#nav-appointments').click();
  await expect(page.locator('.coach-bubble')).toContainText('Danh sách lịch hẹn');
  await page.getByRole('button', { name: 'Dừng hướng dẫn', exact: true }).click();
  await expect(page.locator('.coach-bubble')).not.toBeVisible();
});
test('Direct opening preserves conversation and guided opening offers an immediate shortcut', async ({ page }) => {
  await chat(page, 'Mở trang lịch hẹn giúp tôi');
  await expect(page.locator('#page-title')).toHaveText('Lịch hẹn thử của cô/chú');
  await expect(page.locator('.chat-messages')).toContainText('Mình đã mở trang Lịch hẹn cho bạn.');
  await chat(page, 'Chỉ cách cập nhật thông tin cá nhân');
  await expect(page.locator('.coach-bubble')).toContainText('Hồ sơ');
  await page.getByRole('button', { name: 'Mở giúp tôi', exact: true }).click();
  await expect(page.locator('#page-title')).toHaveText('Thông tin cá nhân');
});
test('Multi-information requests skip known answers and edits keep other slots', async ({ page }) => {
  await chat(page, 'Đặt giúp tôi khám tim ngày mai 9 giờ tại Vinmec Times City');
  await expect(page.locator('.chat-prompt')).toContainText('bác sĩ');
  await page.getByRole('button', { name: /BS\. Nguyễn Minh Lan/ }).click();
  await expect(page.locator('.chat-booking-review')).toContainText('Tim mạch');
  await page.getByRole('button', { name: 'Sửa người khám', exact: true }).click();
  await page.getByRole('button', { name: 'Người thân · Bác Bình', exact: true }).click();
  await expect(page.locator('.chat-booking-review')).toContainText('Bác Bình');
  await expect(page.locator('.chat-booking-review')).toContainText('BS. Nguyễn Minh Lan');
  await expect(page.locator('.chat-booking-review')).toContainText('09:00');
});
test('Simulated voice shows listening, editable transcript and actual navigation', async ({ page }) => {
  await page.getByRole('button', { name: 'Nói với Mia', exact: true }).click();
  await expect(page.locator('.chatbot-panel')).toHaveAttribute('data-status', 'listening');
  await page.getByRole('button', { name: 'Dừng nghe', exact: true }).click();
  await page.getByLabel('Câu nói mô phỏng').fill('Chỉ tôi cách xem lịch hẹn');
  await page.getByRole('button', { name: 'Nhận câu mô phỏng', exact: true }).click();
  await page.locator('#voice-transcript').fill('Mở trang lịch hẹn giúp tôi');
  await expect(page.locator('#page-title')).toHaveText('MyVinmec');
  await page.getByRole('button', { name: 'Dùng yêu cầu này', exact: true }).click();
  await expect(page.locator('#page-title')).toHaveText('Lịch hẹn thử của cô/chú');
  await expect(page.locator('.chat-messages')).toContainText('Mình đã mở trang Lịch hẹn');
});
test('Robot collapses away from bottom navigation and profile saving needs confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'Thu gọn hướng dẫn', exact: true }).click();
  await expect(page.locator('.robot-launcher')).toBeVisible();
  await expect(page.locator('.chatbot-panel')).not.toBeVisible();
  const robot = await page.locator('.robot-launcher').boundingBox();
  const nav = await page.locator('.ref-bottom').boundingBox();
  expect(robot.y + robot.height).toBeLessThanOrEqual(nav.y);
  await page.getByRole('button', { name: 'Mở hướng dẫn', exact: true }).click();
  await chat(page, 'Mở thông tin cá nhân giúp tôi');
  await page.getByRole('button', { name: 'Thu gọn hướng dẫn', exact: true }).click();
  await page.getByLabel('Tên hiển thị').fill('Bác An Demo');
  await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Xác nhận lưu thông tin' })).toBeVisible();
  await page.getByRole('button', { name: 'Xác nhận lưu', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu thông tin mẫu' })).toBeVisible();
});
