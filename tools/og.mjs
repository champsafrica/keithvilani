// Renders a 1200x630 share image for every page into public/og/, plus the apple touch icon.
// Needs Playwright (dev only): node tools/og.mjs
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');

const OUT = new URL('../public/', import.meta.url).pathname;
const pages = JSON.parse(readFileSync(new URL('./pages.json', import.meta.url)));
const key = (p) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-'));
mkdirSync(OUT + 'og', { recursive: true });

const server = await serve(4399);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const p of pages) {
  await page.goto(`http://localhost:4399${p}?og`);
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${OUT}og/${key(p)}.jpg`, type: 'jpeg', quality: 80 });
  console.log('og', p);
}
const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
await icon.setContent(`<body style="margin:0">${readFileSync(OUT + 'favicon.svg', 'utf8').replace('<svg ', '<svg width="180" height="180" ')}</body>`);
await icon.screenshot({ path: OUT + 'apple-touch-icon.png' });
await icon.screenshot({ path: new URL('../src/static/apple-touch-icon.png', import.meta.url).pathname });
await browser.close();
server.close();
