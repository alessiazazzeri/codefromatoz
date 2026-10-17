import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/work",
  "/work/add-group",
  "/services",
  "/about",
  "/contact",
];
for (const width of [320, 375, 768, 1024, 1600]) {
  test(`header e footer a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    for (const route of routes) {
      await page.goto(route);
      const header = page.locator(".global-header");
      await expect(header.locator(".global-logo")).toHaveAttribute("href", "/");
      await expect(header.locator(".global-logo img")).toHaveAttribute(
        "src",
        "/logo.svg",
      );
      await expect(header.locator(".desktop-navigation a")).toHaveText([
        "01WORK",
        "02SERVICES",
        "03ABOUT",
        "04CONTACT↗︎",
      ]);
      const expected = route.startsWith("/work")
        ? "/work"
        : route === "/"
          ? null
          : route;
      if (expected)
        await expect(
          header.locator('.desktop-navigation [aria-current="page"]'),
        ).toHaveAttribute("href", expected);
      else
        await expect(
          header.locator(".desktop-navigation [aria-current]"),
        ).toHaveCount(0);
      const footer = page.locator(".global-footer");
      await expect(footer).toHaveCount(1);
      await expect(footer.locator('a[href="/privacy-policy"]')).toHaveCount(1);
      await expect(footer.locator('a[href="/cookie-policy"]')).toHaveCount(1);
      await expect(footer).toContainText("P. IVA 075065104811");
      for (const link of await footer.locator(".footer-social a").all()) {
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true);
    }
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  });
}
for (const width of [320, 375]) {
  test(`menu mobile completo a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/work/add-group");
    const toggle = page.locator(".menu-toggle");
    const dialog = page.getByRole("dialog");
    await toggle.click();
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("button", { name: "Chiudi menu" }),
    ).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("hidden");
    await expect(dialog.locator('[aria-current="page"]')).toHaveAttribute(
      "href",
      "/work",
    );
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.locator("a").last()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Chiudi menu" }),
    ).toBeFocused();
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(toggle).toBeFocused();
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("");
    await toggle.click();
    await page.getByRole("button", { name: "Chiudi menu" }).click();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await dialog.getByRole("link", { name: /CONTACT/ }).click();
    await expect(page).toHaveURL(/\/contact\/?$/);
    await page.locator(".menu-toggle").click();
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.style.overflow),
    ).toBe("");
  });
}
test("esplorazione logo e pagine legali temporanee", async ({ page }) => {
  await page.goto("/brand-exploration");
  await expect(page.locator(".direction-grid article")).toHaveCount(3);
  await expect(page.locator(".isolated-logo svg")).toHaveCount(3);
  await expect(page.locator(".isolated-logo img")).toHaveCount(0);
  await expect(page.locator(".logo-swatch.light")).toHaveCount(3);
  await expect(page.locator(".logo-swatch.dark")).toHaveCount(3);
  await expect(page.locator("#header-preview .global-logo svg")).toHaveCount(1);
  await expect(page.locator("header").first().locator("img")).toHaveAttribute(
    "src",
    "/logo.svg",
  );
  for (const route of ["/privacy-policy", "/cookie-policy"]) {
    const r = await page.goto(route);
    expect(r?.status()).toBe(200);
    await expect(page.locator("main")).toContainText(
      "DOCUMENTO IN PREPARAZIONE",
    );
  }
  await page.goto("/contact");
  await expect(page.locator(".cp-privacy a")).toHaveAttribute(
    "href",
    "/privacy-policy",
  );
  await expect(page.locator(".cp-privacy input")).toHaveCount(1);
});
test("menu senza JavaScript: navigazione accessibile", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".desktop-navigation")).toBeVisible();
  await expect(page.locator(".desktop-navigation a")).toHaveCount(4);
  await context.close();
});
