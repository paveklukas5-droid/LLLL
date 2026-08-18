#!/usr/bin/env node
/**
 * Generátor přehledového dokumentu nabídky nemovitostí pro knowledge base chatbota.
 *
 *   node tools/generate-nabidka.mjs --probe   … zjistí, odkud se dají data vytáhnout
 *   node tools/generate-nabidka.mjs           … vygeneruje dokument
 *
 * Bez závislostí — potřebuje jen Node 18+ (kvůli vestavěnému fetch).
 */

const SITE = process.env.SITE_URL || 'https://www.zdenekstourac.cz';
const OUT = process.env.OUT_FILE || 'chatbot-realitni-kancelar/kb/nabidka-prehled.md';
const UA = 'ZdenekStouracKBBot/1.0 (+generátor přehledu nabídky pro chatbota)';

const probe = process.argv.includes('--probe');
const log = (...a) => console.log(...a);

/* ---------------------------------------------------------------- utility */

async function get(url, asJson = false) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: asJson ? 'application/json' : 'text/html,application/xml' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return asJson ? res.json() : res.text();
}

const stripTags = (s = '') => s
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;/g, "'")
  .replace(/\s+/g, ' ').trim();

const czNum = (n) => n.toLocaleString('cs-CZ').replace(/ /g, ' ');

/* ------------------------------------------------------- parsování z textu */

const TYPY = [
  [/pronáj|pronajm/i, 'Pronájem'],
  [/dražb|aukc/i, 'Aukce'],
  [/prodej|prodám/i, 'Prodej'],
];

const DRUHY = [
  [/\bbyt/i, 'Byty'],
  [/\b(dom|vil|chalup|chat)/i, 'Domy a rekreační objekty'],
  [/\b(pozem|parcel)/i, 'Pozemky'],
  [/\b(kancel|obchod|komerč|restaur|sklad|výrobn)/i, 'Komerční prostory'],
  [/\bgaráž/i, 'Garáže'],
];

const STAVY = [
  [/prodáno|prodán[oa]/i, 'prodáno'],
  [/rezervo/i, 'rezervováno'],
];

function match(table, text, fallback) {
  for (const [re, val] of table) if (re.test(text)) return val;
  return fallback;
}

/** Z názvu a textu inzerátu vytáhne strukturované parametry. */
function parseItem(title, extra = '') {
  const hay = `${title} ${extra}`;

  const dispo = title.match(/\b(\d\s*\+\s*(?:kk|\d))\b/i)?.[1]?.replace(/\s+/g, '');
  const plocha = hay.match(/(\d[\d\s]{0,6})\s*m(?:2|²|<sup>2)/i)?.[1]?.replace(/\s+/g, '');
  const cenaRaw = hay.match(/(\d[\d\s ]{4,})\s*(?:Kč|CZK)/i)?.[1];
  const cena = cenaRaw ? Number(cenaRaw.replace(/[\s ]/g, '')) : null;

  // Lokalita: poslední smysluplný úsek za čárkou v názvu
  let lokalita = null;
  const parts = title.split(/[,–]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (!/m(2|²)|Kč|\d{4}/i.test(last)) lokalita = last;
  }
  // Bez čárky: zkus úsek za pomlčkou, jinak samotný název obce v textu
  if (!lokalita) {
    const dash = title.match(/\s[-–]\s*([A-ZÁ-Ž][\wÁ-Žá-ž .]{2,30})$/);
    if (dash) lokalita = dash[1].trim();
  }

  return {
    title: title.trim(),
    typ: match(TYPY, title, 'Prodej'),
    druh: match(DRUHY, title, 'Ostatní'),
    stav: match(STAVY, hay, 'volné'),
    dispo: dispo || null,
    plocha: plocha ? Number(plocha) : null,
    cena,
    lokalita,
  };
}

/* --------------------------------------------------- zdroj 1: WP REST API */

async function discoverWpTypes() {
  const types = await get(`${SITE}/wp-json/wp/v2/types`, true);
  return Object.entries(types)
    .filter(([slug, t]) => /nemovit|estate|property|realit/i.test(slug + ' ' + (t.name || '')))
    .map(([slug, t]) => ({ slug, name: t.name, rest: t.rest_base || slug }));
}

async function fromWpRest() {
  const types = await discoverWpTypes();
  if (!types.length) throw new Error('WP REST API je dostupné, ale nenašel jsem typ příspěvku pro nemovitosti');

  const items = [];
  for (const t of types) {
    for (let page = 1; page <= 10; page++) {
      let batch;
      try {
        batch = await get(`${SITE}/wp-json/wp/v2/${t.rest}?per_page=100&page=${page}&status=publish`, true);
      } catch { break; }
      if (!Array.isArray(batch) || !batch.length) break;
      for (const p of batch) {
        const title = stripTags(p.title?.rendered || '');
        if (!title) continue;
        const extra = stripTags(p.excerpt?.rendered || '') + ' ' + stripTags(p.content?.rendered || '').slice(0, 800);
        items.push({ ...parseItem(title, extra), url: p.link });
      }
      if (batch.length < 100) break;
    }
  }
  return { source: `WP REST API (${types.map((t) => t.rest).join(', ')})`, items };
}

