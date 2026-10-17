const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
const toggle = document.querySelector<HTMLButtonElement>(".motion-toggle");
const visual = document.querySelector<HTMLElement>(".sculpture");
const hero = document.querySelector<HTMLElement>(".hero");
let paused = false;
let cleanup = () => {};

function configureMotion() {
  cleanup();
  const enabled = !preference.matches && !paused;
  root.classList.toggle("motion-paused", !enabled);
  root.classList.toggle("motion-enabled", enabled);
  if (toggle) {
    toggle.hidden = preference.matches;
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.setAttribute(
      "aria-label",
      paused ? "Riprendi le animazioni" : "Metti in pausa le animazioni",
    );
    toggle.querySelector("span")!.textContent = paused ? ">" : "||";
  }
  if (!enabled) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll<HTMLElement>(
      ".section-top, .section-heading, .project, .services-intro, .service-grid article, .about-visual, .about-copy, .contact",
    )
    .forEach((element) => {
      // Leave initially visible content visible; animate only upcoming content.
      if (element.getBoundingClientRect().top < innerHeight) return;
      element.classList.add("will-reveal");
      observer.observe(element);
    });

  let frame = 0;
  function updateParallax() {
    frame = 0;
    if (!hero || !visual) return;
    const bounds = hero.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) return;
    const distance = Math.max(-12, Math.min(12, -bounds.top * 0.025));
    visual.style.setProperty("--parallax-y", `${distance}px`);
  }
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(updateParallax);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  updateParallax();
  cleanup = () => {
    observer.disconnect();
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
    visual?.style.removeProperty("--parallax-y");
    document
      .querySelectorAll(".will-reveal")
      .forEach((element) =>
        element.classList.remove("will-reveal", "is-revealed"),
      );
  };
}
toggle?.addEventListener("click", () => {
  paused = !paused;
  configureMotion();
});
preference.addEventListener("change", configureMotion);
configureMotion();
