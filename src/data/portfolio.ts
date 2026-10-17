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
  type: string;
  label: string;
  mark: string;
  screenshot: PortfolioImage | null;
}
export const projects: Project[] = [
  {
    name: "FunTeam",
    type: "fun",
    label: "01",
    mark: "FUN\nTEAM",
    screenshot: null,
  },
  {
    name: "Bad Idea",
    type: "bad",
    label: "02",
    mark: "BAD\nIDEA.",
    screenshot: null,
  },
  {
    name: "Mari Best Catering",
    type: "mari",
    label: "03",
    mark: "mari\nbest",
    screenshot: null,
  },
  {
    name: "Progetto health",
    type: "health",
    label: "04",
    mark: "+",
    screenshot: null,
  },
];
export const about: { portrait: PortfolioImage | null } = { portrait: null };
