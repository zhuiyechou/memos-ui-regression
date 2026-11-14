import { expect, test as setup, type Page } from '@playwright/test';

const USER = process.env.MEMOS_USER || 'admin';
const PASS = process.env.MEMOS_PASS || 'Memos@2026';
const STATE = '.auth/state.json';

// 全新实例建完管理员会弹首次引导框（本机已初始化的实例不会），
// 不关掉的话后续所有用例的新建弹窗都会被它挡住。
async function dismissFirstRunDialogs(page: Page) {
  const dialogs = page.locator('[role=dialog]');
  // 引导框在首页加载后延迟才挂载，先给它 5 秒出现窗口
  await dialogs.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  for (let i = 0; i < 5 && (await dialogs.count()) > 0; i++) {
    const closer = dialogs.getByRole('button', { name: /^(skip|close|get started|done|got it)$/i }).first();
    if (await closer.count()) {
      await closer.click();
    } else {
      const next = dialogs.getByRole('button', { name: /^next$/i }).first();
      if (await next.count()) await next.click();
      else await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(800);
  }
  if ((await dialogs.count()) > 0) {
    const text = (await dialogs.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').slice(0, 120));
    throw new Error(`首次引导未关闭，残留 ${await dialogs.count()} 个弹窗: ${JSON.stringify(text)}`);
  }
}

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

  await dismissFirstRunDialogs(page);

  await page.context().storageState({ path: STATE });
});
