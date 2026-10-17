import { test, expect } from '@playwright/test';
const assets = {
  'p-mari-best-catering-ltd': 'p-mari-best-catering',
  'add-group': 'add-group',
  'elena-bianchi': 'elena-bianchi',
  'centro-fitness': 'gym-center',
  'luxury-hair-studio': 'luxury-hair-studio',
  'centro-estetico': 'sito-estetista',
};
const previewAssets: Record<string, string> = { 'p-mari-best-catering-ltd': 'p-mari-full', 'add-group': 'add-group-full', 'elena-bianchi': 'elena-bianchi-full', 'centro-fitness': 'gym-center-full', 'luxury-hair-studio': 'luxury-hair-full', 'centro-estetico': 'sito-estetista-full' };
const details: Record<string, string[]> = {
  'p-mari-best-catering-ltd': ['p-mari-lista-prodotti', 'p-mari-prodotto-singolo', 'p-mari-search'],
  'add-group': ['add-group-sector', 'add-group-visual', 'add-group-mobile'],
  'elena-bianchi': ['elena-bianchi-servizi', 'elena-bianchi-mobile'],
  'centro-fitness': ['gym-center-2', 'gym-center-mobile'],
  'luxury-hair-studio': ['luxury-hair-studio-2', 'luxury-hair-mobile'],
  'centro-estetico': ['sito-estetista-listino', 'sito-estetista-mobile'],
};
for (const width of [375, 1440]) {
  test(`asset reali, associazioni e caricamento a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/', '/work']) {
      await page.goto(path);
      const cards = page.locator('.project');
      await expect(cards).toHaveCount(path === '/' ? 4 : 6);
      await expect(cards.locator('.art-mark, .placeholder-label')).toHaveCount(0);
      let index = 0;
      for (const card of await cards.all()) {
        if (path === '/work') {
          const expectedRatio = width <= 600 ? (index % 2 ? .95 : 1.15) : ([1, 2].includes(index % 4) ? 1 : 1.4);
          expect(await card.locator('.project-art').evaluate(el => parseFloat(getComputedStyle(el).aspectRatio))).toBeCloseTo(expectedRatio);
        }
        index++;
        const slug = (await card.getAttribute('data-work-path'))!.split('/').pop()!;
        const image = card.locator('img');
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveAttribute('src', new RegExp(`/_astro/${previewAssets[slug]}\\..*\\.webp$`));
        await expect(image).toHaveAttribute('srcset', /320w.*480w/);
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth > 0)).toBe(true);
        expect(Number(await image.getAttribute('width'))).toBeGreaterThan(0);
        expect(Number(await image.getAttribute('height'))).toBeGreaterThan(0);
      }
      await expect(page.locator('.quest-screenshot img')).toHaveAttribute('src', /bubu-siby.*\.webp$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    for (const [slug, filename] of Object.entries(assets)) {
      await page.goto(`/work/${slug}`);
      const primary = page.locator('.case-hero .case-media-real img');
      await expect(primary).toHaveCount(1);
      await expect(primary).toHaveAttribute('src', new RegExp(`${filename}.*\\.webp$`));
      await expect(primary).toHaveAttribute('loading', 'eager');
      await expect(primary).toHaveAttribute('fetchpriority', 'high');
      await primary.scrollIntoViewIfNeeded();
      await expect.poll(() => primary.evaluate((img: HTMLImageElement) => img.naturalWidth > 0)).toBe(true);
      await expect(page.locator('main img.portfolio-image')).toHaveCount(slug === 'add-group' ? 5 : slug === 'p-mari-best-catering-ltd' ? 4 : 3);
      for (const filename of details[slug]) {
        const image = page.locator(`main img.portfolio-image[src*="/${filename}."]`);
        await expect(image).toHaveCount(1);
        await expect(image).toHaveAttribute('loading', 'lazy');
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth > 0)).toBe(true);
      }
      if (slug === 'add-group') {
        const mobile = page.locator('.add-phone img');
        await expect(mobile).toHaveAttribute('width', '588');
        await expect(mobile).toHaveAttribute('srcset', /480w.*588w/);
        await expect(mobile).not.toHaveAttribute('srcset', /960w/);
      }
      expect(await page.locator('.case-media:not(.case-media-real)').count()).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}
