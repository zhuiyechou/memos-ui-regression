import { expect, test } from '@playwright/test';
import {
  archiveMemo,
  createMemo,
  deleteMemo,
  memoCard,
  memoText,
  openArchived,
  openCardMenu,
  pinMemo,
  restoreMemo,
  unpinMemo,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('Pin 后卡片出现置顶标识，菜单变为 Unpin', async ({ page }) => {
  const text = memoText('置顶');
  await createMemo(page, text);

  await pinMemo(page, text);
  await expect(memoCard(page, text).locator('[aria-label="Pinned"]')).toBeVisible();

  await openCardMenu(page, text);
  await expect(page.getByRole('menuitem', { name: /^Unpin$/ })).toBeVisible();
  await page.keyboard.press('Escape');

  await unpinMemo(page, text);
  await deleteMemo(page, text);
});

test('Unpin 后置顶标识消失', async ({ page }) => {
  const text = memoText('取消置顶');
  await createMemo(page, text);
  await pinMemo(page, text);
  await expect(memoCard(page, text).locator('[aria-label="Pinned"]')).toBeVisible();

  await unpinMemo(page, text);
  await expect(memoCard(page, text).locator('[aria-label="Pinned"]')).toHaveCount(0);
  await deleteMemo(page, text);
});

test('Archive 后 memo 从主时间线消失', async ({ page }) => {
  const text = memoText('归档');
  await createMemo(page, text);

  await archiveMemo(page, text);
  await expect(memoCard(page, text)).toHaveCount(0);

  await openArchived(page);
  await restoreMemo(page, text);
  await page.goto('/');
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});

test('归档页能看到已归档的 memo', async ({ page }) => {
  const text = memoText('归档可见');
  await createMemo(page, text);
  await archiveMemo(page, text);

  await openArchived(page);
  await expect(memoCard(page, text)).toBeVisible();

  await restoreMemo(page, text);
  await page.goto('/');
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});

test('Restore 后 memo 回到时间线', async ({ page }) => {
  const text = memoText('恢复归档');
  await createMemo(page, text);
  await archiveMemo(page, text);

  await openArchived(page);
  await restoreMemo(page, text);
  await expect(memoCard(page, text)).toHaveCount(0);

  await page.goto('/');
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});
