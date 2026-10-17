import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

for (const width of [390, 1440]) {
  test(`ritratto a livelli e reveal About a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const visual = page.locator('.about-visual');
    const image = visual.locator('.about-portrait');
    await expect(visual).toHaveClass(/will-reveal/);
    await expect(image).toHaveCSS('opacity', '0');
    await expect(image).toHaveCSS('transition-delay', '0.12s, 0.12s');
    await expect(visual.locator('.about-sticker')).toHaveCSS('transition-delay', '0.24s, 0.24s');
    await visual.scrollIntoViewIfNeeded();
    await expect(visual).toHaveClass(/is-revealed/);
    await expect(image).toHaveCSS('opacity', '1');
    await image.evaluate((img: HTMLImageElement) => img.decode());
    await expect(image).toHaveCSS('filter', 'grayscale(1)');
    await expect(visual.locator('.about-composition')).toHaveCSS('background-color', 'rgb(180, 154, 255)');
    await expect(visual.locator('.about-code')).toHaveAttribute('aria-hidden', 'true');
    const css = readFileSync('src/components/AboutVisual.css', 'utf8').split('/* Reveal')[0].trim();
    expect(await visual.locator('.about-code').textContent()).toBe(css);
    await expect(visual.locator('.about-sticker')).toHaveText('DESIGNMEETS CODE');
    await expect(visual.locator('.art-mark, .portfolio-image')).toHaveCount(0);
    await expect(page.locator('.hero .sculpture-a')).toHaveText('A');
    await expect(page.locator('.hero .sculpture-z')).toHaveText('Z');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(image).toHaveCSS('opacity', '1');
    await expect(image).toHaveCSS('transition-duration', '0s');
    await expect(visual.locator('.about-sticker')).toHaveCSS('opacity', '1');
  });
}
