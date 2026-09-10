# OKNOTHERM – návod na pondělní demo

Cíl tohoto souboru: dostat tě z nuly do živého, předváděcího hovoru s hlasovou
asistentkou **Petra** co nejrychleji, a pak ti dát scénář, jak demo klientovi
prodat. Backend do Make.com je pro tuhle demo **už hotový a živý** (bonus
navíc oproti zadání "nemusíme to hned napojovat na Make") – takže klientovi
můžeš rovnou ukázat kompletní kolečko: hovor → reklamace → e-mail.

---

## 0. Co už je hotové (nemusíš dělat nic)

- Testovací Make scénář `oknotherm reklamace voicebot (demo)` běží a je aktivní.
- Webhook: `https://hook.eu1.make.com/wd8o3r6coe17ws9r09oegganhih8ng15`
  (už vyplněný v `02-vapi-tools.json`, nikam ho neposílej, je jen pro tento webhook).
- Otestováno syntetickým voláním – proběhlo `SUCCESS`. Než budeš dělat live
  demo, doporučuju **jeden reálný zkušební hovor přes VAPI** provést sám
  předem a zkontrolovat, že e-mail dorazil na `paveklukas5@gmail.com`
  (na tvůj Gmail, ne klientovi – je to čistě testovací adresa, viz bod 4).

## 1. Založ nástroje ve VAPI (5 minut, přes API)

VAPI dashboard neumí vložit hotový JSON celého nástroje najednou (jen jeho
`parameters` sekci), proto je nejrychlejší cesta přes API. Uprav a spusť:

```bash
VAPI_KEY="TVUJ_VAPI_PRIVATE_KEY"

curl -sS -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer ${VAPI_KEY}" \
  -H "Content-Type: application/json" \
  -d @02-vapi-tools-odeslat-reklamaci.json   # viz krok 1a níže

curl -sS -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer ${VAPI_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"type":"endCall","function":{"name":"ukoncit_hovor","description":"Ukonci hovor. Volej az po rozlouceni se zakaznikem, nikdy uprostred jeho vety. Pouzij take, kdyz se nedari navazat komunikaci (opakovane ticho) nebo kdyz volajici neni zakaznik OKNOTHERM."},"messages":[{"type":"request-start","content":"Děkuji za zavolání a přeji hezký den. Na shledanou."}]}'
```

**1a)** `02-vapi-tools.json` obsahuje pole `tools` se třemi nástroji
(`odeslat_reklamaci`, `prepojit_na_operatora`, `ukoncit_hovor`). Buď z něj
vytáhni jen objekt `odeslat_reklamaci` do vlastního souboru pro `curl -d @`,
nebo (rychlejší) vlož ho ručně přes dashboard: Tools → Create Tool → Function,
a v JSON přepínači u `parameters` vlož jen sekci `parameters` z toho souboru
(stejný postup jako u LOMAXu, viz `../lomax-voiceagent/08-tool-rucne-ve-vapi.md`,
je 1:1 použitelný, jen s OKNOTHERM poli).

`prepojit_na_operatora` nezakládej vůbec, pokud nemáš na Monday živou linku,
na kterou by se dalo přepojit – pro demo ho klidně vynech.

Zkopíruj si `id` obou vytvořených nástrojů z odpovědi.

## 2. Založ asistenta

Dashboard → Assistants → Create Assistant → Blank Template, pak dopl:
- **Name**: `OKNOTHERM – Reklamace a servis (CZ) – DEMO`
- **First message**: `Dobrý den, tady Petra ze zákaznického servisu OKNOTHERM. Jak vám můžu pomoci?`
- **Model**: Anthropic → `claude-haiku-4-5`, temperature `0.3`, **Max Tokens `1500`**
  (neponižuj – viz `../lomax-voiceagent/11-oprava-prazdne-argumenty.md`, stejná
  past by se zopakovala i tady)
- **System Prompt**: vlož **celý** obsah `01-system-prompt.md`
- **Tools**: přidej oba nástroje z kroku 1 podle jejich `id`
- **Transcriber**: Deepgram, `nova-3`, jazyk `cs`, `smartFormat` a `numerals` VYPNUTO, endpointing `500`
- **Voice**: Azure, `cs-CZ-VlastaNeural`

Všechny ostatní hodnoty (start/stop speaking plan, analysis plan, atd.) jsou
v `03-vapi-assistant-config.json` – nejsou pro samotné předvedení kritické,
ale pokud máš čas, nastav je taky (hlavně `startSpeakingPlan.transcriptionEndpointingPlan.onNumberSeconds: 0.6`,
ať bot neskáče do řeči při diktování PSČ).

