import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const domain = 'https://www.codefromatoz.it';
function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = `${dir}/${name}`;
    return statSync(path).isDirectory() ? htmlFiles(path) : path.endsWith('.html') ? [path] : [];
  });
}
const pages = htmlFiles('dist').map(file => ({ file, route: file.replace(/^dist/, '').replace(/\/index\.html$/, '') || '/' }));
const headers = Object.fromEntries(readFileSync('dist/_headers', 'utf8').split('\n').filter(line => line.startsWith('  ')).map(line => {
  const separator = line.indexOf(':'); return [line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim()];
}));

test('metadata centralizzati, sitemap, robots, social e icone', async ({ page, request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
  expect(locations).toHaveLength(11);
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${domain}/sitemap.xml`);
  expect(robots).not.toContain('Disallow: /privacy-policy');
  for (const { file, route } of pages) {
    const path = route === '/404.html' ? '/404' : route;
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${domain}${path}`);
    const hidden = ['/privacy-policy', '/cookie-policy', '/404'].includes(path);
    expect(locations.includes(`${domain}${path}`)).toBe(!hidden);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', hidden ? 'noindex, follow' : 'index, follow');
    for (const property of ['title', 'description', 'url', 'image', 'type']) {
      expect(await page.locator(`meta[property="og:${property}"]`).getAttribute('content')).toBeTruthy();
    }
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(image).toMatch(/^https:\/\/www\.codefromatoz\.it\//);
    expect((await request.get(new URL(image!).pathname)).status()).toBe(200);
    const schema = page.locator('script[type="application/ld+json"]');
    if (!hidden) {
      const graph = JSON.parse((await schema.textContent())!);
      expect(graph['@graph'].map((entity: { '@type': string }) => entity['@type'])).toEqual(['WebSite', 'Person']);
      expect(graph['@graph'][1].name).toBe('Alessia Zazzeri');
      expect(graph['@graph'][1].sameAs).toHaveLength(2);
    } else await expect(schema).toHaveCount(0);
    // All emitted scripts must be authorized by the generated CSP.
    const html = readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
      if (match[1]) expect(headers['content-security-policy']).toContain(`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
    }
  }
  for (const path of ['/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/social/code-from-a-to-z.png']) expect((await request.get(path)).status()).toBe(200);
  for (const path of ['/brand-exploration', '/brand-exploration/a-z-mark', '/missing-page-audit']) {
    expect((await request.get(path)).status()).toBe(404);
    await page.goto(path);
    expect(new URL(page.url()).pathname).toBe(path);
    await expect(page.locator('main')).toContainText('Questa pagina non esiste.');
  }
  expect(htmlFiles('dist').some(file => file.includes('brand-exploration'))).toBe(false);
  expect(readdirSync('dist/_astro').some(name => name.endsWith('.png'))).toBe(false);
});

for (const width of [320, 375, 768, 1024, 1440]) test(`tutte le pagine: responsive, footer landmark e axe a ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  for (const { route } of pages) {
    await page.goto(route);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    await expect(page.locator('main footer')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(audit.violations, route).toEqual([]);
  }
});

test('overflow vicino a 720px, priorità Work e hit area contatto', async ({ page }) => {
  for (const width of [700, 719, 720, 721, 740]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `home ${width}`).toBe(true);
  }
  await page.goto('/work');
  const images = page.locator('.project img');
  await expect(images.first()).toHaveAttribute('loading', 'eager');
  await expect(images.first()).toHaveAttribute('fetchpriority', 'high');
  for (const image of (await images.all()).slice(1)) await expect(image).toHaveAttribute('loading', 'lazy');
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/work/add-group');
  const link = page.locator('.contact-placeholder > a');
  await link.scrollIntoViewIfNeeded();
  // Pseudo-element extends the clickable area without moving text or layout.
  const hit = await link.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return [-15, 27].map(offset => element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + offset)));
  });
  expect(hit).toEqual([true, true]);
});

test('CSP effettiva simulata, menu/form accessibili, nessun cookie o storage', async ({ page, context }) => {
  const violations: string[] = [];
  const external: string[] = [];
  await page.addInitScript(() => {
    (window as Window & { cspFailures?: string[] }).cspFailures = [];
    document.addEventListener('securitypolicyviolation', event => (window as Window & { cspFailures?: string[] }).cspFailures!.push(event.violatedDirective));
  });
  page.on('request', request => { if (new URL(request.url()).origin !== 'http://localhost:4321') external.push(request.url()); });
  await page.route('**/*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), ...headers } });
  });
  // Mock the same-origin endpoint only; no real email is sent.
  await page.route('**/api/contact', async route => {
    await route.fulfill({ json: route.request().method() === 'GET' ? { token: 'test-challenge' } : { ok: true } });
  });
  await page.setViewportSize({ width: 375, height: 900 });
  for (const path of ['/', '/work', '/about', '/contact']) {
    await page.goto(path);
    await page.locator('.menu-toggle').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    violations.push(...await page.evaluate(() => (window as Window & { cspFailures?: string[] }).cspFailures ?? []));
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
    expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  }
  await page.locator('#contact-name').fill('Test');
  await page.locator('#contact-email').fill('visitor@example.com');
  await page.locator('#contact-need').selectOption('Restyling');
  await page.locator('#contact-project').fill('Una richiesta di prova.');
  await page.locator('#contact-privacy').check();
  await page.locator('.cp-submit').click();
  await expect(page.locator('.cp-success')).toBeFocused();
  violations.push(...await page.evaluate(() => (window as Window & { cspFailures?: string[] }).cspFailures ?? []));
  expect(violations).toEqual([]);
  expect(external).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).not.toMatch(/script-src[^;]*unsafe-inline/);
});
