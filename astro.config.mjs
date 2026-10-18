import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { excludedFromIndex } from "./src/data/site.ts";

export default defineConfig({
  site: "https://www.codefromatoz.it",
  output: "static",
  trailingSlash: "never",
  integrations: [sitemap({
    filter(page) {
      const path = new URL(page).pathname.replace(/\/$/, "") || "/";
      return !excludedFromIndex.has(path)
        && path !== "/404.html"
        && path !== "/api" && !path.startsWith("/api/")
        && !path.startsWith("/brand-exploration")
        && !/\.(xml|txt)$/.test(path);
    },
  })],
});
