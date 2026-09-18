# RD Rýmařov — hlasový agent na reklamace a servis

Hlasová asistentka **Lucie** pro RD Rýmařov (největší český výrobce
montovaných dřevostaveb, https://www.rdrymarov.cz/), postavená na VAPI +
Make.com — třetí nasazení stejného, iterativně vyladěného řešení po LOMAXu
a OKNOTHERM.

**Stav:** kompletní — prompt, nástroje, config i Make backend jsou hotové
a Make scénář je živý a otestovaný. Zbývá jen ruční založení ve VAPI
dashboardu (viz `06-vapi-navod.md` → Fáze 1-2) a reálný testovací hovor.

## Soubory

| Soubor | K čemu |
|---|---|
| `01-system-prompt.md` | Celý systémový prompt — vlož do `model.messages[0].content`. **Začni tady, projdi si hlavně sekci 2 (bezpečnost/havárie).** |
| `02-vapi-tools.json` | Definice nástrojů. Webhook je živě napojený na hotový Make scénář. |
| `03-vapi-assistant-config.json` | Kompletní konfigurace asistenta. |
| `04-make-scenar.md` | Jak funguje živý Make scénář, kam teď chodí e-mail, jak přepnout na produkci. |
| `05-parametry.json` | Jen JSON schéma parametrů `odeslat_reklamaci`, pro ruční vložení do VAPI dashboardu. |
| `06-vapi-navod.md` | **Sem jdi jako druhý.** Kompletní krok-za-krokem návod na založení ve VAPI. |
| `07-vytvorit-tool.sh` | API skript pro založení nástrojů (alternativa k ručnímu klikání). |
| `08-tool-rucne-ve-vapi.md` | Ruční založení nástrojů přes dashboard, pole po poli. |
| `09-testovaci-scenare.md` | 8 scénářů k odzkoušení, včetně havárie (únik plynu). |

## V kostce

- Persona: **Lucie**, čeština, ženský rod důsledně.
- Model: `claude-haiku-4-5`, `maxTokens: 1500`, `emotionRecognitionEnabled: false`
  — všechny poučení z LOMAX/OKNOTHERM (prázdné argumenty, latence) zabudované
  od první verze, ne dodatečně opravované.
- **Nové oproti LOMAX/OKNOTHERM**: skutečná bezpečnostní eskalace v KROKU 2
  — u úniku plynu, ohně/jiskření elektroinstalace nebo praskající nosné
  konstrukce bot okamžitě nasměruje zákazníka na tísňovou linku (150/112),
  ještě před jakýmkoli sběrem dat pro reklamaci. Tohle je citlivější věc
  než u garážových vrat nebo oken — projdi si to v promptu i v testech.
- Reklamace vyžaduje výrobní/hospodářské číslo stavby (`cislo_stavby`),
  ale nikdy se na něm netrvá — dá se dohledat podle adresy.
- 50letá záruka se zmiňuje jen na nosnou konstrukci a jen orientačně,
  nikdy jako závazek pro konkrétní případ.
- Make scénář (`rdrymarov reklamace voicebot`, id 7489325, aktivní) posílá
  strukturovaný e-mail na testovací adresu `paveklukas5@gmail.com` —
  přepnutí na `servis@rdrymarov.cz` je otázka jedné úpravy před ostrým
  provozem.

## Důležité upozornění k faktům o firmě

Přímý přístup na rdrymarov.cz byl v této session blokovaný (síťové
omezení sandboxu), takže všechna fakta v promptu (kontakty, produktové
řady, záruka, reklamační řád) pocházejí z vyhledávání a odvozených zdrojů,
ne z přímého načtení oficiálních stránek. **Než jde asistent do ostrého
provozu, projdi si sekci 3 v `01-system-prompt.md` osobně proti aktuálnímu
webu** — hlavně telefonní čísla, provozní dobu a přesné znění reklamačního
řádu.
