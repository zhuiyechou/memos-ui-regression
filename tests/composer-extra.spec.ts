import { expect, test } from '@playwright/test';
import { createMemo, deleteMemo, memoCard, memoText, openComposer } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('内容为空时 Save 按钮禁用', async ({ page }) => {
  const editor = await openComposer(page);
  const save = page.locator('[role=dialog]').getByRole('button', { name: /^Save$/ });
  await expect(save).toBeDisabled();

  await editor.pressSequentially('x', { delay: 3 });
  await expect(save).toBeEnabled();

  await page.keyboard.press('Escape');
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
});

test('Esc 关闭后再次打开仍保留草稿', async ({ page }) => {
  const draft = `${memoText('草稿')} draft`;
  const editor = await openComposer(page);
  await editor.fill(draft);
  await page.waitForTimeout(400);

  await page.keyboard.press('Escape');
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  await page.waitForTimeout(800);

  await page.locator('[data-new-memo-trigger=true]').first().click({ force: true });
  const reopened = page.locator('[role=dialog] [contenteditable="true"]').last();
  await reopened.waitFor({ state: 'visible' });
  await page.waitForTimeout(800);
  await expect(reopened).toContainText(draft);

  await page.keyboard.press('Escape');
});

test('保存后新建弹窗自动关闭', async ({ page }) => {
  const text = memoText('保存关闭');
  await createMemo(page, text);

  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  await deleteMemo(page, text);
});

test('emoji 内容保存后正常显示', async ({ page }) => {
  const text = `${memoText('emoji')} 😄🎉`;
  const editor = await openComposer(page);
  await editor.fill(text);
  await page.waitForTimeout(400);
  await page.locator('[role=dialog]').getByRole('button', { name: /^Save$/ }).click();

  await expect(memoCard(page, text)).toBeVisible();
  await expect(memoCard(page, text)).toContainText('😄🎉');
  await deleteMemo(page, text);
});
