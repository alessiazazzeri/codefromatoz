import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const projects = [
  "elena-bianchi",
  "centro-fitness",
  "luxury-hair-studio",
  "centro-estetico",
];
for (const slug of projects)
  for (const width of [320, 375, 768, 1440]) {
    test(`${slug}: formato visuale a ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(`/work/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator(".visual-info dl > div")).toHaveCount(
        slug === "luxury-hair-studio" ? 3 : 4,
      );
      await expect(page.locator(".visual-case .case-section")).toHaveCount(4);
      await expect(page.locator(".visual-case .case-media")).toHaveCount(4);
      await expect(page.locator(".visual-case img")).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.keyboard.press("Tab");
      await expect(page.locator(".skip-link")).toBeFocused();
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
    });
  }
