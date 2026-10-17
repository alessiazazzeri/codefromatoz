const about = document.querySelector<HTMLElement>(".about-page");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
let observer: IntersectionObserver | undefined;
function initializeAboutMotion() {
  observer?.disconnect();
  about?.classList.toggle("ap-motion", !reduceMotion.matches);
  const elements =
    about?.querySelectorAll<HTMLElement>("[data-about-reveal]") ?? [];
  elements.forEach((element) =>
    element.classList.remove("ap-pending", "ap-inview"),
  );
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("ap-inview");
        observer?.unobserve(entry.target);
      });
    },
    { threshold: 0.1 },
  );
  elements.forEach((element) => {
    if (element.getBoundingClientRect().top < innerHeight) return;
    element.classList.add("ap-pending");
    observer!.observe(element);
  });
}
reduceMotion.addEventListener("change", initializeAboutMotion);
initializeAboutMotion();
