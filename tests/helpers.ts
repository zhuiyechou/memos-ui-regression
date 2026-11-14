import { expect, type Page } from '@playwright/test';

export const RUN_ID = `E2E-${Date.now()}`;
export const memoText = (label: string) => `${RUN_ID} ${label}`;

export function memoCard(page: Page, text: string) {
  return page.locator('.relative.group').filter({ hasText: text }).first();
}

async function expectNoDialog(page: Page) {
  const dialogs = page.locator('[role=dialog]');
  try {
    await expect(dialogs).toHaveCount(0);
  } catch {
    const text = (await dialogs.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').slice(0, 120));
    throw new Error(`操作前存在 ${await dialogs.count()} 个残留弹窗: ${JSON.stringify(text)}`);
  }
}

export async function openComposer(page: Page) {
  await expectNoDialog(page);
  await page.locator('[data-new-memo-trigger=true]').first().click({ force: true });
  const editor = page.locator('[role=dialog] [contenteditable="true"]').last();
  await editor.waitFor({ state: 'visible' });
  await page.waitForTimeout(800);
  await editor.click();
  return editor;
}

export async function createMemo(page: Page, text: string) {
  const editor = await openComposer(page);
  await editor.pressSequentially(text, { delay: 5 });
  await page.locator('[role=dialog]').getByRole('button', { name: /^Save$/ }).click();
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  await expect(memoCard(page, text)).toBeVisible();
}

export async function openCardMenu(page: Page, text: string) {
  await expectNoDialog(page);
  const card = memoCard(page, text);
  await expect(card).toBeVisible();
  await card.locator('button[aria-label=More]').click({ force: true });
  await page.waitForTimeout(400);
}

export async function deleteMemo(page: Page, text: string) {
  if ((await memoCard(page, text).count()) === 0) return;
  await openCardMenu(page, text);
  await page.getByText('Delete', { exact: true }).click();
  await expect(page.getByText('Are you sure you want to delete this memo?')).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  await expect(memoCard(page, text)).toHaveCount(0);
}

export async function saveComposer(page: Page) {
  await page.locator('[role=dialog]').getByRole('button', { name: /^Save$/ }).click();
  await page.waitForTimeout(1200);
}

export async function createMemoRaw(page: Page, raw: string, marker: string) {
  const editor = await openComposer(page);
  await editor.pressSequentially(raw, { delay: 3 });
  await page.waitForTimeout(400);
  await saveComposer(page);
  await expect(page.getByText(marker).first()).toBeVisible();
}

export async function setVisibility(page: Page, name: 'Private' | 'Protected' | 'Public') {
  await page
    .locator('[role=dialog] button[aria-label="Private"], [role=dialog] button[aria-label="Protected"], [role=dialog] button[aria-label="Public"]')
    .first()
    .click({ force: true });
  await page.waitForTimeout(400);
  await page.getByRole('menuitem', { name: new RegExp(`^${name}`) }).click();
  await page.waitForTimeout(300);
}

export async function openSearch(page: Page) {
  await expect(page.locator('[role=dialog]')).toHaveCount(0);
  await page.locator('aside button[aria-label="Search"]').click({ force: true });
  const input = page.locator('input[placeholder="Search Memos"]').first();
  await input.waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  return input;
}

export async function searchMemos(page: Page, keyword: string) {
  const input = await openSearch(page);
  await input.fill(keyword);
  await page.waitForTimeout(400);
  await input.press('Enter');
  await page.waitForTimeout(1200);
}

export async function openUserMenu(page: Page) {
  await page.locator('aside button[aria-label^="Switch space"]').click({ force: true });
  await page.waitForTimeout(500);
}

export async function openArchived(page: Page) {
  await openUserMenu(page);
  await page.getByText('Archived', { exact: true }).click();
  await page.waitForURL(/\/archived/);
  await page.waitForTimeout(1000);
}

export async function pinMemo(page: Page, text: string) {
  await openCardMenu(page, text);
  await page.getByRole('menuitem', { name: /^Pin$/ }).click();
  await page.waitForTimeout(1000);
}

export async function unpinMemo(page: Page, text: string) {
  await openCardMenu(page, text);
  await page.getByRole('menuitem', { name: /^Unpin$/ }).click();
  await page.waitForTimeout(1000);
}

export async function openEdit(page: Page, text: string) {
  await openCardMenu(page, text);
  await page.getByText('Edit', { exact: true }).click();
  await page.waitForTimeout(1500);
  return page.locator('.memo-editor-root[contenteditable=true]').last();
}

export async function archiveMemo(page: Page, text: string) {
  await openCardMenu(page, text);
  await page.getByRole('menuitem', { name: /^Archive$/ }).click();
  await page.waitForTimeout(1200);
}

export async function restoreMemo(page: Page, text: string) {
  await openCardMenu(page, text);
  await page.getByRole('menuitem', { name: /^Restore$/ }).click();
  await page.waitForTimeout(1200);
}
