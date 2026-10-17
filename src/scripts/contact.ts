import { setContactState } from "./contact-state";
const form = document.querySelector<HTMLFormElement>("#project-form");
if (form) {
  const fieldset = form.querySelector<HTMLFieldSetElement>("fieldset")!;
  const submit = form.querySelector<HTMLButtonElement>(".cp-submit")!;
  const summary = form.querySelector<HTMLElement>("#form-errors")!;
  const fields = [
    ...fieldset.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input, textarea, select"),
  ];
  form.noValidate = true;
  fieldset.disabled = false;
  submit.disabled = false;
  function validate(
    field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  ) {
    let message = "";
    if (
      field.required &&
      (field.type === "checkbox"
        ? !(field as HTMLInputElement).checked
        : !field.value.trim())
    ) {
      message =
        field.type === "checkbox"
          ? "Conferma di aver letto l’informativa privacy e il consenso."
          : field instanceof HTMLSelectElement
            ? "Seleziona un’opzione, anche “Non lo so ancora”."
            : "Compila questo campo.";
    } else if (!field.validity.valid) {
      message =
        field.type === "email"
          ? "Inserisci un indirizzo email valido."
          : "Controlla il valore inserito.";
    }
    const output = document.getElementById(`${field.id}-error`);
    if (output) {
      output.textContent = message;
      output.hidden = !message;
    }
    if (message) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
    return message;
  }
  function refreshSummary() {
    const invalid = fields.filter(
      (field) => field.getAttribute("aria-invalid") === "true",
    );
    const list = summary.querySelector("ul")!;
    list.replaceChildren();
    invalid.forEach((field) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${field.id}`;
      link.textContent =
        field.type === "checkbox"
          ? "Consenso privacy"
          : (field.labels?.[0]?.textContent ?? field.name);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        field.focus();
      });
      item.append(link);
      list.append(item);
    });
    summary.hidden = invalid.length === 0;
    return invalid;
  }
  fields.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid")) {
        validate(field);
        refreshSummary();
      }
      if (form.dataset.state === "error") setContactState(form, "idle");
    });
    field.addEventListener("change", () => {
      if (field.hasAttribute("aria-invalid")) {
        validate(field);
        refreshSummary();
      }
    });
    field.addEventListener("blur", () => {
      if (field.value || field.hasAttribute("aria-invalid")) {
        validate(field);
        refreshSummary();
      }
    });
  });
  const note = document.getElementById("form-availability");
  let token: Promise<string>;
  function prepareToken() {
    token = fetch("/api/contact", {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.token) throw Error();
        return data.token as string;
      })
      .catch(() => "");
  }
  prepareToken();
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.dataset.state === "sending") return;
    setContactState(form, "idle");
    fields.forEach(validate);
    if (refreshSummary().length) {
      summary.focus();
      return;
    }
    setContactState(form, "sending");
    try {
      const challenge = await token;
      if (!challenge) {
        if (note?.firstChild)
          note.firstChild.textContent =
            "L’invio dal modulo non è disponibile. Puoi contattarmi direttamente: ";
        throw Error();
      }
      const read = (name: string) =>
        (
          form.elements.namedItem(name) as
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        ).value;
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: read("name"),
          email: read("email"),
          need: read("need"),
          project: read("project"),
          privacy: (form.elements.namedItem("privacy") as HTMLInputElement)
            .checked,
          honeypot: read("contact_confirm"),
          token: challenge,
        }),
        signal: AbortSignal.timeout(25000),
      });
      const data = await response.json();
      if (response.status === 422 && data.fields) {
        for (const field of fields) {
          const error = data.fields[field.name];
          if (typeof error !== "string") continue;
          field.setAttribute("aria-invalid", "true");
          const output = document.getElementById(`${field.id}-error`);
          if (output) {
            output.textContent = error;
            output.hidden = false;
          }
        }
        setContactState(form, "idle");
        refreshSummary();
        summary.focus();
        return;
      }
      if (!response.ok || data.ok !== true) throw Error();
      form.reset();
      setContactState(form, "success");
      form.querySelector<HTMLElement>(".cp-success")!.focus();
    } catch {
      setContactState(form, "error");
      form.querySelector<HTMLElement>(".cp-error")!.focus();
    } finally {
      prepareToken();
    }
  });
}