/* ------------------------------------------- zdroj 2: sitemap + detaily HTML */

async function fromSitemap() {
  const candidates = [`${SITE}/wp-sitemap.xml`, `${SITE}/sitemap_index.xml`, `${SITE}/sitemap.xml`];
  let urls = [];

  for (const sm of candidates) {
    let xml;
    try { xml = await get(sm); } catch { continue; }
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);

    // index sitemap → projdi vnořené
    const nested = locs.filter((u) => /\.xml/i.test(u) && /nemovit|post|page/i.test(u));
    for (const n of nested.slice(0, 20)) {
      try {
        const sub = await get(n);
        urls.push(...[...sub.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]));
      } catch { /* přeskoč */ }
    }
    urls.push(...locs.filter((u) => !/\.xml/i.test(u)));
    if (urls.length) break;
  }

  urls = [...new Set(urls)].filter((u) => /\/nemovitost\//i.test(u));
  if (!urls.length) throw new Error('V sitemap jsem nenašel žádné URL s /nemovitost/');

  const items = [];
  for (const u of urls.slice(0, 300)) {
    try {
      const html = await get(u);
      const title = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
        || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
      if (!title) continue;
      items.push({ ...parseItem(title, stripTags(html).slice(0, 2500)), url: u });
    } catch { /* přeskoč nedostupné */ }
  }
  return { source: 'sitemap.xml + detailní stránky', items };
}

/* --------------------------------------------------- sestavení dokumentu */

function build(items, source) {
  const dnes = new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  const aktivni = items.filter((i) => i.stav === 'volné');

  const L = [];
  L.push('# Aktuální nabídka nemovitostí — Realitní tým Zdeňka Štourače');
  L.push('');
  L.push(`Stav k ${dnes}. Tento přehled se generuje automaticky a je vždy aktuální.`);
  L.push('');
  L.push('## Na jaké otázky tento dokument odpovídá');
  L.push('');
  L.push('Jaké nemovitosti nabízíte? Co všechno máte v nabídce? Jaké byty prodáváte?');
  L.push('Máte nějaké domy nebo pozemky? Kolik nemovitostí aktuálně nabízíte?');
  L.push('Máte něco v Brně? Máte něco do určité ceny? Jaká je vaše aktuální nabídka?');
  L.push('Seznam nemovitostí, přehled nabídky, volné nemovitosti k prodeji a pronájmu.');
  L.push('');

  L.push('## Souhrn');
  L.push('');
  L.push(`Celkem v nabídce: **${items.length}** nemovitostí, z toho **${aktivni.length}** volných.`);
  L.push('');

  const podleDruhu = {};
  for (const i of items) (podleDruhu[i.druh] ||= []).push(i);
  for (const [druh, list] of Object.entries(podleDruhu).sort((a, b) => b[1].length - a[1].length)) {
    const volne = list.filter((i) => i.stav === 'volné').length;
    L.push(`- **${druh}**: ${list.length} (volných ${volne})`);
  }
  L.push('');

  // Kupní ceny a nájmy se nesmí míchat do jednoho rozpětí
  const rozpeti = (list, popis, jednotka) => {
    const c = list.map((i) => i.cena).filter(Boolean).sort((a, b) => a - b);
    if (c.length >= 2) L.push(`${popis} od **${czNum(c[0])} Kč${jednotka}** do **${czNum(c[c.length - 1])} Kč${jednotka}**.`);
    else if (c.length === 1) L.push(`${popis} **${czNum(c[0])} Kč${jednotka}**.`);
  };
  const naProdej = aktivni.filter((i) => i.typ !== 'Pronájem');
  const kPronajmu = aktivni.filter((i) => i.typ === 'Pronájem');
  if (naProdej.length) rozpeti(naProdej, 'Kupní ceny volných nemovitostí se pohybují', '');
  if (kPronajmu.length) rozpeti(kPronajmu, 'Nájmy se pohybují', ' měsíčně');
  L.push('');

  const lokality = [...new Set(items.map((i) => i.lokalita).filter(Boolean))];
  if (lokality.length) {
    L.push(`Lokality v nabídce: ${lokality.slice(0, 40).join(', ')}.`);
    L.push('');
  }

  L.push('## Seznam nemovitostí');
  L.push('');
  for (const [druh, list] of Object.entries(podleDruhu)) {
    L.push(`### ${druh}`);
    L.push('');
    const sorted = list.slice().sort((a, b) => (a.stav === 'volné' ? -1 : 1) - (b.stav === 'volné' ? -1 : 1));
    for (const i of sorted) {
      const meta = [
        i.typ,
        i.dispo,
        i.plocha ? `${i.plocha} m²` : null,
        i.lokalita,
        i.cena ? `${czNum(i.cena)} Kč` : 'cena na vyžádání',
        i.stav !== 'volné' ? `**${i.stav}**` : null,
      ].filter(Boolean).join(' · ');
      L.push(`- **${i.title}**`);
      L.push(`  ${meta}`);
      L.push(`  ${i.url}`);
    }
    L.push('');
  }

  L.push('---');
  L.push('');
  L.push(`Zdroj dat: ${source}. Dostupnost potvrzuje realitní tým — nemovitost mohla být rezervována`);
  L.push('v průběhu dne. Kompletní přehled s fotkami je v sekci Nemovitosti na www.zdenekstourac.cz.');
  L.push('');

  return L.join('\n');
}

