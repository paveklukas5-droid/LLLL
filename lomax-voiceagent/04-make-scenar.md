# Make.com scénář — od VAPI k e-mailu

Dva scénáře. První je povinný (přijme poptávku a rozešle e-maily), druhý je volitelná pojistka (zpracuje report po skončení hovoru).

---

## SCÉNÁŘ 1 — `LOMAX | Servisní poptávka z voicebota`

```
[1] Webhooks → Custom webhook
        ↓
[1b] Filter: message.type = "tool-calls"   (POVINNÉ, viz níže)
        ↓
[2] Tools → Set multiple variables      (normalizace dat)
        ↓
[3] Router
        ├── větev A: Email → Send an email     → servisní oddělení  (VŽDY)
        ├── větev B: Google Sheets → Add a row  (volitelné, evidence)
        └── větev C: Email / Slack → PŘEDNOSTNÍ (filtr: priorita = vysoka)
        ↓
[4] Webhooks → Webhook response          (musí být poslední!)
```

### Modul 1 — Custom webhook

1. Make → Create a new scenario → přidej **Webhooks → Custom webhook** → *Add* → název `vapi-lomax-servis`.
2. Zkopíruj vygenerovanou URL a vlož ji do `02-vapi-tools.json` → `server.url`.
3. Klikni **Re-determine data structure**, pak z VAPI pusť jeden testovací hovor (nebo pošli testovací payload níže přes `curl`) — Make si tím načte strukturu polí.

**Kde v payloadu leží data.** VAPI posílá tool-call obalený. Cesta k argumentům:

```
message.toolCalls[0].function.arguments
```

Když se ti v Make mapování špatně chytá, dej hned za webhook modul **JSON → Parse JSON** a namapuj `message.toolCalls[0].function.arguments`. Pak už máš pole jako `arguments.jmeno_prijmeni` atd.

Pro zaslání odpovědi zpět VAPI potřebuješ i `toolCallId`:
```
message.toolCalls[0].id
```

**Telefonní číslo zákazníka.** Bot se na něj neptá — bere se z hovoru. Ve stejném payloadu ho najdeš tady:
```
message.call.customer.number
```
Bot vyplní pole `telefon_jine` **jen tehdy**, když zákazník chce volat zpět na jiné číslo. V modulu 2 se z těch dvou zdrojů udělá jedno kontaktní číslo.

> Když volající skryje číslo (anonymní hovor), je `customer.number` prázdné. Proto má e-mail pro servis u telefonu nouzový text — viz níže.

### Modul 1b — Filter „Jen tool-calls" (POVINNÉ)

Na spoji mezi webhookem a modulem 2 klikni na klíč a přidej filtr:

| Pole | Hodnota |
|---|---|
| Label | `Jen tool-calls` |
| Podmínka | `message.type` — *Text: Equal to* — `tool-calls` |

**Proč to tam musí být.** Na stejný webhook může dorazit i `end-of-call-report` nebo `status-update` — buď proto, že Server URL asistenta míří na stejnou adresu, nebo omylem při testech. Takový payload má `message.call`, ale **nemá `toolCalls`**. Bez filtru scénář doběhne, všechna pole z `arguments` jsou prázdná a servisu odejde e-mail, ve kterém je vyplněný jen telefon. To je typický příznak: *„přišel mail a bylo tam jen číslo"*.

### Modul 2 — Set multiple variables (normalizace)

