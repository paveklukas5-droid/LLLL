# Jeden prompt pro Make Maiu

Postaví scénář od nuly **i** opraví rozestavěný. Vlož ho celý do panelu **Build with Maia** ve scénáři, kde už máš modul *Webhooks → Custom webhook*.

Je psaný tak, aby Maia existující moduly upravila místo aby vedle nich stavěla nové. Když ho pustíš dvakrát, nic se nerozbije.

---

```
Uprav tento scénář tak, aby přesně odpovídal specifikaci níže.

JAK POSTUPOVAT
Scénář může být prázdný, rozestavěný nebo špatně poskládaný. Projdi, co v něm už je:
- modul, který ve specifikaci existuje, uprav na správné nastavení, nezakládej vedle něj druhý
- modul, který ve specifikaci není, smaž
- chybějící moduly doplň na správné místo v pořadí
Modul Webhooks - Custom webhook, který už ve scénáři je, ponech a nepřidávej nový trigger.

KONTEXT
Do webhooku posílá data hlasový AI agent z platformy VAPI. Zákazník zavolá na servisní linku firmy LOMAX (výrobce garážových vrat, předokenních rolet, venkovních žaluzií a vchodových dveří) a nahlásí poruchu nebo reklamaci. Agent během hovoru odešle jeden POST požadavek. Scénář ho zpracuje a pošle e-mailem servisnímu oddělení.

KDE V PAYLOADU LEŽÍ DATA
Argumenty nástroje: message.toolCalls[0].function.arguments
ID volání nástroje:  message.toolCalls[0].id
Číslo volajícího:    message.call.customer.number
ID hovoru:           message.call.id

V arguments jsou tato pole:
jmeno_prijmeni (text), telefon_jine (text, většinou prázdný), adresa_ulice_cp (text), adresa_mesto (text), adresa_psc (text), typ_pozadavku (text), typ_produktu (text), model_rada (text), pohon_znacka (text), popis_zavady (text), technicke_detaily (text), kdy_zacalo (text), opakovana_zavada (boolean), bezpecnostni_riziko (boolean), priorita (text), rok_montaze (text), cislo_zakazky (text), kdo_montoval (text), dostupnost (text), ma_fotografie (boolean), shrnuti_pro_technika (text), poznamka (text).

MODULY V TOMTO POŘADÍ

[1] Webhooks - Custom webhook. Už existuje, jen ho ponech.

[2] Filter mezi modulem 1 a 3. Pojmenuj ho "Jen tool-calls".
Podmínka: message.type se rovná textu tool-calls.
Bez tohoto filtru projdou i zprávy end-of-call-report a status-update. Ty nemají pole toolCalls, takže by scénář odeslal e-mail s prázdnými poli.

[3] Data store - Get a record.
Nejdřív založ data store s názvem lomax_poptavky, který má jedno textové pole cislo_poptavky.
Key: {{message.call.id}}
Modul NESMÍ zastavit scénář, když záznam neexistuje. U nového hovoru je prázdný výsledek normální stav, ne chyba.

[4] Tools - Set multiple variables. Musí být AŽ ZA modulem 3, protože z něj čte.
Vytvoř tyto proměnné:
- cislo_poptavky = "SRV-" + formatDate(now; "YYYYMMDD") + "-" + upper(substring(uuid; 0; 6))
- telefon_kontakt = ifempty(telefon_jine; message.call.customer.number)
- telefon_pozn = if(length(telefon_jine) > 0; "zákazník požádal o zpětné volání na toto číslo"; "číslo, ze kterého volal")
- adresa_cela = adresa_ulice_cp + ", " + adresa_mesto + ", " + adresa_psc
- data_ok = if(length(jmeno_prijmeni) > 0 and length(popis_zavady) > 0 and length(adresa_mesto) > 0; true; false)
- je_duplicita = if(length(cislo_poptavky z výstupu modulu 3 Data store Get a record) > 0; true; false)
- priorita_text = switch(priorita; "vysoka"; "PŘEDNOSTNÍ"; "stredni"; "Standardní"; "nizka"; "Nízká")
- typ_text = switch(typ_pozadavku; "reklamace"; "Reklamace"; "servis"; "Servis"; "servisni_prohlidka"; "Servisní prohlídka"; "Jiné")
- produkt_text = switch(typ_produktu; "garazova_vrata_sekcni"; "Sekční garážová vrata"; "garazova_vrata_posuvna"; "Posuvná garážová vrata"; "garazova_vrata_rolovaci"; "Rolovací garážová vrata"; "garazova_vrata_dvoukridla"; "Dvoukřídlá garážová vrata"; "predokenni_roleta"; "Předokenní roleta"; "venkovni_zaluzie"; "Venkovní žaluzie"; "vchodove_dvere"; "Vchodové dveře"; "okno"; "Okno"; "sit_proti_hmyzu"; "Síť proti hmyzu"; "rolovaci_mriz"; "Rolovací mříž"; "pohon_nebo_ovladac"; "Pohon nebo ovladač"; "Jiné")

[5] Router se třemi větvemi. Filtry se nesmí překrývat, aby se vždy provedla právě jedna. Každá větev končí vlastním modulem Webhook response, protože každá vrací něco jiného.

VĚTEV A "Duplicita"
Filtr: je_duplicita se rovná true
Jediný modul: Webhook response, status 200, Content-Type application/json, body:
{"results":[{"toolCallId":"{{message.toolCalls[0].id}}","result":"Poptávka už byla pro tento hovor založena dříve. Nová se nezakládá."}]}
V této větvi se neposílá žádný e-mail.

VĚTEV B "Chybí data"
Filtr: je_duplicita se rovná false A ZÁROVEŇ data_ok se rovná false
Jediný modul: Webhook response, status 200, Content-Type application/json, body. Všimni si, že se vrací klíč error, nikoli result:
{"results":[{"toolCallId":"{{message.toolCalls[0].id}}","error":"Poptávku nelze uložit, v požadavku chybí povinné údaje (jméno, město nebo popis závady). Zopakuj volání nástroje a vyplň všechna povinná pole."}]}
Klíč error je zásadní. Volající služba na něj zareaguje jako na selhání a zopakuje požadavek s vyplněnými daty. Kdyby se vracel result s hezkou větou, ohlásí úspěch i na prázdný payload.

VĚTEV C "OK"
Filtr: je_duplicita se rovná false A ZÁROVEŇ data_ok se rovná true
Moduly v tomto pořadí:
  C1. Data store - Add/replace a record. Key {{message.call.id}}, pole cislo_poptavky = {{cislo_poptavky}}. Musí být před e-mailem, aby se při pádu na e-mailu duplicita nezaložila znovu.
  C2. Email - Send an email servisnímu oddělení. Detaily níže.
  C3. Email - Send an email, přednostní upozornění. Před tento modul dej filtr "Přednostní": priorita se rovná textu vysoka NEBO bezpecnostni_riziko se rovná true.
      Komu: servis@lomax.cz
      Předmět: PŘEDNOSTNÍ {{cislo_poptavky}} - {{jmeno_prijmeni}} - {{adresa_mesto}} - {{telefon_kontakt}}
      Tělo: tři řádky - jméno, telefon, adresa, popis závady. Nic víc, je to upozornění na mobil.
  C4. Webhook response, status 200, Content-Type application/json, body:
{"results":[{"toolCallId":"{{message.toolCalls[0].id}}","result":"Servisní poptávka {{cislo_poptavky}} byla zaevidována a odeslána servisnímu oddělení."}]}

MODUL C2 - E-MAIL SERVISNÍMU ODDĚLENÍ
Odesílatel: servis@lomax.cz
Komu: servis@lomax.cz
Reply-To: servis@lomax.cz
Content type: HTML, nastavené přepínačem modulu. NEPŘIDÁVEJ hlavičku Content-Type do custom headers, vzniklo by nevalidní MIME.
Vyplň i pole s textovou verzí zprávy, aby vznikl korektní multipart/alternative. Do textové verze dej: číslo poptávky, prioritu, jméno, telefon, adresu, produkt, popis závady a shrnutí pro technika, každé na vlastním řádku.
Předmět: {{priorita_text}} - {{cislo_poptavky}} - {{produkt_text}} - {{adresa_mesto}} {{adresa_psc}}
Jako tělo použij PŘESNĚ toto HTML a nic v něm neměň:

<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;color:#222">
  {{if(priorita = "vysoka" or bezpecnostni_riziko; "<div style='background:#d32f2f;color:#fff;padding:12px 16px;border-radius:6px;font-size:16px;font-weight:bold;margin-bottom:16px'>PŘEDNOSTNÍ PŘÍPAD — VYŘÍDIT MIMO POŘADÍ</div>"; "")}}
  {{if(bezpecnostni_riziko; "<div style='background:#fdecea;border-left:4px solid #d32f2f;padding:12px 16px;margin-bottom:16px'><b>Nahlášeno bezpečnostní riziko.</b> Zákazník byl v hovoru poučen, aby produkt nepoužíval a nemanipuloval s ním.</div>"; "")}}
  <h2 style="margin:0 0 4px">Nová servisní poptávka z telefonní linky</h2>
  <p style="margin:0 0 16px;color:#666">
    <b>{{cislo_poptavky}}</b> · {{formatDate(now; "D. M. YYYY HH:mm")}} · priorita: <b>{{priorita_text}}</b><br>
    <a href="https://dashboard.vapi.ai/calls/{{message.call.id}}">Poslechnout hovor a přečíst přepis</a>
  </p>
  <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px">
    <tr style="background:#f4f4f4"><td colspan="2"><b>ZÁKAZNÍK</b></td></tr>
    <tr><td width="180"><b>Jméno</b></td><td>{{jmeno_prijmeni}}</td></tr>
    <tr><td><b>Telefon</b></td><td>
      {{if(length(telefon_kontakt) > 0; "<a href='tel:" + telefon_kontakt + "'>" + telefon_kontakt + "</a>"; "<b style='color:#d32f2f'>SKRYTÉ ČÍSLO — zákazníka nelze zpětně kontaktovat</b>")}}
      <br><span style="color:#888;font-size:12px">{{telefon_pozn}}</span>
    </td></tr>
    <tr><td><b>Adresa realizace</b></td><td>{{adresa_cela}}</td></tr>
    <tr><td><b>Dostupnost</b></td><td>{{ifempty(dostupnost; "neuvedeno")}}</td></tr>
    <tr style="background:#f4f4f4"><td colspan="2"><b>PRODUKT</b></td></tr>
    <tr><td><b>Typ</b></td><td>{{produkt_text}}</td></tr>
    <tr><td><b>Modelová řada</b></td><td>{{ifempty(model_rada; "neuvedeno")}}</td></tr>
    <tr><td><b>Pohon</b></td><td>{{ifempty(pohon_znacka; "neuvedeno")}}</td></tr>
    <tr><td><b>Rok montáže</b></td><td>{{ifempty(rok_montaze; "neuvedeno")}}</td></tr>
    <tr><td><b>Číslo zakázky</b></td><td>{{ifempty(cislo_zakazky; "neuvedeno — dohledat podle adresy")}}</td></tr>
    <tr><td><b>Montoval</b></td><td>{{ifempty(kdo_montoval; "neuvedeno")}}</td></tr>
    <tr style="background:#f4f4f4"><td colspan="2"><b>ZÁVADA — {{typ_text}}</b></td></tr>
    <tr><td><b>Popis</b></td><td>{{popis_zavady}}</td></tr>
    <tr><td><b>Technické detaily</b></td><td>{{ifempty(technicke_detaily; "neuvedeno")}}</td></tr>
    <tr><td><b>Kdy začalo</b></td><td>{{ifempty(kdy_zacalo; "neuvedeno")}}</td></tr>
    <tr><td><b>Opakovaná závada</b></td><td>{{if(opakovana_zavada; "ANO — řešeno už dříve"; "ne")}}</td></tr>
    <tr><td><b>Fotografie</b></td><td>{{if(ma_fotografie; "Zákazník fotku má — vyžádejte si ji při zpětném volání"; "nemá")}}</td></tr>
    <tr style="background:#fffbe6"><td><b>Shrnutí pro technika</b></td><td>{{shrnuti_pro_technika}}</td></tr>
    <tr><td><b>Poznámka</b></td><td>{{ifempty(poznamka; "neuvedeno")}}</td></tr>
  </table>
  <p style="font-size:12px;color:#888;margin-top:16px">
    Vygenerováno automaticky z telefonního hovoru (callId {{message.call.id}}).
    Doporučený další krok: přiřadit nejbližšímu autorizovanému zastoupení podle PSČ {{adresa_psc}}.
  </p>
</div>

PRAVIDLA, KTERÁ NESMÍŠ PORUŠIT
1. Každá ze tří větví routeru končí modulem Webhook response. Bez toho volající služba spadne do timeoutu.
2. Filtry větví se nesmí překrývat.
3. Set multiple variables musí být až za Data store Get a record.
4. Do modulů Email nepřidávej vlastní hlavičku Content-Type.
5. Reply-To musí být vyplněné, jinak chodí odpovědi na účet, pod kterým scénář běží.
6. Nepřidávej moduly Sleep, Iterator ani Aggregator. Celý scénář musí doběhnout do 20 sekund.
7. Nepřidávej žádný e-mail zákazníkovi. Jeho adresa se nesbírá.
8. Všechny texty v e-mailech česky s diakritikou.
```

