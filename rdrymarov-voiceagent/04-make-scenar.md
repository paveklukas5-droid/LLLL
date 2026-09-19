# Make scénář — RD Rýmařov reklamace (živý, otestovaný)

Na rozdíl od OKNOTHERM dema jsi tentokrát rovnou požádal o hotový, zapojený
Make workflow — je hotový a aktivní, ne jen navržený.

## Co existuje

- **Scénář**: `rdrymarov reklamace voicebot` (id `7489325`), tým 874621,
  aktivní.
- **Webhook**: id `3747573`, URL `https://hook.eu1.make.com/vsqv4e6km52dihhfg45ak9ex9qhdrpj8`
  — tahle URL je už vyplněná v `02-vapi-tools.json`.
- **Datová struktura**: `VAPI RD Rýmařov reklamace` (id `589246`), přesně
  podle všech 20 polí nástroje `odeslat_reklamaciv2` — žádné kopírování
  odjinud (to byla přesná příčina prázdných e-mailů u LOMAXu, viz
  `../lomax-voiceagent/11-oprava-prazdne-argumenty.md`).

## Jak scénář funguje

1. **Webhook** (`gateway:CustomWebHook`) přijme tool-call z VAPI.
2. **Set Variables** spočítá:
   - `cislo_reklamace` — vygenerované číslo `REK-YYYYMMDD-XXXXXX`.
   - `telefon_kontakt` — buď `telefon_jine`, nebo číslo volajícího
     (`call.customer.number`), pokud `telefon_jine` je prázdné.
   - `adresa_cela`, `priorita_text`, `typ_text`, `oblast_text` — čitelné
     texty místo interních kódů, pro e-mail.
3. **Router** se dvěma větvemi (obě se spustí vždy, žádný filtr):
   - **Větev A** — pošle **e-mail** (Gmail, HTML) s kompletní tabulkou údajů.
     Nahoře v e-mailu je červené varování, pokud `typ_pozadavku = "havarie"`
     nebo `bezpecnostni_riziko = true`.
   - **Větev B** — **Webhook Respond**, vrátí VAPI potvrzení ve tvaru
     `{"results":[{"toolCallId":"...","result":"Reklamace ... byla úspěšně zaevidována..."}]}`,
     aby bot věděl, že se to povedlo, a řekl to zákazníkovi.

## Kam teď chodí e-mail

Na `paveklukas5@gmail.com` — to je testovací adresa pro tuhle fázi
(stejný postup jako u OKNOTHERM dema). **Než přejdeš do ostrého provozu,
přepni příjemce v modulu Email (`google-email:sendAnEmail`) na skutečnou
adresu servisního oddělení RD Rýmařov** (např. servis@rdrymarov.cz — ověř
si u firmy, jestli chtějí email na tuhle adresu, nebo na jinou interní
schránku pro příjem z voicebota). Úprava zabere v Make editoru přes
`scenarios_update` nebo ručně v UI jen pár vteřin.

## Jak jsem to otestoval

Poslal jsem do scénáře syntetický požadavek přesně ve tvaru, v jakém VAPI
podle vlastní dokumentace posílá tool-call (`message.toolCalls[0].function.arguments...`,
`message.call.customer.number`), se všemi vyplněnými poli. Proběhlo
`SUCCESS`, e-mail měl odejít se všemi daty správně dosazenými.

**Co jsem NEotestoval:** reálné volání přes živého VAPI asistenta — na to
nemám v této session přístup (žádný VAPI konektor, přímé volání
`api.vapi.ai` je blokované). Až založíš asistenta a uděláš první opravdový
testovací hovor, zkontroluj v Make **execution logu** tohoto scénáře
(scenario id 7489325), že modul 2 (webhook) dostal vyplněná pole
v `message.toolCalls[0].function.arguments` — ne jen že scénář hlásí
`SUCCESS`. To je přesně krok, který se u LOMAXu přeskočil a proto se na
prázdné e-maily přišlo pozdě.

## Vyřešeno: prázdné hodnoty v prvním reálném testu (19.9.2026)

Po prvním reálném hovoru (přes web/"online", ne telefonem) dorazil e-mail
s reklamací, ale **všechna pole byla prázdná** ("-", "Ne", "Jiné"), přestože
bot v hovoru správně kladl otázky.

**Diagnóza** (přes Make execution log, ne přes VAPI, tam přístup nemám):
ta konkrétní exekuce měla `operations: 4` a `transfer: 65779` bajtů — oproti
běžné exekuci s reálným tool-callem, která má `operations: 1` a `transfer: 0`.
Tak velký přenos dat odpovídá **end-of-call-report** zprávě (obsahuje celý
přepis hovoru, klidně desítky kB), ne malé zprávě s argumenty nástroje. Jinými
slovy: na webhook dorazila **jiná zpráva než tool-call** (nejspíš proto, že
asistentovo obecné pole **Server URL** — na úrovni celého asistenta, ne
nástroje — bylo omylem nastavené na stejnou webhook adresu jako nástroj
`odeslat_reklamaciv2`). Náš mapping čeká `message.toolCalls[1].function.arguments.*`,
což u end-of-call-report zprávy neexistuje — proto všechno spadlo na `ifempty`/
`switch` výchozí hodnoty ("-", "Jiné", "Ne").

**Oprava (hotovo, aktivní):** přidal jsem na modul `Set Variables` filtr,
který zpracuje dál jen zprávy, kde `message.type` je přesně `"tool-calls"`.
Cokoli jiného (end-of-call-report, status-update, cokoli budoucí) se teď
zastaví hned za webhookem, nic se neodešle e-mailem a nic zbytečně nespotřebuje
kredity. Otestováno oběma směry: zpráva `end-of-call-report` → scénář se
zastaví na 1 operaci (žádný e-mail); reálný tvar `tool-calls` → e-mail projde
normálně.

**Co bys měl/a ještě zkontrolovat na straně VAPI** (tam nemám přístup):
v Assistant → Advanced (nebo Server v horní úrovni configu, ne u nástroje)
zkontroluj, jestli tam náhodou není nastavená stejná webhook URL jako
u nástroje. Pokud ano, buď ji smaž (pro čisté demo ji nepotřebuješ, viz
`_poznamka_server` v `03-vapi-assistant-config.json`), nebo klidně nech —
filtr v Make teď takové zprávy neškodně ignoruje.

## Pokud budeš chtít scénář upravit

Datová struktura na webhooku je nastavená s `strict: false` — nová/neplánovaná
pole ze schématu se nezahodí do chyby, jen prostě nebudou v mapování
k dispozici, dokud je do struktury nedoplníš. Pokud v budoucnu přidáš pole
do `02-vapi-tools.json`, přidej ho i do datové struktury (`VAPI RD Rýmařov
reklamace`, id 589246) — jinak se nové pole bude v e-mailu tiše zobrazovat
jako prázdné, i když ho VAPI pošle správně.
