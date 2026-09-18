#!/usr/bin/env bash
# Založí nástroje pro RD Rýmařov servisního voicebota přímo ve VAPI přes API.
# Náhrada za klikání ve formuláři (VAPI dashboard neumí vložit JSON celého nástroje,
# jen JSON schéma "parameters" - viz 05-parametry.json a 08-tool-rucne-ve-vapi.md).
#
# Použití:
#   1) doplň VAPI_KEY níže
#   2) chmod +x 07-vytvorit-tool.sh && ./07-vytvorit-tool.sh
#
# POZOR: nikdy necommituj tento soubor s vyplněným klíčem.

set -euo pipefail

VAPI_KEY="TVUJ_VAPI_PRIVATE_KEY"
MAKE_WEBHOOK="https://hook.eu1.make.com/vsqv4e6km52dihhfg45ak9ex9qhdrpj8"

echo "→ Zakládám nástroj odeslat_reklamaciv2…"

curl -sS -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer ${VAPI_KEY}" \
  -H "Content-Type: application/json" \
  -d @<(python3 -c "
import json
with open('02-vapi-tools.json') as f:
    data = json.load(f)
print(json.dumps(data['tools'][0]))
")

echo
echo "→ Zakládám nástroj ukoncit_hovor…"

curl -sS -X POST https://api.vapi.ai/tool \
  -H "Authorization: Bearer ${VAPI_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"type":"endCall","function":{"name":"ukoncit_hovor","description":"Ukonci hovor. Volej az po rozlouceni se zakaznikem, nikdy uprostred jeho vety. Pouzij take po pokynu k okamzitemu opusteni domu pri havarii, nebo kdyz se nedari navazat komunikaci."},"messages":[{"type":"request-start","content":"Děkuji za zavolání a přeji hezký den. Na shledanou."}]}'

echo
echo "✓ Hotovo. Zkopíruj si z odpovědí hodnoty \"id\" a připoj nástroje k asistentovi (model.toolIds v 03-vapi-assistant-config.json)."
