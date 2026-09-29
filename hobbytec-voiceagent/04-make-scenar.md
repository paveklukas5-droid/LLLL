# Make scénář — Hobbytec (živý, otestovaný)

- **Scénář** `hobbytec reklamace voicebot`, id `7683216`, tým 874621, aktivní.
- **Webhook** id `3809718`, URL `https://hook.eu1.make.com/ssnb30pw999uogzkqjfac8mvq6nec1u3` (už je v `02-vapi-tools.json`).
- **Datová struktura webhooku** `VAPI Hobbytec reklamace` (id `607535`), vygenerovaná ze **stejného seznamu polí** jako JSON nástroje, takže se nemůžou rozejít (to byla příčina prázdných e-mailů u LOMAXu). Obsahuje i `toolCallList` a `artifact.messages`.

## Jak to funguje

1. **Webhook** přijme zprávu z VAPI.
2. **Filtr:** pokračuje jen `message.type = tool-calls`. Cokoli jiného (end-of-call-report, status-update) se zastaví.
3. **Modul 3** vytáhne všechna pole. Každé má **záložní zdroj**: když `toolCalls[1].function.arguments` chybí, vezme se `toolCallList[1].arguments`.
4. **Modul 5** spočítá: číslo záznamu `HT-RRRRMMDD-XXXXXX`, telefon (jiné číslo, jinak číslo volajícího), čitelné texty (zboží, druh závady, priorita), **`email_ok`** (e-mail zákazníka obsahuje zavináč), **`prazdna_data`** (objednatel i popis závady prázdné = `ano`) a **`zaloha_text`** (všechno, co zákazník v hovoru řekl, z `artifact.messages`, role `user`; systémový prompt se tam nedostane).
5. **Router, 5 větví:**
   - data v pořádku → **e-mail kolegům** s odpověďmi **seřazenými jako v jejich formuláři** (E-mail, Objednatel zakázky, Adresa, Telefon, Číslo smlouvy / ID zakázky, Datum prodeje, Označení zboží, Druh závady, Popis závady, Foto / video) + „Navíc z hovoru" + záloha z hovoru,
   - data v pořádku a e-mail zákazníka platný → **e-mail zákazníkovi** s tlačítkem na oficiální Google formulář, kde nahraje fotky nebo video (formulář je vyžaduje a po telefonu nejdou). Je v něm jen zboží, druh závady a popis, **ne adresa ani telefon**, aby při špatně rozpoznaném e-mailu neunikly osobní údaje,
   - data v pořádku → **odpověď VAPI** s úspěchem (říká botovi, jestli e-mail s formulářem odešel),
   - data prázdná → **e-mail „[PRÁZDNÁ DATA]"** s telefonem volajícího a tím, co zákazník řekl,
   - data prázdná → **odpověď VAPI s chybou**. Bot dostane `error`, VAPI řekne „zkusím to ještě jednou" a **model nástroj zavolá znovu** (prompt to říká). Zákazník prázdný záznam nepozná.

**Proč:** už třikrát přišla prázdná data z VAPI. Teď se to (1) automaticky opraví druhým pokusem, (2) když ani to nepomůže, kolegové dostanou telefon a věty zákazníka, takže se žádný hovor neztratí.

## Kam chodí e-maily

- **Kolegům** (moduly 8 a 9): zatím jen `paveklukas5@gmail.com`. Před ostrým provozem přepiš na adresu reklamačního oddělení Hobbytec.
- **Zákazníkovi** (modul 11): na adresu, kterou zákazník nadiktoval. Odesílatelem je připojený Gmail (chatbotique). Pro ostrý provoz je lepší odesílat z domény Hobbytec; modul jde i vypnout, pokud to klient nechce.

## Proč nejde formulář odeslat automaticky

Make umí Google formulář za zákazníka odeslat přímo, jenže jejich formulář má **povinné nahrání souboru** a to Google dovolí jen přihlášenému uživateli. Proto vedeme zákazníka do formuláře e-mailem.

## Co jsem nemohl ověřit

Z Make přes MCP vidím jen stav běhu (`SUCCESS`), ne obsah e-mailů ani která větev se pustila. Ověření je v `06-navod-a-testy.md`, bod 4A.

Data store jako další zálohu jsem zkusil, ale účet Make nemá volné úložiště, tak tam žádný log není.

## Když budeš přidávat pole

Přidej ho na **třech místech**: JSON nástroje (`05-parametry.json`), datová struktura webhooku (id 607535) a modul 3 ve scénáři. Jinak bude v e-mailu prázdné, i když ho VAPI pošle.
