import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [320, 375, 768, 1440]) {
  test(`case study P.Mari a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/work/p-mari-best-catering-ltd");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("P.MARI BESTCATERING LTD.");
    await expect(page.locator(".case-section")).toHaveCount(7);
    await expect(page.locator(".case-media")).toHaveCount(4);
    await expect(page.locator(".case-info dl > div")).toHaveCount(5);
    await expect(page.locator(".catalogue-path strong")).toHaveText([
      "CATEGORIE",
      "RICERCA",
      "PRODOTTO",
      "CONTATTO",
    ]);
    await expect(page.locator(".language-grid span")).toHaveText([
      "EN",
      "IT",
      "EL",
      "RU",
    ]);
    await expect(page.locator(".case-next")).toHaveAttribute(
      "data-next-project",
      "/work/add-group",
    );
    await expect(page.locator(".case-next a")).toHaveAttribute("href", "/work/add-group");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("navigation").getByRole("link", { name: /Progetti/ }),
    ).toHaveAttribute("href", "/work");
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
  });
}
