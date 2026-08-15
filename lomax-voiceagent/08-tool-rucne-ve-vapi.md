# Založení nástroje ručně ve VAPI dashboardu

Postupuj shora dolů. Texty v šedých blocích jsou připravené ke zkopírování 1:1.

> **Zkratka:** VAPI má u parametrů přepínač **Model / JSON**. Přepni na **JSON**, označ v editoru všechno (Ctrl+A) a vlož celý obsah `09-parametry.json`. Tím KROK 3 odpadá.
>
> Musíš vložit **celý objekt** včetně `{ "type": "object", "properties": { … }, "required": [ … ] }`. Když vložíš jen kus polí za už existující JSON, editor hlásí *Unexpected non-whitespace character after JSON*.

**Kde to je:** VAPI dashboard → levé menu **Tools** → tlačítko **Create Tool** → typ **Function**.

---

## KROK 1 — Základní pole

### Tool Name / Function Name
```
odeslat_servisni_poptavku
```

### Description
Tohle je nejdůležitější text celého nástroje — model z něj pozná, **kdy** má nástroj zavolat. Nezkracuj ho.
```
Odešle kompletní servisní / reklamační poptávku zákazníka do systému LOMAX, který ji e-mailem předá servisnímu oddělení a nejbližšímu autorizovanému zastoupení. Volej AŽ POTÉ, co jsi zákazníkovi zrekapitulovala údaje a on je potvrdil. Volej maximálně jednou za hovor (kromě jednoho opakování při chybě). Pole, která nemáš, posílej jako prázdný řetězec - nikdy je nevymýšlej.
```

### Server URL
Vlož svoji Make webhook URL, například:
```
https://hook.eu2.make.com/TVUJ_WEBHOOK_KLIC
```

### Ostatní přepínače
| Pole | Hodnota |
|---|---|
| **Async** | **vypnuto** (bot musí počkat na potvrzení z Make) |
| **Timeout** | `25` sekund |

---

## KROK 2 — Messages (hlášky během volání)

Sekce **Messages** → **Add Message**. Přidej všechny čtyři. Bez nich bot během čekání na Make mlčí a zákazník si myslí, že hovor spadl.

| Type | Content |
|---|---|
| `Request Start` | `Zakládám vám servisní poptávku, moment prosím.` |
| `Request Complete` | `Hotovo, poptávku mám odeslanou.` |
| `Request Failed` | `Omlouvám se, systém mi teď poptávku nepřijal. Zkusím to ještě jednou.` |
| `Request Response Delayed` (timing `8000` ms) | `Ještě to zpracovávám, děkuji za trpělivost.` |

---

## KROK 3 — Parametry (22× Add Property)

Pro každý blok níže klikni **Add Property** a vyplň tři pole + zaškrtávátko.

> **Pozor u polí 6, 7 a 15:** povolené hodnoty jsou napsané rovnou v popisu, protože formulář obvykle nenabízí `enum`. Nemaž je — Make z nich dělá čitelné texty v e-mailu.

---

**1.** Name: `jmeno_prijmeni` · Type: **string** · Required: **ANO**
```
Celé jméno a příjmení volajícího, tak jak ho nadiktoval. Například Jan Novák.
```

**2.** Name: `telefon_jine` · Type: **string** · Required: ne
```
Alternativní telefonní číslo pro zpětné volání, jen číslice bez mezer. Vyplň POUZE tehdy, když zákazník řekne, že se mu má technik ozvat na JINÉ číslo, než ze kterého právě volá. Jinak prázdný řetězec - číslo volajícího se doplní automaticky z hovoru. Když ho zákazník nadiktuje, přečti mu ho zpět.
```

**3.** Name: `adresa_ulice_cp` · Type: **string** · Required: **ANO**
```
Ulice a číslo popisné adresy REALIZACE, tedy kde je produkt namontovaný. Není to fakturační adresa.
```

**4.** Name: `adresa_mesto` · Type: **string** · Required: **ANO**
```
Město nebo obec realizace.
```

**5.** Name: `adresa_psc` · Type: **string** · Required: **ANO**
```
PSČ realizace, 5 číslic bez mezery. KLÍČOVÉ pole - podle něj se poptávka směruje na nejbližší autorizované zastoupení.
```

**6.** Name: `typ_pozadavku` · Type: **string** · Required: **ANO**
```
Použij PŘESNĚ jednu z hodnot: reklamace, servis, servisni_prohlidka, jine. Význam: reklamace = zákazník to sám nazývá reklamací nebo jde o vadu krátce po montáži; servis = běžná porucha; servisni_prohlidka = chce pravidelnou roční prohlídku; jine = například urgence již podané reklamace.
```

**7.** Name: `typ_produktu` · Type: **string** · Required: **ANO**
```
Kategorie produktu, kterého se závada týká. Použij PŘESNĚ jednu z hodnot: garazova_vrata_sekcni, garazova_vrata_posuvna, garazova_vrata_rolovaci, garazova_vrata_dvoukridla, predokenni_roleta, venkovni_zaluzie, vchodove_dvere, okno, sit_proti_hmyzu, rolovaci_mriz, pohon_nebo_ovladac, jine.
```

**8.** Name: `model_rada` · Type: **string** · Required: ne
```
Modelová řada, pokud ji zákazník zná. Například Home, Delta, Excellent, Praktik, LT 50, Z-90, C-80, FABO. Jinak prázdný řetězec.
```

**9.** Name: `pohon_znacka` · Type: **string** · Required: ne
```
Značka pohonu, pokud je známa: Marantec, Somfy, Selve, Elero, jiná, nebo hodnota bez pohonu. Jinak prázdný řetězec.
```

