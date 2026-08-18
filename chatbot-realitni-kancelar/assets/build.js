const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const NAVY   = '#16243B';
const NAVY_2 = '#22364F';
const AMBER  = '#C8952F';

const MARK = (fill, dots) => `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">
  <path d="M50 11 L93 45 L93 74 A8 8 0 0 1 85 82 L61 82 L38 97 L45 82 L15 82 A8 8 0 0 1 7 74 L7 45 Z" fill="${fill}"/>
  <circle cx="32" cy="61" r="5.6" fill="${dots}"/>
  <circle cx="50" cy="61" r="5.6" fill="${dots}"/>
  <circle cx="68" cy="61" r="5.6" fill="${dots}"/>
</svg>`;

// Silueta střech — deterministicky "náhodné" šířky i výšky, ať se vzor viditelně neopakuje
const roofs = (() => {
  const W = [58, 92, 44, 74, 110, 52, 86, 64, 98, 48, 78, 120, 56, 88, 68, 104, 50, 82];
  const H = [34, 58, 26, 46, 70, 30, 52, 38, 62, 28, 48, 76, 32, 56, 40, 66, 24, 44];
  const O = [.045, .075, .035, .06, .09, .04, .07, .05, .085, .038, .065, .095, .042, .072, .055, .08, .033, .058];
  let x = -40, i = 0, out = '';
  while (x < 1400) {
    const w = W[i % W.length], h = H[i % H.length], o = O[i % O.length];
    const peak = Math.round(h * 0.42);
    out += `<path d="M${x} 200 L${x} ${200-h} L${x + w/2} ${200-h-peak} L${x+w} ${200-h} L${x+w} 200 Z" fill="#FFFFFF" opacity="${o}"/>`;
    x += w - 6; i++;
  }
  return out;
})();

const JOBS = [
  { name: 'launcher', w: 192, h: 192, transparent: true, body: `
    <div style="width:192px;height:192px;border-radius:50%;background:${NAVY};
                display:flex;align-items:center;justify-content:center;">
      <div style="width:104px;height:104px;">${MARK('#FFFFFF', NAVY)}</div>
    </div>` },

  { name: 'agent-avatar', w: 256, h: 256, transparent: true, body: `
    <div style="width:256px;height:256px;border-radius:50%;
                background:linear-gradient(160deg,${NAVY_2} 0%,${NAVY} 100%);
                display:flex;align-items:center;justify-content:center;">
      <div style="width:132px;height:132px;">${MARK('#FFFFFF', NAVY)}</div>
    </div>` },

  { name: 'banner', w: 1400, h: 200, transparent: false, body: `
    <div style="position:relative;width:1400px;height:200px;overflow:hidden;
                background:linear-gradient(110deg,${NAVY} 0%,${NAVY_2} 55%,${NAVY} 100%);">
      <svg width="1400" height="200" viewBox="0 0 1400 200" style="position:absolute;inset:0;">${roofs}</svg>
      <div style="position:absolute;left:0;right:0;bottom:0;height:4px;background:${AMBER};"></div>
    </div>` },
];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  for (const j of JOBS) {
    const page = await browser.newPage({
      viewport: { width: j.w, height: j.h },
      deviceScaleFactor: 1,
    });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      html,body{width:${j.w}px;height:${j.h}px;overflow:hidden;background:transparent}
    </style></head><body>${j.body}</body></html>`);
    await page.screenshot({ path: `${j.name}.png`, omitBackground: j.transparent });
    await page.close();
    console.log(`${j.name}.png  ${j.w}x${j.h}`);
  }
  await browser.close();
})();
