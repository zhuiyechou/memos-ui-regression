import { expect, test } from '@playwright/test';
import { createMemoRaw, deleteMemo, memoCard, memoText } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('引用块渲染为 blockquote', async ({ page }) => {
  const marker = memoText('引用块');
  await createMemoRaw(page, `> ${marker}`, marker);

  await expect(memoCard(page, marker).locator('blockquote')).toContainText(marker);
  await deleteMemo(page, marker);
});

test('行内代码渲染为 code 元素', async ({ page }) => {
  const marker = memoText('行内代码');
  await createMemoRaw(page, '`' + marker + '` 结尾', marker);

  await expect(memoCard(page, marker).locator('code')).toContainText(marker);
  await deleteMemo(page, marker);
});

test('任务列表渲染为复选框', async ({ page }) => {
  const marker = memoText('任务清单');
  await createMemoRaw(page, `- [ ] ${marker}`, marker);

  await expect(memoCard(page, marker).locator('input[type=checkbox]')).toHaveCount(1);
  await deleteMemo(page, marker);
});
