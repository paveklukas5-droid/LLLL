# VAPI — nastavení krok za krokem

Dvě cesty. **Cesta A přes API** je rychlejší a spolehlivější (nakopíruješ hotový JSON). **Cesta B přes dashboard** je klikací — ve formuláři se JSON vložit nedá, každý parametr nástroje musíš přidat ručně, a těch je 22. Ve VAPI ale jde u parametrů přepnout na JSON editor — pak vložíš celý blok z `09-parametry.json` najednou.

Doporučuji: **nástroj založ přes API (cesta A), asistenta si naklikej v dashboardu (cesta B2)** — u asistenta se ti pak lépe ladí hlas a prompt živě.

---

# ČÁST 1 — PRVNÍ ZPRÁVA

Ta úplně první věta rozhoduje o tom, jestli zákazník začne mluvit k věci, nebo se zeptá „haló, kdo je tam?". Pravidla, která tyhle varianty dodržují: **představit firmu do 2 sekund**, **říct, že jde o servis**, a **skončit otevřenou otázkou**.

### Doporučená (výchozí)
```
Dobrý den, tady Klára ze servisu LOMAX. Jak vám můžu pomoci?
```

### Když zapneš nahrávání hovoru (`recordingEnabled: true`)
```
Dobrý den, tady Klára ze servisu LOMAX. Hovor nahráváme kvůli kvalitě služeb. S čím vám můžu pomoci?
```

### Varianta, která rovnou navede na věc (nejvyšší úspěšnost sběru dat)
```
Dobrý den, tady Klára ze servisní linky LOMAX. Povězte mi prosím, s jakým produktem máte problém.
```

### Varianta mimo pracovní dobu
Pokud si přes Make nebo VAPI Squad rozlišíš čas hovoru:
```
Dobrý den, tady Klára ze servisu LOMAX. Kolegové jsou k dispozici od osmi do šestnácti, ale vaši servisní poptávku zapíšu i teď. S čím máte problém?
```

### Nastavení v dashboardu
- **First Message Mode:** `Assistant Speaks First` — u servisní linky vždycky. Když necháš mluvit prvního zákazníka, půlka lidí mlčí a čeká.
- Do pole **First Message** vlož jen jednu z vět nahoře, bez uvozovek.

> **Nepoužívej** delší uvítání typu „vítejte na servisní lince společnosti LOMAX & Co s.r.o., největšího českého výrobce…". Zákazník s rozbitými vraty to nechce poslouchat a stejně tě přeruší.

---

# ČÁST 2 — NÁSTROJ

## Cesta A: přes API (doporučeno, 2 minuty)

**1. Vezmi si privátní klíč**
Dashboard → *Settings* (nebo *Organization*) → **API Keys** → zkopíruj **Private Key**. Pozor, ne Public key — ten je jen pro webové widgety.

**2. Uprav si `02-vapi-tools.json`**
- `server.url` → tvoje Make webhook URL
- `server.headers.x-api-key` → tvoje vymyšlené tajemství (stejné dej do Make filtru)

**3. Pošli nástroj do VAPI**

Vytvoř si soubor `tool.json`, do kterého vlož **jen ten první objekt** z pole `tools` (tj. celý blok od `"type": "function"` po jeho uzavírací závorku, bez klíče `_comment`). Pak:

```bash
curl -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer TVUJ_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d @tool.json
```

Odpověď obsahuje `"id": "..."` — **tohle ID si ulož**, budeš ho potřebovat pro asistenta.

**4. Stejně založ ukončení hovoru** (nepovinné, jde zapnout i přepínačem v dashboardu):

```bash
curl -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer TVUJ_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"endCall","function":{"name":"ukoncit_hovor","description":"Ukončí hovor. Volej až po rozloučení se zákazníkem, nikdy uprostřed jeho věty."}}'
```

**5. Ověř, že to sedí**
```bash
curl https://api.vapi.ai/tool -H "Authorization: Bearer TVUJ_PRIVATE_KEY"
```

---

## Cesta B: přes dashboard (klikací)

Dashboard → **Tools** → **Create Tool** → vyber typ **Function**.

### Základ nástroje

| Pole ve formuláři | Co vyplnit |
|---|---|
| **Tool Name** / Function Name | `odeslat_servisni_poptavku` |
| **Description** | Zkopíruj celý dlouhý popis z `02-vapi-tools.json` (klíč `function.description`). Nezkracuj ho — právě z něj model pozná, **kdy** má nástroj zavolat. |
| **Server URL** | Tvoje Make webhook URL |
| **Timeout** | `25` sekund |
| **Async** | **vypnuto** — bot musí počkat na potvrzení, než řekne „hotovo" |

