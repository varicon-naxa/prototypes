import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url    = process.argv[2] || 'http://localhost:3000';
const label  = process.argv[3] || 'screenshot';
const outDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// auto-increment N
const existing = fs.readdirSync(outDir).filter(f => f.endsWith('.png'));
const N = existing.length + 1;
const outFile = path.join(outDir, `${label}-${N}.png`);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
// Navigate to site diary, open Plant section, add one item, screenshot
await page.evaluate(() => {
  if (typeof goPage === 'function') goPage('site-diary');
});
await new Promise(r => setTimeout(r, 500));
await page.evaluate(() => {
  if (typeof sdShowTab === 'function') sdShowTab('sec-plant');
  if (typeof renderPlant === 'function') renderPlant();
});
await new Promise(r => setTimeout(r, 400));
// Add 55T Excavator to show the count drop from 10 → 9
await page.evaluate(() => {
  if (typeof quickAddEquip === 'function') quickAddEquip('EQ-006');
});
await new Promise(r => setTimeout(r, 500));
// Scroll to plant section header to see tabs and table
await page.evaluate(() => {
  const sec = document.getElementById('sec-plant');
  if (sec) sec.scrollIntoView({ block: 'start', behavior: 'instant' });
});
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: outFile, fullPage: false });
await browser.close();
console.log('Screenshot saved:', outFile);
