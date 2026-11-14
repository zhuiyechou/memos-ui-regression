import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button[aria-label="Open navigation"]')).toBeVisible();
  await page.waitForTimeout(1500);
});

test('移动端导航抽屉展示四个入口', async ({ page }) => {
  await page.locator('button[aria-label="Open navigation"]').click({ force: true });
  await page.waitForTimeout(1000);

  const nav = page.locator('nav[aria-label=Primary], aside nav').first();
  await expect(nav.getByText('Timeline')).toBeVisible();
  await expect(nav.getByText('Calendar')).toBeVisible();
  await expect(nav.getByText('Map')).toBeVisible();
  await expect(nav.getByText('Attachments')).toBeVisible();
});

test('移动端可从抽屉打开搜索面板', async ({ page }) => {
  await page.locator('button[aria-label="Open navigation"]').click({ force: true });
  await page.waitForTimeout(800);
  await page.locator('button[aria-label="Search"]').first().click({ force: true });

  const input = page.locator('input[placeholder="Search Memos"]').first();
  await expect(input).toBeVisible();
  await input.fill('mobile');
  await page.waitForTimeout(500);
  await input.press('Escape');
  await expect(input).toHaveCount(0);
});
