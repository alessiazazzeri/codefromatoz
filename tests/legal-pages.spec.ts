import { test, expect } from '@playwright/test';

for (const route of ['/privacy-policy', '/cookie-policy']) {
  test(`${route}: lettura, indice da tastiera e link validi`, async ({ page, request }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('time')).toHaveAttribute('datetime', '2026-10-17');
    await expect(page.locator('main')).not.toContainText('DOCUMENTO IN PREPARAZIONE');
    await expect(page.getByRole('contentinfo')).toContainText('Code from A to Z di Zazzeri Alessia');
    await expect(page.getByRole('contentinfo')).toContainText('© 2026 CODE FROM A TO Z — ALESSIA ZAZZERI');
    await expect(page.getByRole('contentinfo')).toContainText('P. IVA 07506510481');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    const index = page.locator('.legal-index a');
    for (const link of await index.all()) {
      const href = (await link.getAttribute('href'))!;
      await expect(page.locator(href)).toHaveCount(1);
      await link.focus();
      await expect(link).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.locator(href)).toBeInViewport();
    }
    for (const href of await page.locator('main a[href^="/"]').evaluateAll(links => links.map(link => link.getAttribute('href')!))) {
      const url = new URL(href, 'http://localhost:4321');
      const response = await request.get(url.pathname);
      expect(response.status()).toBe(200);
      if (url.hash) expect(await response.text()).toContain(`id="${url.hash.slice(1)}"`);
    }
  });
}

test('informative, checkbox e audit privacy senza nuove richieste o storage', async ({ page, context }) => {
  const external: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).origin !== 'http://localhost:4321') external.push(request.url());
  });
  for (const route of ['/privacy-policy', '/cookie-policy', '/contact']) {
    await page.goto(route);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
    expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
    await expect(page.locator('iframe')).toHaveCount(0);
  }
  const checkbox = page.locator('#contact-privacy');
  await expect(checkbox).toHaveAttribute('required');
  await expect(checkbox).toHaveAttribute('aria-describedby', 'contact-privacy-error');
  await expect(page.locator('label[for="contact-privacy"]')).toHaveText("Ho letto l'informativa privacy.");
  await expect(page.locator('.cp-privacy a')).toHaveAttribute('href', '/privacy-policy');
  await expect(page.locator('.cp-privacy input')).toHaveCount(1);
  await expect(page.locator('#privacy-note')).toHaveCount(0);
  await page.locator('.cp-privacy a').click();
  await expect(page.locator('#titolare')).toContainText('Via G. F. Mariti 2');
  await expect(page.locator('#titolare')).toContainText('50127 Firenze (FI), Italia');
  await expect(page.locator('#sicurezza')).toContainText('pseudonimizzato, non completamente anonimizzato');
  await expect(page.locator('#conservazione')).toContainText('fino a 12 mesi');
  expect(external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});
