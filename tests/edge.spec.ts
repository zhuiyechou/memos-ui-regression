import { expect, test } from '@playwright/test';
import { createMemo, deleteMemo, memoCard, memoText, openCardMenu, openComposer } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('纯空格不能创建 memo（D01）', async ({ page }) => {
  test.fail(true, 'D01: 纯空格可以保存为空 memo');

  const editor = await openComposer(page);
  await editor.pressSequentially('   ');

  await expect(page.locator('[role=dialog]').getByRole('button', { name: /^Save$/ })).toBeDisabled();
});

test('刷新后 memo 仍在', async ({ page }) => {
  const text = memoText('刷新');
  await createMemo(page, text);

  await page.reload();
  await expect(memoCard(page, text)).toContainText(text);

  await deleteMemo(page, text);
});

test('取消编辑后内容不变', async ({ page }) => {
  const text = memoText('取消编辑');
  await createMemo(page, text);

  await openCardMenu(page, text);
  await page.getByText('Edit', { exact: true }).click();
  await page.waitForTimeout(1500);

  const editor = page.locator('.memo-editor-root[contenteditable=true]').last();
  await editor.click();
  await editor.press('End');
  await editor.pressSequentially(' 不应该保存');
  await page.getByRole('button', { name: /^Cancel$/ }).click();
  await page.waitForTimeout(800);

  await expect(memoCard(page, text)).toContainText(text);
  await expect(page.getByText(`${text} 不应该保存`)).toHaveCount(0);

  await deleteMemo(page, text);
});

test('取消删除后 memo 仍在', async ({ page }) => {
  const text = memoText('取消删除');
  await createMemo(page, text);

  await openCardMenu(page, text);
  await page.getByText('Delete', { exact: true }).click();
  await expect(page.getByText('Are you sure you want to delete this memo?')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText('Are you sure you want to delete this memo?')).toHaveCount(0);

  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});

test('删除同内容 memo 时只删一条', async ({ page }) => {
  const text = memoText('重复');
  await createMemo(page, text);
  await createMemo(page, text);

  const cards = page.locator('.relative.group').filter({ hasText: text });
  await expect(cards).toHaveCount(2);

  await cards.first().locator('button[aria-label=More]').click({ force: true });
  await page.waitForTimeout(400);
  await page.getByText('Delete', { exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).last().click();

  await expect(cards).toHaveCount(1);
  await deleteMemo(page, text);
});