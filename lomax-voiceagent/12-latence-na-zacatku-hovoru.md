# Latence na začátku hovoru (zpětná vazba od klienta)

Klient testoval živou linku a hlásil znatelnou latenci **na začátku
konverzace** — pak se to (jeho slovy) "rozjelo" a bylo to v pohodě. Tenhle
soubor popisuje diagnózu a co jsem opravil.

## Co jsem opravil

Systémový prompt měl na **úplném začátku**, hned za úvodním odstavcem,
řádek:

```
Aktuální datum a čas: {{now}}
```

To je problém kvůli tomu, jak funguje prompt caching u Anthropicu (a přes
VAPI se predává dál k Anthropicu beze změny): cache funguje na **shodném
prefixu** promptu. Když je hned na začátku dynamická hodnota, která se mění
prakticky u každého hovoru (přesný čas na sekundy), **nikdy se nemůže
sdílet cache mezi dvěma různými hovory** — velký statický blok pravidel,
znalostí a příkladů (řádově tisíce tokenů) se tak u každého jednoho hovoru
musí zpracovat znovu od nuly, místo aby se využila cache z předchozího
volání.

**Oprava:** `{{now}}` jsem přesunul z úplného začátku promptu na úplný
konec (za "11. ZLATÉ PRAVIDLO"). Zbytek promptu je teď u každého hovoru
bajtově identický, takže se statický prefix může cachovat a sdílet mezi
voláními, která jdou v krátkém sledu po sobě (cache u Anthropicu drží
typicky několik minut).

## Co tahle oprava vyřeší a co ne

- **Vyřeší:** latenci u druhého, třetího... hovoru, pokud jdou v krátkém
  časovém odstupu po prvním (typický průběh testování, kdy klient zavolá
  vícekrát za sebou).
- **Nevyřeší úplně:** úplně první hovor po delší pauze (přes noc, po
  několika minutách ticha) bude mít pořád nějaké zahřívací zpoždění — to je
  kombinace studeného startu modelu, hlasové syntézy (Azure) a
  transkripce (Deepgram), což je na straně VAPI/poskytovatelů a podle
  jejich vlastní dokumentace na to momentálně není žádný "warm-up"
  mechanismus, který by šlo zapnout.

**Praktické doporučení pro důležité demo/testování:** pár minut před tím,
než bude klient/testér volat, si sám jednou zavolej (klidně jen "ahoj a
zavěsím") — zahřeje to spojení k Deepgramu/Azure a s opravou výše má šanci
zahřát i cache promptu, takže klientův hovor pak bude rychlý od první
věty.

## DŮLEŽITÉ — musíš to ručně promítnout do živého asistenta

Tahle oprava je jen v souboru `01-system-prompt.md` v repozitáři. **Nic se
neaktualizuje samo** — do živého VAPI asistenta, který klient testoval,
musíš ručně vložit nový obsah `01-system-prompt.md` (Dashboard → tvůj
asistent → System Prompt → přepsat celý obsah, nebo přes API `PATCH
/assistant/{id}`).
