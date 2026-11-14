import { expect, test } from '@playwright/test';
import { createMemo, deleteMemo, memoCard, memoText, openEdit } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

const uniqueTag = (prefix: string) => `${prefix}${Date.now().toString().slice(-6)}`;

test('编辑时删除标签文本后标签芯片消失', async ({ page }) => {
  const base = memoText('删标签');
  const tag = uniqueTag('qad');
  await createMemo(page, `${base} #${tag}`);
  await expect(memoCard(page, base).locator(`span[data-tag="${tag}"]`)).toBeVisible();

  const editor = await openEdit(page, base);
  await editor.click();
  await editor.press('End');
  for (let i = 0; i < tag.length + 2; i += 1) await page.keyboard.press('Backspace');
  await page.getByRole('button', { name: /^Update$/ }).click();
  await page.waitForTimeout(1200);

  await expect(memoCard(page, base).locator(`span[data-tag="${tag}"]`)).toHaveCount(0);
  await deleteMemo(page, base);
});

test('删除带标签 memo 后标签筛选页不再命中', async ({ page }) => {
  const text = memoText('标签清理');
  const tag = uniqueTag('qac');
  await createMemo(page, `${text} #${tag}`);

  await memoCard(page, text).locator(`span[data-tag="${tag}"]`).click();
  await expect(page).toHaveURL(/tagSearch/);
  const tagUrl = page.url();

  await page.goto('/');
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);

  await page.goto(tagUrl);
  await page.waitForTimeout(1500);
  await expect(memoCard(page, text)).toHaveCount(0);
});
