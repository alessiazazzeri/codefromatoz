import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("hover dei servizi: accenti distinti senza spostare la griglia", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const cards = page.locator(".service-grid article");
  const colors: string[] = [];
  for (const card of (await cards.all()).slice(0, 3)) {
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveCSS("transform", "none");
    const before = await card.boundingBox();
    await card.hover();
    await expect
      .poll(() =>
        card.evaluate((e) => getComputedStyle(e, "::after").transform),
      )
      .toBe("matrix(1, 0, 0, 1, 0, 0)");
    const after = await card.boundingBox();
    expect(after).toEqual(before);
    colors.push(
      await card.evaluate((e) =>
        getComputedStyle(e).getPropertyValue("--service-accent").trim(),
      ),
    );
  }
  expect(new Set(colors).size).toBe(3);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await cards.first().hover();
  await expect(cards.first().locator(".service-symbol")).toHaveCSS(
    "transform",
    "none",
  );
  const audit = await new AxeBuilder({ page })
    .include("#services")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
});
