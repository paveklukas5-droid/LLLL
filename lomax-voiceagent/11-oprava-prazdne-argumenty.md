# Oprava: hovor proběhl skvěle, ale přišla prázdná obálka

Z logu hovoru ze 17. 8.:

```json
"toolCalls": [{
  "name": "odeslat_servisni_poptavku",
  "serverUrl": "https://hook.eu1.make.com/u6q3lpz...",
  "arguments": {}          ← prázdné
}]
```

Model neměl kam data zapsat, protože nástroj ve VAPI má **prázdný nebo chybějící objekt `parameters`**. Sedmiminutový hovor, ve kterém bot posbíral všechno správně, skončil prázdným e-mailem. Zákazník to vyjmenoval přesně: *„není tam ani moje jméno, není tam priorita, telefon špatně, nemáte tam ani zapsanou adresu, ani produkt, ani rok montáže… ani shrnutí pro technika, popis závady tam vůbec není."*

Pořadí oprav je podle dopadu. **Bod 1 udělej dřív než cokoli jiného** — bez něj je každý hovor k ničemu, ať je jakkoli dobrý.

---

## 1. Schéma parametrů nástroje (celý ten bug)

### Nahraj schéma

VAPI → **Tools** → `odeslat_servisni_poptavku` → sekce parametrů → přepni na **JSON** → **Ctrl+A** → vlož celý obsah `09-parametry.json` → **Save**.

### Ověř, že se to fakt uložilo

Tohle je ta důležitá část. Editor tvrdí, že uložil, i když se schéma nepropsalo — přesně to se stalo minule. Zkontroluj to přes API:

```bash
curl -sS https://api.vapi.ai/tool \
  -H "Authorization: Bearer TVUJ_VAPI_PRIVATE_KEY" \
  | python3 -c "
import json,sys
for t in json.load(sys.stdin):
    f = t.get('function') or {}
    if f.get('name') != 'odeslat_servisni_poptavku': continue
    props = ((f.get('parameters') or {}).get('properties') or {})
    req   = ((f.get('parameters') or {}).get('required') or [])
    print('tool id  :', t.get('id'))
    print('parametru:', len(props), '(ma byt 22)')
    print('povinnych:', len(req),   '(ma byt 10)')
    print('server   :', (t.get('server') or {}).get('url'))
    print('VERDIKT  :', 'OK' if len(props)==22 else '>>> SCHEMA SE NEULOZILO <<<')
"
```

Když to vypíše `0 parametru`, uložení neproběhlo. Pak schéma nahraj rovnou přes API — tam se ztratit nemůže:

```bash
curl -sS -X PATCH https://api.vapi.ai/tool/TVUJ_TOOL_ID \
  -H "Authorization: Bearer TVUJ_VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"function\":{\"name\":\"odeslat_servisni_poptavku\",\"parameters\":$(grep -v '^//' 09-parametry.json)}}"
```

Pak spusť ověřovací příkaz znovu. **Dokud nevypíše 22, nemá smysl testovat hovorem.**

### Ještě zkontroluj serverUrl

V logu je `hook.eu1.make.com`. Ujisti se, že je to ten samý webhook, na kterém máš postavený scénář — Make dává různým účtům různé regiony (`eu1`, `eu2`) a splést si je je snadné.

---

## 1b. Datová struktura webhooku v Make

**Druhá, nezávislá příčina prázdných e-mailů** — a hůř dohledatelná, protože scénář hlásí úspěch.

Custom webhook v Make může mít připojenou *datovou strukturu*. Pokud ji má, Make příchozí JSON proti ní validuje a **všechno, co v ní není definované, zahodí**. Do modulů pak doteče prázdno, mapování `2.message.toolCalls[1].function.arguments.jmeno_prijmeni` vrátí nic, e-mail odejde prázdný a v historii svítí zelený běh.

Přesně to se stalo tady: struktura webhooku měla v `arguments` pole z úplně jiného projektu — `jmeno`, `email`, `typ_zajmu`, `ucel_vyuziti`, `lokalita`, `casovy_ramec`. Ani jedno z 22 lomaxích polí tam nebylo, takže se všechna zahazovala bez ohledu na to, co VAPI poslal.

**Jak to zkontrolovat:** otevři modul Custom webhook → klikni na webhook → *Data structure*. Pod `message → toolCalls → function → arguments` musí být tvoje pole.

**Jak to opravit:** buď strukturu přepiš na správná pole, nebo ji odpoj úplně (pak Make pustí dál syrový JSON a mapování se píše ručně, což u hardcodovaných cest nevadí).

> **Proč to vzniká:** struktura se učí z prvního payloadu, nebo se zkopíruje spolu se scénářem z jiného projektu. Když se pak změní schéma nástroje, struktura se sama neaktualizuje. **Po každé změně parametrů nástroje ve VAPI tuhle strukturu překontroluj.**

---

## 2. Make musí validovat a hlídat duplicity

Webhook vrátil `"Servisní poptávka SRV-20260817-EDB7B8 byla úspěšně zaevidována"` na **prázdný payload**. Ta hláška byla natvrdo napsaná a nekontrolovala nic — bot pak s klidem oznámil hotovo.

