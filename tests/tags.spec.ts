import { expect, test } from '@playwright/test';
import { createMemo, deleteMemo, memoCard, memoText, openCardMenu } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

const uniqueTag = (prefix: string) => `${prefix}${Date.now().toString().slice(-6)}`;

test('新建 memo 输入 #标签 后卡片渲染标签芯片', async ({ page }) => {
  const text = memoText('标签一');
  const tag = uniqueTag('qa');
  await createMemo(page, `${text} #${tag}`);

  await expect(memoCard(page, text).locator(`span[data-tag="${tag}"]`)).toBeVisible();
  await deleteMemo(page, text);
});

test('一个 memo 里的两个标签都渲染', async ({ page }) => {
  const text = memoText('双标签');
  const tagA = uniqueTag('qaA');
  const tagB = uniqueTag('qaB');
  await createMemo(page, `${text} #${tagA} #${tagB}`);

  const card = memoCard(page, text);
  await expect(card.locator(`span[data-tag="${tagA}"]`)).toBeVisible();
  await expect(card.locator(`span[data-tag="${tagB}"]`)).toBeVisible();
  await deleteMemo(page, text);
});

test('点击标签芯片进入标签筛选', async ({ page }) => {
  const text = memoText('标签筛选');
  const tag = uniqueTag('qaf');
  await createMemo(page, `${text} #${tag}`);

  await memoCard(page, text).locator(`span[data-tag="${tag}"]`).click();
  await expect(page).toHaveURL(/tagSearch/);
  await expect(memoCard(page, text)).toBeVisible();

  await page.goto('/');
  await expect(memoCard(page, text)).toBeVisible();
  await deleteMemo(page, text);
});

test('标签筛选结果只包含带该标签的 memo', async ({ page }) => {
  const tagged = memoText('带标签');
  const plain = memoText('不带标签');
  const tag = uniqueTag('qag');
  await createMemo(page, `${tagged} #${tag}`);
  await createMemo(page, plain);

  await memoCard(page, tagged).locator(`span[data-tag="${tag}"]`).click();
  await expect(page).toHaveURL(/tagSearch/);
  await expect(memoCard(page, tagged)).toBeVisible();
  await expect(memoCard(page, plain)).toHaveCount(0);

  await page.goto('/');
  await expect(memoCard(page, tagged)).toBeVisible();
  await deleteMemo(page, tagged);
  await expect(memoCard(page, plain)).toBeVisible();
  await deleteMemo(page, plain);
});

test('编辑 memo 追加标签后标签生效', async ({ page }) => {
  const text = memoText('编辑加标签');
  const tag = uniqueTag('qae');
  await createMemo(page, text);

  await openCardMenu(page, text);
  await page.getByText('Edit', { exact: true }).click();
  await page.waitForTimeout(1500);
  const editor = page.locator('.memo-editor-root[contenteditable=true]').last();
  await editor.click();
  await editor.press('End');
  await editor.pressSequentially(` #${tag}`, { delay: 5 });
  await page.getByRole('button', { name: /^Update$/ }).click();
  await page.waitForTimeout(1200);

  await expect(memoCard(page, text).locator(`span[data-tag="${tag}"]`)).toBeVisible();
  await deleteMemo(page, text);
});
