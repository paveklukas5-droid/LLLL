# Chatbot — Realitní tým Zdeňka Štourače

Prompt sada pro AI chatbota zákaznické podpory na [zdenekstourac.cz](https://www.zdenekstourac.cz/),
postavená ve stejné struktuře jako prompt pro Climax.cz.

## Soubory

| Soubor | Kam patří |
|---|---|
| [`GLOBAL_PROMPT.md`](GLOBAL_PROMPT.md) | pole **Global prompt** / System prompt |
| [`INSTRUCTIONS.md`](INSTRUCTIONS.md) | pole **Instructions** |

Obsah vlož **bez** nadpisu souboru — text začíná od `# Role`, resp. `# Instructions`.

## Tool

Stejný jeden tool jako u Climaxu:

**`poslat_email`** — tool si sám vyžádá od klienta:
- Jméno
- Telefonní číslo
- E-mailová adresa
- Popis dotazu nebo poptávky

Prompt navíc instruuje bota, aby do **popisu poptávky** shrnul kontext, který už v konverzaci zazněl
(typ poptávky, nemovitost, lokalita, dispozice, časový horizont) — tým tak dostane kvalifikovanou
poptávku, ne holý kontakt, a nemusí se doptávat na to, co klient už jednou řekl.

Cílový e-mail: `reality@zdenekstourac.cz`

---

## Jak je vyřešená hlavní obava: „nesmí to přehnaně nabízet poslání e-mailu"

Tohle je nejčastější důvod, proč realitní chatboti odrazují klienty. V promptu je to ošetřené
na pěti úrovních, které se navzájem jistí:

**1. Pořadí priorit.** V sekci *Primární cíle* je odeslání poptávky až **čtvrté** — za odpovědí,
poradenstvím a informacemi. Model se řídí pořadím, takže tohle není kosmetika.

**2. Pravidlo tří zámků.** Než smí bot nabídnout kontakt, musí projít třemi testy:
- **HOTOVO** — odpověděl jsem úplně a sám?
- **SIGNÁL** — má klient konkrétní osobní záměr, nebo je to dotaz, který opravdu neznám?
- **ČISTÝ ŠTÍT** — nenabízel jsem už? Neodmítl klient dřív?

Stačí jeden zavřený zámek → nenabízí, jen odpoví. Výchozí stav je **odpovědět**, ne nabídnout.

**3. Tvrdý rozpočet.** Maximálně **2 nabídky na celou konverzaci**, druhá jen při novém a silnějším
signálu. Po jakémkoli odmítnutí **0** — nadobro. Ignorovaná nabídka se počítá jako tiché „ne".

**4. Kalibrační příklady.** V *Instructions* je 7 párů ❌ špatně / ✅ správně s konkrétními dialogy.
Příklady zabírají u LLM podstatně víc než abstraktní pravidlo — právě tady se ladí „cit".

**5. Pojistka proti opačné chybě.** Zdrženlivost by se snadno zvrhla v pasivitu, takže je stejně
explicitně napsané, že u silného signálu („chci prodat", „chci prohlídku", „kolik má můj byt cenu")
se **nesmí váhat ani vteřinu**. Prompt pojmenovává obě selhání, ne jen jedno — jinak model překmitne
do druhého extrému.

## Guardraily specifické pro reality

Reality mají jiné rizikové body než stínicí technika — tady se chybná odpověď počítá ve stovkách tisíc:

- **Bot nikdy sám neodhaduje cenu nemovitosti.** Ani orientačně. Vysvětlí, co cenu ovlivňuje,
  a odhad nechá na týmu. *(Zároveň je to nejlepší konverzní bod — klient sám žádá přesně tuhle službu.)*
- **Žádné závazné právní, daňové ani hypoteční poradenství.** Princip vysvětlí, konkrétní posouzení
  patří advokátovi / daňovému poradci / hypotečnímu specialistovi. Neuvádí daňové lhůty ani sazby
  mimo knowledge base — legislativa se mění a zastaralé číslo je závazek.
- **Žádné sliby výsledku** — prodejní ceny, termínu prodeje, schválení hypotéky.
- **Žádná diskriminační kritéria** u pronájmů, ani když je navrhne sám klient.
- **Citlivé situace** (dědictví, rozvod, exekuce, úmrtí) mají vlastní režim — žádný cross-sell,
  věcný klidný tón, lidský kontakt je tam na místě.
- **Ostrá hranice zdrojů:** obecné realitní znalosti smí vysvětlovat volně (to je jádro jeho
  užitečnosti a důvod, proč zvládne ~95 % dotazů sám), konkrétní čísla a fakta o firmě jen
  z knowledge base.

---

## ⚠️ Fakta k ověření před nasazením

Web `zdenekstourac.cz` je blokovaný egress politikou tohoto prostředí, takže jsem ho nemohl načíst
přímo. Firemní údaje v promptu pocházejí z veřejných zdrojů (Firmy.cz, Sreality.cz, LinkedIn,
výpisy stránek webu ve vyhledávání). **Než prompt nasadíte, projděte prosím tento seznam** — jsou
to jediná místa, kde by mohla být nepřesnost:

- [ ] **Telefonní čísla** — v promptu `+420 608 964 884` a `+420 602 545 030`
- [ ] **E-mail** — `reality@zdenekstourac.cz`
- [ ] **Adresa** — Bayerova 797/28, 602 00 Brno-Veveří
- [ ] **Provozní doba** — v promptu uvedeno „dle telefonické domluvy". Pokud máte pevnou dobu,
      přepište to (bot se na to bude odkazovat).
- [ ] **Vztah k RE/MAX** — podle stránky „Více o nás" tým od roku 2025 pokračuje samostatně,
      část webu ale ještě nese označení RE/MAX. Prompt je psaný tak, že **RE/MAX aktivně nezmiňuje**
      a mluví o „Realitním týmu Zdeňka Štourače". Pokud je to jinak, upravte sekci *Klíčové informace o týmu*.
- [ ] **Aukce nemovitostí** — web popisuje průběh na klientském portálu RE/MAX. Prompt záměrně
      popisuje jen **princip** aukce, ne konkrétní platformu. Doplňte podle aktuálního stavu.
- [ ] **Odhad ceny zdarma** — v promptu je popsaný jako nezávazný a zdarma. Potvrďte formulaci.
- [ ] **Seznam služeb** — zkontrolujte, jestli sedí sekce *Co Realitní tým Zdeňka Štourače dělá*
      s aktuální nabídkou (sekce `/prace/` na webu).
- [ ] **Složení týmu** — Zdeněk Štourač, Naďa Černá, Lenka Stratilová + spolupracovníci
      (Ing. Jiří Němec – hypotéky, Mgr. Milada Blumaierová – advokátní kancelář).

---

## Co dát do knowledge base

Prompt počítá s tím, že ~95 % dotazů pokryje knowledge base. Čím je bohatší, tím míň bude bot
předávat dotazy týmu — což je přesně cíl. Doporučené zdroje:

1. **Aktuální nabídka nemovitostí** — knowledge base se obnovuje automaticky každý den, což je
   pro nabídku nemovitostí to hlavní. Ať v datech u každé nemovitosti je: dispozice, výměra,
   lokalita, cena, stav, energetický štítek, **stav dostupnosti** (*volné / rezervováno / prodáno*)
   a **odkaz na detail** na webu. Jedna nemovitost = jeden ucelený záznam, ne rozsekaná do víc
   kusů — jinak bot smíchá parametry dvou bytů dohromady.
2. **Všechny stránky sekce `/prace/`** — služby, aukce, právní servis, home staging, hypotéky
3. **Stránka „Více o nás"** a profily členů týmu
4. **Reference a recenze klientů**
5. **Provize a podmínky spolupráce** — pokud je chcete zveřejňovat; jinak bot na dotaz na provizi
   správně přizná neznalost a předá dotaz (což je legitimní situace B)
6. **Blog / články** — nejlepší zdroj odpovědí na obecné dotazy
7. **Vlastní FAQ** — typicky: jak probíhá prodej krok za krokem, co si připravit k prodeji,
   jak dlouho prodej trvá, kdo platí provizi, jak funguje rezervační smlouva a úschova,
   prodej nemovitosti se zástavou/exekucí, dědictví a spoluvlastnické podíly, PENB,
   prodej s hypotékou, zastupování kupujícího

---

## Proč jen jeden tool

Zvažoval jsem přidání toolu na vyhledávání nemovitostí. **Není potřeba**, protože se knowledge base
denně sama obnovuje — tím odpadá hlavní důvod, kvůli kterému by se vyplatil (zastaralé inzeráty).

Zbývá jediná slabina: knowledge base hledá podle podobnosti textu, ne podle číselných rozsahů,
takže dotaz typu „byt do 6 milionů" může vytáhnout i dražší nemovitosti. U portfolia v řádu desítek
nemovitostí to není problém — bot si čísla ověří sám (viz pravidlo 6 v sekci *Když se klient ptá
na konkrétní nemovitost z nabídky*). Znovu to zvažte, až bude aktivních inzerátů přes ~100.

Každý tool navíc je další místo, kde se model může splést ve výběru. S jedním toolem je routing
prakticky neomylný a pravidlo tří zámků drží. To je funkce, ne nedostatek.

Pokud byste chtěli poptávky automaticky směrovat do CRM, přidejte do stávajícího toolu parametr
`typ_poptavky` — ne druhý tool.

## Doporučené testovací scénáře

Po nasazení projděte těchto 10 konverzací — pokrývají všechny hraniční případy promptu:

1. „Co je home staging?" → **musí odpovědět a skončit**, žádná nabídka kontaktu
2. „Chci prodat byt v Bystrci, kolik dostanu?" → vysvětlí + **hned** nabídne odhad
3. „Jak dlouho trvá prodej domu?" → odpoví, nenabízí
4. Nabídka → klient odpoví další otázkou → **nesmí nabídnout znovu**
5. Nabídka → „zatím ne" → **do konce konverzace už nikdy**
6. „ano" napsané textem místo tlačítka → **okamžitě spustí tool**, neptá se znovu
7. „Kolik je u vás provize?" → pokud není v KB, přizná a nabídne předání
8. „Musím platit daň, když prodám byt po 3 letech?" → vysvětlí princip, **neuvede konkrétní lhůtu**
   mimo KB, odkáže na daňového poradce
9. „Zdědil jsem dům, chceme prodat" → soustrast, věcná pomoc, **žádný cross-sell**
10. „Máte volný 3+1 v Králově Poli?" → konkrétní odpověď z KB; zájem o prohlídku → tool
