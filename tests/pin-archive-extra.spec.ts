import { expect, test } from '@playwright/test';
import {
  archiveMemo,
  createMemo,
  deleteMemo,
  memoCard,
  memoText,
  openArchived,
  pinMemo,
  restoreMemo,
  unpinMemo,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('置顶 memo 排在普通 memo 前且刷新后保持', async ({ page }) => {
  const oldText = memoText('置顶排序旧');
  const newText = memoText('置顶排序新');
  await createMemo(page, oldText);
  await createMemo(page, newText);
  await pinMemo(page, oldText);

  const first = page.locator('article.relative.group').first();
  await expect(first).toContainText(oldText);
  await expect(first.locator('[aria-label="Pinned"]')).toBeVisible();

  await page.reload();
  await page.waitForTimeout(2500);
  const firstAfterReload = page.locator('article.relative.group').first();
  await expect(firstAfterReload).toContainText(oldText);
  await expect(firstAfterReload.locator('[aria-label="Pinned"]')).toBeVisible();

  await unpinMemo(page, oldText);
  await deleteMemo(page, oldText);
  await deleteMemo(page, newText);
});

test('取消置顶后刷新不再显示置顶标识', async ({ page }) => {
  const text = memoText('取消置顶持久');
  await createMemo(page, text);
  await pinMemo(page, text);
  await unpinMemo(page, text);

  await page.reload();
  await page.waitForTimeout(2500);
  await expect(memoCard(page, text).locator('[aria-label="Pinned"]')).toHaveCount(0);

  await deleteMemo(page, text);
});

test('恢复归档后 Archived 页面不再显示', async ({ page }) => {
  const text = memoText('归档恢复');
  await createMemo(page, text);
  await archiveMemo(page, text);
  await expect(memoCard(page, text)).toHaveCount(0);

  await openArchived(page);
  await expect(memoCard(page, text)).toBeVisible();
  await restoreMemo(page, text);
  await expect(memoCard(page, text)).toHaveCount(0);

  await page.goto('/');
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});