---

## Kontrola po Maie

- [ ] **Pořadí je webhook → filtr → Data store → proměnné → router.** Set multiple variables za Data store, ne před ním.
- [ ] **Filtr „Jen tool-calls"** je hned za webhookem.
- [ ] **Každá ze tří větví končí Webhook response** a filtry se nepřekrývají.
- [ ] **Větev B vrací `error`**, ne `result`.
- [ ] `telefon_kontakt` čte z `message.call.customer.number`, ne z neexistujícího `arguments.telefon`.
- [ ] `toolCallId` v odpovědích je namapované, ne natvrdo napsané.
- [ ] Data store `lomax_poptavky` existuje a zapisuje se **před** e-mailem.
- [ ] Reply-To vyplněné, `Content-Type` **není** v custom headers.
- [ ] Prázdná pole se zobrazují jako „neuvedeno".

---

## Když něco nesedí

**Webhook response skončil ve špatném místě:**
```
Každá ze tří větví routeru musí končit vlastním modulem Webhook response. Zkontroluj, že žádná větev nekončí bez něj a že žádný Webhook response nestojí mimo router.
```

**Špatné mapování:**
```
Oprav mapování. Data z nástroje jsou v message.toolCalls[0].function.arguments, ne v kořeni payloadu. Číslo volajícího je v message.call.customer.number. ID pro odpověď je v message.toolCalls[0].id. ID hovoru pro data store je v message.call.id.
```

**Maia zjednodušila HTML e-mailu:**
```
V modulu C2 nahraď tělo e-mailu přesně tímto HTML a nic v něm neměň:
```
…a vlož HTML ze specifikace výše.

**Přidat evidenci do tabulky:**
```
Do větve C mezi e-mail a Webhook response přidej modul Google Sheets - Add a row se sloupci: datum, cislo_poptavky, jmeno_prijmeni, telefon_kontakt, adresa_cela, produkt_text, typ_text, priorita, popis_zavady, shrnuti_pro_technika.
```

**Zabezpečit webhook:**
```
Přidej hned za webhook, ještě před filtr Jen tool-calls, další filtr s podmínkou: hodnota hlavičky x-api-key se rovná textu TVOJE_TAJEMSTVI.
```

---

## Otestuj dřív, než to zapojíš do VAPI

Testovací `curl` payload je v `04-make-scenar.md`. Musí přijít e-mail **a** curl musí dostat `200` s JSONem obsahujícím `toolCallId`. Když přijde jen jedno z toho, VAPI bude hlásit selhání nástroje.
