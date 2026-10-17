import { setContactState } from "./contact-state";
const form = document.querySelector<HTMLFormElement>("#project-form");
if (form) {
  const fieldset = form.querySelector<HTMLFieldSetElement>("fieldset")!;
  const submit = form.querySelector<HTMLButtonElement>(".cp-submit")!;
  const summary = form.querySelector<HTMLElement>("#form-errors")!;
  const fields = [
    ...fieldset.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea",
    ),
  ];
  form.noValidate = true;
  fieldset.disabled = false;
  submit.disabled = false;
  function validate(field: HTMLInputElement | HTMLTextAreaElement) {
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
          : "Compila questo campo.";
    } else if (!field.validity.valid) {
      message =
        field.type === "email"
          ? "Inserisci un indirizzo email valido."
          : field.type === "url"
            ? "Inserisci un URL completo, ad esempio https://example.com."
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
    field.addEventListener("blur", () => {
      if (field.value || field.hasAttribute("aria-invalid")) {
        validate(field);
        refreshSummary();
      }
    });
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setContactState(form, "idle");
    fields.forEach(validate);
    if (refreshSummary().length) {
      summary.focus();
      return;
    }
    // There is no backend configured. Never transmit, persist or log form data,
    // and never claim success. Keep the direct email available instead.
    setContactState(form, "error");
    form.querySelector<HTMLElement>(".cp-error")!.focus();
  });
}
