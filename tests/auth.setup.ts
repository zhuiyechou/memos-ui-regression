import { expect, test as setup } from '@playwright/test';

const USER = process.env.MEMOS_USER || 'admin';
const PASS = process.env.MEMOS_PASS || 'Memos@2026';
const STATE = '.auth/state.json';

setup('建立管理员会话', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);

  if (page.url().includes('/auth')) {
    await page.locator('input').nth(0).fill(USER);
    await page.locator('input[type=password]').fill(PASS);
    const signup = page.getByRole('button', { name: /create admin account/i });
    if (await signup.count()) {
      await signup.click();
    } else {
      await page.getByRole('button', { name: /sign in/i }).click();
    }
    await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 20_000 });
  }

  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();

  // 全新实例创建管理员后会弹 "Welcome to Memos" 引导框，必须先关掉，
  // 否则后续所有用例的 openComposer 都会被这个 dialog 挡住。
  for (let i = 0; i < 3; i++) {
    const guide = page.locator('[role=dialog]').filter({ hasText: 'Welcome to Memos' }).first();
    if (!(await guide.isVisible().catch(() => false))) break;
    const skip = guide.getByRole('button', { name: /skip|get started|done/i }).first();
    if (await skip.count()) {
      await skip.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(page.locator('[role=dialog]')).toHaveCount(0, { timeout: 10_000 });
  }
  await expect(page.locator('[role=dialog]')).toHaveCount(0);

  await page.context().storageState({ path: STATE });
});
