import { expect, test } from '@playwright/test';
import { createMemo, deleteMemo, memoCard, memoText, openCardMenu } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('Calendar 页面可打开并返回时间线', async ({ page }) => {
  await page.locator('a[href^="/calendar"]').first().click();
  await expect(page).toHaveURL(/\/calendar/);

  await page.getByRole('link', { name: 'Timeline' }).first().click();
  await expect(page).toHaveURL(/127\.0\.0\.1:5230\/$/);
});

test('Attachments 页面可打开', async ({ page }) => {
  await page.locator('a[href^="/attachments"]').first().click();
  await expect(page).toHaveURL(/\/attachments/);
  await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();
});

test('详情页支持浏览器后退和前进', async ({ page }) => {
  const text = memoText('前进后退');
  await createMemo(page, text);

  await openCardMenu(page, text);
  await page.getByRole('menuitem', { name: /^Open$/ }).click();
  await expect(page).toHaveURL(/\/memos\//);

  await page.goBack();
  await expect(page).toHaveURL(/127\.0\.0\.1:5230\/$/);
  await expect(memoCard(page, text)).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/\/memos\//);
  await expect(page.getByText(text).first()).toBeVisible();

  await page.goBack();
  await page.waitForTimeout(1200);
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});
