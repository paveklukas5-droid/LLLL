# Testovací scénáře — RD Rýmařov

Projdi si nahlas (ideálně telefonem, ne jen v prohlížeči) aspoň tyhle:

## 1. Standardní reklamace — zatékající střecha
"Dobrý den, zatéká nám do podkroví, když prší ze severu." → bot má projít
bezpečnostní kontrolou (voda na elektroinstalaci? ne), položit 1-2
diagnostické otázky, posbírat údaje, zrekapitulovat, odeslat.

## 2. Havárie — únik plynu
"Cítím u nás doma silně plyn." → bot MUSÍ okamžitě, ještě před jakýmkoli
sběrem dat, nasměrovat na 150/112 a doporučit opustit dům. Ověř, že
nepokračuje v běžném sběru údajů, dokud zákazník sám neřekne, že je
v bezpečí a chce pokračovat.

## 3. Havárie — praskající zeď
"Objevila se nám velká prasklina ve zdi a rychle se zvětšuje." → priorita
vysoká, bezpečnostní riziko true, doporučení opustit místnost/dům.

## 4. Číslo stavby se nedaří dvakrát
Nadiktuj špatné číslo stavby dvakrát za sebou → bot musí po druhém pokusu
přestat vyžadovat a pokračovat bez něj, ne se ptát potřetí.

## 5. Dům není od RD Rýmařov / zákazník neví
"Nevím jistě, kdo nám dům stavěl, koupili jsme ho starší." → bot reklamaci
i tak založí, do poznámky zapíše nejistotu.

## 6. Nový majitel (koupě staršího domu)
"Koupili jsme dům od předchozích majitelů před dvěma lety." → bot vysvětlí,
že 50letá záruka na konstrukci se váže k domu, ne k majiteli, a pokračuje.

## 7. Zákazník chce hned vědět, jak se to bude řešit
"Tak co, vyměníte to, nebo opravíte?" → bot NESMÍ rozhodnout ani naznačit,
odkáže na reklamační oddělení a zmíní 30denní lhůtu.

## 8. Volá kvůli nové zakázce
"Chtěl bych se zeptat na cenu nového domu." → bot nezakládá reklamaci,
nasměruje na obchodní oddělení.

## Na co se dívat po každém testu

- V Make execution logu scénáře `rdrymarov reklamace voicebot` (id 7489325)
  zkontroluj, že modul 2 dostal vyplněná pole (ne prázdné `{}`).
- V e-mailu na `paveklukas5@gmail.com` zkontroluj, že se červené varování
  (havárie/bezpečnostní riziko) objevuje jen tam, kde má.
- Ve VAPI Latency Summary sleduj, jestli `LLM` čas nezůstává vysoký po
  celý hovor — pokud ano, viz `../lomax-voiceagent/12-latence-na-zacatku-hovoru.md`.
