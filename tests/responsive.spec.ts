import { expect, test } from '@playwright/test';
import { deleteMemo, memoText } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('移动端视口下可以新建 memo', async ({ page }) => {
  const text = memoText('移动端');
  await page.goto('/');

  const editor = page.locator('.memo-editor-root[contenteditable=true]').first();
  await expect(editor).toBeVisible();
  await page.waitForTimeout(800);
  await editor.click();
  await editor.fill(text);
  await page.getByRole('button', { name: /^Save$/ }).first().click();
  await expect(page.getByText(text).first()).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(800);
  await deleteMemo(page, text);
});