A protože si zákazník stěžoval, bot zavolal nástroj znovu, zase s prázdnými argumenty. V dispečinku teď leží dva duchové: `SRV-20260817-EDB7B8` a `SRV-20260817-36A982`.

Obojí řeší nová struktura scénáře v `04-make-scenar.md`:

- **Data store `lomax_poptavky`** klíčovaný přes `callId` — druhé volání v témže hovoru se pozná a e-mail se neposílá podruhé
- **Větev „Chybí povinná data"** vrátí `error` místo `result`, takže bot řekne *„systém mi poptávku nepřijal"* a zkusí to znovu **s vyplněnými daty**, místo aby lhal, že je hotovo

Klíčový detail je to slovo `error` v odpovědi:

```json
{"results":[{"toolCallId":"{{message.toolCalls[0].id}}","error":"Poptávku nelze uložit, chybí povinné údaje."}]}
```

---

## 3. Ženský rod

Ve 25,2 bot řekl *„Rozumím, rád vám s tím pomůžu"* a zákazník to hned píchl: *„Jak rád? Nic jste, že ne?"*

V promptu je teď tvrdé pravidlo hned jako bod 2b, se seznamem zakázaných tvarů. Vlož si aktuální `01-system-prompt.md`.

## 4. Zákaz opravování značek

Zákazník řekl **Sommer**, bot odpověděl *„Somfy, dobře."* Sommer je jiný výrobce a zákazník to musel hláskovat po písmenech.

Nové pravidlo v sekci 2 promptu: názvy značek, příjmení a obcí se čtou zpět **přesně tak, jak zazněly**, a při nejistotě se nechají vyhláskovat. Špatná značka pohonu v tiketu znamená, že technik přijede se špatným dílem.

## 5. Rozpor u nouzového odjištění

Ve 115,7 bot řekl *„nesahejte a nemanipulujte s tím"*. O třicet sekund později: *„Zkoušel jste nouzové odjištění pohonu? Červený provázek nebo páčku?"* Zákazník: *„To je kde?"* Bot: *„To vám nebudu popisovat, nechám to na technikovi."* Reakce zákazníka byla naprosto oprávněná: *„Počkat, proč jste mi nabízela, abych to udělal, a pak mi řeknete, že mi to nepopíšete?"*

Otázka na nouzové odjištění je z promptu **odstraněná**. Nahradila ji čistě diagnostická: **„Jdou vrata pohnout ručně?"** — na tu zákazník odpoví bez manipulace se zařízením.

## 6. Model zpátky na Haiku 4.5

$4,66 za jeden hovor na Sonnetu 4.6 (547 sekund, 50 zahozených requestů). Při stovce hovorů měsíčně je to 12 tisíc korun jen na LLM — za vyplnění formuláře. Haiku 4.5 to srazí zhruba desetinásobně a ubere ~0,8 s latence.

V `03-vapi-assistant-config.json` je nastavené `claude-haiku-4-5`.

---

## Ještě dvě věci z logu

**Mluvní čas bota vylétl na 43 %, nejdelší blok 34,3 s.** V promptu je nový tvrdý strop: jedna promluva max 10 sekund, tedy ~25 slov, a bot má mluvit méně než zákazník.

**Bot se třikrát ptal na věci, které už zazněly** (*„Jak jsem říkal" / „Už jsem říkal" / „Taky jsem to říkal"*). Nové pravidlo na začátku KROKU 4: před každou otázkou zkontrolovat, jestli informace už nezazněla, a pokud ano, jen ji potvrdit.

**A pořád „A pejsci prosím?" místo PSČ.** Pravidlo o fonetickém „pé-es-čé" je v promptu od 15. 8. — pokud to bot pořád komolí, znamená to, že v poli System Prompt máš starší verzi. Zkopíruj `01-system-prompt.md` znovu celý.

---

## Co naopak zabralo

Z minulých kol reálně funguje:

- **Čtení čísel po číslicích.** *„Sedm, sedm, sedm, jedna, dva, tři, čtyři, pět, šest. Souhlasí?"* — první pokus, potvrzeno. Proti padesátisekundovému martyriu z 15. 8. je to jiný svět.
- **Validace délky PSČ.** *„To jsou jen čtyři číslice, PSČ bývá pět. Můžete mi prosím zopakovat celé?"* — přesně tak to má vypadat.
- **Číslo zakázky jako nepovinné.** *„Nevadí vůbec, technik si to dohledá podle adresy."* Žádné zacyklení.
- Triáž, empatie i vokativ drží.

---

## Pořadí a kontrolní seznam

| | Krok |
|---|---|
| ☐ | Nahrát schéma parametrů a **ověřit přes API, že vrací 22** |
| ☐ | Zkontrolovat, že `serverUrl` nástroje míří na správný Make webhook (eu1 vs eu2) |
| ☐ | V Make přidat Data store + validační větve podle `04-make-scenar.md` |
| ☐ | Nahrát aktuální `01-system-prompt.md` (ženský rod, značky, strop promluvy, ruční pohyb vrat) |
| ☐ | Přepnout model na Haiku 4.5 |
| ☐ | Smazat obě duchařské zakázky `SRV-20260817-EDB7B8` a `SRV-20260817-36A982` z dispečinku |
| ☐ | Testovací hovor → v Calls zkontrolovat, že `arguments` **není** `{}` |
