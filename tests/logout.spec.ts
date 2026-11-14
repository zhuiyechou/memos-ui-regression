import { expect, test } from '@playwright/test';
import { openUserMenu } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('退出登录后跳转到登录页', async ({ page }) => {
  await openUserMenu(page);
  await page.getByText('Sign out', { exact: true }).click();

  await expect(page).toHaveURL(/\/auth/);
  await expect(page.getByText('Welcome back.')).toBeVisible();
});
