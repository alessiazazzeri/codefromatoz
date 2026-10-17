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
    await expect(page.locator('label[for="contact-privacy"]')).toHaveText("Ho letto l'informativa privacy.");
    await expect(page.locator('#contact-privacy')).toHaveAttribute('required');
    await expect(page.locator('.cp-privacy a')).toHaveAttribute('href', '/privacy-policy');
    await expect(
      page.locator("#contact-brand, #contact-website, #contact-budget"),
    ).toHaveCount(0);
    await expect(
      page.getByLabel("Di cosa hai bisogno? (obbligatorio)"),
    ).toHaveAttribute("required");
    await expect(page.locator(".cp-budget a")).toHaveAttribute(
      "href",
      "/services#numbers-title",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.getByRole("button", { name: "PARLIAMONE" }).click();
    await expect(page.locator("#form-errors")).toBeFocused();
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(5);
    await expect(page.locator('#contact-privacy-error')).toHaveText('Conferma di aver letto l’informativa privacy.');
    await expect(page.locator('#form-errors')).toContainText('Presa visione dell’informativa privacy');
    await expect(page.locator("#contact-name-error")).toHaveText(
      "Compila questo campo.",
    );
    await page.locator("#form-errors a").first().click();
    await expect(page.getByLabel("Nome (obbligatorio)")).toBeFocused();
    await page.getByLabel("Nome (obbligatorio)").fill("Test visitor");
    await page.getByLabel("Email (obbligatorio)").fill("not-an-email");
    await page
      .getByLabel("Raccontami in due righe cosa hai in mente (obbligatorio)")
      .fill("Messaggio di prova del modulo.");
    await page.locator("#contact-privacy").check();
    await page.getByRole("button", { name: "PARLIAMONE" }).click();
    await expect(page.locator("#contact-email-error")).toHaveText(
      "Inserisci un indirizzo email valido.",
    );
    await expect(page.locator("#contact-need-error")).toContainText(
      "Non lo so ancora",
    );
    await page
      .getByLabel("Di cosa hai bisogno? (obbligatorio)")
      .selectOption("Non lo so ancora");
    await expect(page.locator("#contact-need-error")).toBeHidden();
    await page.getByLabel("Email (obbligatorio)").fill("test@example.com");
    await page.getByRole("button", { name: "PARLIAMONE" }).click();
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

for (const width of [375, 1440]) {
  test(`invio API, errori e recupero a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let outcome = 422;
    const payloads: Record<string, unknown>[] = [];
    await page.route("**/api/contact", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { token: "test-challenge" } });
        return;
      }
      payloads.push(route.request().postDataJSON());
      await route.fulfill({
        status: outcome,
        json:
          outcome === 422
            ? { ok: false, fields: { project: "Controlla il messaggio." } }
            : { ok: outcome === 200 },
      });
    });
    await page.goto("/contact");
    await page.locator("#contact-name").fill("Alessia");
    await page.locator("#contact-email").fill("visitor@example.com");
    await page.locator("#contact-need").selectOption("Restyling");
    await page.locator("#contact-project").fill("Una richiesta di prova.");
    await page.locator("#contact-privacy").check();
    const submit = page.locator(".cp-submit");
    await submit.click();
    await expect(page.locator("#form-errors")).toBeFocused();
    await expect(page.locator("#contact-project-error")).toHaveText(
      "Controlla il messaggio.",
    );
    outcome = 429;
    await submit.click();
    await expect(page.locator(".cp-error")).toBeFocused();
    await expect(page.locator("#contact-project")).toHaveValue(
      "Una richiesta di prova.",
    );
    await expect(page.locator(".cp-success")).toBeHidden();
    outcome = 200;
    await submit.click();
    await expect(page.locator(".cp-success")).toBeFocused();
    await expect(page.locator("#contact-project")).toHaveValue("");
    expect(payloads).toHaveLength(3);
    expect(payloads[2]).toEqual({
      name: "Alessia",
      email: "visitor@example.com",
      need: "Restyling",
      project: "Una richiesta di prova.",
      privacy: true,
      honeypot: "",
      token: "test-challenge",
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
