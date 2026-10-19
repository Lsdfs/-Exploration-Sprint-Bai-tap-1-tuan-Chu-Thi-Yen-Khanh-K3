import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/'); await page.locator('.robot-launcher').click();
  await expect(page.locator('.send-button')).toBeEnabled();
  await page.getByRole('button', { name: 'Thu gọn hướng dẫn', exact: true }).click();
});

test('Reference home opens services, contact sheet and connection dialog', async ({ page }) => {
  await expect(page.locator('.service-grid > button')).toHaveCount(12);
  await page.getByRole('button', { name: 'Liên hệ', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Liên hệ' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng bảng' }).click();
  await page.getByRole('button', { name: 'Dịch vụ y tế', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dịch vụ y tế', exact: true })).toBeVisible();
  await page.getByPlaceholder('Chọn danh mục dịch vụ').fill('Vaccine');
  await expect(page.locator('.medical-card:visible')).toHaveCount(1);
  await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  await page.getByRole('button', { name: 'Quyền lợi CBNV Vingroup', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Thông báo kết nối hồ sơ y tế' })).toBeVisible();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await page.getByRole('button', { name: 'Tất cả dịch vụ', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Dịch vụ', exact: true })).toBeVisible();
});

test('Service sheet navigates and price check requires a hospital selection', async ({ page }) => {
  await page.getByRole('button', { name: 'Tất cả dịch vụ', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Dịch vụ', exact: true });
  await sheet.getByRole('button', { name: 'Danh mục giá & quyền lợi', exact: true }).click();
  await expect(sheet).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'KIỂM TRA', exact: true })).toBeDisabled();
  await page.getByLabel('Chọn bệnh viện', { exact: true }).selectOption({ label: 'Vinmec Times City' });
  await page.getByRole('button', { name: 'KIỂM TRA', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('chưa kết nối');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('Reference destinations return home and appointment CTA starts booking', async ({ page }) => {
  for (const [label, title] of [['Đơn thuốc', 'Thuốc'], ['Nhắc lịch uống thuốc', 'Nhắc lịch uống thuốc'], ['Tạm ứng viện phí', 'Tạm ứng viện phí'], ['Sổ tiêm', 'Sổ tiêm chủng'], ['Cẩm nang làm mẹ', 'Chào mừng đến với cẩm nang Làm Mẹ!'], ['Danh mục giá & quyền lợi', 'Danh mục giá & quyền lợi'], ['Cộng đồng hỏi đáp bác sĩ', 'Cộng đồng hỏi đáp bác sĩ']]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Quay lại trang chủ' }).click();
  }
  await page.getByRole('button', { name: 'Lịch hẹn', exact: true }).click();
  await expect(page.getByText('Hiện tại bạn chưa có lịch hẹn nào')).toBeVisible();
  await page.getByRole('button', { name: 'ĐẶT HẸN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cô/chú đặt lịch cho ai?' })).toBeVisible();
});
