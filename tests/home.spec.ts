import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 390, 768, 1440]) {
  test(`homepage, navigazione e accessibilità a ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("DESIGNTHAT ✱WORKS.");
    const logos = page.locator('img[src="/logo.svg"]');
    await expect(logos).toHaveCount(2);
    for (const logo of await logos.all()) {
      await logo.scrollIntoViewIfNeeded();
      await expect(logo).toBeVisible();
      await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 128 && img.naturalHeight === 128)).toBe(true);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.locator(".project")).toHaveCount(4);
    await expect(page.locator('.project-grid .index-image--home')).toHaveCount(4);
    await expect(page.locator('.project-grid .project-shot, .project-grid .art-orbit')).toHaveCount(0);
    await expect(page.locator(".service-grid article")).toHaveCount(6);
    await expect(page.locator('script:not([type="application/ld+json"])')).toHaveCount(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const anchors = await page
      .locator('a[href^="#"]')
      .evaluateAll((elements) =>
        elements.map((e) => e.getAttribute("href")!).filter((h) => h !== "#"),
      );
    for (const anchor of anchors)
      await expect(page.locator(anchor)).toHaveCount(1);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await page
      .getByRole("navigation", {name: "Navigazione footer"})
      .getByRole("link", { name: "WORK", exact: true })
      .click();
    await expect(page).toHaveURL(/\/work\/?$/);
    await page.goto("/");
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}
