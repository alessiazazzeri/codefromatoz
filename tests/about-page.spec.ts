import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [320, 375, 768, 1440]) {
  test(`/about narrativa a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/about");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(
      "CODE FIRST.THEN DESIGN.NOW BOTH.",
    );
    await expect(page.locator(".ap-section")).toHaveCount(7);
    await expect(page.locator(".ap-principles li")).toHaveCount(4);
    const portrait = page.locator(".ap-portrait img");
    await portrait.evaluate((image: HTMLImageElement) => image.decode());
    expect(
      await portrait.evaluate((image: HTMLImageElement) => image.naturalWidth),
    ).toBe(408);
    await expect(portrait).toHaveCSS("filter", "grayscale(1)");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: "Alessia", includeHidden: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".ap-offline a")).toHaveAttribute(
      "href",
      "https://codefromatoz.github.io/bubu-siby/",
    );
    await expect(page.locator(".ap-primary")).toHaveAttribute(
      "href",
      "mailto:info@codefromatoz.it",
    );
    await expect(page.locator(".ap-primary")).toHaveAttribute(
      "data-future-href",
      "/contact",
    );
    await expect(page.locator('.ap-actions a[href="/work"]')).toHaveCount(1);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((elements) =>
        elements.map((e) => e.getAttribute("href")!),
      )) {
      const target = new URL(href, "http://localhost:4321");
      const result = await page.request.get(target.pathname);
      expect(result.status(), href).toBe(200);
      if (target.hash)
        expect(await result.text()).toContain(`id="${target.hash.slice(1)}"`);
    }
  });
}
test("/about reveal e cambio reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about");
  const target = page.locator("[data-about-reveal]").first();
  await expect(target).toHaveClass(/ap-pending/);
  await target.scrollIntoViewIfNeeded();
  await expect(target).toHaveClass(/ap-inview/);
  await expect(target).toHaveCSS("translate", "0px");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".about-page")).not.toHaveClass(/ap-motion/);
  await expect(page.locator(".ap-pending")).toHaveCount(0);
});
