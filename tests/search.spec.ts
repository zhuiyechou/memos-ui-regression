import { expect, test } from '@playwright/test';
import { createMemo, deleteMemo, memoCard, memoText, searchMemos } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('搜索不存在的关键词显示空结果提示', async ({ page }) => {
  await searchMemos(page, `zzz-not-exist-${Date.now()}`);

  await expect(page).toHaveURL(/contentSearch/);
  await expect(page.getByText('No matching memos')).toBeVisible();
});

test('搜索特殊字符不报错、不白屏', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', error => errors.push(error));

  await searchMemos(page, '%_.-#()[]');
  await page.waitForTimeout(500);

  await expect(page).toHaveURL(/contentSearch/);
  await expect(page.getByText('Timeline', { exact: true })).toBeVisible();
  expect(errors).toHaveLength(0);
});

test('搜索大小写不敏感', async ({ page }) => {
  const text = memoText('CaSe');
  await createMemo(page, text);

  await searchMemos(page, text.toLowerCase());
  await expect(memoCard(page, text)).toBeVisible();

  await page.goto('/');
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});

test('点击 Clear filters 后时间线恢复', async ({ page }) => {
  const text = memoText('清空筛选');
  await createMemo(page, text);

  await searchMemos(page, `zzz-clear-${Date.now()}`);
  await expect(page.getByText('No matching memos')).toBeVisible();

  await page.getByText('Clear filters').click();
  await page.waitForTimeout(1000);

  await expect(page).not.toHaveURL(/filter=/);
  await expect(memoCard(page, text)).toBeVisible();

  await page.goto('/');
  await page.waitForTimeout(1200);
  await deleteMemo(page, text);
});

test('搜索部分关键词能命中 memo', async ({ page }) => {
  const marker = memoText('关键词');
  await createMemo(page, `${marker} 尾部内容`);

  await searchMemos(page, '关键词');
  await expect(memoCard(page, marker)).toBeVisible();

  await page.goto('/');
  await expect(memoCard(page, marker)).toBeVisible();
  await deleteMemo(page, marker);
});

test('搜索同内容的两条 memo 都能命中', async ({ page }) => {
  const text = memoText('重复搜索');
  await createMemo(page, text);
  await createMemo(page, text);

  await searchMemos(page, text);
  await expect(page.locator('.relative.group').filter({ hasText: text })).toHaveCount(2);

  await page.goto('/');
  const cards = page.locator('.relative.group').filter({ hasText: text });
  await expect(cards).toHaveCount(2);

  for (let remaining = 1; remaining >= 0; remaining -= 1) {
    await cards.first().locator('button[aria-label=More]').click({ force: true });
    await page.waitForTimeout(500);
    await page.getByText('Delete', { exact: true }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
    await expect(cards).toHaveCount(remaining);
  }
});
