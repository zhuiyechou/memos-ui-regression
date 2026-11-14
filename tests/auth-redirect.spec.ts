import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('未登录访问根路径会被重定向到登录页', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/auth/);
  await expect(page.getByText('Welcome back.')).toBeVisible();
});
