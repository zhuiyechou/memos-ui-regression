import { expect, test } from '@playwright/test';
import { createMemo, deleteMemo, memoCard, memoText, openCardMenu } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('Open 菜单进入 memo 详情页并显示原文', async ({ page }) => {
  const text = memoText('详情页');
  await createMemo(page, text);

  await openCardMenu(page, text);
  await page.getByRole('menuitem', { name: /^Open$/ }).click();
  await expect(page).toHaveURL(/\/memos\//);
  await expect(page.getByText(text).first()).toBeVisible();

  await page.goBack();
  await page.waitForTimeout(1200);
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});
