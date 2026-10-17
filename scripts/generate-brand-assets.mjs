// Optional maintenance command. No runtime dependencies; uses the existing test browser.
import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
const publicRoot = new URL('../public/', import.meta.url);
const logo = await readFile(new URL('logo.svg', publicRoot), 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#f4f1e9;color:#111326;font-family:Arial,Helvetica,sans-serif;width:1200px;height:630px;border:2px solid #111326;position:relative;overflow:hidden}
  header{height:118px;display:flex;align-items:center;border-bottom:2px solid #111326}header svg{width:70px;height:70px;margin:0 28px}header span{align-self:stretch;border-left:2px solid #111326;padding:43px 30px;font:700 25px 'Courier New',monospace;letter-spacing:-1px}
  main{height:410px;padding:34px 40px;position:relative;border-bottom:2px solid #111326}h1{font-size:102px;font-weight:900;letter-spacing:-7px;line-height:.93;margin:0;position:relative;z-index:1}h1 span{color:#2544f5}.mark{position:absolute;right:28px;top:0;width:210px;height:410px;border-left:2px solid #111326;background:#b49aff;display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:92px;font-weight:900;line-height:1;letter-spacing:-7px}.mark b{color:#2544f5;font-size:74px;font-weight:400;line-height:1.1}.mark:after{content:'';position:absolute;bottom:0;height:14px;background:#ff74d4;width:100%;border-top:2px solid #111326}footer{height:98px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;font:700 24px 'Courier New',monospace}footer span{font-size:48px;color:#2544f5}
  </style></head><body><header>${logo}<span>CODE FROM A TO Z</span></header><main><h1>WEB DESIGN<br><span>+ DEVELOPMENT</span></h1><div class="mark" aria-hidden="true">A<b>↓</b>Z</div></main><footer>ALESSIA ZAZZERI<span>A → Z</span></footer></body></html>`);
  // The typographic block ends before the mark; keep the actual approved font system.
  await page.addStyleTag({ content: 'h1{font-size:88px;letter-spacing:-6px;line-height:1.06;padding-top:28px}.mark{width:190px}main{padding-right:230px}' });
  await mkdir(new URL('social/', publicRoot), { recursive: true });
  await page.screenshot({ path: new URL('social/code-from-a-to-z.png', publicRoot).pathname });
  for (const [size, name, padding] of [[32, 'favicon-32.png', 3], [180, 'apple-touch-icon.png', 24]]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:#f4f1e9;color:#111326;padding:${padding}px;width:${size}px;height:${size}px;box-sizing:border-box">${logo.replace('width="128" height="128"', `width="${size-padding*2}" height="${size-padding*2}"`)}</body></html>`);
    await page.screenshot({ path: new URL(name, publicRoot).pathname });
  }
} finally { await browser.close(); }
