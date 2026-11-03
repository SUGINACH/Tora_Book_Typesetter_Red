# PROVENANCE.md — מקורות וייחוס · Tora Book Typesetter Red
> מצב: 02.11.2026 (סגירת S7).

## קוד
- **בסיס:** בנייה מאפס (from-scratch) לפי `spec/01_MASTER_SPECIFICATION.md` + `spec/02_MASTER_WORK_PLAN.md`. אין העתקת קוד ריצה מהגרסאות הקודמות; יש **היסק לקחים** מתועדים (lessons) שהומרו למנגנונים ולבדיקות.
- **היסקים שהומרו למנגנון חי בסגירה זו:** fixDropWordInColumns (Gold), AQ stages+caps (Gold), chapter-end modes (Green), terminal-residual (Green), en-line-prefix (V_current), 70-footnotes continuous (V21), marker-for-numbering (IMUD), page-num-in-header (Orange), folio frames (V1), gershayim עבריים (P1-8).

## מסמכים
- `spec/01_MASTER_SPECIFICATION.md`, `spec/02_MASTER_WORK_PLAN.md` — מסמכי האם של הריפו.
- `Typesetter_doc/shared/comparisons/Monster_Comparison_All_Repos_Branches.md` — קטלוג הכשלים ההיסטורי (השוואת כל הגרסאות/ענפים).
- `audits/01_PROGRESS_AUDIT.md` — ביקורת עצמאית (02.11.2026, קומיט 7d0203b) — מקור 6 ממצאי ה־P0 ו־8 ממצאי ה־P1 שתוקנו בסגירה זו.
- `audits/02_S7_CLOSURE_REPORT.md` — דוח סגירת S7 (מסמך זה נכתב במקביל).
- `ai-chat/` — תמלילי שיחות הפיתוח (qwen) כפי שהועלו לריפו.

## גופנים
- שמות גופנים בלבד (Frank Ruhl Libre, David HB, Narkisim, Nachlieli, Alef, Rubin) — אין קבצי גופן בריפו; פרופילי הרוחב בקוד הם קירובים מתועדים עד S12 (אורקל מדידה). רישוי קבצי גופנים יתווסף כשייכללו (S12).

## בדיקות
- `tests/unit/*` — נכתבו מאפס (parser 17, typography 14) לפי המפרט.
- `tests/integration/registry.test.js` — חוזה שלוש שכבות (8) עם הסורק האמיתי (D-45).
- `tests/layout/s5-s6.test.js` — 17, כולל מדיניות הערה ארוכה במסלול אמיתי (dp-planner).
- `tests/e2e/*` — pipeline 14, s7-gate 15, canonical 6 (קורפוס קנוני).
- `tests/audit/negative-controls.test.js` — 16 בדיקות anti-false-positive.
- **אוסף הבדיקות ההיסטורי של חמשת הריפואים (21 תרחישי IMUD וכו') לא הועבר** — נרשם כפער; הבדיקות שנכתבו מכסות את אותם שטחים לפי המפרט. ראה ISSUE_REGISTRY FWD-4 לקורפוס.
