# Hobbytec — co přesně udělat (v tomto pořadí)

## 0. Jak funguje jejich reklamace (proč je bot postavený takhle)

Jejich **oficiální reklamační formulář** (Google Forms) má tyto otázky. Bot je vyplňuje za zákazníka ve stejném pořadí:

| Otázka formuláře | Povinná | Pole nástroje |
|---|---|---|
| E-mail | ano | `email_zakaznika` |
| Objednatel zakázky | ano | `objednatel_zakazky` |
| Adresa | ne | `adresa_ulice_cp`, `adresa_mesto`, `adresa_psc` |
| Telefon | ne | z čísla volajícího, případně `telefon_jine` |
| Číslo smlouvy / ID zakázky | ne | `cislo_smlouvy_zakazky` |
| Datum prodeje | ne | `datum_prodeje` |
| Označení reklamovaného zboží | ano | `zbozi`: pergola / zimní zahrada / přístřešek / garáž / ostatní |
| Druh závady | ano | `druh_zavady`: poškozené / nekompletní / nefunkční / ostatní |
| Popis závady | ano | `popis_zavady` |
| Foto / video (až 5 souborů, 10 MB) | ano | **po telefonu nejde**, zákazník je nahraje ve formuláři |

Ve formuláři je „druh závady" zaškrtávátko s možností víc voleb. Bot vybere jednu převládající a zbytek napíše do popisu.

Z veřejných zdrojů k tomu: záruční a pozáruční servis se hlásí písemně do **48 hodin** od zjištění vady, poškozená zásilka přepravci do **2 pracovních dnů**, vyřízení do **30 dnů**, záruka 24 měsíců (u pergol a zimních zahrad podle modelu). Web hobbytec.cz byl v mém prostředí blokovaný, tak to ověř.

**Tok hovoru:** bot vyplní údaje, kolegům odejde e-mail v pořadí formuláře, **zákazníkovi přijde e-mail s odkazem na formulář**, kde jen nahraje fotky. Proto bot říká „zapisuji váš požadavek", ne „zakládám reklamaci" (to by zákazníka mohlo mylně uklidnit, že je hotovo). Chceš-li slovo „reklamace", změň texty v `02-vapi-tools.json` (messages).

## 1. Založ nástroj (nový)

**Cesta A – API (doporučuju):** doplň VAPI_KEY do `07-vytvorit-tool.sh` a spusť. Zapíše se přesně to, co je v JSON.

**Cesta B – dashboard:** Tools → Create Tool → Function.
- Name: `odeslat_reklamaci_hobbytec`
- Description: z `02-vapi-tools.json` (`function.description`)
- Strict Mode: zapnuto (stejně jako u LOMAXu, kde to funguje)
- Parameters → JSON → smaž vše → vlož celý `05-parametry.json` (19 polí, 11 povinných)
- Server URL: `https://hook.eu1.make.com/ssnb30pw999uogzkqjfac8mvq6nec1u3`
- Messages ručně: Request Start (neblokující) „Zapisuji váš požadavek, moment prosím." / Complete „Hotovo, požadavek mám předaný." / Failed „Omlouvám se, systém mi to teď nepřijal. Zkusím to ještě jednou." / Delayed 8000 ms „Ještě to zpracovávám, děkuji za trpělivost."
- Response Body a Aliases nech prázdné.

**Po uložení obnov stránku a otevři Parameters znovu: musí tam být 19 polí.** (Dashboard po uložení pole přeuspořádá, to nevadí, jde o počet a názvy.)

## 2. Asistent (duplikát z LOMAXu)

1. Duplikuj LOMAX asistenta, přejmenuj na `Hobbytec – Reklamace (CZ)`.
2. **First Message:** `Dobrý den, tady Markéta z reklamačního oddělení Hobytek. Jak vám můžu pomoci?`
3. **System Prompt:** smaž vše a vlož celý `01-system-prompt.md`.
4. **Tools:** **odeber LOMAX nástroj `odeslat_servisni_poptavku`** (jinak by reklamace Hobbytec mohly odcházet na LOMAX!) a připoj `odeslat_reklamaci_hobbytec` + `ukoncit_hovor`.
5. **Model → Max Tokens = 1500.** (Ověř očima, nepředpokládej. Default 100 ořízne JSON a přijdou prázdná data.)
6. Hlas, přepis a model nech z LOMAXu. **Server URL asistenta prázdné.** Emotion Recognition vypnuto.
7. Ulož.

