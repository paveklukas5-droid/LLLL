# Přehledový dokument nabídky pro knowledge base

Řeší slepé místo, kvůli kterému bot neuměl odpovědět na „Jaké nemovitosti nabízíte?".
Jednotlivé stránky inzerátů popisují vždy jen jednu nemovitost — **žádná stránka neobsahuje
celou nabídku**, takže vyhledávání v knowledge base na tak široký dotaz nemá co najít.
Tenhle dokument tu díru zaceluje.

## Jak to funguje

```
GitHub Actions (denně 5:20)
   └─ node tools/generate-nabidka.mjs
        ├─ zkusí WP REST API  → /wp-json/wp/v2/<typ nemovitosti>
        └─ jinak sitemap.xml  → detailní stránky /nemovitost/…
   └─ zapíše kb/nabidka-prehled.md a commitne, jen když se něco změnilo
```

Výsledný soubor je pak na stabilní adrese:

```
https://raw.githubusercontent.com/paveklukas5-droid/LLLL/claude/realitni-kancelar-chatbot-dintiz/chatbot-realitni-kancelar/kb/nabidka-prehled.md
```

Tuhle URL přidejte do knowledge base jako další zdroj. Denní obnova KB si pak sama
natáhne aktuální verzi.

## Než to poprvé pustíte

Web `zdenekstourac.cz` je z prostředí, kde skript vznikal, blokovaný egress politikou,
takže **skutečnou strukturu dat jsem neověřil** — parser je postavený na tom, jak vypadají
názvy inzerátů (`Prodej bytu 3+1, 74 m², Brno-Žabovřesky`) a otestovaný na vzorku takových
názvů. GitHub Actions se na web dostane bez problémů, ale nejdřív si ověřte, co skript najde:

```bash
node tools/generate-nabidka.mjs --probe
```

Vypíše, který zdroj zabral, kolik nemovitostí našel a prvních pět záznamů rozparsovaných
na pole. Když u některého pole (cena, dispozice, výměra, lokalita) upozorní, že ho nevyčetl
u většiny záznamů, pošlete ten výpis — doladím parser podle reálných dat.

Ruční spuštění: záložka **Actions → Přehled nabídky pro knowledge base → Run workflow**.

## Nastavení

| Proměnná | Výchozí | K čemu |
|---|---|---|
| `SITE_URL` | `https://www.zdenekstourac.cz` | web, ze kterého se čte nabídka |
| `OUT_FILE` | `chatbot-realitni-kancelar/kb/nabidka-prehled.md` | kam se zapíše výsledek |

## Co dokument obsahuje

- **Sekce „Na jaké otázky tento dokument odpovídá"** — schválně obsahuje formulace, kterými
  se lidé ptají. Vyhledávání v knowledge base pracuje s podobností textu, takže tenhle
  odstavec je to, co dotaz „Jaké nemovitosti nabízíte?" konečně chytí.
- **Souhrn** — počty podle druhu, kolik je volných, cenové rozpětí zvlášť pro prodej
  a zvlášť pro nájmy, výčet lokalit.
- **Seznam** seskupený podle druhu, u každé nemovitosti dispozice, výměra, lokalita, cena,
  stav dostupnosti a odkaz na detail.

Díky souhrnu bot poprvé vidí celou nabídku najednou, takže zvládne i „máte něco 3+1 v Brně"
a „máte něco do 6 milionů" — což přes jednotlivé inzeráty nešlo.

## Alternativa bez GitHubu

Pokud jste na WordPressu, elegantnější varianta je nechat stejný přehled vykreslovat jako
**stránku přímo na webu** (např. `/prehled-nabidky/`) z existujících příspěvků. Je vždycky
živá, nic se nesynchronizuje, nic neběží na cronu — a knowledge base ji nabere sama při
denním průchodu webu, protože je na vaší doméně. Řekněte si, jestli to chcete, napíšu k tomu
snippet.
