# Návod: Instalace chatbota na web

Tento kód přidá na web chatovacího asistenta pro nemovitosti a uvítací
bublinu, která se sama objeví pár vteřin po načtení stránky a zve
návštěvníka ke kliknutí. Po kliknutí (nebo po otevření chatu jakkoli
jinak) bublina zmizí.

Nic dalšího se nastavovat nemusí — chatbot je už hotový a nastavený,
stačí kód vložit na web.

---

## Co budete potřebovat

- přístup do administrace webu (nebo kontakt na toho, kdo web spravuje)
- přiložený kód (soubor s koncovkou `.html`, nebo kód přímo v této zprávě)

---

## Kam kód vložit

Kód se vkládá **na každou stránku webu najednou**, do patičky, těsně
před uzavírací značku `</body>`. Tam se obvykle vkládají i podobné
kódy jako Google Analytics nebo Facebook Pixel — pokud něco takového
na webu už je, kód patří vedle toho.

### WordPress
1. Nejjednodušší a nejbezpečnější cesta je plugin **WPCode** nebo
   **Insert Headers and Footers** (zdarma, v repozitáři pluginů).
2. Po instalaci: vložte kód do pole **Footer** (patička) — projeví se
   automaticky na všech stránkách webu.
3. Bez pluginu: **Vzhled → Editor motivu → footer.php**, vložit kód
   těsně před `</body>`. (Doporučujeme raději plugin — při aktualizaci
   šablony se úprava souboru snadno ztratí.)

### Webflow
1. **Project Settings → Custom Code**
2. Kód vložte do pole **Footer Code**.
3. Nezapomeňte web znovu **publikovat**, jinak se změna neprojeví.

### Wix
1. **Nastavení webu → Vlastní kód** (Custom Code)
2. Přidat kód, umístění **Konec body (Body – end)**, aplikovat na
   **všechny stránky**.

### Shoptet
1. **Vzhled → Nastavení šablony → Vlastní HTML/JS kód** (přesný název
   sekce se liší podle šablony).
2. Vložit do sekce, která se vykresluje v patičce.

### Jiná platforma nebo vlastní web na míru
Stačí poslat kód správci webu se vzkazem:

> „Vlož prosím tento kód na všechny stránky webu, do patičky, těsně
> před uzavírací značku `</body>`."

---

## Jak ověřit, že to funguje

1. Otevřete web — nejlépe v **anonymním/inkognito okně** prohlížeče,
   ať výsledek neovlivní předchozí testování.
2. Počkejte cca 5 vteřin — vpravo dole by se měla objevit tmavá
   bublina s textem.
3. Klikněte na ni — měl by se otevřít chat a bublina zmizet.
4. To samé zkontrolujte i na mobilu — bublina by měla sedět pěkně nad
   ikonkou chatu, ne pod ní ani přes ni.

---

## Co dělat, když se něco nezdá

- **Bublina se neukázala vůbec** — zkuste anonymní okno. Prohlížeč si
  totiž pamatuje, že ji návštěvník už jednou zavřel, a 24 hodin ji
  znovu nenabízí (aby lidi neotravovala při každém načtení stránky).
- **Kód nejde vložit přesně před `</body>`** — nevadí, funguje i jinde
  na stránce, jen se může spustit o zlomek vteřiny později.
- **Chatbot nebo bublina se objeví dvakrát** — kód byl vložen na dvou
  místech zároveň (např. v šabloně i v pluginu současně). Stačí ho
  nechat jen na jednom místě.
