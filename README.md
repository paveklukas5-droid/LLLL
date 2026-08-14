# Sonity — web

Statický jednostránkový web pro firmu Sonity (AI automatizace a asistenti na míru).

## Struktura

```
index.html      hlavní stránka (Domů, O nás, Služby, Kontakt)
css/styles.css  veškeré styly
js/script.js    mobilní menu, scroll animace, odesílání kontaktního formuláře
assets/logo.svg logo znovu vytvořené jako vektor (S + šipka) podle dodané grafiky
```

## Spuštění lokálně

Web nepotřebuje žádný build krok ani server — stačí otevřít `index.html`
v prohlížeči, nebo pro lokální vývoj spustit jednoduchý server:

```bash
python3 -m http.server 8000
```

a otevřít `http://localhost:8000`.

## Kontaktní formulář

Formulář je napojený na **Netlify Forms** (`data-netlify="true"` na
`<form>`) — funguje automaticky po nasazení na Netlify, bez backendu.
Netlify sám sbírá odeslání a umí je posílat e-mailem (nastavíte v
Netlify → Site settings → Forms → Form notifications). Pokud web
neběží na Netlify (např. lokální náhled), formulář se sám přepne na
záložní `mailto:` odkaz.

## Logo

Originální logo bylo dodáno jako rastrový obrázek (PNG). Pro web bylo
znovu vytvořeno jako SVG (`assets/logo.svg`), aby bylo ostré na všech
rozlišeních. Pokud máte oficiální vektorový soubor loga (SVG/AI/EPS),
nahraďte jím tento soubor pro 100% přesnou shodu se značkou.

## Nasazení na Netlify

1. Založte si účet na [netlify.com](https://www.netlify.com) (jde přes GitHub účet).
2. „Add new site" → „Import an existing project" → vyberte tento GitHub repozitář a větev.
3. Build command nechte prázdný, publish directory nastavte na `.` (kořen repozitáře) — web je statický, nic se nebuildí.
4. Deploy. Netlify automaticky rozpozná `<form data-netlify="true">` v `index.html` a začne sbírat odeslání.
5. V Site settings → Forms → Form notifications si nastavte e-mailové upozornění na nové poptávky.
6. V Site settings → Domain management připojíte vlastní doménu (sonity.cz), jakmile ji budete mít koupenou.
