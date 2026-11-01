// Builds the two A4 QR posters (Night and Day look) into the folder above this one.
// Run from CHRONO-LANDING:   node posters/source/build.cjs
// Needs Google Chrome and playwright-core (npm i --no-save playwright-core). See README.md in the folder above.
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-generator'); // already a dependency of the landing page
const { chromium } = require('playwright-core');

// the things that change from one release to the next
const VERSION = '1.4.0';
const SIZE = '48 MB';
const SITE = 'https://chronoquest-five.vercel.app';
const GAME = SITE + '/downloads/chronoquest.apk';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const here = __dirname;
const art = path.join(here, '..', '..', 'public', 'art');
const outDir = path.join(here, '..');

function qrSvg(text) {
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  const n = q.getModuleCount(), pad = 4, size = n + pad * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!q.isDark(r, c)) { c++; continue; }
      let s = c; while (c < n && q.isDark(r, c)) c++;
      d += 'M' + (s + pad) + ' ' + (r + pad) + 'h' + (c - s) + 'v1h-' + (c - s) + 'z';
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges"><rect width="' + size + '" height="' + size + '" fill="#FFFBF2"/><path d="' + d + '" fill="#1B0F05"/></svg>';
}

(async () => {
  // the game's sprites, scaled up with nearest-neighbour so they stay sharp in a PDF
  const files = { back: 'parallax-forest-back-trees.png', mid: 'parallax-forest-middle-trees.png', coin: 'coin.png', soldier: 'spanish_soldier_1.png', rizal: 'rizal_jump.png', artifact: 'artifact_1.png', heart: 'heart_full.png', star: 'star_full.png' };
  const scale = { back: 4, mid: 4, coin: 8, soldier: 6, rizal: 6, artifact: 8, heart: 8, star: 8 };
  const raw = {};
  for (const k in files) raw[k] = 'data:image/png;base64,' + fs.readFileSync(path.join(art, files[k])).toString('base64');

  const browser = await chromium.launch({ executablePath: CHROME });
  const tmp = await browser.newPage();
  const up = await tmp.evaluate(async ([raw, scale]) => {
    const out = {};
    for (const k in raw) {
      const img = new Image(); img.src = raw[k]; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width * scale[k]; c.height = img.height * scale[k];
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, c.width, c.height);
      out[k] = c.toDataURL('image/png');
    }
    return out;
  }, [raw, scale]);
  await tmp.close();

  let frag = fs.readFileSync(path.join(here, 'frag.html'), 'utf8');
  frag = frag.replace(/\{\{IMG:(\w+)\}\}/g, (m, k) => { if (!up[k]) throw new Error('no image ' + k); return up[k]; });
  frag = frag.replace('{{QR_GAME}}', qrSvg(GAME)).replace('{{QR_SITE}}', qrSvg(SITE));
  frag = frag.replace('{{STRIPES}}', Array.from({ length: 32 }, (_, i) => '<i style="left:' + (i * 3.3).toFixed(2) + 'cqw"></i>').join(''));
  frag = frag.replace(/\{\{VERSION\}\}/g, VERSION).replace('{{SIZE}}', SIZE);
  if (/\{\{/.test(frag)) throw new Error('placeholder left in frag.html');

  const html = '<!doctype html><html><head><meta charset="utf-8"><title>ChronoQuest poster</title>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap">' +
    '<style>@page { size: A4 portrait; margin: 0 } html, body { margin: 0; padding: 0; background: #fff; height: 297mm; overflow: hidden } .pw { width: 210mm; height: 297mm }</style></head><body>' + frag + '</body></html>';

  for (const look of ['night', 'day']) {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(l => document.getElementById('poster').setAttribute('data-look', l), look);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const name = 'ChronoQuest-QR-Poster-' + look[0].toUpperCase() + look.slice(1) + '-' + VERSION + '.pdf';
    await page.pdf({ path: path.join(outDir, name), width: '210mm', height: '297mm', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    console.log('wrote', name);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
