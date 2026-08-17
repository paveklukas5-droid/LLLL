# Prompt pro Make Maiu

Maia scénář postaví, ale mapování si domyslí, pokud jí přesně neřekneš cesty k datům. Proto je prompt takhle konkrétní.

**Postup:** otevři scénář, kde už máš modul *Webhooks → Custom webhook*, otevři panel **Build with Maia** a vlož PROMPT 1. Až doběhne, zkontroluj podle checklistu níž a případně použij doplňkové prompty.

---

## PROMPT 1 — hlavní (vlož celý)

```
Naváž na existující modul Webhooks - Custom webhook. Nepřidávej nový trigger.

KONTEXT
Do webhooku posílá data hlasový AI agent z platformy VAPI. Zákazník zavolá na servisní linku firmy LOMAX (výrobce garážových vrat, předokenních rolet, venkovních žaluzií a vchodových dveří) a nahlásí poruchu nebo reklamaci. Agent po hovoru odešle jeden POST požadavek. Scénář musí data zpracovat a poslat e-mailem servisnímu oddělení.

STRUKTURA PŘÍCHOZÍCH DAT
Vše podstatné je v poli message. Argumenty nástroje jsou tady:
message.toolCalls[0].function.arguments
ID volání nástroje je tady:
message.toolCalls[0].id
Telefonní číslo volajícího je tady:
message.call.customer.number

V arguments jsou tato pole:
jmeno_prijmeni (text), telefon_jine (text, většinou prázdný), adresa_ulice_cp (text), adresa_mesto (text), adresa_psc (text), typ_pozadavku (text), typ_produktu (text), model_rada (text), pohon_znacka (text), popis_zavady (text), technicke_detaily (text), kdy_zacalo (text), opakovana_zavada (boolean), bezpecnostni_riziko (boolean), priorita (text), rok_montaze (text), cislo_zakazky (text), kdo_montoval (text), dostupnost (text), ma_fotografie (boolean), shrnuti_pro_technika (text), poznamka (text).

POSTAV TYTO MODULY V TOMTO POŘADÍ

Modul 1b: Filter hned za webhookem, ještě před vším ostatním.
Pojmenuj ho "Jen tool-calls" a nastav podmínku: message.type se rovná textu tool-calls.
Bez tohoto filtru projdou i zprávy end-of-call-report a status-update, které nemají pole toolCalls, a scénář pak odešle e-mail s prázdnými poli.

Modul 2: Tools - Set multiple variables
Vytvoř tyto proměnné:
- cislo_poptavky = "SRV-" + formatDate(now; "YYYYMMDD") + "-" + upper(substring(uuid; 0; 6))
- telefon_kontakt = ifempty(telefon_jine; message.call.customer.number)
- telefon_pozn = if(length(telefon_jine) > 0; "zákazník požádal o zpětné volání na toto číslo"; "číslo, ze kterého volal")
- adresa_cela = adresa_ulice_cp + ", " + adresa_mesto + ", " + adresa_psc
- priorita_text = switch(priorita; "vysoka"; "PŘEDNOSTNÍ"; "stredni"; "Standardní"; "nizka"; "Nízká")
- typ_text = switch(typ_pozadavku; "reklamace"; "Reklamace"; "servis"; "Servis"; "servisni_prohlidka"; "Servisní prohlídka"; "Jiné")
- produkt_text = switch(typ_produktu; "garazova_vrata_sekcni"; "Sekční garážová vrata"; "garazova_vrata_posuvna"; "Posuvná garážová vrata"; "garazova_vrata_rolovaci"; "Rolovací garážová vrata"; "garazova_vrata_dvoukridla"; "Dvoukřídlá garážová vrata"; "predokenni_roleta"; "Předokenní roleta"; "venkovni_zaluzie"; "Venkovní žaluzie"; "vchodove_dvere"; "Vchodové dveře"; "okno"; "Okno"; "sit_proti_hmyzu"; "Síť proti hmyzu"; "rolovaci_mriz"; "Rolovací mříž"; "pohon_nebo_ovladac"; "Pohon nebo ovladač"; "Jiné")

Modul 3: Router se dvěma větvemi.

VĚTEV A - bez filtru - Email: Send an email
Odesílatel: servis@lomax.cz
Komu: servis@lomax.cz
Reply-To: servis@lomax.cz
Content type: HTML. NEPŘIDÁVEJ ručně hlavičku Content-Type do custom headers.
Vyplň i textovou verzi zprávy, aby vznikl korektní multipart/alternative.
Předmět: [{{priorita_text}}] Servisní poptávka {{cislo_poptavky}} - {{produkt_text}} - {{adresa_mesto}} {{adresa_psc}}
Tělo: přehledná HTML tabulka se sekcemi ZÁKAZNÍK, PRODUKT, ZÁVADA. Nadpis "Nová servisní poptávka z telefonní linky", pod ním číslo poptávky, datum přijetí a priorita.
Pokud je priorita rovna "vysoka" NEBO bezpecnostni_riziko rovno true, dej úplně nahoru široký červený pruh (pozadí #d32f2f, bílý tučný text) s nápisem "PŘEDNOSTNÍ PŘÍPAD - VYŘÍDIT MIMO POŘADÍ". Priorita musí jít poznat na první pohled, ne jen jako text v hlavičce.
Pokud je bezpecnostni_riziko rovno true, přidej pod pruh světle červený box s textem "Nahlášeno bezpečnostní riziko. Zákazník byl v hovoru poučen, aby produkt nepoužíval a nemanipuloval s ním."
U telefonu použij telefon_kontakt jako odkaz tel: a pod něj menším šedým písmem telefon_pozn. Pokud je telefon_kontakt prázdný, napiš červeně "SKRYTÉ ČÍSLO - zákazníka nelze zpětně kontaktovat".
Všechna prázdná textová pole nahraď slovem "neuvedeno", ne pomlčkou. U čísla zakázky použij "neuvedeno - dohledat podle adresy".
Pod hlavičku přidej odkaz s textem "Poslechnout hovor a přečíst přepis" vedoucí na https://dashboard.vapi.ai/calls/{{message.call.id}}
Na konci uveď: "Vygenerováno automaticky z telefonního hovoru (callId {{message.call.id}}). Doporučený další krok: přiřadit nejbližšímu autorizovanému zastoupení podle PSČ {{adresa_psc}}."

VĚTEV B - s filtrem - Email: Send an email
Filtr pojmenuj "Přednostní" a nastav podmínku: priorita rovná se text "vysoka" NEBO bezpecnostni_riziko rovná se true.
Komu: servis@lomax.cz
Předmět: PŘEDNOSTNÍ {{cislo_poptavky}} - {{jmeno_prijmeni}} - {{adresa_mesto}} - {{telefon_kontakt}}
Tělo: krátká zpráva na tři řádky - jméno, telefon, adresa, popis závady. Nic víc, je to upozornění na mobil.

Modul 4: Webhooks - Webhook response. Musí být úplně poslední modul za routerem.
Status: 200
Headers: Content-Type: application/json
Body přesně tento JSON:
{"results":[{"toolCallId":"{{message.toolCalls[0].id}}","result":"Servisní poptávka {{cislo_poptavky}} byla úspěšně zaevidována a odeslána servisnímu oddělení."}]}

DŮLEŽITÁ PRAVIDLA
1. Webhook response musí být poslední modul, jinak volající služba spadne do timeoutu.
2. Nepřidávej žádné moduly Sleep, Iterator ani Aggregator.
3. Celý scénář musí doběhnout do 20 sekund.
4. Všechny texty v e-mailech piš česky s diakritikou.
5. Nepřidávej modul pro odpověď zákazníkovi - e-mail zákazníka se nesbírá.
6. V modulech Email nikdy nepřidávej vlastní hlavičku Content-Type. Vede to k nevalidnímu MIME a část klientů pak zobrazí zdroják HTML místo zprávy.
7. Reply-To musí být vždy vyplněné na servisní schránku, jinak odpovědi chodí na účet, pod kterým scénář běží.
```