| Proměnná | Vzorec |
|---|---|
| `cislo_poptavky` | `"SRV-" + formatDate(now; "YYYYMMDD") + "-" + substring(uuid; 0; 6)` |
| `priorita_text` | `switch(priorita; "vysoka"; "🔴 PŘEDNOSTNÍ"; "stredni"; "🟠 Standardní"; "nizka"; "🟢 Nízká")` |
| `produkt_text` | `switch(typ_produktu; "garazova_vrata_sekcni"; "Sekční garážová vrata"; "garazova_vrata_posuvna"; "Posuvná garážová vrata"; "garazova_vrata_rolovaci"; "Rolovací garážová vrata"; "garazova_vrata_dvoukridla"; "Dvoukřídlá garážová vrata"; "predokenni_roleta"; "Předokenní roleta"; "venkovni_zaluzie"; "Venkovní žaluzie"; "vchodove_dvere"; "Vchodové dveře"; "okno"; "Okno"; "sit_proti_hmyzu"; "Síť proti hmyzu"; "rolovaci_mriz"; "Rolovací mříž"; "pohon_nebo_ovladac"; "Pohon / ovladač"; "Jiné")` |
| `typ_text` | `switch(typ_pozadavku; "reklamace"; "Reklamace"; "servis"; "Servis"; "servisni_prohlidka"; "Servisní prohlídka"; "Jiné")` |
| `adresa_cela` | `adresa_ulice_cp + ", " + adresa_mesto + ", " + adresa_psc` |
| `telefon_kontakt` | `ifempty(telefon_jine; message.call.customer.number)` |
| `telefon_pozn` | `if(length(telefon_jine) > 0; "zákazník požádal o zpětné volání na toto číslo"; "číslo, ze kterého volal")` |

### Modul 3 — Router s filtry

- **Větev A** (servisní oddělení): bez filtru.
- **Větev B** (Google Sheets): bez filtru.
- **Větev C** (přednostní upozornění): filtr `priorita` → *Equal to* `vysoka` **OR** `bezpecnostni_riziko` = `true`. Pošli na mobil odpovědné osoby / do Slacku / SMS.

### Modul 4 — Webhook response (POVINNÉ)

Bez něj bude VAPI čekat a bot řekne, že se odeslání nepovedlo.

- **Status:** `200`
- **Body** (Content-Type `application/json`):

```json
{
  "results": [
    {
      "toolCallId": "{{message.toolCalls[0].id}}",
      "result": "Servisní poptávka {{cislo_poptavky}} byla úspěšně zaevidována a odeslána servisnímu oddělení."
    }
  ]
}
```

Text v `result` bot uslyší a může ho zákazníkovi převyprávět — proto je česky a lidsky.

---

## E-mail A — pro servisní oddělení

### Hlavičky (tady se to nejčastěji pokazí)

| Pole v modulu Email | Hodnota |
|---|---|
| **From / Odesílatel** | `servis@lomax.cz` — ne gmailová adresa agentury. Linka se představuje jako servis LOMAX, tak ať tak vypadá i e-mail. Gmail má navíc denní limity, na které v provozu narazíš. |
| **To** | `servis@lomax.cz` (doplň reálnou) |
| **Reply-To** | `servis@lomax.cz` — **nikdy nenech prázdné.** Bez něj odpovědi dispečerů létají na účet, ze kterého scénář běží. |
| **Content type** | vyber v modulu **HTML**. |

> **MIME pozor.** Content-Type nepiš do sekce *Custom headers*. Make ho nastaví sám podle přepínače Content type. Když ho přidáš ručně, mail má dvě hlavičky `Content-Type` (`multipart/mixed` a hned pod ní `text/plain`), což je nevalidní — část klientů pak místo mailu zobrazí zdroják HTML.

**Textová alternativa.** Modul *Email → Send an email* má pole pro text i HTML. Vyplň **obě**, ať vznikne korektní `multipart/alternative`. Do textové verze stačí:

```
LOMAX - nova servisni poptavka {{cislo_poptavky}}
Priorita: {{priorita_text}}
Zakaznik: {{jmeno_prijmeni}}, tel. {{telefon_kontakt}}
Adresa: {{adresa_cela}}
Produkt: {{produkt_text}}
Zavada: {{popis_zavady}}
Shrnuti: {{shrnuti_pro_technika}}
Zaznam hovoru: https://dashboard.vapi.ai/calls/{{message.call.id}}
```

### Předmět

```
{{priorita_text}} · {{cislo_poptavky}} · {{produkt_text}} · {{adresa_mesto}} {{adresa_psc}}
```

### Tělo (HTML)

