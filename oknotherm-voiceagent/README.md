# OKNOTHERM – hlasový agent na reklamace (demo)

Hlasová asistentka **Petra** pro OKNOTHERM (okna, dveře, stínicí technika,
bioklimatické pergoly, fasády — https://www.oknotherm.cz/), postavená na VAPI
+ Make.com, přímý port osvědčeného řešení z `../lomax-voiceagent/`.

**Stav:** demo připravené, Make backend je živý a otestovaný (viz `04-demo-navod.md`).

## Soubory

| Soubor | K čemu |
|---|---|
| `01-system-prompt.md` | Celý systémový prompt pro VAPI asistenta — vlož do `model.messages[0].content`. |
| `02-vapi-tools.json` | Definice nástrojů `odeslat_reklamaci`, `prepojit_na_operatora`, `ukoncit_hovor`. Webhook už je živě napojený na demo Make scénář. |
| `03-vapi-assistant-config.json` | Kompletní konfigurace asistenta (model, hlas, transcriber, analysis plan). |
| `04-demo-navod.md` | **Začni tady.** Krok za krokem, jak dostat demo do provozu do pondělí a jak ho předvést klientovi. |

## V kostce

- Persona: **Petra**, čeština, ženský rod důsledně (viz prompt sekce 1, bod 2b).
- Model: `claude-haiku-4-5`, `maxTokens: 1500` (nastaveno rovnou správně od
  začátku — viz `../lomax-voiceagent/11-oprava-prazdne-argumenty.md`, proč je
  to důležité).
- Telefon se bere z ID volajícího, nikdy se nediktuje (výjimka: zpětné volání
  na jiné číslo nebo skryté číslo volajícího).
- Bezpečnostní triáž: prasklé sklo, nezamykatelné dveře/okno, uvolněný rám,
  jiskřící motor → `priorita = vysoka`, `bezpecnostni_riziko = true`.
- Nikde se neříká "poptávka" nahlas zákazníkovi — vždy "reklamace".
- Make demo scénář (`oknotherm reklamace voicebot (demo)`, aktivní) posílá
  strukturovaný e-mail na testovací adresu `paveklukas5@gmail.com` — přepnutí
  na skutečné adresy OKNOTHERM je otázka jedné úpravy, až klient schválí.
