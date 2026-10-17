import { test, expect } from '@playwright/test';
for (const width of [320, 375, 768, 1024, 1440]) test(`viewport portfolio: larghezza intera e taglio verticale a ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  for (const path of ['/', '/work']) {
    await page.goto(path);
    for (const card of await page.locator('.project-art').all()) {
      const image = card.locator('img');
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
      const result = await image.evaluate((element: HTMLImageElement) => {
        const frame = element.parentElement!;
        const rect = element.getBoundingClientRect(), parent = frame.getBoundingClientRect();
        const style = getComputedStyle(element), border = getComputedStyle(frame);
        const left = parseFloat(border.borderLeftWidth), right = parseFloat(border.borderRightWidth), top = parseFloat(border.borderTopWidth);
        return { x: rect.left - parent.left - left, y: rect.top - parent.top - top, width: rect.width, innerWidth: parent.width - left - right, height: rect.height, frameHeight: frame.clientHeight, sourceRatio: element.naturalWidth / element.naturalHeight, renderedRatio: rect.width / rect.height, transform: style.transform, overflow: border.overflow, src: element.currentSrc };
      });
      expect(result.src).toContain('-full.');
      expect(Math.abs(result.x)).toBeLessThan(1);
      expect(Math.abs(result.y)).toBeLessThan(1);
      expect(Math.abs(result.width - result.innerWidth)).toBeLessThan(1);
      expect(result.renderedRatio).toBeCloseTo(result.sourceRatio, 2);
      expect(result.height).toBeGreaterThanOrEqual(result.frameHeight - 1);
      expect(result.transform).toBe('none');
      expect(result.overflow).toBe('hidden');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
