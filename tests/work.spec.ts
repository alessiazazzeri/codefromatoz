import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { clientWork } from '../src/data/work';
const names = ['P. Mari Best Catering Equipment', 'ADD Group', 'Elena Bianchi — Psicologa Psicoterapeuta', 'Landing page Centro Fitness', 'Luxury Hair Studio', 'Sito web Centro Estetico'];
for (const width of [320, 390, 768, 1440]) {
  test(`/work editoriale a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto('/work');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle('Selected Projects — Code from A to Z');
    await expect(page.locator('h1')).toHaveText('SELECTEDPROJECTS.');
    await expect(page.locator('.editorial-grid h3')).toHaveText(names);
    await expect(page.locator('.editorial-grid .placeholder-label')).toHaveCount(6);
    await expect(page.locator('.editorial-grid img')).toHaveCount(0);
    await expect(page.locator('[data-work-path^="/work/"]')).toHaveCount(6);
    await expect(page.locator('.editorial-grid a')).toHaveCount(clientWork.filter(project => project.published).length);
    await expect(page.locator('.editorial-grid a[href="/work/add-group"]')).toHaveCount(1);
    await expect(page.locator('#side-quest a')).toHaveAttribute('href', 'https://codefromatoz.github.io/bubu-siby/');
    await expect(page.getByRole('heading', { name: 'SIDE QUESTS / BECAUSE WHY NOT' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const first = await page.locator('.editorial-grid .project').nth(0).boundingBox();
    const second = await page.locator('.editorial-grid .project').nth(1).boundingBox();
    expect(first).not.toBeNull(); expect(second).not.toBeNull();
    expect(first!.width).toBeGreaterThan(second!.width);
    if (width <= 600) expect(second!.y).toBeGreaterThan(first!.y + first!.height);
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Servizi', includeHidden: true })).toHaveAttribute('href', '/#services');
    await expect(page.locator('.wordmark')).toHaveAttribute('href', '/');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}
