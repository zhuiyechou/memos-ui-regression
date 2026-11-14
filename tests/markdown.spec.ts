import { expect, test } from '@playwright/test';
import { createMemoRaw, deleteMemo, memoCard, memoText } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-new-memo-trigger=true]').first()).toBeVisible();
  await page.waitForTimeout(1200);
});

test('一级标题按 Markdown 渲染为 h1', async ({ page }) => {
  const marker = memoText('标题渲染');
  await createMemoRaw(page, `# ${marker}`, marker);

  await expect(memoCard(page, marker).locator('h1')).toContainText(marker);
  await deleteMemo(page, marker);
});

test('加粗语法渲染为 strong', async ({ page }) => {
  const marker = memoText('加粗渲染');
  await createMemoRaw(page, `**${marker}**`, marker);

  await expect(memoCard(page, marker).locator('strong')).toContainText(marker);
  await deleteMemo(page, marker);
});

test('代码块渲染为 pre/code 且内容不变', async ({ page }) => {
  const marker = memoText('代码块');
  await createMemoRaw(page, '```\n' + marker + '\n```', marker);

  await expect(memoCard(page, marker).locator('pre code')).toContainText(marker);
  await deleteMemo(page, marker);
});

test('script 标签被当作纯文本，不执行', async ({ page }) => {
  const marker = memoText('XSS');
  let dialogs = 0;
  page.on('dialog', async dialog => {
    dialogs += 1;
    await dialog.dismiss();
  });

  await createMemoRaw(page, `<script>alert('xss')</script> ${marker}`, marker);

  const card = memoCard(page, marker);
  await expect(card.locator('script')).toHaveCount(0);
  await expect(card).toContainText('alert');
  expect(dialogs).toBe(0);

  await deleteMemo(page, marker);
});