/* ------------------------------------------- HTML varianta pro crawler KB */

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Z markdownu udělá jednoduché sémantické HTML — Voiceflow crawler čte HTML spolehlivěji než text/plain. */
function toHtml(md) {
  const out = [];
  let inList = false;
  const inline = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');

  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };

    if (/^### /.test(line)) { closeList(); out.push(`<h3>${inline(line.slice(4))}</h3>`); }
    else if (/^## /.test(line)) { closeList(); out.push(`<h2>${inline(line.slice(3))}</h2>`); }
    else if (/^# /.test(line)) { closeList(); out.push(`<h1>${inline(line.slice(2))}</h1>`); }
    else if (/^---\s*$/.test(line)) { closeList(); out.push('<hr>'); }
    else if (/^- /.test(line)) { if (!inList) { out.push('<ul>'); inList = true; } out.push(`<li>${inline(line.slice(2))}</li>`); }
    else if (/^\s+\S/.test(line) && inList) { out[out.length - 1] = out[out.length - 1].replace(/<\/li>$/, ` — ${inline(line.trim())}</li>`); }
    else if (line === '') closeList();
    else { closeList(); out.push(`<p>${inline(line)}</p>`); }
  }
  if (inList) out.push('</ul>');

  return `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aktuální nabídka nemovitostí — Realitní tým Zdeňka Štourače</title>
<style>
  body{max-width:52rem;margin:2rem auto;padding:0 1.25rem;
       font:16px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a}
  h1{font-size:1.6rem} h2{font-size:1.2rem;margin-top:2rem} h3{font-size:1rem;color:#475569}
  li{margin:.4rem 0} a{color:#1d4ed8;word-break:break-all} hr{border:0;border-top:1px solid #e2e8f0;margin:2rem 0}
</style>
</head>
<body>
${out.join('\n')}
</body>
</html>
`;
}

/* ------------------------------------------------------------------- main */

const ADAPTERS = [
  ['WP REST API', fromWpRest],
  ['sitemap.xml', fromSitemap],
];

(async () => {
  log(`Web: ${SITE}\n`);
  const errors = [];

  for (const [name, fn] of ADAPTERS) {
    try {
      log(`▸ zkouším ${name} …`);
      const { source, items } = await fn();
      if (!items.length) throw new Error('zdroj odpověděl, ale nevrátil žádné nemovitosti');

      log(`  ✔ nalezeno ${items.length} nemovitostí`);
      if (probe) {
        log('\nUkázka prvních pěti záznamů:\n');
        for (const i of items.slice(0, 5)) log('  ' + JSON.stringify(i, null, 0));
        const chybi = ['cena', 'dispo', 'plocha', 'lokalita']
          .filter((k) => items.filter((i) => i[k]).length < items.length * 0.5);
        if (chybi.length) log(`\n⚠ U většiny záznamů se nepodařilo vyčíst: ${chybi.join(', ')} — pošlete tenhle výpis k doladění parseru.`);
        return;
      }

      const { writeFile, mkdir } = await import('node:fs/promises');
      const { dirname } = await import('node:path');
      await mkdir(dirname(OUT), { recursive: true });
      const md = build(items, source);
      await writeFile(OUT, md, 'utf8');
      const htmlPath = OUT.replace(/\.md$/, '.html');
      await writeFile(htmlPath, toHtml(md), 'utf8');
      log(`\n✔ zapsáno do ${OUT}`);
      log(`✔ zapsáno do ${htmlPath}`);
      return;
    } catch (e) {
      log(`  ✘ ${e.message}`);
      errors.push(`${name}: ${e.message}`);
    }
  }

  console.error('\nŽádný zdroj dat nefungoval:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
})();
