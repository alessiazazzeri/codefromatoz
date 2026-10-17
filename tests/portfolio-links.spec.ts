import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { clientWork } from "../src/data/work";
import { projects } from "../src/data/portfolio";

test("card collegate per ogni case study esistente e link interni validi", async ({
  page,
}) => {
  const available = clientWork.filter((project) =>
    existsSync(`dist/work/${project.slug}/index.html`),
  );
  expect(
    clientWork
      .filter((project) => project.published)
      .map((project) => project.slug),
  ).toEqual(available.map((project) => project.slug));
  for (const path of ["/", "/work"]) {
    await page.goto(path);
    const expected =
      path === "/"
        ? projects.filter((project) =>
            available.some((ready) => ready.slug === project.slug),
          )
        : available;
    for (const project of expected)
      await expect(
        page.locator(`.project h3 a[href="${path === "/" ? `/work#${project.slug}` : `/work/${project.slug}`}"]`),
      ).toHaveCount(1);
    await expect(page.locator("#side-quest a")).toHaveAttribute(
      "href",
      "https://codefromatoz.github.io/bubu-siby/",
    );
  }
  const sequence = [
    "p-mari-best-catering-ltd",
    "add-group",
    "elena-bianchi",
    "centro-fitness",
    "luxury-hair-studio",
    "centro-estetico",
  ];
  for (let index = 0; index < sequence.length; index++) {
    await page.goto(`/work/${sequence[index]}`);
    const next = `/work/${sequence[(index + 1) % sequence.length]}`;
    await expect(page.locator(".case-next a")).toHaveAttribute("href", next);
    await page.locator(".case-next a").click();
    await expect(page).toHaveURL(new RegExp(next + "/?$"));
  }
  const checked = new Set<string>();
  for (const path of [
    "/",
    "/work",
    "/services",
    "/about",
    "/contact",
    "/privacy-policy",
    "/cookie-policy",
    "/brand-exploration",
    ...available.map((project) => `/work/${project.slug}`),
  ]) {
    await page.goto(path);
    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("href")!),
      );
    for (const href of hrefs) {
      const target = new URL(href, `http://localhost:4321${path}`);
      if (target.origin !== "http://localhost:4321" || checked.has(target.href))
        continue;
      checked.add(target.href);
      const response = await page.request.get(target.pathname);
      expect(response.status(), `Link ${href} da ${path}`).toBe(200);
      if (target.hash)
        expect(
          await response.text(),
          `Ancora ${target.hash} da ${path}`,
        ).toContain(`id="${target.hash.slice(1)}"`);
    }
  }
});

for (const width of [375, 1440]) {
  test(`homepage → progetto in work → case study, card intere a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const project of projects) {
      await page.goto('/');
      const art = page.locator(`[data-work-path="/work/${project.slug}"] .project-art`);
      await art.scrollIntoViewIfNeeded();
      const homeBox = (await art.boundingBox())!;
      await page.mouse.click(homeBox.x + homeBox.width / 2, homeBox.y + homeBox.height / 2);
      await expect(page).toHaveURL(new RegExp(`/work#${project.slug}$`));
      const target = page.locator(`article#${project.slug}`);
      await expect(target).toBeInViewport();
      const workArt = target.locator('.project-art');
      await workArt.scrollIntoViewIfNeeded();
      const workBox = (await workArt.boundingBox())!;
      await page.mouse.click(workBox.x + workBox.width / 2, workBox.y + workBox.height / 2);
      await expect(page).toHaveURL(new RegExp(`/work/${project.slug}/?$`));
    }
    await page.goto('/work');
    for (const project of clientWork) {
      const link = page.locator(`#${project.slug} h3 a`);
      await link.focus();
      await expect(link).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/work/${project.slug}/?$`));
      await page.goBack();
    }
  });
}
