# Make scénář — Hobbytec (živý, otestovaný)

- **Scénář** `hobbytec reklamace voicebot`, id `7683216`, tým 874621, aktivní.
- **Webhook** id `3809718`, URL `https://hook.eu1.make.com/ssnb30pw999uogzkqjfac8mvq6nec1u3` (už je v `02-vapi-tools.json`).
- **Datová struktura webhooku** `VAPI Hobbytec reklamace` (id `607535`) — vygenerovaná ze **stejného zdroje** jako JSON nástroje, takže pole nemůžou být rozdílná. Obsahuje i `toolCallList` a `artifact.messages`.

## Jak to funguje

1. **Webhook** přijme zprávu z VAPI.
2. **Filtr:** pokračuje jen `message.type = tool-calls`. Cokoli jiného (end-of-call-report, status-update) se zastaví.
3. **Modul 3** vytáhne všechna pole. Každé má **záložní zdroj**: když `toolCalls[1].function.arguments` chybí, vezme se `toolCallList[1].arguments`.
4. **Modul 5** spočítá odvozené věci: číslo záznamu `HT-RRRRMMDD-XXXXXX`, telefon (jiné číslo, jinak číslo volajícího), čitelné texty, a hlavně **`prazdna_data`** (jméno i popis závady prázdné = `ano`) a **`zaloha_text`** (všechno, co zákazník v hovoru řekl, z `artifact.messages`, role `user`; systémový prompt se tam nedostane).
5. **Router, 4 větve:**
   - data v pořádku → **e-mail** s tabulkou + zálohou z hovoru,
   - data v pořádku → **odpověď VAPI** s úspěchem (obsahuje i pokyn pro bota, ať zákazníka navede poslat e-mailem fakturu, list a fotky),
   - data prázdná → **e-mail „[PRÁZDNÁ DATA]"** s telefonem volajícího a tím, co zákazník řekl,
   - data prázdná → **odpověď VAPI s chybou**. Bot dostane `error`, VAPI řekne „zkusím to ještě jednou" a **model volá nástroj znovu** (prompt to říká). Zákazník tedy prázdný záznam nepozná.

**Proč to takhle:** už třikrát přišla prázdná data z VAPI. Teď se to (1) automaticky opraví druhým pokusem, (2) když ani to nepomůže, kolegové dostanou telefon a věty zákazníka, takže se žádný hovor neztratí.

## Kam chodí e-mail

Zatím jen na `paveklukas5@gmail.com`. **Před ostrým provozem** přepni příjemce v modulech 8 a 9 (`google-email:sendAnEmail`) na adresu reklamačního oddělení Hobbytec (dohodni s klientem, klidně `reklamace@hobbytec.cz` nebo interní schránku).

## Co jsem nemohl ověřit

Z Make přes MCP vidím jen stav běhu (`SUCCESS`), ne obsah e-mailů ani která větev se pustila. Proto ověření v pořádku níže (bod 2 v `06-navod-a-testy.md`).

Data store jako další zálohu jsem zkusil, ale účet Make nemá volné úložiště, tak tam žádný log není.

## Když budeš přidávat pole

Přidej ho na **třech místech**: JSON nástroje (`05-parametry.json`), datová struktura webhooku (id 607535) a modul 3 ve scénáři. Jinak bude v e-mailu prázdné, i když ho VAPI pošle.
