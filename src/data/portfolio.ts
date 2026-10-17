import type { ImageMetadata } from "astro";

// Image metadata shared by the explicit project asset map.
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
}
export const projects: Project[] = [
  {
    name: "P. Mari Best Catering Ltd",
    categories: "WordPress / WooCommerce / Multilingual",
    slug: "p-mari-best-catering-ltd",
    caseStudyPublished: true,
    type: "fun",
    label: "01",
  },
  {
    name: "ADD Group",
    categories: "Web Design / WordPress / B2B",
    slug: "add-group",
    caseStudyPublished: true,
    type: "bad",
    label: "02",
  },
  {
    name: "Elena Bianchi — Psicologa Psicoterapeuta",
    categories: "Web Design / WordPress / Health",
    slug: "elena-bianchi",
    caseStudyPublished: true,
    type: "mari",
    label: "03",
  },
  {
    name: "Luxury Hair Studio",
    categories: "Web Design / WordPress",
    slug: "luxury-hair-studio",
    caseStudyPublished: true,
    type: "health",
    label: "04",
  },
];
