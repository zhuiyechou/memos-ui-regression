import { expect, test } from '@playwright/test';
import { createMemo, deleteMemo, memoCard, memoText, openCardMenu, searchMemos } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('新建 memo 后时间线可见', async ({ page }) => {
  const text = memoText('新建');
  await createMemo(page, text);
  await expect(memoCard(page, text)).toContainText(text);
  await deleteMemo(page, text);
});

test('编辑 memo 内容并保存', async ({ page }) => {
  const text = memoText('编辑前');
  await createMemo(page, text);
  await openCardMenu(page, text);
  await page.getByText('Edit', { exact: true }).click();
  await page.waitForTimeout(1500);

  const editor = page.locator('.memo-editor-root[contenteditable=true]').last();
  await expect(editor).toContainText(text);
  await editor.click();
  await editor.press('End');
  await editor.pressSequentially(' 已编辑');
  await page.getByRole('button', { name: /^Update$/ }).click();

  await expect(page.getByText(`${text} 已编辑`).first()).toBeVisible();
  await deleteMemo(page, text);
});

test('搜索能定位到指定 memo', async ({ page }) => {
  const text = memoText('搜索目标');
  await createMemo(page, text);

  await searchMemos(page, text);
  await expect(memoCard(page, text)).toBeVisible();

  await page.goto('/');
  await page.waitForTimeout(1500);
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});

test('删除 memo 后从时间线消失', async ({ page }) => {
  const text = memoText('待删除');
  await createMemo(page, text);
  await deleteMemo(page, text);
  await expect(page.getByText(text)).toHaveCount(0);
});
