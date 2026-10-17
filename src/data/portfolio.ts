import type { ImageMetadata } from "astro";

// Import approved original assets from src/assets, then replace the relevant null.
// Example shape: { source: importedImage, alt: 'Approved description', position: '50% 50%' }
// Keep null until the real asset is supplied. No file path is guessed or requested at runtime.
export interface PortfolioImage {
  source: ImageMetadata;
  alt: string;
  /** CSS object-position; adjust framing without modifying the original asset. */
  position?: string;
}
interface Project {
  name: string;
  categories: string;
  slug: string;
  /** Enable only after the matching /work/[slug] page exists. */
  caseStudyPublished: boolean;
  type: string;
  label: string;
  mark: string;
  screenshot: PortfolioImage | null;
}
export const projects: Project[] = [
  {
    name: "P. Mari Best Catering Ltd",
    categories: "WordPress / WooCommerce / Multilingual",
    slug: "p-mari-best-catering-ltd",
    caseStudyPublished: true,
    type: "fun",
    label: "01",
    mark: "FUN\nTEAM",
    screenshot: null,
  },
  {
    name: "ADD Group",
    categories: "Web Design / WordPress / B2B",
    slug: "add-group",
    caseStudyPublished: true,
    type: "bad",
    label: "02",
    mark: "BAD\nIDEA.",
    screenshot: null,
  },
  {
    name: "Elena Bianchi — Psicologa Psicoterapeuta",
    categories: "Web Design / WordPress / Health",
    slug: "elena-bianchi",
    caseStudyPublished: true,
    type: "mari",
    label: "03",
    mark: "mari\nbest",
    screenshot: null,
  },
  {
    name: "Luxury Hair Studio",
    categories: "Web Design / WordPress",
    slug: "luxury-hair-studio",
    caseStudyPublished: true,
    type: "health",
    label: "04",
    mark: "+",
    screenshot: null,
  },
];
export const about: { portrait: PortfolioImage | null } = { portrait: null };
