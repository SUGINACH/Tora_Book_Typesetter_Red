# Tora Book Typesetter — RED
**מנוע עימוד תורני (RTL, עברית) — בנייה מאפס, אפס תלויות ריצה.**

> מצב אמת, עדכני ל־03.11.2026 (ד) — **שקיפות עימוד מהקוד (S4.7): 388 בדיקות ירוקות** (336 + 52 של אודיט העימוד s14) **ואודיט גיאומטריה בדפדפן אמיתי ב-CI** (tools/layout-audit — חפיפות/גלישות/כותרות/שערים/יישור/גופנים; אפס בעיות על ספר המבחן). ברירות המחדל של המקור חיות מהעלייה: שערים בסדר המקור (ראשי→אחורי→תוכן→גוף) עם תוכן מובנה (בס״ד/כותרת/כתר/מחבר/שנה), כותרות עליונות בכל עמודי התוכן כולל פתיחות ותוכן-עניינים, יישור שורות justify, וארבעת גופני העיצוב של המקור מוטמעים (David Libre/Frank Ruhl Libre/Bellefair/Noto Serif Hebrew — SIL OFL). דטרמיניזם נעול מחדש (‏ad1161a9 — שרשרת 75b8c605→7ccad899→93dfbd3e→ef2e7a14→ad1161a9). תג v25-unified-rc1 — קידום למהדורה באישור משתמש בלבד. מסמכי האם: `spec/01_MASTER_SPECIFICATION.md`, `spec/02_MASTER_WORK_PLAN.md`. ממצאים פתוחים: `ISSUE_REGISTRY.md` — מדור EXT.

> **🔗 פריסה חיה (GitHub Pages):** <https://suginach.github.io/Tora_Book_Typesetter_Red/> — היישום המלא בדפדפן: 4 לשוניות, 12 פאנלים, מנוע ב־Web Worker, תצוגה ודיבאג פר־עמוד. אופליין מלא (אפס בקשות חיצוניות). ייצוא PDF/ZIP דורש Node — בדפדפן מוצגת הודעה עברית מפורשת (D-75); ייצוא HTML עצמאי והרינדור החי עובדים בדפדפן במלואם. מקור הפריסה: ענף `gh-pages` (חבילת UI בלבד).
> **03.11 (D-83/D-84):** הפריסה עודכנה לאחר תיקון קריסת ספרי־אמת ארוכים ("Maximum call stack size exceeded" — spread על >125K מילים) והוספת רינדור-מחלונות בתצוגה לספרים של מאות/אלפי עמודים. נבדק בדפדפן אמיתי על ספר שלם (1,021 עמודים, 291,719 מילים).

