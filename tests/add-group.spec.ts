import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [320, 375, 768, 1440]) {
  test(`ADD Group B2B a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/work/add-group");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("ADD GROUP.");
    await expect(page.locator(".add-case .case-section")).toHaveCount(6);
    await expect(page.locator(".add-info dl > div")).toHaveCount(4);
    await expect(page.locator(".add-case .case-media")).toHaveCount(4);
    await expect(page.locator(".add-phone")).toHaveCount(1);
    await expect(page.locator('.add-case [aria-label^="Placeholder"]')).toHaveCount(0);
    await expect(page.locator('.add-structure img')).toHaveAttribute('src', /add-group-sector.*\.webp$/);
    await expect(page.locator('.add-direction img')).toHaveAttribute('src', /add-group-visual.*\.webp$/);
    await expect(page.locator('.add-desktop img')).toHaveAttribute('src', /add-group\..*\.webp$/);
    await expect(page.locator('.add-phone img')).toHaveAttribute('src', /add-group-mobile.*\.webp$/);
    await expect(page.locator(".add-case img")).toHaveCount(5);
    await expect(page.locator(".add-next")).toHaveAttribute(
      "data-next-project",
      "/work/elena-bianchi",
    );
    await expect(page.locator(".add-next a")).toHaveAttribute("href", "/work/elena-bianchi");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(await page.locator(".add-case").textContent()).not.toMatch(
      /DYLOG|listini|agenti|e-commerce/i,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    for (const path of ["/", "/work"]) {
      await page.goto(path);
      const link = page.locator(`.project h3 a[href="${path === '/' ? '/work#add-group' : '/work/add-group'}"]`);
      await expect(link).toHaveCount(1);
      await link.click();
      if (path === "/") {
        await expect(page).toHaveURL(/\/work#add-group$/);
        await page.locator('#add-group h3 a').click();
      }
      await expect(page).toHaveURL(/\/work\/add-group\/?$/);
      await expect(page.locator("h1")).toHaveText("ADD GROUP.");
    }
  });
}