### Hlášky během volání (sekce *Messages*)

Tohle lidi často vynechají a bot pak 4 sekundy mlčí, což na telefonu působí jako spadlý hovor.

| Typ | Text |
|---|---|
| `Request Start` | `Zakládám vám servisní poptávku, moment prosím.` |
| `Request Complete` | `Hotovo, poptávku mám odeslanou.` |
| `Request Failed` | `Omlouvám se, systém mi teď poptávku nepřijal. Zkusím to ještě jednou.` |
| `Request Delayed` (8000 ms) | `Ještě to zpracovávám, děkuji za trpělivost.` |

### Parametry — 22× „Add Property"

Pro každý řádek klikni **Add Property**, vyplň *Name*, *Type*, *Description* (kopíruj z `02-vapi-tools.json`) a zaškrtni *Required* tam, kde je níže ✔.

| # | Name | Type | Req |
|---|---|---|---|
| 1 | `jmeno_prijmeni` | string | ✔ |
| 2 | `telefon_jine` | string | |
| 3 | `adresa_ulice_cp` | string | ✔ |
| 4 | `adresa_mesto` | string | ✔ |
| 5 | `adresa_psc` | string | ✔ |
| 6 | `typ_pozadavku` | string | ✔ |
| 7 | `typ_produktu` | string | ✔ |
| 8 | `model_rada` | string | |
| 9 | `pohon_znacka` | string | |
| 10 | `popis_zavady` | string | ✔ |
| 11 | `technicke_detaily` | string | |
| 12 | `kdy_zacalo` | string | |
| 13 | `opakovana_zavada` | boolean | |
| 14 | `bezpecnostni_riziko` | boolean | ✔ |
| 15 | `priorita` | string | ✔ |
| 16 | `rok_montaze` | string | |
| 17 | `cislo_zakazky` | string | |
| 18 | `kdo_montoval` | string | |
| 19 | `dostupnost` | string | |
| 20 | `ma_fotografie` | boolean | |
| 21 | `shrnuti_pro_technika` | string | ✔ |
| 22 | `poznamka` | string | |

**Když formulář nenabízí `enum`:** u polí `typ_pozadavku`, `typ_produktu` a `priorita` prostě vypiš povolené hodnoty přímo do *Description*, například:

> `Kategorie produktu. Použij PŘESNĚ jednu z hodnot: garazova_vrata_sekcni, garazova_vrata_posuvna, garazova_vrata_rolovaci, garazova_vrata_dvoukridla, predokenni_roleta, venkovni_zaluzie, vchodove_dvere, okno, sit_proti_hmyzu, rolovaci_mriz, pohon_nebo_ovladac, jine`

Funguje to skoro stejně dobře jako `enum` a Make dostane čisté hodnoty pro `switch()`.

---

# ČÁST 3 — ASISTENT

Dashboard → **Assistants** → **Create Assistant** → *Blank Template*. Název: `LOMAX – Servis a reklamace (CZ)`.

## Záložka Model

| Pole | Hodnota |
|---|---|
| **Provider** | Anthropic |
| **Model** | Claude Sonnet 5 *(když ho nevidíš, vezmi nejnovější Sonnet; alternativa GPT-4.1)* |
| **First Message** | viz ČÁST 1 |
| **System Prompt** | **celý obsah `01-system-prompt.md`** — označ vše, zkopíruj, vlož |
| **Temperature** | `0.3` |
| **Max Tokens** | `350` |

> Markdown v promptu nevadí — model ho čte jako strukturu, ale nahlas ho nikdy neříká (je to zakázané v sekci 1, pravidlo 9). Nesnaž se ho odmazávat, ztratíš tím přehlednost.

## Záložka Voice

| Pole | Hodnota |
|---|---|
| **Provider** | Azure |
| **Voice** | `cs-CZ-VlastaNeural` (žena) nebo `cs-CZ-AntoninNeural` (muž) |
| **Speed** | `1.0` |

Chceš přirozenější projev? Přepni na **ElevenLabs**, model `eleven_flash_v2_5`, `Optimize Streaming Latency = 3`, `Stability 0.5`, `Similarity 0.75`. Zní líp, ale **otestuj diktování čísel** — občas ujede výslovnost. Azure je na servisní linku sázka na jistotu.

## Záložka Transcriber

| Pole | Hodnota |
|---|---|
| **Provider** | Deepgram |
| **Model** | `nova-2` |
| **Language** | **Czech / cs** ← nejčastější chyba je nechat tu angličtinu |
| **Smart Format** | zapnuto |

Když bot komolí příjmení a čísla, vyzkoušej v tomhle pořadí: Azure `cs-CZ` → ElevenLabs `scribe_v1`.