## מה עובד כרגע (ומה לא) — ללא הצהרות פנויות
| יכולת | מצב | הוכחה |
|---|---|---|
| פענוח (DFA + מטא־דאטה בפתיח בלבד, סוגריים [], הערות־סיום ממוספרות/כותרת־מחלקה) | עובד | `tests/unit/parser.test.js` (17) |
| שבירת שורות Knuth-Plass ללא מקף + מגינים (NBSP/E000) + קדם־פאס סוגריים לפני מדידה. **ביקורת 03.11: ה־DP היה מת מאז S1 (off-by-one) — הוחי עם השלמת מודל ragged (raggedEnd + LINE_DEMERIT); הגיבוי נכבל לאיסורי המסלור הראשי** | עובד (מוחי ונעול) | typography (16 — כולל 2 נעילות חדשות), canonical |
| תכנון עמודים (DP) + איזון טורים **בשמירת סדר קריאה** + לולאת נסיגה + מטריצת הגנות + **פס כותרות חוצה־טורים (FWD-1)** | עובד | e2e (14), s5-s6 (17), s8 |
| הערות שוליים (מרזב): סמנים 4 סגנונות × 4 מדיניות איפוס, מפריד 6 סגנונות, block/continuous, מדיניות הערה ארוכה (פיצול אמיתי) | עובד | s7-gate (15), s5-s6 (17) |
| הערות סיום: עמודי "הערות/(המשך)" per-part, כותרת מהוראת מחלקה, מספור אופציונלי | עובד | s7-gate, canonical |
| הערות צד (H7): עיגון לפסקה המארחת, cascade, מיכל 20px, אין גניזה (BRZ-15) | עובד | s7-gate |
| שימור תוכן (BRZ-15) בכל מצבי ההערות **והעיטורים** — חשבונאות identity-by-construction | עובד | e2e 14/14, canonical 6/6, s8 |
| **עיטורים (S8): הזמנת גובה בזמן פריסה (F-08), fit-to-text במדידת JS, סימטריית מרווחים (F-21), הרמה −0.08em, עיטור סיום־פרק בתקציב, מפרידי H3–H6 עם fits() בכל אתר הצבה** | עובד | s8-decoration (39) |
| **שערים (S8): PT-01/02/03 מבנית, ערכות נושא — הפעלת שלושת השערים (F-10 נעול), תיבות עם עיגול־שלם, בורר ויזואלי, "הצג שער משנה"** | עובד | s8 gate 2/3 |
| **גרפיקה (S8): JPG/PNG/SVG, ייבוא תיקייה עם אימות נתיבים, חיטוי SVG, רקעים 3 מחלקות + insets מ״מ, עמודים מותאמים PT-09** | עובד | s8 gate 6/7 + PT-09 |
| **כותרות עליונות (S9): עצמאות מלאה 3×2 (מקור/יישור/גופן/גודל/רוחב%/טקסט לכל סלוט), same_as + גידוע מעגליות, פותחות H2/H3 ייעודיות, first/last-word מאוחד, bc7892f נעול** | עובד | s9 מטריצה 10×3×3×2 |
| **מספור (S9): נוסחת V1 השלמה (start-idx + initial-value), מסגרות נבדלות (circle/square CSS + parens/squares טקסט), מיקומים כולל top/in-header, count/show לפי סוג עמוד, pn-sequence/pn-overflow אודיט** | עובד | s9 gates 2+5 |
| **תוכן־עניינים (S9): עמודי toc-general/toc-detail אמיתיים, כללי+מפורט, קיבוץ inline, נקודות מובילות, עוגנים לחיצים #page-N, תוויות בפורמט הגיליון, תקציב איטרציה נגד תליה** | עובד | s9 gate 3 (כולל stress) |
| **אודיט עיטורים: ornament-overflow/overlap/asymmetry במייצרים אמיתיים + ניטרליות CP4==CP5 מוכחת** | עובד | s8 gate 1/5 |
| דטרמיניזם (layoutHash בין ריצות; שעון לוגי ביומנים) | עובד | e2e, canonical |
| חוזה הגדרות שלוש־שכבות + סורקים **אמיתיים** (phantom/dead/orphan) | עובד | registry 8/8 |
| רנדור DOM + ייצוא HTML עצמאי + offline-guard (exit 7) | עובד | e2e, NC-16 |
| דוח אבחון v2 (עברית, מחזור חיים, דטרמיניזם **נמדד**) | עובד | e2e, canonical |
| **ממשק משתמש מלא (S10): 4 לשוניות (עורך/הגדרות/בדיקה/תצוגה), 12 פאנלים מהרישום עם חיפוש עברי + איפוס + תבניות, מנוע ב־Worker עם התקדמות "עמוד X מתוך Y", מדיניות קל/כבד (D-64) + ⚡, זום/קפיצה במספר עברי/סנכרון סמן↔עמוד/TOC, טבלת ממצאים + trace + לוח כיסוי, highlightIssue, דיבאג פר־עמוד (V21), חבילות דפדפן מופרדות + offline** | עובד | s10-ui (37); F-06 scan 0 הפרות |
| **הרחבות: סגנונות מותאמים (S11):** טריגרים (linePrefix/pattern/inlineMarker «…» ו־~…~/combinator AND/OR), שישה מצבי פריסה (regular/full-width עם פס+מונה/צד/מרזב/עמודי הערות/מיקום חדש), עיטורים מקושרים המזמינים גובה, סכמה עם שגיאות עברית, חבילת tora-typesetter-extensions v1 (ייבוא/ייצוא דטרמיניסטי/שיתוף קריא), עמודים מותאמים כולל לפני הפתיחה, תמונות מוטמעות data: בלבד | עובד | s11-extensions (50) |
| **ייבוא DOCX (S11):** קורא ZIP עצמאי (STORE+DEFLATE, מנפח טהור ≡ zlib), XML עם מגננים, Heading1–7→כותרת N, הערות וורד→הערות סוגריים במקום ההפניה, דחיית פורמט עברית בלי קריסה (חוק 14) | עובד | s11 שער 3 (roundtrip diff=0) |
| **המלצות עריכה מוכחות (S11):** כשהמנוע מיצה אפשרויות — הצעות שמירות־תוכן עם הוכחת reflow חיה (הסרה+אפס חדשים+שינוי hash); החלה מה־UI מחזירה בדיוק את ה־hash המוכח; שומר גודל >200 עמודים | עובד | s11 שער 4 |
| **ייצוא מושלם (S12):** HTML עצמאי חד־קובץ (@page מהרישום, offline, ≡ רינדור חי); PDF 1.4 טהור — CIDFontType2 מוטמע+מצומצם (89% חיסכון), ToUnicode (חילוץ עברי מדויק), עץ סימניות UTF-16BE, קישורי TOC, סימני חיתוך+דם; ZIP פרויקט (מסמך+הגדרות+הרחבות+ערכה) עם מיגרציה v1→v2; מקור גיאומטריה יחיד (projector); parity מודל↔רסטר מוכח | עובד | s12-export (24) + artifacts |
| **שכבת מדידה מתמטית (S12, מימוש B):** פרנסר טבלאות גופן עצמאי (hmtx/cmap/kern/GPOS/OS/2 — אומת מול fontTools); מאחורי דגל measure-impl; parity A↔B ≤0.01px; שקילות שבירות 0 הבדלים על הקנוני; cap-height אמיתי למילה הראשונה | עובד | s12 שער 4 |
| **קבלה סופית (S13):** מטריצת רגרסיה 6×3 עם דוח מצטבר; דטרמיניזם משולש (repeat/inter-commit/cross-path); תקציבי T4 במדידה; אבטחה נבדקה מחדש (SVG/fuzz/traversal/XSS/אפס־eval/offline/CSP); נגישות מבנית חדשה; ערכת ניטור (repro-zip); תיעוד מסירה מלא (RELEASE_NOTES/MIGRATION/OPERATIONS/SECURITY/ACCESSIBILITY/CUTOVER) | עובד | s13 (23) + artifacts |

