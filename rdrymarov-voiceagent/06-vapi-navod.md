# RD Rýmařov — kompletní návod na nastavení ve VAPI

Tenhle soubor je jediné místo, kterým musíš projít, abys dostal/a hlasového
agenta **Lucie** živě na telefonní lince. Make backend je už hotový a
otestovaný (viz `04-make-scenar.md`) — zbývá jen VAPI.

## Fáze 1 — Založ nástroje

Dvě cesty, vyber si jednu:

- **Přes API** (rychlejší): `07-vytvorit-tool.sh` — doplň VAPI_KEY a spusť.
- **Ručně v dashboardu**: `08-tool-rucne-ve-vapi.md`, krok za krokem,
  s JSON schématem parametrů v `05-parametry.json`.

Založ `odeslat_reklamaciv2` a `ukoncit_hovor`. `prepojit_na_operatora` jen
pokud máš živou linku k přepojení.

Ulož si `id` obou (resp. všech) vytvořených nástrojů.

## Fáze 2 — Založ asistenta

1. Dashboard → **Assistants → Create Assistant → Blank Template**.
2. Vyplň podle `03-vapi-assistant-config.json`:
   - **Name**: `RD Rýmařov – Servis a reklamace (CZ)`
   - **First message**: „Dobrý den, tady Lucie ze servisu RD Rýmařov. Jak vám můžu pomoci?"
   - **Model**: Anthropic `claude-haiku-4-5`, temperature `0.3`, **Max Tokens `1500`**
     (nikdy níž — viz `../lomax-voiceagent/11-oprava-prazdne-argumenty.md`)
   - **Emotion Recognition**: **vypnuto** (nepoužívá se v promptu, jen by
     přidávalo latenci navíc — poučení z LOMAX/OKNOTHERM latenčního ladění)
   - **System Prompt**: vlož **celý** obsah `01-system-prompt.md`
   - **Tools**: přidej nástroje z Fáze 1
   - **Transcriber**: Deepgram `nova-3`, jazyk `cs`, `smartFormat`/`numerals` VYPNUTO, endpointing `500`
   - **Voice**: Azure `cs-CZ-VlastaNeural`
3. Ulož.

Zbylé jemné doladění (start/stop speaking plan, analysis plan) je
v `03-vapi-assistant-config.json` — přenes je, pokud chceš mít asistenta
1:1 podle configu, ale není to blokující pro spuštění.

## Fáze 3 — Otestuj

1. **Talk to Assistant** v dashboardu — projdi si scénáře z
   `09-testovaci-scenare.md`, hlavně havárii (únik plynu) — to je
   nejdůležitější a nejcitlivější část celého promptu.
2. Zavolej si i **skutečným telefonem** na přidělené číslo, ne jen
   v prohlížeči — čeština a diktování čísel se na telefonu chová jinak.
3. Po každém testu zkontroluj e-mail na `paveklukas5@gmail.com` a Make
   execution log (viz `04-make-scenar.md`).

## Fáze 4 — Před ostrým provozem

- Přepni e-mail v Make scénáři ze `paveklukas5@gmail.com` na skutečnou
  adresu servisního oddělení RD Rýmařov.
- Přiřaď asistentovi reálné telefonní číslo (Phone Numbers → Import/Buy →
  přiřaď k asistentovi).
- Promysli GDPR větu o nahrávání hovoru, pokud necháš `recordingEnabled: true`.
- Udělej 2-3 testovací hovory těsně po sobě a zkontroluj Latency Summary —
  pokud `LLM` čas zůstává vysoký po celou dobu hovoru bez zlepšení, přečti
  si `../lomax-voiceagent/12-latence-na-zacatku-hovoru.md`, je to stejná
  třída problému jako u LOMAXu.

## Odkud jsou čísla a fakta v promptu

Kontakty, produktová řada, záruka a reklamační řád jsou z veřejného webu
RD Rýmařov (rdrymarov.cz) a souvisejících zdrojů (reklamační řád RD
Rýmařov, obchodní podmínky). Přímý přístup na rdrymarov.cz byl v této
session blokovaný, takže fakta pocházejí z vyhledávání a mohou být
neaktuální — **před ostrým nasazením si projdi sekci 3 v `01-system-prompt.md`
a porovnej ji se skutečným aktuálním obsahem webu**, hlavně telefonní čísla
a provozní dobu servisní linky.
