import { expect, test } from '@playwright/test';
import { createMemo, createMemoRaw, deleteMemo, memoCard, memoText, openComposer, saveComposer } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('Esc 关闭新建弹窗且不保存内容', async ({ page }) => {
  const text = memoText('Esc取消');
  await page.locator('[data-new-memo-trigger=true]').first().click({ force: true });
  await page.waitForTimeout(1000);
  const editor = page.locator('[role=dialog] [contenteditable="true"]').last();
  await editor.click();
  await editor.fill(text);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);

  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  await expect(page.locator('.relative.group').filter({ hasText: text })).toHaveCount(0);
});

test('多行文本保存后换行保留', async ({ page }) => {
  const marker = memoText('多行');
  await createMemoRaw(page, `第一行-${marker}\n第二行内容\n第三行内容`, marker);

  const card = memoCard(page, marker);
  await expect(card).toContainText('第二行内容');
  await expect(card).toContainText('第三行内容');
  expect(await card.locator('p').count()).toBeGreaterThanOrEqual(3);

  await deleteMemo(page, marker);
});

test('2000 字以上长文本可以保存并完整展示', async ({ page }) => {
  const marker = memoText('长文本');
  const long = marker + '长'.repeat(2000);
  const editor = await openComposer(page);
  await editor.fill(long);
  await page.waitForTimeout(500);
  await saveComposer(page);

  await expect(page.getByText(marker).first()).toBeVisible();
  expect((await memoCard(page, marker).innerText()).length).toBeGreaterThan(2000);

  await deleteMemo(page, marker);
});

test('新建的 memo 出现在时间线最上方', async ({ page }) => {
  const text = memoText('排序');
  await createMemo(page, text);

  await expect(page.locator('article.relative.group').first()).toContainText(text);
  await deleteMemo(page, text);
});
