import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const width of [390, 1440]) {
  test(`motion e pausa a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/motion-enabled/);
    const toggle = page.getByRole("button", {
      name: "Metti in pausa le animazioni",
    });
    await expect(toggle).toBeVisible();
    await expect(page.locator(".sculpture-star")).toHaveCSS(
      "animation-name",
      "slow-turn",
    );
    await page.evaluate(() => scrollTo(0, 160));
    await expect
      .poll(() =>
        page
          .locator(".sculpture")
          .evaluate((e) => e.style.getPropertyValue("--parallax-y")),
      )
      .not.toBe("0px");
    const card = page.locator(".project").first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveClass(/is-revealed/);
    await expect(card).toHaveCSS("opacity", "1");
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/motion-paused/);
    await expect(page.locator(".sculpture-star")).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator(".marquee-track")).toHaveCSS(
      "animation-name",
      "none",
    );
    await page.getByRole("button", { name: "Riprendi le animazioni" }).click();
    await expect(page.locator("html")).toHaveClass(/motion-enabled/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(toggle).toBeHidden();
    await expect(page.locator(".sculpture-star")).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator(".will-reveal")).toHaveCount(0);
    await expect(page.locator(".sculpture")).toHaveCSS("transform", "none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const element of await page.locator(".will-reveal").all()) {
      await element.scrollIntoViewIfNeeded();
      await expect(element).toHaveCSS("opacity", "1");
    }
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      );
    });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.locator("#contact").focus();
    await expect(page.locator("#contact")).toBeFocused();
  });
}
test("contenuti disponibili senza JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator(".project").first()).toBeVisible();
  await expect(page.locator(".motion-toggle")).toBeHidden();
  await expect(page.locator(".will-reveal")).toHaveCount(0);
  await context.close();
});
