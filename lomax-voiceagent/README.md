# LOMAX — hlasový agent pro reklamace a servis (VAPI + Make)

Kompletní balík pro telefonní linku, na kterou volají zákazníci LOMAXu s poruchou nebo reklamací.
Bot celý hovor vede česky, vytáhne ze zákazníka všechno, co servisní technik potřebuje, ověří to, a odešle poptávku do Make, který rozešle e-maily.

**Žádná knowledge base není potřeba** — všechny znalosti o LOMAXu jsou přímo v system promptu.

## Soubory

| Soubor | Co s ním |
|---|---|
| `01-system-prompt.md` | **Hlavní věc.** Celý obsah zkopíruj do VAPI → Assistant → Model → System Prompt |
| `02-vapi-tools.json` | Definice nástrojů. Vytvoř ve VAPI → Tools, doplň Make webhook URL |
| `03-vapi-assistant-config.json` | Zbytek nastavení asistenta — hlas, přepis, timeouty, analýza |
| `04-make-scenar.md` | Návod na Make scénář krok za krokem + hotové HTML e-maily |
| `05-testovaci-scenare.md` | 14 scénářů, které projeď před ostrým provozem |
| `06-vapi-navod.md` | **Klikací návod na VAPI** — varianty první zprávy, všechny záložky asistenta, časté chyby |
| `07-vytvorit-tool.sh` | Založení nástrojů přes API jedním příkazem (rychlá cesta) |
| `08-tool-rucne-ve-vapi.md` | Založení nástroje **ručně v dashboardu** — text ke zkopírování do každého pole |
| `09-parametry.json` | Všech 22 parametrů nástroje najednou — k vložení do JSON editoru ve VAPI |

---

## Nasazení za 30 minut

> Podrobný klikací postup včetně každého pole ve VAPI je v **`06-vapi-navod.md`**. Níže je zkrácená verze.

**1. Make — webhook**
Vytvoř scénář podle `04-make-scenar.md`, začni modulem *Webhooks → Custom webhook*, zkopíruj URL.

**2. VAPI — nástroj**
Dashboard → Tools → Create Tool → typ *Function*. Vlož definici `odeslat_servisni_poptavku` z `02-vapi-tools.json`, do Server URL vlož Make webhook. Přidej i nástroj `ukoncit_hovor` (typ *End Call*).

**3. VAPI — asistent**
Create Assistant → Blank. Nastav podle `03-vapi-assistant-config.json`:
- System prompt = celý `01-system-prompt.md`
- Transcriber: Deepgram `nova-2`, jazyk **cs**
- Voice: Azure `cs-CZ-VlastaNeural` (jistota) nebo ElevenLabs `eleven_flash_v2_5` (přirozenější)
- Model: Claude Sonnet 5, temperature `0.3`
- First message: `Dobrý den, tady Klára ze servisu LOMAX. Jak vám můžu pomoci?`
- Připoj oba nástroje

**4. Číslo**
Phone Numbers → kup nebo připoj české číslo (přes SIP trunk / Twilio) → přiřaď asistenta.

**5. Test**
Projeď `05-testovaci-scenare.md`. Minimálně T1, T2, T8 a T9 než pustíš linku ven.

---

## Co ještě ověř přímo u LOMAXu

Prompt staví na veřejně dostupných informacích z webu. **Před ostrým provozem si nech od LOMAXu potvrdit:**

- [ ] **Cílová e-mailová adresa servisu** — v šablonách je zástupné `servis@lomax.cz`
- [ ] **Jak se k technikovi dostanou fotky závady** — bot e-mail nesbírá, takže si o fotku musí říct technik při zpětném volání. Pokud LOMAX chce fotky dřív, nejjednodušší je z Make poslat zákazníkovi SMS s odkazem na nahrávací formulář
- [ ] **Telefonní číslo pro předání zákazníka** — v promptu je `519 304 040` (recepce). Pokud má servis vlastní linku, přepiš ji v promptu na **všech místech** (sekce 3.4, 7.4, 7.5, 7.11, 7.12)
- [ ] **Záruční podmínky v sekci 3.2** — údaje jsou z webu, ale záruky se mění. Ať je schválí někdo z LOMAXu, nebo tu sekci úplně smaž a bot bude na dotazy odpovídat „to posoudí technik"
- [ ] **Zda se má poptávka směrovat automaticky na zastoupení podle PSČ** — pokud LOMAX má tabulku PSČ → zastoupení, přidej ji do Make jako Data Store a e-mail chodí rovnou správnému partnerovi
- [ ] **Jestli mají interní systém (CRM, helpdesk)** — pak do Make přidej větev, která tam poptávku založí přes API, a e-mail zůstane jen jako notifikace

---

## GDPR

Bot sbírá osobní údaje, takže:

1. **Souhlas** si vyžádá v hovoru (krok 6 promptu) a bez něj poptávku neodešle.
2. **Nahrávání hovoru** je v `03-vapi-assistant-config.json` zapnuté. Buď ho vypni (`recordingEnabled: false`), nebo uprav první větu na:
   > „Dobrý den, tady Klára ze servisu LOMAX. Hovor je nahráván kvůli kvalitě služeb. Jak vám můžu pomoci?"
3. **Bot nikdy nežádá** rodné číslo, číslo OP, číslo účtu ani platební údaje — je to v zakázaném chování.
4. **Telefon se nesbírá diktováním** — bere se z caller ID hovoru. Bot se na číslo zeptá jen tehdy, když volající své číslo skryl.
5. **Doplň informaci o hlasové lince** do zásad ochrany osobních údajů na lomax.cz.

---

## Ladění, když něco nefunguje

| Problém | Řešení |
|---|---|
| Bot komolí telefonní čísla a PSČ | Změň transcriber na Azure `cs-CZ`; zvyš `onNumberSeconds` na `0.8` |
| Bot skáče zákazníkovi do řeči | Zvyš `startSpeakingPlan.waitSeconds` na `0.7`, `onNoPunctuationSeconds` na `1.8` |
| Bot mluví moc dlouho | Sniž `maxTokens` na 250, v promptu zvýrazni pravidlo „maximálně 2 věty" |
| Nezavolá nástroj | Zkontroluj, že je nástroj připojený k asistentovi; sniž temperature na `0.2`; přidej do KROKU 7 promptu důraznější formulaci |
| VAPI hlásí timeout nástroje | Make scénář nemá poslední modul *Webhook response*, nebo běží déle než 25 s — zkrať ho a těžké kroky (Sheets, CRM) dej až za response |
| Hlas zní roboticky | ElevenLabs `eleven_flash_v2_5` + `optimizeStreamingLatency: 3` |
| E-mail chodí prázdný | V Make mapuješ špatnou cestu — data jsou v `message.toolCalls[0].function.arguments`, ne v kořeni payloadu |

---

## Zdroje

- [LOMAX — hlavní web](https://www.lomax.cz/)
- [Servisní poptávka](https://www.lomax.cz/servis.html)
- [Záruky a garance](https://www.lomax.cz/zaruky-garance)
- [Kontakt](https://www.lomax.cz/kontakt)
- [Sídlo firmy a fakturační údaje](https://www.lomax.cz/kontakt/sidlo-firmy-a-fakturacni-udaje.html)
