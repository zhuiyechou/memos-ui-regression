import { expect, test } from '@playwright/test';
import { deleteMemo, memoCard, memoText, openComposer, saveComposer, setVisibility } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('新建弹窗默认可见性是 Private', async ({ page }) => {
  await page.locator('[data-new-memo-trigger=true]').first().click({ force: true });
  await page.waitForTimeout(1000);

  await expect(page.locator('[role=dialog] button[aria-label="Private"]')).toBeVisible();

  await page.locator('[role=dialog]').getByRole('button', { name: /^Cancel$/ }).click();
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
});

test('Public memo 保存后卡片显示公开标识', async ({ page }) => {
  const text = memoText('公开');
  const editor = await openComposer(page);
  await editor.pressSequentially(text, { delay: 3 });
  await setVisibility(page, 'Public');
  await saveComposer(page);

  await expect(memoCard(page, text).locator('[aria-label="Public"]')).toBeVisible();
  await deleteMemo(page, text);
});

test('Protected memo 保存后卡片显示受保护标识', async ({ page }) => {
  const text = memoText('受保护');
  const editor = await openComposer(page);
  await editor.pressSequentially(text, { delay: 3 });
  await setVisibility(page, 'Protected');
  await saveComposer(page);

  await expect(memoCard(page, text).locator('[aria-label="Protected"]')).toBeVisible();
  await deleteMemo(page, text);
});
