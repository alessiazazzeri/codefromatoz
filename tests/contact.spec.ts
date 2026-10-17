import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  setContactState,
  type ContactState,
} from "../src/scripts/contact-state";

for (const width of [320, 375, 768, 1440]) {
  test(`/contact accessibile e validazione a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const posts: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    const response = await page.goto("/contact");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("TELL MEWHAT'S ONYOUR MIND.");
    await expect(page.getByLabel("Nome (obbligatorio)")).toBeEnabled();
    await expect(
      page.getByLabel("Budget indicativo (facoltativo)"),
    ).not.toHaveAttribute("required");
    await expect(
      page.getByLabel("Di cosa hai bisogno? (facoltativo)"),
    ).not.toHaveAttribute("required");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.getByRole("button", { name: "INVIA IL PROGETTO" }).click();
    await expect(page.locator("#form-errors")).toBeFocused();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(4);
    await expect(page.locator("#contact-name-error")).toHaveText(
      "Compila questo campo.",
    );
    await page.locator("#form-errors a").first().click();
    await expect(page.getByLabel("Nome (obbligatorio)")).toBeFocused();
    await page.getByLabel("Nome (obbligatorio)").fill("Test visitor");
    await page.getByLabel("Email (obbligatorio)").fill("not-an-email");
    await page.getByLabel("Hai già un sito?").fill("not-a-url");
    await page
      .getByLabel("Raccontami il progetto (obbligatorio)")
      .fill("Messaggio di prova del modulo.");
    await page.locator("#contact-privacy").check();
    await page.getByRole("button", { name: "INVIA IL PROGETTO" }).click();
    await expect(page.locator("#contact-email-error")).toHaveText(
      "Inserisci un indirizzo email valido.",
    );
    await expect(page.locator("#contact-website-error")).toContainText(
      "URL completo",
    );
    await page.getByLabel("Email (obbligatorio)").fill("test@example.com");
    await page.getByLabel("Hai già un sito?").fill("");
    await page.getByRole("button", { name: "INVIA IL PROGETTO" }).click();
    await expect(page.locator("#project-form")).toHaveAttribute(
      "data-state",
      "error",
    );
    await expect(page.locator(".cp-error")).toBeFocused();
    await expect(page.locator(".cp-success")).toBeHidden();
    await expect(page.locator(".cp-error a")).toHaveAttribute(
      "href",
      "mailto:info@codefromatoz.it",
    );
    expect(posts).toEqual([]);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  });
}
test("stati UI predisposti senza invio simulato", async ({ page }) => {
  await page.goto("/contact");
  for (const state of [
    "sending",
    "success",
    "error",
    "idle",
  ] as ContactState[]) {
    await page.evaluate(
      ({ source, state }) => {
        const render = new Function(`return (${source})`)();
        render(document.querySelector("#project-form"), state);
      },
      { source: setContactState.toString(), state },
    );
    await expect(page.locator("#project-form")).toHaveAttribute(
      "aria-busy",
      String(state === "sending"),
    );
    if (state === "sending")
      await expect(page.locator(".cp-submit")).toBeDisabled();
    else await expect(page.locator(".cp-submit")).toBeEnabled();
    if (state === "success")
      await expect(
        page.getByRole("status").filter({ hasText: "GOT IT." }),
      ).toBeVisible();
    if (state === "sending")
      await expect(page.locator(".cp-submit")).toHaveText("SENDING...");
  }
});
test("senza JavaScript non invia dati e offre email diretta", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/contact");
  await expect(page.locator(".cp-submit")).toBeDisabled();
  await expect(page.locator(".cp-direct a")).toHaveAttribute(
    "href",
    "mailto:info@codefromatoz.it",
  );
  await context.close();
});
