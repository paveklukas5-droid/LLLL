#!/usr/bin/env bash
# Založí NOVÝ nástroj odeslat_reklamaci_hobbytec ve VAPI přes API.
# Proč přes API: pořadí polí a nastavení "strict" se uloží přesně tak, jak je v JSON
# (dashboard si klíče po uložení přeskládá). Je to nejspolehlivější cesta.
#
# Použití (spusť ve složce hobbytec-voiceagent):
#   1) doplň VAPI_KEY
#   2) chmod +x 07-vytvorit-tool.sh && ./07-vytvorit-tool.sh
#   3) z odpovědi si zkopíruj "id" a připoj nástroj k asistentovi (Model -> Tools)
#
# POZOR: nikdy necommituj tento soubor s vyplněným klíčem.

set -euo pipefail
VAPI_KEY="TVUJ_VAPI_PRIVATE_KEY"

curl -sS -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer ${VAPI_KEY}" \
  -H "Content-Type: application/json" \
  -d @<(python3 -c "
import json
with open('02-vapi-tools.json') as f:
    print(json.dumps(json.load(f)['tools'][0]))
")
echo
echo "Hotovo. Ulož si id nástroje z odpovědi."
