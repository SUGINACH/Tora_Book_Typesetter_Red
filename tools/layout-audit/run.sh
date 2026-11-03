#!/usr/bin/env bash
# tools/layout-audit/run.sh — אודיט עימוד בדפדפן אמיתי (03.11(ד); S4.11)
#
# שקיפות עימוד מהקוד: מגיש את האפליקציה (red-build/ui) בשרת מקומי, פותח
# דפדפן headless דרך agent-browser, טוען את ספר המבחן, מעמד, ומריץ את
# audit-in-page.js בתוך הדף. יציאה 0 = אפס בעיות; יציאה 1 = יש בעיות
# (הדוח המלא ב-$LAYOUT_AUDIT_OUT); יציאה 2 = כשל תשתית.
#
# **S4.11 (בקשת המשתמש: "כל הבדיקות צריכות להיעשות על הקובץ ה'גדול מאוד'"):**
#   1. הזרקת הטקסט עברה מ-base64 בארגומנט שורת-פקודה (מגבלת לינוקס
#      MAX_ARG_STRLEN=128KB — קובץ של 3.4MB היה נכשל) ל-fetch מ-URL שהשרת
#      המקומי מגיש. עכשיו כל גודל קובץ עובר.
#   2. המתנת המוכנות עברה מ-sleep קבוע (3 שניות) ל-polling של מצב האפליקציה
#      עד שהעימוד הושלם (ספרים גדולים לוקחים יותר מ-3 שניות).
#   3. האודיט עצמו (audit-in-page.js) מודע-וירטואליזציה: סורק את הספר
#      בגלילה ומבקר כל עמוד כשהוא חי ב-DOM, עם בדיקת כיסוי מלא.
#
# דרישות: node, python3, agent-browser (npm i -g agent-browser && agent-browser install).
# משתני סביבה:
#   LAYOUT_AUDIT_FIXTURE          — קובץ הטקסט לבדיקה (ברירת מחדל: ה-fixture הקטן)
#   LAYOUT_AUDIT_READY_TIMEOUT_MS — פסק זמן להמתנת סיום העימוד (ברירת מחדל: 240000)
# שימוש: bash tools/layout-audit/run.sh   (משורש הריפו)
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UI="$ROOT/red-build/ui"
PORT="${LAYOUT_AUDIT_PORT:-8931}"
FIXTURE="${LAYOUT_AUDIT_FIXTURE:-$ROOT/red-build/tests/fixtures/imud_default_text.txt}"
OUT="${LAYOUT_AUDIT_OUT:-/tmp/layout-audit-report.json}"
READY_TIMEOUT_MS="${LAYOUT_AUDIT_READY_TIMEOUT_MS:-240000}"

command -v agent-browser >/dev/null 2>&1 || { echo "חסר agent-browser — התקן: npm i -g agent-browser && agent-browser install"; exit 2; }
[ -f "$FIXTURE" ] || { echo "חסר fixture: $FIXTURE"; exit 2; }

rm -f "$OUT"

cd "$UI"
python3 -m http.server "$PORT" >/tmp/layout-audit-http.log 2>&1 &
HTTP_PID=$!
# **S4.11:** ה-fixture מוגש מהשרת עצמו — הדף fetch אותו. בלי base64 בארגומנט.
FIXSERVED="_audit-fixture-$$.txt"
cp "$FIXTURE" "$FIXSERVED"
trap 'kill $HTTP_PID 2>/dev/null; rm -f "$UI/_layout-audit.js" "$UI/$FIXSERVED"; agent-browser close >/dev/null 2>&1' EXIT
sleep 1

agent-browser open "http://localhost:$PORT/index.html" >/dev/null || exit 2
agent-browser wait 3500 >/dev/null

# טעינת הספר + עימוד + מעבר לתצוגה — הנתיב החי האמיתי.
# **S4.11:** polling עד להשלמת העימוד (hasResult && pages>0) במקום sleep קבוע —
# הקובץ הגדול (849 עמודים) לוקח יותר מ-3 השניות שהיו כתובות כאן.
READINESS="$(agent-browser eval "(async()=>{
  const app = window.__toraApp; if(!app) return 'NO_APP';
  const ta = document.querySelector('textarea'); if(!ta) return 'NO_TEXTAREA';
  const text = await (await fetch('/$FIXSERVED')).text();
  ta.value = text;
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  await new Promise(r=>setTimeout(r,400));
  app.onExplicitRetypeset();
  const t0 = Date.now();
  while (Date.now()-t0 < $READY_TIMEOUT_MS) {
    const st = app.getState();
    if (st && st.hasResult && st.pages > 0) break;
    await new Promise(r=>setTimeout(r,400));
  }
  const st = app.getState();
  if (!st || !st.hasResult || !(st.pages > 0)) return 'TIMEOUT_' + JSON.stringify(st||null);
  for (const t of document.querySelectorAll('[role=tab],.tab,button')) if (/תצוגה/.test(t.textContent)) t.click();
  await new Promise(r=>setTimeout(r,1500));
  return 'READY_' + st.pages + '_pages';
})()" 2>&1 | tail -1)"
# הפלט של agent-browser eval מקודד-JSON (עטוף במרכאות) — מנקים אותן
READINESS="${READINESS//\"/}"
echo "$READINESS"

case "$READINESS" in
  READY_*) : ;;
  *)
    echo "✗ האפליקציה לא התמודדה בזמן ($READY_TIMEOUT_MS ms) — פלט: $READINESS"
    exit 2
    ;;
esac

# הזרקת האודיט (הסקריפט מוגש עם ה-UI ונטען ב-fetch — ללא בעיות escaping).
# האודיט אסינכרוני (סריקת גלילה של ספר וירטואלי) — agent-browser ממתין ל-Promise.
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
sw = d.get('sweep') or {}
print(f"  עמודים שנבדקו: {s.get('pages')}/{s.get('slots')} (וירטואלי: {s.get('virtualized')})"
      + (f" | סריקה: {sw.get('steps')} צעדים, {sw.get('ms')}ms" if sw else "") + f" | אודיט: {s.get('sweepMs')}ms")
print(f"  (שערים: {s.get('shaarPages')}) | שורות: {s.get('totalLines')}")
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
