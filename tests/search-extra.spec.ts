import { expect, test } from '@playwright/test';
import { createMemo, deleteMemo, memoCard, memoText, openSearch, searchMemos } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('按 Esc 关闭搜索面板', async ({ page }) => {
  const input = await openSearch(page);
  await input.fill('anything');
  await page.waitForTimeout(500);
  await input.press('Escape');

  await expect(page.locator('input[placeholder="Search Memos"]')).toHaveCount(0);
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
});

test('清空搜索关键词后恢复时间线列表', async ({ page }) => {
  const text = memoText('清空搜索');
  await createMemo(page, text);

  const input = await openSearch(page);
  await input.fill(text);
  await page.waitForTimeout(700);
  await input.fill('');
  await page.waitForTimeout(900);

  await expect(page.getByText('No matching memos')).toHaveCount(0);
  await expect(page.locator('article.relative.group').first()).toBeVisible();

  await input.press('Escape');
  await expect(input).toHaveCount(0);
  await page.goto('/');
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});

test('搜索后 URL 带 contentSearch 筛选参数', async ({ page }) => {
  const text = memoText('搜索参数');
  await createMemo(page, text);

  await searchMemos(page, text);
  await expect(page).toHaveURL(/contentSearch/);

  await page.goto('/');
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});

test('搜索无关词不显示目标 memo', async ({ page }) => {
  const target = memoText('目标A');
  const other = memoText('无关B');
  await createMemo(page, target);
  await createMemo(page, other);

  await searchMemos(page, target);
  await expect(memoCard(page, target)).toBeVisible();
  await expect(memoCard(page, other)).toHaveCount(0);

  await page.goto('/');
  await expect(memoCard(page, target)).toBeVisible();
  await expect(memoCard(page, other)).toBeVisible();
  await deleteMemo(page, target);
  await deleteMemo(page, other);
});
