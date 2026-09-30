# Hobbytec — hlasový agent na reklamace

Asistentka **Markéta** pro Hobbytec (výrobce hliníkových pergol, zimních zahrad, přístřešků a garáží + e-shop vybavení pro dům a zahradu, https://www.hobbytec.cz/). Čtvrtý projekt ve stejné řadě jako LOMAX, OKNOTHERM a RD Rýmařov.

**Začni v `06-navod-a-testy.md`.**

| Soubor | K čemu |
|---|---|
| `01-system-prompt.md` | Prompt (cca 9 000 znaků, záměrně kompaktní kvůli rychlosti). |
| `02-vapi-tools.json` | Nový nástroj `odeslat_reklamaci_hobbytec` + `ukoncit_hovor`. |
| `03-vapi-assistant-config.json` | Kontrolní seznam nastavení asistenta (duplikuješ z LOMAXu). |
| `04-make-scenar.md` | Popis živého Make scénáře (id 7683216). |
| `05-parametry.json` | **Čistý JSON pro pole Parameters** (19 polí, 11 povinných, podle jejich formuláře). |
| `06-navod-a-testy.md` | Postup, ověření dat, testovací hovory. |
| `07-vytvorit-tool.sh` | Založení nástroje přes API (nejspolehlivější). |

## Co je jiné oproti ostatním projektům

- **Pole jsou 1:1 podle jejich oficiálního reklamačního formuláře** (E-mail, Objednatel, Adresa, Telefon, Číslo smlouvy, Datum prodeje, Zboží, Druh závady, Popis, Foto/video). Bot je zákazníkovi klade ve stejném pořadí.
- **Bot reklamaci zapíše celou sám.** Zákazník po hovoru nic nevyplňuje ani neposílá, žádný e-mail zákazníkovi nechodí. Foto/video po telefonu nejde, takže si je případně vyžádá reklamační tým.
- **GDPR:** e-mail kolegům neobsahuje přepis ani citace hovoru, jen strukturované údaje. Bez modrého a žlutého pruhu (červený jen při bezpečnostním riziku).
- **Vrácení zboží** není reklamace: bot nástroj nevolá a odkáže na info e-mail.
- **Poškozená zásilka** (druh závady „poškozené") má pokyn: dva pracovní dny přepravci, zápis u řidiče.
- **Záruka se liší podle modelu**, bot žádnou délku neříká.
- **Make scénář se sám hlídá proti prázdným datům**: záložní zdroj polí, automatický druhý pokus bota a upozornění „[PRÁZDNÁ DATA]" s telefonem volajícího (viz `04-make-scenar.md`).

## Otevřené věci k ověření

- Fakta o lhůtách a záruce jsou z vyhledávání, web byl blokovaný. Ověř kontakty, lhůty, záruky.
- Ve světě Hobbytec jsou i jiné firmy (Hobbytec Home s.r.o., hobbytec-home.cz). Tenhle projekt je jen pro hobbytec.cz.
- Výslovnost „Hobytek" je odhad, poslechni první větu.
- E-mail kolegům jde z připojeného Gmailu (chatbotique) na `paveklukas5@gmail.com`; pro ostrý provoz přepsat příjemce a ideálně odesílat z domény Hobbytec.
