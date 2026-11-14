import { chromium } from 'playwright';

const browser = await chromium.launch();
const ctx = await browser.newContext({ storageState: '.auth/state.json', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(15000);

async function deleteAllE2E(scopeName) {
  let deleted = 0;
  for (let i = 0; i < 30; i += 1) {
    const card = page.locator('.relative.group').filter({ hasText: 'E2E-' }).first();
    if ((await card.count()) === 0) break;
    await card.locator('button[aria-label=More]').click({ force: true });
    await page.waitForTimeout(500);
    await page.getByText('Delete', { exact: true }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
    await page.waitForTimeout(900);
    deleted += 1;
  }
  console.log(`${scopeName}: deleted ${deleted}, remaining ${await page.locator('.relative.group').filter({ hasText: 'E2E-' }).count()}`);
}

await page.goto('http://127.0.0.1:5230/');
await page.waitForTimeout(1800);
await deleteAllE2E('timeline');

await page.locator('aside button[aria-label^="Switch space"]').click({ force: true });
await page.waitForTimeout(500);
await page.getByText('Archived', { exact: true }).click();
await page.waitForTimeout(1200);
await deleteAllE2E('archived');

await browser.close();