```html
<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;color:#222">

  {{if(priorita = "vysoka" or bezpecnostni_riziko; "<div style='background:#d32f2f;color:#fff;padding:12px 16px;border-radius:6px;font-size:16px;font-weight:bold;margin-bottom:16px'>PŘEDNOSTNÍ PŘÍPAD — VYŘÍDIT MIMO POŘADÍ</div>"; "")}}

  {{if(bezpecnostni_riziko; "<div style='background:#fdecea;border-left:4px solid #d32f2f;padding:12px 16px;margin-bottom:16px'><b>Nahlášeno bezpečnostní riziko.</b> Zákazník byl v hovoru poučen, aby produkt nepoužíval a nemanipuloval s ním.</div>"; "")}}

  <h2 style="margin:0 0 4px">Nová servisní poptávka z telefonní linky</h2>
  <p style="margin:0 0 16px;color:#666">
    <b>{{cislo_poptavky}}</b> · {{formatDate(now; "D. M. YYYY HH:mm")}} · priorita: <b>{{priorita_text}}</b><br>
    <a href="https://dashboard.vapi.ai/calls/{{message.call.id}}">Poslechnout hovor a přečíst přepis</a>
  </p>

  <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px">
    <tr style="background:#f4f4f4"><td colspan="2"><b>ZÁKAZNÍK</b></td></tr>
    <tr><td width="180"><b>Jméno</b></td><td>{{jmeno_prijmeni}}</td></tr>
    <tr><td><b>Telefon</b></td><td>
      {{if(length(telefon_kontakt) > 0; "<a href='tel:" + telefon_kontakt + "'>" + telefon_kontakt + "</a>"; "<b style='color:#d32f2f'>SKRYTÉ ČÍSLO — zákazníka nelze zpětně kontaktovat</b>")}}
      <br><span style="color:#888;font-size:12px">{{telefon_pozn}}</span>
    </td></tr>
    <tr><td><b>Adresa realizace</b></td><td>{{adresa_cela}}</td></tr>
    <tr><td><b>Dostupnost</b></td><td>{{ifempty(dostupnost; "neuvedeno")}}</td></tr>

    <tr style="background:#f4f4f4"><td colspan="2"><b>PRODUKT</b></td></tr>
    <tr><td><b>Typ</b></td><td>{{produkt_text}}</td></tr>
    <tr><td><b>Modelová řada</b></td><td>{{ifempty(model_rada; "neuvedeno")}}</td></tr>
    <tr><td><b>Pohon</b></td><td>{{ifempty(pohon_znacka; "neuvedeno")}}</td></tr>
    <tr><td><b>Rok montáže</b></td><td>{{ifempty(rok_montaze; "neuvedeno")}}</td></tr>
    <tr><td><b>Číslo zakázky</b></td><td>{{ifempty(cislo_zakazky; "neuvedeno — dohledat podle adresy")}}</td></tr>
    <tr><td><b>Montoval</b></td><td>{{ifempty(kdo_montoval; "neuvedeno")}}</td></tr>

    <tr style="background:#f4f4f4"><td colspan="2"><b>ZÁVADA — {{typ_text}}</b></td></tr>
    <tr><td><b>Popis</b></td><td>{{popis_zavady}}</td></tr>
    <tr><td><b>Technické detaily</b></td><td>{{ifempty(technicke_detaily; "neuvedeno")}}</td></tr>
    <tr><td><b>Kdy začalo</b></td><td>{{ifempty(kdy_zacalo; "neuvedeno")}}</td></tr>
    <tr><td><b>Opakovaná závada</b></td><td>{{if(opakovana_zavada; "ANO — řešeno už dříve"; "ne")}}</td></tr>
    <tr><td><b>Fotografie</b></td><td>{{if(ma_fotografie; "Zákazník fotku má — vyžádejte si ji při zpětném volání"; "nemá")}}</td></tr>

    <tr style="background:#fffbe6"><td><b>Shrnutí pro technika</b></td><td>{{shrnuti_pro_technika}}</td></tr>
    <tr><td><b>Poznámka</b></td><td>{{ifempty(poznamka; "neuvedeno")}}</td></tr>
  </table>

  <p style="font-size:12px;color:#888;margin-top:16px">
    Vygenerováno automaticky z telefonního hovoru (callId {{message.call.id}}).
    Doporučený další krok: přiřadit nejbližšímu autorizovanému zastoupení podle PSČ {{adresa_psc}}.
  </p>
</div>
```

