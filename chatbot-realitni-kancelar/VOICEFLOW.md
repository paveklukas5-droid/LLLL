# Nasazení ve Voiceflow

Kam co patří, když je agent postavený ve Voiceflow.

## 1. Prompty

| Náš soubor | Kam ve Voiceflow |
|---|---|
| `GLOBAL_PROMPT.md` | **Agent → Persona** (systémový prompt agenta) |
| `INSTRUCTIONS.md` | **Knowledge Base → Settings → Instructions** |

Obojí vkládejte bez nadpisu souboru — text začíná od `# Role`, resp. `# Instructions`.

Ve stejném nastavení Knowledge Base zkontrolujte ještě tohle:

- **Chunk limit** — nechte aspoň `3`, ideálně `5`. Při nižší hodnotě bot u dotazů
  na nabídku uvidí jen pár útržků a začne si domýšlet.
- **Temperature** — `0.2`–`0.4`. Výš už si vymýšlí, níž zní jako robot.
- **Model** — pro češtinu volte ten nejsilnější, který máte v plánu k dispozici.
  Na češtině je rozdíl mezi modely mnohem větší než na angličtině.

## 2. Tool `poslat_email`

Ve Voiceflow to je **Function / Tool**, který pošle POST na váš webhook v Make.

- **Metoda a URL:** `POST` na adresu Custom webhooku z Make (modul 2 ve scénáři)
- **Body:** JSON s poli, která už webhook zná

```json
{
  "cele_jmeno": "{cele_jmeno}",
  "telefonni_cislo": "{telefonni_cislo}",
  "email": "{email}",
  "popis_problemu": "{popis_problemu}",
  "shrnuti_problemu": "{prepis_konverzace}"
}
```

Popis toolu, který uvidí model při rozhodování, ať zní takhle — je to poslední pojistka
proti přehnanému nabízení:

> Odešle poptávku nebo dotaz klienta realitnímu týmu, který se mu ozve. Používej pouze tehdy,
> když klient jasně souhlasil s předáním kontaktu — nikdy sám od sebe a nikdy jako náhradu
> za odpověď, kterou umíš dát.

## 3. Přehled nabídky do Knowledge Base

Tohle je ta věc, která opraví „Jaké nemovitosti nabízíte?". Generátor je popsaný
v [`kb/README.md`](kb/README.md), tady je jen napojení na Voiceflow.

### Varianta A — URL dokument s denním refreshem (doporučeno, žádný kód)

Voiceflow umí u URL dokumentů sám periodicky přenačítat obsah. Stačí tedy:

1. GitHub Actions vygeneruje soubor a commitne ho (běží denně v 5:20).
2. Ve Voiceflow: **Knowledge Base → Add Data Source → URL**
3. Vložte adresu vygenerovaného souboru:
   ```
   https://raw.githubusercontent.com/paveklukas5-droid/LLLL/claude/realitni-kancelar-chatbot-dintiz/chatbot-realitni-kancelar/kb/nabidka-prehled.md
   ```
4. **Refresh rate: Daily**

A je hotovo — nic se nesynchronizuje, Voiceflow si obsah tahá sám.

Generátor vedle `.md` zapisuje i **`nabidka-prehled.html`**. Kdyby Voiceflow nechtěl
přijmout `.md` (raw GitHub ho servíruje jako `text/plain`), použijte HTML verzi —
budete pro ni ale potřebovat adresu, která servíruje `text/html`, tedy zapnout na repozitáři
GitHub Pages, nebo soubor nahrát na vlastní web.

> Pozn.: pokud máte ve Voiceflow zapnutý LLM chunking, každý refresh spotřebuje kredity.
> U dokumentu tohohle rozsahu je to zanedbatelné, ale je dobré o tom vědět.

### Varianta B — nahrání přes API (deterministické)

Když nechcete být závislí na crawleru, workflow umí dokument nahrát přímo:

1. Ve Voiceflow: **Integrations → API Keys** → vytvořte klíč (začíná `VF.DM.`)
2. Na GitHubu: **Settings → Secrets and variables → Actions → New repository secret**
   - jméno `VOICEFLOW_API_KEY`, hodnota ten klíč
3. Nic dalšího — workflow ten krok spustí sám, jakmile secret existuje.
   Bez secretu se krok přeskočí a použije se varianta A.

Skript ([`tools/voiceflow-sync.mjs`](../tools/voiceflow-sync.mjs)) před nahráním smaže
předchozí verzi dokumentu, aby v KB nevznikaly duplicity — jinak by bot postupně viděl
nabídku ze všech předchozích dnů najednou.

### Varianta C — tabulkový dokument (nejlepší vyhledávání, k prozkoumání)

Voiceflow umí i **table dokumenty** se `searchableFields` a `metadataFields`, kde jde
filtrovat podle hodnot polí. Pro nabídku nemovitostí je to strukturně nejlepší řešení —
dotaz „3+1 v Brně do 6 milionů" by se filtroval na datech, ne odhadoval z textu.

Nejdřív si ale v dokumentaci pod svým účtem ověřte přesnou adresu endpointu — v podkladech
se objevuje ve dvou tvarech (`api.voiceflow.com/v1/knowledge-base/docs/upload/table`
a `realtime-api.voiceflow.com/v1alpha1/…`) a nechci vám dát tvar, který u vás nebude platit.
Až budete vědět, který je ten správný, doplním do generátoru i tenhle výstup.

## 4. Co po nasazení otestovat

1. „Jaké nemovitosti nabízíte?" → kategorie, zužující otázka, **žádná** nabídka kontaktu
2. „Máte něco 3+1 v Brně?" → konkrétní nemovitosti z přehledu
3. „Máte něco do 6 milionů?" → jen ty, co limit opravdu splňují
4. „Co je home staging?" → odpoví a **skončí**
5. „Chci prodat byt, kolik dostanu?" → nabídne odhad **hned**
6. Nabídka → „zatím ne" → do konce konverzace už nikdy
7. „ano" textem místo tlačítka → spustí tool bez dalšího ptaní
