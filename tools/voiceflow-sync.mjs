#!/usr/bin/env node
/**
 * Nahraje vygenerovaný přehled nabídky do Voiceflow Knowledge Base.
 *
 * Potřeba jen tehdy, když nechcete spoléhat na vestavěný denní refresh URL
 * dokumentů ve Voiceflow. Tahle cesta je deterministická — po doběhnutí víte,
 * že v KB je přesně ten obsah, který jste vygenerovali.
 *
 *   VOICEFLOW_API_KEY=VF.DM.xxx node tools/voiceflow-sync.mjs
 */

import { readFile } from 'node:fs/promises';

const API = process.env.VOICEFLOW_API_URL || 'https://api.voiceflow.com';
const KEY = process.env.VOICEFLOW_API_KEY;
const FILE = process.env.OUT_FILE || 'chatbot-realitni-kancelar/kb/nabidka-prehled.md';
const DOC_NAME = process.env.VOICEFLOW_DOC_NAME || 'nabidka-prehled.txt';

if (!KEY) {
  console.error('Chybí VOICEFLOW_API_KEY. Klíč najdete ve Voiceflow: Integrations → API Keys (začíná VF.DM.).');
  process.exit(1);
}

const auth = { Authorization: KEY };

async function call(method, path, opts = {}) {
  const res = await fetch(`${API}${path}`, { method, headers: { ...auth, ...(opts.headers || {}) }, body: opts.body });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* nevadí */ }
  if (!res.ok) {
    throw new Error(`${method} ${path} → HTTP ${res.status}\n${text.slice(0, 600)}`);
  }
  return json ?? text;
}

/** Najde dokumenty se stejným názvem, aby po nahrání nezůstaly duplicity. */
async function findExisting() {
  const res = await call('GET', '/v1/knowledge-base/docs?page=1&limit=100');
  const list = Array.isArray(res) ? res : (res.data ?? res.documents ?? []);
  if (!Array.isArray(list)) {
    console.warn('⚠ Seznam dokumentů má neočekávaný tvar, mazání starých verzí přeskakuji.');
    console.warn('  Odpověď:', JSON.stringify(res).slice(0, 400));
    return [];
  }
  return list.filter((d) => {
    const name = d?.data?.name || d?.name || '';
    return name === DOC_NAME;
  });
}

(async () => {
  const md = await readFile(FILE, 'utf8');
  console.log(`Soubor: ${FILE} (${md.length} znaků)`);

  const stare = await findExisting();
  for (const d of stare) {
    const id = d.documentID || d.id;
    if (!id) continue;
    await call('DELETE', `/v1/knowledge-base/docs/${id}`);
    console.log(`✔ smazána předchozí verze ${id}`);
  }

  const form = new FormData();
  form.append('file', new Blob([md], { type: 'text/plain' }), DOC_NAME);

  const up = await call('POST', '/v1/knowledge-base/docs/upload?overwrite=true', { body: form });
  const id = up?.data?.documentID || up?.documentID || '(neznámé ID)';
  console.log(`✔ nahráno do Voiceflow jako ${DOC_NAME}, documentID ${id}`);
  console.log('\nVe Voiceflow zkontrolujte Knowledge Base → dokument by měl mít stav Success.');
})().catch((e) => {
  console.error('\nSynchronizace selhala:\n' + e.message);
  console.error('\nZkontrolujte platnost API klíče a v dokumentaci Voiceflow tvar endpointů —');
  console.error('pokud se změnily, pošlete mi tenhle výpis a upravím skript.');
  process.exit(1);
});
