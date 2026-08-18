# Grafika a texty pro widget chatbota

## Soubory

| Soubor | Kam ve widgetu | Rozměr |
|---|---|---|
| `launcher.png` | **Launcher type & image** → Browse | 192 × 192 px, průhledné pozadí |
| `agent-avatar.png` | **Agent image** → Browse | 256 × 256 px, průhledné pozadí |
| `banner.png` | **Banner image & text** → Image | 1400 × 200 px |
| `build.js` | zdroj — přegenerování při změně barev | — |

Značka je dům, který je zároveň chatovací bublina — čitelná i ve 24 px, kde se
detailnější logo rozpadne.

## Paleta

| Role | HEX | Kde |
|---|---|---|
| **Primární — tmavá modrá** | `#16243B` | launcher, avatar, banner, hlavička widgetu |
| Světlejší modrá (přechod) | `#22364F` | gradient v banneru a avataru |
| **Akcent — jantarová** | `#C8952F` | linka pod bannerem, tlačítko odeslání, aktivní prvky |
| Plocha zprávy | `#F5F7FA` | bublina odpovědi asistenta |
| Text | `#0F172A` | běžný text |

Proč tahle kombinace: tmavá modrá je barva důvěry a stability — proto ji používají
banky a realitky. Jantarová k ní dělá teplý kontrast, takže widget nepůsobí chladně,
a hlavně **není modrý jako každý druhý chatbot** — výchozí `#2563EB` splyne s tisícem
jiných widgetů.

### Kdyby se vám tahle paleta nehodila

Obě alternativy drží stejnou logiku (tmavý základ + teplý akcent):

- **Grafit a terakota** — `#2A2E35` + `#C0563A`. Modernější, méně korporátní.
- **Lesní zelená a písek** — `#14503F` + `#D8B26A`. Klidná, prémiová, na realitkách vzácná.

### Přebarvení

V `build.js` nahoře jsou tři konstanty. Přepište je a spusťte:

```bash
npm i playwright-core
node build.js
```

## Texty do widgetu (česky)

**Header**
> Realitní tým Zdeňka Štourače

Do hlavičky patří jméno kanceláře, ne popis bota. Lidé věří jménu, ne „AI asistentovi".

**Description**
> Poradím s prodejem, pronájmem i koupí nemovitosti. Ptejte se na cokoli.

Další varianty, pokud chcete jiný důraz:
- „Zeptejte se na cokoli k nemovitostem — odpovím hned." *(důraz na rychlost)*
- „Odpovím na dotazy k prodeji i koupi. Nezávazně a bez čekání." *(důraz na nezávaznost)*
- „S čím vám dnes můžeme pomoct?" *(nejneutrálnější)*

**Launcher s textem** (druhá a třetí varianta tlačítka)
> Máte dotaz?

Alternativy: „Poradíme vám", „Zeptejte se", „Potřebujete poradit?"

„Máte dotaz?" funguje na realitním webu nejlíp — člověk, který si prohlíží inzerát,
většinou jednu konkrétní otázku má, a tohle ho osloví přesně v ten moment.
„Talk to AI" nechte pryč: „AI" v tomhle oboru spíš brzdí, lidé chtějí mluvit s někým,
kdo ví, co dělá.

## Poznámka k avataru

Nejlepší **Agent image** není ikona, ale **fotka Zdeňka nebo někoho z týmu**.
Widgety s lidskou tváří mají znatelně vyšší míru zapojení než ty s ikonou — a u realit
to platí dvojnásob, protože celý obchod stojí na tom, komu člověk věří. Dodaná ikona
je plnohodnotná náhrada, dokud fotku nemáte; až ji budete mít, vyměňte ji.

Fotka by měla být čtvercová, ořezaná na obličej a ramena, na světlém pozadí.
