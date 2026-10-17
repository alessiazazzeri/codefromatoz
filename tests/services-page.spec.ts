import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [320, 375, 768, 1440]) {
  test(`/services a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/services");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("FROM IDEA.TO WEBSITE.");
    await expect(page.locator(".srv-section")).toHaveCount(8);
    await expect(page.locator(".srv-price strong")).toHaveText([
      "€650",
      "€1.000",
      "€750",
      "€1.500",
    ]);
    await expect(page.locator(".srv-price small")).toHaveText([
      "FROM",
      "FROM",
      "FROM",
      "FROM",
    ]);
    await expect(page.locator(".srv-timeline li")).toHaveCount(5);
    await expect(page.locator(".srv-tool-row")).toHaveCount(3);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.locator('.desktop-navigation a[href="/services"]'),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".srv-final a")).toHaveAttribute(
      "href",
      "/contact",
    );
    await expect(page.locator('.global-footer a[href="/contact"]')).toHaveCount(1);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    for (const link of await page.locator('a[href^="/"]').all()) {
      const href = (await link.getAttribute("href"))!;
      const target = new URL(href, "http://localhost:4321");
      const destination = await page.request.get(target.pathname);
      expect(destination.status(), href).toBe(200);
      if (target.hash)
        expect(await destination.text()).toContain(
          `id="${target.hash.slice(1)}"`,
        );
    }
  });
}
