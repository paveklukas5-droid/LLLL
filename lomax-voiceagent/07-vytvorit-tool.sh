#!/usr/bin/env bash
# Založí nástroje pro LOMAX servisního voicebota přímo ve VAPI přes API.
# Náhrada za klikání ve formuláři (VAPI dashboard neumí vložit JSON).
#
# Použití:
#   1) doplň VAPI_KEY a MAKE_WEBHOOK níže
#   2) chmod +x 07-vytvorit-tool.sh && ./07-vytvorit-tool.sh
#
# POZOR: nikdy necommituj tento soubor s vyplněnými klíči.

set -euo pipefail

VAPI_KEY="TVUJ_VAPI_PRIVATE_KEY"
MAKE_WEBHOOK="https://hook.eu2.make.com/TVUJ_WEBHOOK"
MAKE_SECRET="lomax-servis-2026-zmen-me"

echo "→ Zakládám nástroj odeslat_servisni_poptavku…"

cat > /tmp/lomax_tool.json <<EOF
{
  "type": "function",
  "async": false,
  "server": {
    "url": "${MAKE_WEBHOOK}",
    "timeoutSeconds": 25,
    "headers": { "x-api-key": "${MAKE_SECRET}" }
  },
  "messages": [
    { "type": "request-start", "content": "Zakládám vám servisní poptávku, moment prosím.", "blocking": false },
    { "type": "request-complete", "content": "Hotovo, poptávku mám odeslanou." },
    { "type": "request-failed", "content": "Omlouvám se, systém mi teď poptávku nepřijal. Zkusím to ještě jednou." },
    { "type": "request-response-delayed", "content": "Ještě to zpracovávám, děkuji za trpělivost.", "timingMilliseconds": 8000 }
  ],
  "function": {
    "name": "odeslat_servisni_poptavku",
    "description": "Odešle kompletní servisní / reklamační poptávku zákazníka do systému LOMAX, který ji e-mailem předá servisnímu oddělení a nejbližšímu autorizovanému zastoupení. Volej AŽ POTÉ, co jsi zákazníkovi zrekapitulovala údaje a on je potvrdil. Volej maximálně jednou za hovor (kromě jednoho opakování při chybě). Pole, která nemáš, posílej jako prázdný řetězec - nikdy je nevymýšlej.",
    "parameters": {
      "type": "object",
      "properties": {
        "jmeno_prijmeni": { "type": "string", "description": "Celé jméno a příjmení volajícího, tak jak ho nadiktoval." },
        "telefon_jine": { "type": "string", "description": "Alternativní telefonní číslo pro zpětné volání. Vyplň POUZE tehdy, když zákazník řekne, že se mu má technik ozvat na JINÉ číslo, než ze kterého právě volá. Jinak prázdný řetězec - číslo volajícího se doplní automaticky z hovoru. Když ho zákazník nadiktuje, přečti mu ho zpět." },
        "adresa_ulice_cp": { "type": "string", "description": "Ulice a číslo popisné adresy REALIZACE (kde je produkt namontovaný), ne fakturační adresa." },
        "adresa_mesto": { "type": "string", "description": "Město / obec realizace." },
        "adresa_psc": { "type": "string", "description": "PSČ realizace, 5 číslic bez mezery. KLÍČOVÉ pro směrování na nejbližší zastoupení." },
        "typ_pozadavku": { "type": "string", "enum": ["reklamace", "servis", "servisni_prohlidka", "jine"], "description": "reklamace = zákazník to sám nazývá reklamací nebo jde o vadu krátce po montáži; servis = běžná porucha; servisni_prohlidka = chce pravidelnou roční prohlídku; jine = např. urgence již podané reklamace." },
        "typ_produktu": { "type": "string", "enum": ["garazova_vrata_sekcni", "garazova_vrata_posuvna", "garazova_vrata_rolovaci", "garazova_vrata_dvoukridla", "predokenni_roleta", "venkovni_zaluzie", "vchodove_dvere", "okno", "sit_proti_hmyzu", "rolovaci_mriz", "pohon_nebo_ovladac", "jine"], "description": "Kategorie produktu, kterého se závada týká." },
        "model_rada": { "type": "string", "description": "Modelová řada, pokud ji zákazník zná: Home, Delta, Excellent, Praktik, LT 50, Z-90, C-80, FABO. Jinak prázdný řetězec." },
        "pohon_znacka": { "type": "string", "description": "Značka pohonu, pokud je známa: Marantec, Somfy, Selve, Elero, jiná, nebo bez pohonu. Jinak prázdný řetězec." },
        "popis_zavady": { "type": "string", "description": "Konkrétní popis závady vlastními slovy zákazníka. Ne obecné nefunguje to, ale např. vrata se zastaví asi 20 cm nad zemí a vyjedou zpět nahoru, bliká jedna fotobuňka." },
        "technicke_detaily": { "type": "string", "description": "Odpovědi na diagnostické otázky: stav fotobuněk, vyměněná baterie v ovladači, reakce nástěnného tlačítka, zvuk motoru, zkoušené nouzové odjištění apod. Jinak prázdný řetězec." },
        "kdy_zacalo": { "type": "string", "description": "Kdy se závada poprvé objevila, slovy zákazníka. Např. asi před třemi dny, po té bouřce minulý týden." },
        "opakovana_zavada": { "type": "boolean", "description": "true, pokud zákazník uvedl, že se stejný problém už dříve řešil." },
        "bezpecnostni_riziko": { "type": "boolean", "description": "true při prasklé pružině, utrženém lanku, uvolněné či visící lamele, křivém nebo vypadlém křídle, samovolném sjíždění vrat, jiskření nebo zápachu spáleniny." },
        "priorita": { "type": "string", "enum": ["vysoka", "stredni", "nizka"], "description": "vysoka = bezpečnostní riziko nebo objekt nelze zabezpečit (vrata nejdou zavřít); stredni = produkt nefunkční, ale zabezpečený; nizka = kosmetická vada, hluk, drobnost." },
        "rok_montaze": { "type": "string", "description": "Přibližný rok montáže, např. 2019. Prázdný řetězec, pokud zákazník neví." },
        "cislo_zakazky": { "type": "string", "description": "Číslo zakázky / objednávky / faktury, pokud ho zákazník má. Jinak prázdný řetězec." },
        "kdo_montoval": { "type": "string", "description": "Kdo produkt montoval - zastoupení LOMAX, jiná firma, svépomocí, nebo prázdný řetězec." },
        "dostupnost": { "type": "string", "description": "Kdy je zákazník k zastižení / kdy se mu hodí návštěva technika." },
        "ma_fotografie": { "type": "boolean", "description": "true, pokud zákazník uvedl, že fotografii závady má nebo ji pořídí a pošle." },
        "shrnuti_pro_technika": { "type": "string", "description": "1-2 věty pro technika: co se stalo a co si nejspíš bude potřebovat vzít s sebou." },
        "poznamka": { "type": "string", "description": "Cokoli dalšího podstatného: volající není majitel, název firmy/SVJ, urgence, zákazník si není jistý výrobcem, zajímá ho cena dopředu apod." }
      },
      "required": ["jmeno_prijmeni", "adresa_ulice_cp", "adresa_mesto", "adresa_psc", "typ_pozadavku", "typ_produktu", "popis_zavady", "priorita", "bezpecnostni_riziko", "shrnuti_pro_technika"]
    }
  }
}
EOF

curl -sS -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer ${VAPI_KEY}" \
  -H "Content-Type: application/json" \
  -d @/tmp/lomax_tool.json

echo
echo "→ Zakládám nástroj ukoncit_hovor…"

curl -sS -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer ${VAPI_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"type":"endCall","function":{"name":"ukoncit_hovor","description":"Ukonci hovor. Volej az po rozlouceni se zakaznikem, nikdy uprostred jeho vety. Pouzij take, kdyz se nedari navazat komunikaci (opakovane ticho) nebo kdyz volajici neni zakaznik LOMAX."},"messages":[{"type":"request-start","content":"Děkuji za zavolání a přeji hezký den. Na shledanou."}]}'

echo
rm -f /tmp/lomax_tool.json
echo "✓ Hotovo. Zkopíruj si z odpovědí hodnoty \"id\" a připoj nástroje k asistentovi."
