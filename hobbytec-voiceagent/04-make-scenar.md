# Make scénář — Hobbytec (živý, otestovaný)

- **Scénář** `hobbytec reklamace voicebot`, id `7683216`, tým 874621, aktivní.
- **Webhook** id `3809718`, URL `https://hook.eu1.make.com/ssnb30pw999uogzkqjfac8mvq6nec1u3` (už je v `02-vapi-tools.json`).
- **Datová struktura webhooku** `VAPI Hobbytec reklamace` (id `607535`), vygenerovaná ze **stejného seznamu polí** jako JSON nástroje, takže se nemůžou rozejít (to byla příčina prázdných e-mailů u LOMAXu). Obsahuje i `toolCallList` a `artifact.messages` (nevadí).

## Princip

Bot **celou reklamaci zapíše sám**. Zákazník po hovoru nic nevyplňuje ani neposílá. Nikdo mu neodchází žádný e-mail. Když má fotky nebo video, vyžádá si je reklamační tým sám.

**GDPR:** do e-mailu se nedává, co zákazník v hovoru řekl (žádný přepis, žádné citace). Jsou v něm jen strukturované údaje, které zákazník sám poskytl pro reklamaci.

## Jak to funguje

1. **Webhook** přijme zprávu z VAPI.
2. **Filtr:** pokračuje jen `message.type = tool-calls`. Cokoli jiného (end-of-call-report, status-update) se zastaví.
3. **Modul 3** vytáhne všech 19 polí. Každé má **záložní zdroj**: když `toolCalls[1].function.arguments` chybí, vezme se `toolCallList[1].arguments`. Booleany se převedou na „Ano"/„Ne".
4. **Modul 5** spočítá: číslo záznamu `HT-RRRRMMDD-XXXXXX`, telefon (jiné číslo, jinak číslo volajícího), adresu v jednom řádku, čitelné texty (zboží, druh závady, priorita) a **`prazdna_data`** (objednatel i popis závady prázdné = `ano`).
5. **Router, 4 větve:**
   - data v pořádku → **e-mail reklamačnímu oddělení** s odpověďmi **seřazenými jako v jejich formuláři** (E-mail, Objednatel zakázky, Adresa, Telefon, Číslo smlouvy / ID zakázky, Datum prodeje, Označení zboží, Druh závady, Popis závady) + blok „Navíc z hovoru" (model, kdy zjištěno, dostupnost, fotky ano/ne, poznámka, shrnutí pro technika). **Červený pruh jen při bezpečnostním riziku.** Žádný modrý ani žlutý pruh, žádný přepis hovoru.
   - data v pořádku → **odpověď VAPI** s úspěchem. Bot dostane pokyn říct, že se kolegové ozvou na telefon a případné fotky si vyžádají sami.
   - data prázdná → **e-mail „[PRÁZDNÁ DATA]"** jen s telefonem volajícího a časem hovoru (bez přepisu).
   - data prázdná → **odpověď VAPI s chybou** (`error`). VAPI řekne „zkusím to ještě jednou" a **model nástroj zavolá znovu** (prompt to říká). Zákazník prázdný záznam nepozná.

**Proč:** už třikrát přišla prázdná data z VAPI. Teď se to (1) automaticky opraví druhým pokusem, (2) když ani to nepomůže, kolegové dostanou alespoň telefon volajícího, takže se hovor neztratí.

## Kam chodí e-maily

- **Reklamačnímu oddělení** (moduly 8 a 9): zatím jen `paveklukas5@gmail.com`. Před ostrým provozem přepiš na adresu reklamačního oddělení Hobbytec. Odesílatelem je připojený Gmail (chatbotique); pro ostrý provoz je lepší odesílat z domény Hobbytec.
- **Zákazníkovi:** nic.

## Co jsem nemohl ověřit

Z Make přes MCP vidím jen stav běhu (`SUCCESS`), ne obsah e-mailů ani která větev se pustila. Ověření je v `06-navod-a-testy.md`, bod 4A.

Data store jako další zálohu jsem zkusil, ale účet Make nemá volné úložiště, tak tam žádný log není.

## Když budeš přidávat pole

Přidej ho na **třech místech**: JSON nástroje (`05-parametry.json`), datová struktura webhooku (id 607535) a modul 3 ve scénáři (plus případně řádek v e-mailu). Jinak bude v e-mailu prázdné, i když ho VAPI pošle.
