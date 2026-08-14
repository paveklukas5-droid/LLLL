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

Formulář v sekci Kontakt zatím nemá backend — po odeslání otevře e-mailový
klient s předvyplněnou zprávou na `contact.sonity@gmail.com`. Pro reálné
odesílání bez otevírání e-mailového klienta lze později napojit službu typu
Formspree, EmailJS nebo vlastní backend endpoint.

## Logo

Originální logo bylo dodáno jako rastrový obrázek (PNG). Pro web bylo
znovu vytvořeno jako SVG (`assets/logo.svg`), aby bylo ostré na všech
rozlišeních. Pokud máte oficiální vektorový soubor loga (SVG/AI/EPS),
nahraďte jím tento soubor pro 100% přesnou shodu se značkou.