---

## Kontrola po Maie

Než pustíš scénář naostro, projdi:

- [ ] **Filtr „Jen tool-calls" je hned za webhookem** — bez něj chodí prázdné maily z reportů po hovoru.
- [ ] **Webhook response je opravdu poslední** — Maia ho občas dá do jedné z větví routeru. Musí být za routerem, ne v něm.
- [ ] **`telefon_kontakt` se mapuje na `message.call.customer.number`**, ne na neexistující `arguments.telefon`.
- [ ] **Filtr přednostní větve** používá `vysoka` (bez diakritiky, malá písmena) — přesně tak, jak to posílá bot.
- [ ] **`toolCallId` v response** je namapované, ne natvrdo napsané.
- [ ] Předmět e-mailu obsahuje **PSČ** — podle něj se poptávka směruje na zastoupení.
- [ ] **Reply-To** je vyplněné a **Content-Type není** v custom headers.
- [ ] U přednostního případu je v mailu **červený pruh**, ne jen slovo v hlavičce.
- [ ] Prázdná pole se zobrazují jako „neuvedeno".

---

## Doplňkové prompty, když něco nesedí

**Když Maia zjednoduší HTML e-mailu:**
```
V modulu Email ve větvi A nahraď tělo e-mailu tímto HTML a nic v něm neměň:
```
…a vlož HTML z `04-make-scenar.md`, sekce „E-mail A".

**Když je Webhook response ve špatném místě:**
```
Přesuň modul Webhook response tak, aby byl posledním modulem celého scénáře, až za routerem. Nesmí být uvnitř žádné větve routeru.
```

**Když mapování ukazuje na špatné cesty:**
```
Oprav mapování. Data z nástroje jsou v message.toolCalls[0].function.arguments, ne v kořeni payloadu. Telefonní číslo volajícího je v message.call.customer.number. ID pro odpověď je v message.toolCalls[0].id.
```

**Když chceš přidat evidenci do tabulky:**
```
Přidej do routeru třetí větev bez filtru s modulem Google Sheets - Add a row. Sloupce: datum, cislo_poptavky, jmeno_prijmeni, telefon_kontakt, adresa_cela, produkt_text, typ_text, priorita, popis_zavady, shrnuti_pro_technika. Tato větev musí být před modulem Webhook response.
```

**Když chodí e-maily s prázdnými poli (vyplněný jen telefon):**
```
Přidej hned za modul Webhooks - Custom webhook filtr s podmínkou: message.type se rovná textu tool-calls. Zprávy jiného typu nesmí pokračovat do dalších modulů.
```

**Když chceš zabezpečit webhook:**
```
Přidej hned za webhook modul Filter s podmínkou: hodnota hlavičky x-api-key se rovná textu TVOJE_TAJEMSTVI. Pokud podmínka neplatí, scénář nepokračuje.
```

---

## Než to pustíš na ostro

Otestuj scénář `curl` payloadem z `04-make-scenar.md` (sekce „Testovací payload"). Musí ti přijít e-mail a `curl` musí dostat odpověď `200` s JSONem obsahujícím `toolCallId`. Teprve pak přepni webhook do VAPI nástroje.