> **Proč odkaz místo přímé nahrávky.** V okamžiku volání nástroje hovor ještě běží, takže `recordingUrl` ani finální přepis zatím neexistují. Odkaz na `dashboard.vapi.ai/calls/{{callId}}` bude funkční, jakmile hovor skončí. Kdo chce nahrávku přímo v mailu, pošle si ji druhým scénářem (níže) — spáruje se přes stejné `callId`.

---

## SCÉNÁŘ 2 (volitelný, doporučený) — `LOMAX | Report po hovoru`

Pojistka pro případ, že bot nezavolal nástroj (zákazník zavěsil uprostřed, technická chyba).

```
[1] Webhooks → Custom webhook   (URL vlož do assistant.server.url)
        ↓
[2] Filter:  message.type = "end-of-call-report"
        ↓
[3] Router
        ├── Filtr: message.analysis.structuredData.poptavka_odeslana = false
        │       AND  message.analysis.structuredData.telefon  není prázdné
        │   → Email: "⚠️ NEDOKONČENÁ poptávka – zavolat zpět"
        └── Filtr: message.analysis.successEvaluation = "fail"
            → Email do složky ke kontrole kvality (přepis + odkaz na nahrávku)
```

Užitečná pole z reportu:
- `message.analysis.summary` — české shrnutí hovoru
- `message.analysis.structuredData` — všechna pole ze `structuredDataPlan`
- `message.artifact.transcript` — celý přepis
- `message.artifact.recordingUrl` — nahrávka
- `message.endedReason` — proč hovor skončil
- `message.customer.number` — číslo volajícího (fallback, když bot telefon nezachytil)

---

## Testovací payload (curl)

Než zapojíš VAPI, otestuj Make samostatně:

```bash
curl -X POST "https://hook.eu2.make.com/TVUJ_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{
  "message": {
    "type": "tool-calls",
    "call": { "customer": { "number": "+420777123456" } },
    "toolCalls": [{
      "id": "call_test_001",
      "type": "function",
      "function": {
        "name": "odeslat_servisni_poptavku",
        "arguments": {
          "jmeno_prijmeni": "Jan Novák",
          "telefon_jine": "",
          "adresa_ulice_cp": "Krátká 12",
          "adresa_mesto": "Brno",
          "adresa_psc": "60200",
          "typ_pozadavku": "servis",
          "typ_produktu": "garazova_vrata_sekcni",
          "model_rada": "Delta",
          "pohon_znacka": "Marantec",
          "popis_zavady": "Vrata se zastaví asi 20 cm nad zemí a vyjedou zpátky nahoru. Jedna fotobuňka bliká červeně.",
          "technicke_detaily": "Nástěnné tlačítko reaguje, ovladač taky. Překážka v cestě není.",
          "kdy_zacalo": "asi před třemi dny",
          "opakovana_zavada": false,
          "bezpecnostni_riziko": false,
          "priorita": "stredni",
          "rok_montaze": "2019",
          "cislo_zakazky": "",
          "kdo_montoval": "zastoupení LOMAX",
          "dostupnost": "všední dny odpoledne po 15:00",
          "ma_fotografie": true,
          "shrnuti_pro_technika": "Sekční vrata Delta s pohonem Marantec se nedovírají, pravděpodobně rozladěné nebo znečištěné fotobuňky. Vzít náhradní pár fotobuněk.",
          "poznamka": ""
        }
      }
    }]
  }
}'
```

Očekávaná odpověď: `200` a JSON s `results[0].toolCallId`.

---

## Zabezpečení webhooku

Make webhook je veřejná URL. Ochrana:

1. Ve VAPI tool nastav hlavičku `x-api-key` (viz `02-vapi-tools.json`).
2. V Make hned za webhook dej **Filter**: `1.headers.x-api-key` *Equal to* tvoje tajemství. Když nesedí → scénář končí.
3. V Make webhooku zapni **IP restrictions**, pokud máš od VAPI seznam odchozích IP.
4. Do e-mailů nikdy neposílej klíče ani interní URL.
