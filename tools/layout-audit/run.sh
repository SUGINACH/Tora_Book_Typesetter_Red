#!/usr/bin/env bash
# tools/layout-audit/run.sh — אודיט עימוד בדפדפן אמיתי (03.11(ד))
#
# שקיפות עימוד מהקוד: מגיש את האפליקציה (red-build/ui) בשרת מקומי, פותח
# דפדפן headless דרך agent-browser, טוען את ספר המבחן של IMUD, מעמד,
# ומריץ את audit-in-page.js בתוך הדף. יציאה 0 = אפס בעיות; יציאה 1 = יש
# בעיות (הדוח המלא ב-$LAYOUT_AUDIT_OUT).
#
# דרישות: node, python3, agent-browser (npm i -g agent-browser && agent-browser install).
# שימוש: bash tools/layout-audit/run.sh   (משורש הריפו)
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UI="$ROOT/red-build/ui"
PORT="${LAYOUT_AUDIT_PORT:-8931}"
FIXTURE="${LAYOUT_AUDIT_FIXTURE:-$ROOT/red-build/tests/fixtures/imud_default_text.txt}"
OUT="${LAYOUT_AUDIT_OUT:-/tmp/layout-audit-report.json}"

command -v agent-browser >/dev/null 2>&1 || { echo "חסר agent-browser — התקן: npm i -g agent-browser && agent-browser install"; exit 2; }
[ -f "$FIXTURE" ] || { echo "חסר fixture: $FIXTURE"; exit 2; }

rm -f "$OUT"

cd "$UI"
python3 -m http.server "$PORT" >/tmp/layout-audit-http.log 2>&1 &
HTTP_PID=$!
trap 'kill $HTTP_PID 2>/dev/null; rm -f "$UI/_layout-audit.js"; agent-browser close >/dev/null 2>&1' EXIT
sleep 1

B64="$(base64 -w0 "$FIXTURE")"

agent-browser open "http://localhost:$PORT/index.html" >/dev/null || exit 2
agent-browser wait 3500 >/dev/null

# טעינת הספר + עימוד + מעבר לתצוגה — הנתיב החי האמיתי
READINESS="$(agent-browser eval "(async()=>{ const app = window.__toraApp; if(!app) return 'NO_APP';
  const ta = document.querySelector('textarea'); if(!ta) return 'NO_TEXTAREA';
  const bytes = Uint8Array.from(atob('$B64'), c=>c.charCodeAt(0));
  ta.value = new TextDecoder('utf-8').decode(bytes);
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  await new Promise(r=>setTimeout(r,400));
  app.onExplicitRetypeset();
  await new Promise(r=>setTimeout(r,3000));
  for (const t of document.querySelectorAll('[role=tab],.tab,button')) if (/תצוגה/.test(t.textContent)) t.click();
  await new Promise(r=>setTimeout(r,1500));
  return 'READY_' + app.getState().pages + '_pages';
})()" 2>&1 | tail -1)"
echo "$READINESS"

# הזרקת האודיט (הסקריפט מוגש עם ה-UI ונטען ב-fetch — ללא בעיות escaping)
cp "$ROOT/tools/layout-audit/audit-in-page.js" "$UI/_layout-audit.js"
agent-browser eval "(async()=>{ const t = await (await fetch('/_layout-audit.js')).text(); return eval(t); })()" > "$OUT" 2>/dev/null
rm -f "$UI/_layout-audit.js"

if [ ! -s "$OUT" ]; then echo "✗ האודיט לא הפיק דוח"; exit 2; fi

echo "──────────────────────────────────────────────"
echo "דוח אודיט עימוד (דפדפן אמיתי):"
python3 - "$OUT" << 'PYEOF'
import json, sys
raw = open(sys.argv[1]).read().strip()
if raw.startswith('"'):
    raw = json.loads(raw)
d = json.loads(raw)
s = d.get('summary', {})
print(f"  עמודים: {s.get('pages')} (שערים: {s.get('shaarPages')}) | שורות: {s.get('totalLines')}")
print(f"  כותרות עליונות בעמודי תוכן: {s.get('bodyPagesWithHeader')}")
print(f"  גופנים בפועל: {', '.join(d.get('observedFonts', []))}")
print(f"  בעיות: {s.get('problems')} {s.get('bySeverity', '')}")
for p in d.get('problems', [])[:10]:
    print(f"    - [{p.get('severity')}] {p.get('type')} (עמוד {p.get('page', '-')})"
          + (f": {p.get('a','')} ↔ {p.get('b','')}" if p.get('type') == 'LINE_OVERLAP' else ''))
sys.exit(1 if s.get('problems', 0) else 0)
PYEOF
RC=$?
echo "──────────────────────────────────────────────"
[ $RC -eq 0 ] && echo "✓ אודיט עימוד עבר — אפס בעיות" || echo "✗ יש בעיות עימוד — הדוח המלא: $OUT"
exit $RC
