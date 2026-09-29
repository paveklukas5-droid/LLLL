# Hobbytec — hlasový agent na reklamace

Asistentka **Markéta** pro Hobbytec (výrobce hliníkových pergol, zimních zahrad a přístřešků + e-shop vybavení pro dům a zahradu, https://www.hobbytec.cz/). Čtvrtý projekt ve stejné řadě jako LOMAX, OKNOTHERM a RD Rýmařov.

**Začni v `06-navod-a-testy.md`.**

| Soubor | K čemu |
|---|---|
| `01-system-prompt.md` | Prompt (cca 8 900 znaků, záměrně kompaktní kvůli rychlosti). |
| `02-vapi-tools.json` | Nový nástroj `odeslat_reklamaci_hobbytec` + `ukoncit_hovor`. |
| `03-vapi-assistant-config.json` | Kontrolní seznam nastavení asistenta (duplikuješ z LOMAXu). |
| `04-make-scenar.md` | Popis živého Make scénáře (id 7683216). |
| `05-parametry.json` | **Čistý JSON pro pole Parameters** (20 polí, 10 povinných). |
| `06-navod-a-testy.md` | Postup, ověření dat, testovací hovory. |
| `07-vytvorit-tool.sh` | Založení nástroje přes API (nejspolehlivější). |

## Co je jiné oproti ostatním projektům

- **Jejich reklamace je jen e-mailem** (faktura + reklamační list + fotky, do 48 hodin od zjištění vady). Bot proto zapíše údaje a zákazníka navede, co má poslat. Neříká „zakládám reklamaci".
- **Poškozená zásilka** má vlastní větev (dva pracovní dny přepravci, zápis u řidiče).
- **Záruka se liší podle modelu**, bot žádnou délku neříká.
- **Make scénář se sám hlídá proti prázdným datům**: záložní zdroj polí, přepis toho, co zákazník řekl, a automatický druhý pokus bota (viz `04-make-scenar.md`).

## Otevřené věci k ověření

- Fakta jsou z vyhledávání, web byl blokovaný. Ověř kontakty, lhůty, záruky.
- Ve světě Hobbytec jsou i jiné firmy (Hobbytec Home s.r.o., hobbytec-home.cz). Tenhle projekt je jen pro hobbytec.cz.
- Výslovnost „Hobytek" je odhad, poslechni první větu.
