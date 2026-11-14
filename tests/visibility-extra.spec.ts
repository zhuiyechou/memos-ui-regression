import { expect, test } from '@playwright/test';
import {
  createMemo,
  deleteMemo,
  memoCard,
  memoText,
  openComposer,
  openEdit,
  saveComposer,
  setVisibility,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('编辑时把 Private 改成 Public 后卡片出现公开标识', async ({ page }) => {
  const text = memoText('改公开');
  await createMemo(page, text);
  await expect(memoCard(page, text).locator('[aria-label="Public"]')).toHaveCount(0);

  await openEdit(page, text);
  const editCard = memoCard(page, text);
  await editCard.locator('button[aria-label="Private"]').click({ force: true });
  await page.getByRole('menuitem', { name: /^Public/ }).click();
  await page.waitForTimeout(300);
  await editCard.getByRole('button', { name: /^Update$/ }).click();
  await page.waitForTimeout(1500);

  await expect(memoCard(page, text).locator('[aria-label="Public"]')).toBeVisible();
  await deleteMemo(page, text);
});

test('编辑时把 Public 改回 Private 后公开标识消失', async ({ page }) => {
  const text = memoText('改回私有');
  const editor = await openComposer(page);
  await editor.pressSequentially(text, { delay: 3 });
  await setVisibility(page, 'Public');
  await saveComposer(page);
  await expect(memoCard(page, text).locator('[aria-label="Public"]')).toBeVisible();

  await openEdit(page, text);
  const editCard = memoCard(page, text);
  await editCard.locator('button[aria-label="Public"]').click({ force: true });
  await page.getByRole('menuitem', { name: /^Private/ }).click();
  await page.waitForTimeout(300);
  await editCard.getByRole('button', { name: /^Update$/ }).click();
  await page.waitForTimeout(1500);

  await expect(memoCard(page, text).locator('[aria-label="Public"]')).toHaveCount(0);
  await deleteMemo(page, text);
});
