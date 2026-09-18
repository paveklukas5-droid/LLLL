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

## Pokud budeš chtít scénář upravit

Datová struktura na webhooku je nastavená s `strict: false` — nová/neplánovaná
pole ze schématu se nezahodí do chyby, jen prostě nebudou v mapování
k dispozici, dokud je do struktury nedoplníš. Pokud v budoucnu přidáš pole
do `02-vapi-tools.json`, přidej ho i do datové struktury (`VAPI RD Rýmařov
reklamace`, id 589246) — jinak se nové pole bude v e-mailu tiše zobrazovat
jako prázdné, i když ho VAPI pošle správně.