## הרצה
```bash
# האפליקציה החיה (דפדפן, מקומי לחלוטין — אין שום בקשת רשת):
#   פתחו את red-build/ui/index.html (המנוע נטען ב־Worker עם התקדמות "עמוד X מתוך Y")

cd red-build
npm test            # כל הסוויטות (388 בדיקות) — כולל s14-layout-audit
npm run test:unit   # parser + typography
npm run test:settings   # חוזה הרישום + סורקים (dead-control = 0 מ־S10)
npm run test:layout     # s5-s6
npm run test:e2e        # pipeline + s7 + s8 + s9
npm run test:ornaments  # שער S8 (39)
npm run test:headers    # שער S9 (25)
npm run test:ui         # שער S10 (37) — לשוניות/Worker/מדיניות/סנכרונים/דיבאג
npm run test:extensions  # שער S11 (50) — סגנונות מותאמים/DOCX/המלצות
npm run test:export       # שער S12 (24) — HTML/PDF/ZIP/מדידה/parity
npm run test:audit      # negative-controls (16)
npm run test:canonical  # קורפוס קנוני (תנאי מיזוג)
npm run test:determinism
node tests/fixtures/generate_canonical_corpus.js   # יצירת הקורפוס מחדש

# מהשורש (לא מ־red-build):
node tools/gen-ui-bindings.js       # חידוש מניפסט הכיתובים מהרישום (179)
node tools/build-worker-bundle.js   # בניית חבילות הדפדפן (worker + app)
node tools/scan-control-triggers.js # סריקת F-06 → tests/artifacts/s10-callgraph.json
```

## מבנה
```
red-build/src/engine/{parser,typography,layout,notes,decoration,output,audit,core}
red-build/src/ui/{app-shell,settings-panel,editor-tab,preview-tab,testing-tab,status-strip,retypeset-policy,worker-protocol,worker-client,engine-worker-main,inline-transport,caret-map,callgraph-scan,bindings.generated,browser-entry}
red-build/ui/{index.html,styles.css,engine-worker.bundle.js,app.bundle.js}   # האפליקציה החיה
red-build/tests/{unit,integration,layout,e2e,audit,negative-controls,fixtures,artifacts}
tools/{gen-ui-bindings,build-worker-bundle,scan-control-triggers}.js
spec/          — מפרט אם + תכנית עבודה (S0..S13)
audits/        — 01 ביקורת עצמאית, 02 דוח סגירת S7, 03 דוח סגירת S8, 04 דוח סגירת S9
DECISIONS.md / WORKLOG.md / ISSUE_REGISTRY.md / OPEN_QUESTIONS.md / PROVENANCE.md / LAYOUT_DEPENDENCY_MAP.md
archive/debug/ — קבצי דיבוג היסטוריים (read-only)
```

## משמעת פיתוח (מתוך תכנית העבודה — מחייב)
1. commit-per-feature; אין לערבב ניקיון קבצים עם תיקוני engine.
2. כל החלטה → `DECISIONS.md`; כל תקלה → `ISSUE_REGISTRY.md` (חומרה+ראיות+בדיקת רגרסיה).
3. לא לטעון ללא ראיה; לא להשבית אבחון; לא להגדיל timeout עיוור.
4. כל תיקון חייב לעבור גם בקורפוס הקנוני (`npm run test:canonical`).
5. פגם משלב קודם ⇒ Branch-back-fix מאותו שלב + עדכון Registry — לא תיקון נקודתי.