## 3. Před prvním hovorem (30 vteřin, ale zachrání to hodiny)

☐ Max Tokens 1500  ☐ nástroj `odeslat_reklamaci_hobbytec` připojený, LOMAX nástroj odebraný  ☐ nástroj po obnovení stránky má 19 polí  ☐ název nástroje v promptu i ve VAPI stejný, včetně `_hobbytec`

## 4. Ověření, že data fakt chodí

**A) Kontrola Make** (poslal jsem testovací požadavky do `paveklukas5@gmail.com`). Starší e-maily „Hliníková pergola / POLLUX" z prvního návrhu smaž, jsou z předchozí verze scénáře. Nové mají být **3**:
- **E-mail kolegům** `[PŘEDNOSTNÍ] Hobbytec HT-… - Pergola - Říčany`: tabulka v pořadí formuláře (E-mail paveklukas5@gmail.com, Objednatel Jan Testovací, Adresa Zahradní 12, Říčany, 25101, Označení zboží Pergola, Druh závady Poškozené…), modrý pruh o fotkách a dole „Co zákazník v hovoru řekl".
- **E-mail zákazníkovi** (přišel na tvůj Gmail, protože jsem v testu použil tvou adresu) `Hobbytec - váš požadavek na reklamaci, poslední krok` s tlačítkem „Otevřít reklamační formulář".
- **`[PRÁZDNÁ DATA] Hobbytec - hovor od +420777333444`** s větami „Zatéká mi do zimní zahrady." a „Bydlím v Kaplici."
- V žádném z nich **nesmí být** text „TAJNY PROMPT" (systémový prompt se do e-mailu nedostane).

Když něco z toho nesedí, napiš mi, co přišlo.

**B) První skutečný hovor:** zavolej Talk to Assistant nebo telefonem, projdi celý hovor. Pak:
- Přišel **jeden** e-mail kolegům s vyplněnými údaji? Výborně.
- Přišel `[PRÁZDNÁ DATA]` a hned po něm normální? Bot si poradil sám druhým pokusem. Zkontroluj Max Tokens.
- Přišel jen `[PRÁZDNÁ DATA]`? Pak je pořád problém na straně VAPI: Max Tokens, nebo zkus **vypnout Strict Mode** u nástroje. I tak máš v e-mailu telefon a věty zákazníka.

## 5. Testovací hovory (aspoň těchto 7)

1. **Vada pergoly:** „Lamela pergoly se nezavírá." → bezpečnostní otázka, doptání, údaje **včetně e-mailu (přečte ho zpět)**, rekapitulace, zapsání, řekne, že odkaz na formulář přišel e-mailem.
2. **Poškozená zásilka:** „Zahradní domek přišel s rozbitým dílem." → druh „poškozené", ptá se na zápis u řidiče, priorita vysoká, řekne o dvou pracovních dnech.
3. **Bezpečnost:** „Uvolnila se konstrukce a hrozí pád skla." → pokyn nechodit tam, `bezpecnostni_riziko` true.
4. **Nesmysly:** datum prodeje v budoucnosti, vymyšlená obec, směrovací číslo, které k obci nesedí → doptá se, neodkývá.
5. **Bez čísla smlouvy:** dvakrát špatně nadiktované číslo → po druhém pokusu jde dál.
6. **Vrácení zboží:** „Chci vrátit zboží do čtrnácti dnů." → **nástroj nevolá**, řekne, ať napíše na info e-mail s formulářem pro vrácení.
7. **E-mail:** nadiktuj e-mail se slovy „zavináč" a „tečka cé zet", jednou ho oprav při zpětném přečtení. Pak ho dvakrát nadiktuj úplně špatně → bot ho nechá prázdný a odkáže na web.

Poslouchej: výslovnost „Hobytek", ženský rod celý hovor, čísla slovy, žádné „aha".

## 6. Před ostrým provozem

- Přepiš příjemce e-mailů kolegům v Make (moduly 8, 9) z tvého Gmailu na reklamační oddělení Hobbytec a rozhodni s klientem, jestli má e-mail zákazníkovi (modul 11) zůstat a z jaké adresy jde.
- **Ověř fakta v promptu proti živému webu** (kontakty, lhůty, záruka). Web byl pro mě blokovaný.
- Přiděl telefonní číslo, promysli GDPR větu o nahrávání a o e-mailu zákazníka.
