import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
const root = new URL('../dist/', import.meta.url);
async function files(dir) {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(entry => entry.isDirectory() ? files(new URL(`${entry.name}/`, dir)) : new URL(entry.name, dir)))).flat();
}
const output = await files(root);
if (!output.some(file => file.href === new URL('404.html', root).href)) throw new Error('Missing Cloudflare Pages top-level 404.html');
const textFiles = output.filter(file => ['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg'].includes(extname(file.pathname)));
const texts = await Promise.all(textFiles.map(file => readFile(file, 'utf8')));
const references = texts.join('\n');
// Remove only known source copies that have an optimized sibling and no
// references. Sources themselves remain intact in src/assets/projects.
const sources = await files(new URL('../src/assets/projects/', import.meta.url));
const sourceNames = new Set(sources.filter(file => /\.(png|webp)$/.test(file.pathname)).map(file => basename(file.pathname).replace(/\.(png|webp)$/, '')));
const sourceHashes = new Set(await Promise.all(sources.map(async file => createHash('sha256').update(await readFile(file)).digest('hex'))));
let removed = 0;
for (const file of output) {
  const name = basename(file.pathname);
  if (!file.pathname.includes('/_astro/') || !/\.(png|webp)$/.test(name)) continue;
  const stem = [...sourceNames].find(stem => name.startsWith(`${stem}.`));
  if (!stem || references.includes(name)) continue;
  if (!sourceHashes.has(createHash('sha256').update(await readFile(file)).digest('hex'))) continue;
  if (!output.some(other => basename(other.pathname).startsWith(`${stem}.`) && other.href !== file.href && other.pathname.endsWith('.webp'))) throw new Error(`Missing optimized derivative for ${name}`);
  await unlink(file); removed++;
}
// Hash the final emitted scripts, including JSON-LD. Style attributes are used
// for responsive crops and motion; style-src unsafe-inline is intentional.
const hashes = new Set();
for (const text of texts) for (const match of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  if (match[1]) hashes.add(`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
}
const csp = `default-src 'self'; script-src 'self' ${[...hashes].sort().join(' ')}; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'none'; frame-ancestors 'none'`;
await writeFile(new URL('_headers', root), `/*\n  Content-Security-Policy: ${csp}\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n`);
console.log(`Finalized build: removed ${removed} unreferenced source copies; CSP includes ${hashes.size} script hashes.`);