## 3. Vyzkoušej si to sám PŘED demem

Dashboard → tvůj asistent → **Talk to Assistant** (mikrofon v prohlížeči).
Projdi si nahlas aspoň dva scénáře z `01-system-prompt.md` sekce 10
(standardní okno a prasklé sklo), ideálně 2-3x, ať slyšíš, kde to drhne.
Pak si zavolej **telefonem** (ne jen v prohlížeči) – čeština na telefonní
lince zní jinak a diktování čísel/PSČ se chová jinak než v prohlížeči.

Zkontroluj, že po dokončení hovoru dorazil e-mail na `paveklukas5@gmail.com`
s předmětem `[...] DEMO reklamace REK-...`. Pokud ne, dřív než budeš dělat
cokoliv jiného, zkontroluj v Make execution log scénáře
`oknotherm reklamace voicebot (demo)` (id 7341667), jestli tool z VAPI vůbec
dorazil s vyplněnými argumenty – nejčastější příčina je popsaná v
`../lomax-voiceagent/11-oprava-prazdne-argumenty.md`.

## 4. Co říct klientovi o e-mailové adrese

E-mail teď chodí na `paveklukas5@gmail.com` (testovací schránka), ne na
`reklamace@oknotherm.cz`. To klientovi řekni na rovinu – je to demo, ne
produkční nasazení, a přepnutí na jejich skutečné adresy je otázka jedné
změny v Make scénáři (2 minuty), kterou uděláš, až schválí, komu má reklamace
chodit (typicky Šárka Zemanová – reklamace, Tereza Horáková – servis).

## 5. Scénář předvedení klientovi (~10 minut)

1. **Kontext (1 min).** "Tohle je hlasová asistentka, která umí přijmout
   telefonickou reklamaci nebo servisní požadavek úplně sama, ve slušné
   češtině, 24/7, a rovnou vygeneruje kompletní podklad pro technika e-mailem."
2. **Živý hovor (4-5 min).** Zavolej asistentce (buď telefonním číslem
   napojeným ve VAPI, nebo Talk to Assistant na sdíleném displeji) a nahraj
   běžný případ – např. plastové okno, které drhne. Nech Petru projít celý
   flow: identifikace, adresa, produkt, diagnostika, rekapitulace, odeslání.
3. **Ukázka výstupu (2 min).** Otevři e-mail, který právě dorazil – ukaž
   klientovi strukturovaná data, prioritu, bezpečnostní flag pokud padl.
4. **Bezpečnostní scénář (volitelně, 1-2 min).** Zkus druhé volání s
   "praským sklem" – ukaž, jak bot okamžitě rozpozná riziko, poučí zákazníka
   a označí to jako vysokou prioritu s červeným varováním v e-mailu.
5. **Shrnutí a další kroky (1 min).** Zmiň, co chybí do ostrého nasazení:
   napojení na skutečné e-maily servisu, přiřazení telefonního čísla,
   případně napojení na jejich CRM/skladový systém, pokud ho mají.

## 6. Co NEukazovat / na co dát pozor

- Nepřipomínej nahlas, že jde o "poptávku" – bot vždy mluví o "reklamaci",
  to je záměr (viz LOMAX finální wording fix, stejný princip platí i tady).
- Neslibuj konkrétní záruční lhůtu ani cenu opravy nahlas při demu – prompt
  bota to sám o sobě nedělá, ale kdyby se klient zeptal ústně tebe osobně,
  drž se stejné opatrnosti jako bot (sekce 3.2 promptu).
- Pokud during demo dojde k výpadku (VAPI/Deepgram hiccup), měj připravený
  fallback: druhý telefon/tab s Talk to Assistant jako záložní kanál.

## 7. Co udělat AŽ PO schválení klientem (ne teď)

- Přesměrovat e-maily z Make scénáře na skutečné adresy OKNOTHERM.
- Zvážit sloučení s jejich existujícím textovým Voiceflow botem (scénář
  `oknotherm poslani poptávky/problému`, id 6907061) – je to jiný kanál
  (web chat, ne telefon), takže obě řešení mohou běžet vedle sebe.
- Napojit `prepojit_na_operatora` na skutečnou linku, pokud ji chtějí.
- Probrat GDPR/nahrávání hovorů (viz `artifactPlan._poznamka_gdpr` v
  `03-vapi-assistant-config.json`) před ostrým provozem.
