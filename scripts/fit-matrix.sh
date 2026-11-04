#!/bin/bash
# מטריצת ניסויים S4.19: מודל התאמת-DOM לעומת אריתמטיקה מדויקת
set -e
cd /home/z/my-project/Tora_Book_Typesetter_Red
run_one () {
  local label="$1"; shift
  env "$@" node tools/layout-parity/run-ours.js > /tmp/fit-run.log 2>&1 || { echo "$label: RUN FAILED"; return; }
  python3 tools/layout-parity/compare.py \
    audits/layout-reference.json \
    audits/layout-parity-artifacts/ours-model.json \
    audits/layout-parity-artifacts/ours.pdf \
    "/tmp/parity-$label.json" > /tmp/fit-cmp.log 2>&1 || true
  python3 - "$label" <<'EOF'
import json, sys
label = sys.argv[1]
try:
    r = json.load(open(f"/tmp/parity-{label}.json"))
    s = r["summary"]
    p7 = next((c for c in r["checks"] if c.get("id") == "P7"), None)
    p6 = next((c for c in r["checks"] if c.get("id") == "P6"), None)
    h4 = next((c for c in r["checks"] if c.get("id") == "H4"), None)
    p7v = p7.get("ratio") if p7 else "?"
    p6d = f" P6={p6.get('refCount')}/{p6.get('oursCount')} lm={p6.get('linesMatch')}" if p6 else ""
    h4d = f" H4reach={h4.get('reachPct')}" if h4 else ""
    print(f"{label:>12}: score={s['score']}% P7={p7v}{p6d}{h4d}")
except Exception as e:
    print(f"{label:>12}: PARSE FAIL {e}")
EOF
}
run_one dom-round   RED_FIT_MODEL=dom RED_FIT_ROUND=round
run_one dom-floor   RED_FIT_MODEL=dom RED_FIT_ROUND=floor
run_one dom-ceil    RED_FIT_MODEL=dom RED_FIT_ROUND=ceil
run_one dom-m0      RED_FIT_MODEL=dom RED_FIT_ROUND=round RED_FIT_MARGIN=0
run_one exact       RED_FIT_MODEL=exact