## Záložka Tools

- Připoj `odeslat_servisni_poptavku`
- Zapni **Enable End Call Function**
- **Forwarding Phone Number** nech prázdné, pokud nemáš živou linku

## Záložka Analysis

- **Summary Prompt**, **Success Evaluation** a **Structured Data** — zkopíruj texty a schéma z `03-vapi-assistant-config.json`, sekce `analysisPlan`.
- Structured Data je pojistka: i kdyby bot zapomněl zavolat nástroj, data ti přijdou v reportu po hovoru a nic se neztratí.

## Záložka Advanced

**Start Speaking Plan**
| Pole | Hodnota |
|---|---|
| Wait Seconds | `0.5` |
| Smart Endpointing | zapnuto |
| On Punctuation Seconds | `0.15` |
| On No Punctuation Seconds | `1.4` |
| **On Number Seconds** | **`0.6`** |

> `On Number Seconds` je nejdůležitější číslo v celém nastavení. Zákazník diktuje telefon a PSČ po skupinách s pauzami — bez tohohle mu bot skočí do řeči uprostřed čísla a zapíše ho špatně.

**Stop Speaking Plan**
| Pole | Hodnota |
|---|---|
| Num Words | `2` |
| Voice Seconds | `0.2` |
| Backoff Seconds | `1.0` |

**Messaging / Timeouts**
| Pole | Hodnota |
|---|---|
| Idle Messages | `Jste tam ještě, prosím?` / `Slyšíme se?` |
| Idle Timeout | `9` s |
| Max Idle Messages | `2` |
| Silence Timeout | `30` s |
| Max Duration | `900` s (15 min) |
| Background Sound | `Off` |
| Background Denoising | zapnuto |
| Backchanneling | **vypnuto** — v češtině zní přitakávání nepřirozeně |

**Analysis / Server**
- **Server URL** (na úrovni asistenta) → druhý Make webhook
- **Server Messages** → zaškrtni `end-of-call-report` a `status-update`

**Privacy**
- **Recording** — zapni jen pokud upravíš první zprávu podle ČÁSTI 1

---

# ČÁST 4 — TELEFONNÍ ČÍSLO

Dashboard → **Phone Numbers** → **Create Phone Number**.

- VAPI přímo česká čísla obvykle nenabízí. Reálné cesty: **Twilio** (koupíš `+420` číslo a připojíš přes *Import from Twilio*), nebo **vlastní SIP trunk** od českého operátora (*BYO SIP Trunk*), což je pro produkci lepší kvůli ceně za minutu i kvalitě.
- U čísla nastav **Inbound Assistant** = tvůj LOMAX asistent.
- Pokud se má bot zapojit až po X zazvoněních za lidmi, řeší se to na straně ústředny LOMAXu (přesměrování při neobsazení), ne ve VAPI.

---

# ČÁST 5 — POŘADÍ SPUŠTĚNÍ

1. Make scénář → zkopíruj webhook URL
2. Otestuj Make samostatně `curl` payloadem z `04-make-scenar.md`
3. Založ nástroj ve VAPI (cesta A nebo B)
4. Založ asistenta, připoj nástroj
5. **Test v dashboardu** tlačítkem *Talk to Assistant* — ověříš prompt a tok hovoru
6. Připoj telefonní číslo
7. **Test reálným telefonem** — teprve tady se ukáže kvalita češtiny
8. Projeď `05-testovaci-scenare.md`, minimálně T1, T2, T8, T9
9. Zkontroluj, že e-maily dorazily se správnými čísly
10. Teprve pak zveřejni číslo

---

# ČASTÉ CHYBY (pořadí podle toho, jak často se dějí)

| Chyba | Projev | Oprava |
|---|---|---|
| Transcriber nechaný na angličtině | Bot nerozumí vůbec ničemu | Language → `cs` |
| Make nemá poslední modul *Webhook response* | Bot řekne, že odeslání selhalo, i když e-mail dorazil | Přidej *Webhook response* jako **poslední** modul |
| Chybí `On Number Seconds` | Špatná telefonní čísla a PSČ v e-mailech | Nastav `0.6` |
| Zkrácený popis nástroje | Bot nástroj nezavolá vůbec | Vlož celý dlouhý popis z JSON |
| Async zapnuté | Bot řekne „hotovo" dřív, než Make doběhne | Async vypnout |
| Make mapuje kořen payloadu | Prázdné e-maily | Data jsou v `message.toolCalls[0].function.arguments` |
| Těžké moduly před response | Timeout nástroje | Sheets, CRM a další dej **až za** *Webhook response* |
| Public key místo Private | `401 Unauthorized` u API | Private Key ze *Settings → API Keys* |
