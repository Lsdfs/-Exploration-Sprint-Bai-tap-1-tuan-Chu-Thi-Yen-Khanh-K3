import { chromium } from '../05-prototype/node_modules/playwright/index.mjs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(new URL('slides.html', root).href);
  await page.evaluate(() => document.fonts.ready);
  const checks = await page.locator('section').evaluateAll(elements => elements.map((e, i) => ({
    slide: i + 1,
    overflow: e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth,
    imagesLoaded: [...e.querySelectorAll('img')].every(img => img.complete && img.naturalWidth > 0),
    footerOverlap: [...e.children].filter(c => !c.classList.contains('source') && !c.classList.contains('num'))
      .some(c => c.getBoundingClientRect().bottom > e.querySelector('.source').getBoundingClientRect().top - 8),
  })));
  console.log(JSON.stringify(checks, null, 2));
  if (checks.length !== 10 || checks.some(c => c.overflow || !c.imagesLoaded || c.footerOverlap)) {
    throw new Error('Slide layout validation failed');
  }
  await page.pdf({ path: fileURLToPath(new URL('slides.pdf', root)), preferCSSPageSize: true, printBackground: true });
  if (process.argv.includes('--preview')) {
    await page.locator('section').nth(7).screenshot({ path: fileURLToPath(new URL('slides-preview.png', root)) });
  }
} finally {
  await browser.close();
}
