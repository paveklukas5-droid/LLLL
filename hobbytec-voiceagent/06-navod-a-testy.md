# Hobbytec — co přesně udělat (v tomto pořadí)

## 0. Jak funguje jejich reklamace (proč je bot postavený takhle)

Z veřejných zdrojů (web hobbytec.cz byl v mém prostředí blokovaný, čerpal jsem z výsledků vyhledávání citujících jejich stránku Reklamace / Vrácení zboží a obchodní podmínky):

- Reklamace **jde výhradně e-mailem** na `reklamace@hobbytec.cz` s přílohami: **faktura, vyplněný reklamační list (ke stažení na webu), fotodokumentace**.
- Záruční i pozáruční servis se hlásí písemně **nejpozději do 48 hodin od zjištění vady**.
- **Poškozená zásilka** (přepravce Toptrans): nepřebírat nebo sepsat protokol s řidičem, oznámit do **2 pracovních dnů**.
- Vyřízení do **30 dnů**. Záruka 24 měsíců, u pergol a zimních zahrad **různá podle modelu** (podle stránek modelů od 2 do 10 let). Při oprávněné reklamaci hradí dopravu Hobbytec.
- Vrácení zboží (odstoupení) jde přes `info@hobbytec.cz` s formulářem pro vrácení.

**Důsledek:** hlasový bot reklamaci sám „nepodá". Sebere údaje, předá je kolegům a **navede zákazníka, co má e-mailem poslat**. Proto se v hovoru říká „zapisuji váš požadavek", ne „zakládám reklamaci" (to by zákazníka mohlo mylně uklidnit, že je hotovo). Kdybys chtěl slovo „reklamace", změň texty v `02-vapi-tools.json` (messages).

## 1. Založ nástroj (nový)

**Cesta A – API (doporučuju):** doplň VAPI_KEY do `07-vytvorit-tool.sh` a spusť. Zapíše se přesně to, co je v JSON.

**Cesta B – dashboard:** Tools → Create Tool → Function.
- Name: `odeslat_reklamaci_hobbytec`
- Description: z `02-vapi-tools.json` (`function.description`)
- Strict Mode: zapnuto (stejně jako u LOMAXu, kde to funguje)
- Parameters → JSON → smaž vše → vlož celý `05-parametry.json`
- Server URL: `https://hook.eu1.make.com/ssnb30pw999uogzkqjfac8mvq6nec1u3`
- Messages ručně: Request Start (neblokující) „Zapisuji váš požadavek, moment prosím." / Complete „Hotovo, požadavek mám předaný." / Failed „Omlouvám se, systém mi to teď nepřijal. Zkusím to ještě jednou." / Delayed 8000 ms „Ještě to zpracovávám, děkuji za trpělivost."
- Response Body a Aliases nech prázdné.

**Po uložení obnov stránku a otevři Parameters znovu: musí tam být 20 polí.** (Dashboard po uložení pole přeuspořádá, to nevadí, jde o počet a názvy.)

## 2. Asistent (duplikát z LOMAXu)

1. Duplikuj LOMAX asistenta, přejmenuj na `Hobbytec – Reklamace (CZ)`.
2. **First Message:** `Dobrý den, tady Markéta z reklamačního oddělení Hobytek. Jak vám můžu pomoci?`
3. **System Prompt:** smaž vše a vlož celý `01-system-prompt.md`.
4. **Tools:** **odeber LOMAX nástroj `odeslat_servisni_poptavku`** (jinak by reklamace Hobbytec mohly odcházet na LOMAX!) a připoj `odeslat_reklamaci_hobbytec` + `ukoncit_hovor`.
5. **Model → Max Tokens = 1500.** (Ověř očima, nepředpokládej. Default 100 ořízne JSON a přijdou prázdná data.)
6. Hlas, přepis a model nech z LOMAXu. **Server URL asistenta prázdné.** Emotion Recognition vypnuto.
7. Ulož.

## 3. Před prvním hovorem (30 vteřin, ale zachrání to hodiny)

☐ Max Tokens 1500  ☐ nástroj `odeslat_reklamaci_hobbytec` připojený, LOMAX nástroj odebraný  ☐ nástroj po obnovení stránky má 20 polí  ☐ název nástroje v promptu i ve VAPI stejný, včetně `_hobbytec`

## 4. Ověření, že data fakt chodí

**A) Kontrola Make (už jsem poslal 2 testovací požadavky, mrkni do `paveklukas5@gmail.com`):**
- **2 e-maily**, žádný víc, žádný míň.
- E-mail 1: předmět `[PŘEDNOSTNÍ] Hobbytec HT-… - Hliníková pergola - Říčany`, červený pruh „POŠKOZENÁ ZÁSILKA", vyplněná tabulka (Jan Testovací, Zahradní 12, POLLUX…) a dole „Co zákazník v hovoru řekl" se dvěma větami.
- E-mail 2: předmět `[PRÁZDNÁ DATA] Hobbytec - hovor od +420777333444` a v něm věty „Zatéká mi do zimní zahrady." a „Bydlím v Kaplici."
- V žádném z nich **nesmí být** text „TAJNY PROMPT" (ověřuje, že se do e-mailu nedostane systémový prompt).
Když něco z toho nesedí, napiš mi, co přišlo.

**B) První skutečný hovor:** zavolej Talk to Assistant nebo telefonem, projdi celý hovor. Pak:
- Přišel **jeden** e-mail s vyplněnými údaji? Výborně.
- Přišel `[PRÁZDNÁ DATA]` a hned po něm normální? Bot si poradil sám druhým pokusem. Zkontroluj Max Tokens.
- Přišel jen `[PRÁZDNÁ DATA]`? Pak je pořád problém na straně VAPI: Max Tokens, nebo zkus **vypnout Strict Mode** u nástroje. I tak máš v e-mailu telefon a věty zákazníka.

## 5. Testovací hovory (aspoň těchto 6)

1. **Vada pergoly:** „Lamela pergoly se nezavírá." → bezpečnostní otázka, doptání, údaje, rekapitulace, zapsání, pokyn poslat e-mailem fakturu/fotky/list.
2. **Poškozená zásilka:** „Zahradní domek přišel s rozbitým dílem." → ptá se na zápis u řidiče a datum převzetí, priorita vysoká, řekne o dvou pracovních dnech.
3. **Bezpečnost:** „Uvolnila se konstrukce a hrozí pád skla." → pokyn nechodit tam, `bezpecnostni_riziko` true.
4. **Nesmysly:** datum dodání v budoucnosti, vymyšlená obec, PSČ, které k obci nesedí → doptá se, neodkývá.
5. **Bez čísla objednávky** dvakrát špatně nadiktovaného → po druhém pokusu jde dál.
6. **Vrácení zboží:** „Chci vrátit zboží do čtrnácti dnů." → řekne, ať napíše na info e-mail s formulářem, a zapíše záznam.

Poslouchej: výslovnost „Hobytek", ženský rod celý hovor, čísla slovy, žádné „aha".

## 6. Před ostrým provozem

- Přepiš příjemce e-mailů v Make (moduly 8, 9) z tvého Gmailu na reklamační oddělení Hobbytec.
- **Ověř fakta v promptu proti živému webu** (kontakty, lhůty, záruka). Web byl pro mě blokovaný.
- Přiděl telefonní číslo, promysli GDPR větu o nahrávání.
