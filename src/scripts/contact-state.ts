export type ContactState = "idle" | "sending" | "success" | "error";
// Sending and success are ready for a future real delivery integration.
// Only an actual confirmed delivery should transition to success.
export function setContactState(form: HTMLFormElement, state: ContactState) {
  form.dataset.state = state;
  form.setAttribute("aria-busy", String(state === "sending"));
  const submit = form.querySelector<HTMLButtonElement>(".cp-submit")!;
  submit.disabled = state === "sending";
  submit.innerHTML =
    state === "sending"
      ? "SENDING..."
      : 'INVIA IL PROGETTO <span aria-hidden="true">→</span>';
  form.querySelectorAll<HTMLElement>(".cp-form-status").forEach((element) => {
    element.hidden = !element.classList.contains(`cp-${state}`);
  });
}