**10.** Name: `popis_zavady` · Type: **string** · Required: **ANO**
```
Konkrétní popis závady vlastními slovy zákazníka. Nikdy obecné nefunguje to, ale například: vrata se zastaví asi 20 cm nad zemí a vyjedou zpět nahoru, bliká jedna fotobuňka.
```

**11.** Name: `technicke_detaily` · Type: **string** · Required: ne
```
Odpovědi na diagnostické otázky: stav fotobuněk, vyměněná baterie v ovladači, reakce nástěnného tlačítka, zvuk motoru, zkoušené nouzové odjištění a podobně. Jinak prázdný řetězec.
```

**12.** Name: `kdy_zacalo` · Type: **string** · Required: ne
```
Kdy se závada poprvé objevila, slovy zákazníka. Například asi před třemi dny, nebo po té bouřce minulý týden.
```

**13.** Name: `opakovana_zavada` · Type: **boolean** · Required: ne
```
true, pokud zákazník uvedl, že se stejný problém už dříve řešil.
```

**14.** Name: `bezpecnostni_riziko` · Type: **boolean** · Required: **ANO**
```
true při prasklé pružině, utrženém lanku, uvolněné či visící lamele, křivém nebo vypadlém křídle, samovolném sjíždění vrat, jiskření nebo zápachu spáleniny.
```

**15.** Name: `priorita` · Type: **string** · Required: **ANO**
```
Použij PŘESNĚ jednu z hodnot: vysoka, stredni, nizka. Význam: vysoka = bezpečnostní riziko nebo objekt nelze zabezpečit, například vrata nejdou zavřít; stredni = produkt nefunkční, ale zabezpečený; nizka = kosmetická vada, hluk, drobnost.
```

**16.** Name: `rok_montaze` · Type: **string** · Required: ne
```
Přibližný rok montáže, například 2019. Prázdný řetězec, pokud zákazník neví.
```

**17.** Name: `cislo_zakazky` · Type: **string** · Required: ne
```
Číslo zakázky, objednávky nebo faktury, pokud ho zákazník má po ruce. Jinak prázdný řetězec. Nikdy na něm netrvej.
```

**18.** Name: `kdo_montoval` · Type: **string** · Required: ne
```
Kdo produkt montoval: zastoupení LOMAX, jiná firma, svépomocí. Jinak prázdný řetězec.
```

**19.** Name: `dostupnost` · Type: **string** · Required: ne
```
Kdy je zákazník k zastižení nebo kdy se mu hodí návštěva technika. Například všední dny odpoledne po 15:00.
```

**20.** Name: `ma_fotografie` · Type: **boolean** · Required: ne
```
true, pokud zákazník uvedl, že fotografii závady má nebo ji pořídí a pošle.
```

**21.** Name: `shrnuti_pro_technika` · Type: **string** · Required: **ANO**
```
Jedna až dvě věty pro technika: co se stalo a co si nejspíš bude potřebovat vzít s sebou.
```

**22.** Name: `poznamka` · Type: **string** · Required: ne
```
Cokoli dalšího podstatného: volající není majitel, název firmy nebo SVJ, urgence, zákazník si není jistý výrobcem, zajímá ho cena dopředu a podobně.
```

---

## KROK 4 — Ulož a zkontroluj

Klikni **Create Tool** / **Save**. Pak si v seznamu Tools nástroj otevři a zkontroluj:

- [ ] Je tam všech **22 parametrů**
- [ ] **10 z nich** je označeno jako Required (čísla 1, 3, 4, 5, 6, 7, 10, 14, 15, 21)
- [ ] `opakovana_zavada`, `bezpecnostni_riziko` a `ma_fotografie` jsou typu **boolean**, ne string (čísla 13, 14, 20)
- [ ] Server URL je tvůj Make webhook
- [ ] Async je vypnuté
- [ ] Jsou tam všechny 4 hlášky

---

## KROK 5 — Druhý nástroj: ukončení hovoru

**Tools → Create Tool → typ End Call.**

| Pole | Hodnota |
|---|---|
| **Name** | `ukoncit_hovor` |
| **Description** | `Ukončí hovor. Volej až po rozloučení se zákazníkem, nikdy uprostřed jeho věty. Použij také, když se nedaří navázat komunikaci (opakované ticho) nebo když volající není zákazník LOMAX.` |
| **Message → Request Start** | `Děkuji za zavolání a přeji hezký den. Na shledanou.` |

Alternativně stačí u asistenta zapnout přepínač **Enable End Call Function** a tento nástroj nevytvářet.

---

## KROK 6 — Připojení k asistentovi

**Assistants → tvůj LOMAX asistent → záložka Tools** → v rozbalovacím seznamu vyber `odeslat_servisni_poptavku` (a případně `ukoncit_hovor`) → **Publish** / **Save**.

Bez publikování se změny na živé číslo nepropíšou.

---

## KROK 7 — Ověření, že to volá

V dashboardu klikni **Talk to Assistant** a odehraj krátký hovor: jméno, adresa s PSČ, popis závady.

- Bot má na konci říct *„Zakládám vám servisní poptávku, moment prosím."* → to znamená, že nástroj **skutečně zavolal**
- V Make se má scénář spustit a v historii mít zelený běh
- V logu hovoru ve VAPI (**Calls → detail hovoru**) najdeš sekci s tool callem a přesným JSON, který odešel — tam nejrychleji uvidíš, jestli něco chybí

**Když bot nástroj nezavolá vůbec:** nejčastěji je zkrácený Description nástroje, nebo není nástroj připojený k asistentovi. Zkontroluj v tomhle pořadí.
