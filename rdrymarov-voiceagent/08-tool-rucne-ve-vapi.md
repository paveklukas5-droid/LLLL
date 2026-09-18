# Založení nástrojů ručně v VAPI dashboardu

VAPI dashboard neumí vložit JSON celého nástroje najednou — jen JSON schéma
pole **Parameters**. Tenhle návod je pro klikání ve formuláři, bez API.

## 1. `odeslat_reklamaciv2` (hlavní nástroj)

1. **Tools → Create Tool → Function**
2. **Name**: `odeslat_reklamaciv2`
3. **Description** (textové pole): zkopíruj z `02-vapi-tools.json` klíč
   `function.description`.
4. Zapni **Strict Mode**.
5. **Parameters** → přepni na **JSON** → smaž výchozí obsah → vlož **celý**
   obsah souboru `05-parametry.json`.
6. **Server URL**: `https://hook.eu1.make.com/vsqv4e6km52dihhfg45ak9ex9qhdrpj8`
   (Make scénář je živý a otestovaný, viz `04-make-scenar.md`.)
7. **Messages** (nastav ručně přes UI, ne přes JSON):
   - **Request Start** (non-blocking): „Zakládám vám reklamaci, moment prosím."
   - **Request Complete**: „Hotovo, reklamaci mám odeslanou."
   - **Request Failed**: „Omlouvám se, systém mi teď reklamaci nepřijal. Zkusím to ještě jednou."
   - **Request Response Delayed** (8000 ms): „Ještě to zpracovávám, děkuji za trpělivost."
8. **Response Body / Aliases**: nech prázdné, nepoužíváme (viz vysvětlení
   v hlavním chatu s Klaudem — jsou to jen extraktory proměnných pro
   navazující kroky workflow, které tady nemáme).
9. **Save.**

## 2. `ukoncit_hovor` (End Call)

1. **Create Tool → End Call**
2. **Name**: `ukoncit_hovor`
3. **Description**: zkopíruj z `02-vapi-tools.json`.
4. **Messages → Request Start**: „Děkuji za zavolání a přeji hezký den. Na shledanou."

## 3. `prepojit_na_operatora` (volitelné)

Zakládej jen pokud máš živou servisní linku, na kterou se dá přepojit.
Jinak tenhle nástroj úplně vynech.

1. **Create Tool → Transfer Call**
2. **Name**: `prepojit_na_operatora`
3. **Destination**: `+420554252127`
4. **Description** a **Message**: zkopíruj z `02-vapi-tools.json`.

## 4. Připojení k asistentovi

Assistant → Model → **Tools** → přidej `odeslat_reklamaciv2` a `ukoncit_hovor`
(a `prepojit_na_operatora`, pokud jsi ho založil/a). Ulož ID nástrojů, budeš
je potřebovat i v `model.toolIds` v `03-vapi-assistant-config.json`, pokud
konfiguruješ asistenta přes API místo dashboardu.
