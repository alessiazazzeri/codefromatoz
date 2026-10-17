import type { APIRoute } from 'astro';
import { absoluteUrl, excludedFromIndex } from '../data/site';
// Derive the list from actual page files; no dates or unpublished routes invented.
const pages = Object.keys(import.meta.glob('./**/*.astro'))
  .map(path => path.replace(/^\.\//, '/').replace(/\.astro$/, '').replace(/\/index$/, '') || '/')
  .filter(path => !excludedFromIndex.has(path) && !path.includes('['));
export const GET: APIRoute = () => new Response(
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.sort().map(path => `<url><loc>${absoluteUrl(path)}</loc></url>`).join('')}</urlset>`,
  { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
);
