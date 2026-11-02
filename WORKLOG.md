# WORKLOG.md — יומן עבודה לפי שלב · Tora Book Typesetter Red
> כלל: כל שלב מתועד עם מה נעשה, ראיות ובדיקות. עדכון אחרון: 02.11.2026.

## 02.11.2026 — סגירת S7 ("סגירת כל הקצוות עד להשלמת S7 כולו")

### רקע
דוח ביקורת עצמאי (`audits/01_PROGRESS_AUDIT.md`, קומיט 7d0203b) מצא 6 ממצאי P0 ו־8 ממצאי P1; E2E עמד על 11/14 עם 3 כשלי שימור תוכן. הוראת המשתמש: סגירת כל הקצוות עד להשלמת S7 כולו.

### מה נעשה (לפי סדר העבודה — Branch-back-fix מהשלבים הקודמים, לא תיקון נקודתי)

**S0 (ניהול — הושלם):**
- נוסדו: `DECISIONS.md` (D-30..D-53), `ISSUE_REGISTRY.md` (P0/P1 עם ראיות ובדיקות רגרסיה), `WORKLOG.md` (קובץ זה), `OPEN_QUESTIONS.md`, `PROVENANCE.md`, `LAYOUT_DEPENDENCY_MAP.md`, `README.md` אמת.
- `package.json`: סקריפטים תקניים (`test:unit`, `test:settings`, `test:layout`, `test:audit`, `test:e2e`, `test:canonical`, `test:determinism`).
- CI: `.github/workflows/ci.yml` (Node 18/20/22 — npm test).
- ניקוי ריפו: `dbg2..dbg7` → `archive/debug/`; קובץ ריק `ai-chat/1` נמחק (דפוס באגי מ־Yellow).
- אוסף הזהב: `tests/audit/negative-controls.test.js` — 16 בדיקות anti-false-positive (כולל 14 תיקוני ה־false-positive ההיסטוריים של Z.ai/Claude).
- קורפוס קנוני: `tests/fixtures/canonical_corpus.txt` (נוצר דטרמיניסטית ע"י `generate_canonical_corpus.js`) + `tests/e2e/canonical.test.js` כתנאי מיזוג.

**S4-back-fix (P0-5, P0-4):** `scanConsumers` אמיתי — הרישום מוחרג מהיקף הסריקה, צריכה = `settings[...]` בלבד; `derivePlacementFlags` לא דורס קלט משתמש (D-39); מפתחות מתים חוברו/הוסרו (D-44/D-45/D-46/D-48). ראיות: registry 8/8 עם הסורק המתוקן.

**S5-back-fix (P0-3):** `moveLineForward` (D-49) — הזזות קדימה בסדר הקריאה בלבד; תיוג `seq` לכל שורה בהצבה; `reading-order-break` נוסף לקטלוג עם מייצר בפועל; `fixDropWordInColumns` מחובר ל־flushPage; איזון בגרנולריות שורה עם פשרות מתועדות (D-50). ראיות: s7-gate 'reading-order lock' + הוכחת הגלאי.

**S6-back-fix (P1-1):** `footnote-budget.getFootnotesReservedHeight` = מקור יחיד (dp-planner ממשיך דרכו); AQ + מצבי סוף־פרק נקראים מהצינור; מדיניות הערה ארוכה (split/move-whole/reject-to-body) בזמן ההצבה — פיצול אמיתי של הטקסט בין מרזבי עמודים עם סימון המשך; fn-layout-mode block/continuous מנגנון פריסה אמיתי (D-34).

**S7 (השלמה מלאה):**
- עמודי הערות: per-part, כותרות מהוראת מחלקה (D-40) עם "(המשך)", `endnote-columns` 1/2, `count-endnote-pages` (מספור), `f-note-body-font` במדידה.
- הערות צד: עיגון לפסקה המארחת (host), cascade, מיכל 20px, מעבר לעמוד הבא (BRZ-15 — אין גניזה), `verifyH7Conversion` מחובר (עוגן, לא חיפוש טקסט — תיקון המשתמש).
- סמנים: `notes/markers` מקור יחיד (4 סגנונות); מדיניות איפוס (continuous/page/section/part); הדבקה לעוגן (BRZ-11 לכל הסגנונות); תג E102 לזיהוי מדויק (D-53).
- חשבונאות: identity-by-construction (D-30) — בדיקת אמת מחלצת מהפלט המרונדר בלבד.
- CP4==CP5: הוכחה אמיתית (D-47) עם בדיקת רגישות (השתלת מוטציה ⇒ הhash משתנה).
- קדם־פאס סוגריים (D-42) + אכלוס `parenRanges` — משפחת V23 חיה.
- מספור עברי (D-31), פתיחות (D-36), `page-underfill` נפק, `pageNumberDisplay` מאוכלס, `background-opacity` ⇒ rgba אמיתי, מפריד טורים מרונדר.
- דטרמיניזם: שעון לוגי (ledger/events); `deterministic` נמדד; trace-verbosity מוזרם.

### ראיות — הרצת הבדיקות (02.11.2026)
```
parser:            17/17
typography:        14/14
registry-integration: 8/8   (סורק phantom אמיתי)
layout-s5-s6:      17/17    (כולל מדיניות הערה ארוכה במסלול אמיתי)
e2e-pipeline:      14/14    (לשעבר 11/14 — שלושת כשלי שימור התוכן תוקנו)
s7-gate:           15/15
negative-controls: 16/16
canonical:          6/6    (קורפוס קנוני, 8 מצבי הגדרות)
————— סה"כ: 107 בדיקות ירוקות
```

### שערי S7 (S7.2) — מצב
- [x] Endnote E2E multi-part: עמודים נכונים, ללא running head/גיליון (ברירת מחדל), כותרות המשך.
- [x] side-note-overflow=0, overlap=0; הצמדה לאנקור.
- [x] h7-conversion false-positive injection (כפילות טקסט בגוף ⇒ לא מדווח).
- [x] שני מצבי fn-layout audit-clean; continuous ללא תקרה.
- [x] מטריצת מספור×מפריד×איפוס — הרצים תואמים הגדרות (settings-effect).

### החלטות שנרשמו במסגרת העבודה
D-30, D-31, D-34, D-36, D-39, D-40, D-41, D-42, D-43, D-44, D-45, D-46, D-47, D-48, D-49, D-50, D-51, D-53 — ראו `DECISIONS.md`.

### ידוע ו�תוח (לא חוסם S7)
FWD-1 (spanning כותרות — S8), FWD-2 (shaar-sub reset — S8), FWD-3 (אורקל מדידה — S12), FWD-4 (קורפוס היסטורי 5,702 שורות ליובא). ראו `ISSUE_REGISTRY.md`.

---

## S8 — שערים, עיטורים, מפרידים וגרפיקה (Decoration Pass L5) — 03.11.2026

**מודולים חדשים (7):** `theme-sets` (קיבוץ לפי מספר ערכה, uniqueShaarId — נעילת F-10, הפעלת שלושת השערים, מודל בורר ויזואלי), `shaar-boxes` (גרירה/שינוי גודל/הצמדה/עיגול־שלם ייצוא־טעינה), `assets-import` (JPG/PNG/SVG דרך wrapShaarMedia, ייבוא תיקייה ללא מניפסט, אימות נתיבים), `svg-sanitize` (רשימת־היתרים + CSP hook), `custom-pages` (PT-09), `shaar-pages` (PT-01/02/03 מבנית), `ornament-plan` (פאס L5 + אודיט ornament-* במייצרים אמיתיים).

**הרחבות:** `ornament-fit` (h2OrnamentReservedHeight — הזמנת גובה בזמן פריסה, סגירת שורש F-08; סימטריית מרווחים F-21; הרמה אופטית −0.08em; משמרות מפרידים), `dividers` (מפרידי שערים, rollback-aware counters), `page-decorations` (3 מחלקות רקע + insets מ״מ — מיזוג פאנל רקע→נושאים), `dp-planner` (פס חוצה־טורים FWD-1, reAlignColumns — תיקון טור פנטום, H0→PREFACE), `pipeline` (הכנסת שערים לפני CP4, פאס עיטורים אחרי הערות צד, סריקות כוללות פס), `dom-renderer` (רינדור עיטורים/פס/רקעים/שערים/עמודים מותאמים), `folio` (counted=false לעמודים מותאמים), `retreat-loop` (D-60 — הקפאה ללא תיקון נרשמת כפשרה).

**רישום:** 23 מפתחות S8 חזרו עם מנגנום חי + בדיקות אפקט (D-54; סגירת הבטחת D-45). אפס מפתחות פנטום (הסורק האמיתי).

**ראיות — הרצת הבדיקות (03.11.2026):**
```
parser:            17/17
typography:        14/14
registry-integration: 8/8   (23 מפתחות חדשים — כולם נצרכים בפועל)
layout-s5-s6:      17/17
e2e-pipeline:      14/14
s7-gate:           15/15
s8-decoration:     39/39    (חדש — כל שערי S8.2 + REQ-ORN-01..08 + FWD-1/2)
canonical:          6/6     (כולל עיטורים מלאים: שימור תוכן + ניטרליות)
negative-controls: 16/16
————— סה"כ: 146 בדיקות ירוקות (לשעבר 107)
test:determinism   OK (bf2497eeea35a37b)
```

### שערי S8 (S8.2) — מצב
- [x] ornament-* kinds = 0 על canonical+ornaments; מייצרים אמיתיים (הזרקת פגם ⇒ ממצא).
- [x] רגרסיית F-10: הפעלת ערכת JSON ⇒ שלושת השערים פעילים (נעול לצמיתות) + ייחודיות id.
- [x] עיגול־שלם תיבות שער: הזזה → ייצוא → טעינה ⇒ מיקומים זהים.
- [x] גובה מפריד טורים = Math.min−8px תחת עומס (טורים לא־שווים); מקור יחיד.
- [x] פאס עיטורים מוכח ניטרלי (CP4==CP5 אמיתי; הזמנות גובה בפריסה — F-08).
- [x] אבטחת ייבוא: path traversal נדחה ומדווח; SVG מחוטא; CSP hook.
- [x] בורר ויזואלי: תצוגה מקדימה מהשער הראשי (מודל נתונים ל־S10).

### החלטות שנרשמו
D-54..D-60 — ראו `DECISIONS.md`.

### ידוע ותועד (לא חוסם S8)
FWD-3 (אורקל מדידה — S12), FWD-4 (קורפוס היסטורי — מתמשך). גרסת PDF של ממצאי עיטורים (צילומי עמוד) — עם ה־UI של S10 (הרנדר כאן הוא מודל גיאומטרי + אורקל DOM לבדיקות).

---

## S9 — כותרות עליונות, מספור עמודים, תוכן־עניינים (03.11.2026) — הושלם

### שינויים
- `decoration/headers-builder.js` — שכתוב מלא: עצמאות 3×2 (מקור/יישור/גופן/גודל/רוחב%/טקסט־מותאם לכל סלוט); מקורות `book-name-rest` + `first-last-words` (פורט fillHeaderFirstLastWords עם ניקוי פיסוק); `header-opening-dedicated` לפותחות H2/H3 (עוקף D-36 רק כשמופעל); resolveSameAs עם seen-set; בדיקת chapterOpening עברה לתוך buildHeader (מקור יחיד).
- `decoration/folio.js` — נוסחת V1 הושלמה: `page-num-start-idx` (תצוגה מהסוד הזה ואילך; effective = סוד − start‑idx + initial); מסגרות נבדלות (circle/square = CSS badge; parenthesis/squares/floral/diamond = טקסטואליות); show-numbering לעמודי toc-general/toc-detail (D-62); `tocPageLabel` לתוויות TOC בפורמט המספור.
- `decoration/toc-builder.js` — שכתוב מלא: buildTocModel (show/inline + קיבוץ inline רצוף), buildTocPages (זרימה במדידה מראש, עטיפה ≤2 שורות, קטיעה + ממצא, תקציב 20k שורות/500 עמודים), insertTocPages (הכנסה מבנית + בניית תבניות לזוגיות סופית — D-63 + ממצא binding-parity-shift כשדרוש), resolveTocTargets (עוגנים + תוויות דרך pageRef).
- `decoration/numbering-audit.js` — חדש: pn-sequence (סודים רציפים, נוסחה, מונוטוניות תצוגה; "חסרים מוצהרים" מותרים) + pn-overflow (גיליון בתקציב 30% מרוחב תיבת תוכן) → ledger.
- `core/pipeline.js` — הכנסת עמודי TOC לפני hash CP4; פענוח עוגנים/תוויות אחרי assignNumbers; pn-audit מחובר; opensWithHeadingLevel + firstWord/lastWord מגוף העמוד (בלי כותרות, פיסוק מנוקה); תוצר: tocPages/tocInsert/numberingAudit.
- `core/settings-registry.js` — 26 מפתחות חדשים (18 פר‑סלוט, 4 פתיחה, start‑idx, 3 מיומנות TOC) + enum מקורות מורחב + frame `squares`. סה"כ 179 מפתחות — כולם נצרכים בפועל.
- `output/dom-renderer.js` — renderHeader בצורה החדשה (גופן/גודל px פר‑סלוט); renderTocPageContent (שורות/קבוצות/נקודות/עוגנים `#page-N`); renderFolio מקור יחיד (במקום 4 העתקים) + badge למסגרות CSS; עוגן `id="page-N"` לכל עמוד.
- `output/html-export.js` — CSS: folio top/in‑header, page-num-badge (circle/box — פורט V1), סגנונות TOC מלאים (רמות 1–7, קבוצות, נקודות, מספור שורות).

### בדיקות
```
parser:            17/17
typography:        14/14
registry-integration: 8/8   (179 מפתחות — כולם נצרכים בפועל)
layout-s5-s6:      17/17
e2e-pipeline:      14/14
s7-gate:           15/15
s8-decoration:     39/39
s9-headers:        25/25    (חדש — כל שערי S9.2 + REQ-HDR-01..06)
canonical:          6/6
negative-controls: 16/16
————— סה"כ: 171 בדיקות ירוקות (לשעבר 146)
test:determinism   OK (75b8c605ca3f3dd7)
```

### שערי S9 (S9.2) — מצב
- [x] מטריצת כותרות: כל מקור×יישור×רוחב × recto/verso (10×3×3×2=180 צירופים) + golden DOM + bc7892f נעול.
- [x] כרך־ב': initial-value=22 ⇒ כ״ב; start-idx (נוסחת V1); count/show pairs (shaar/toc/endnotes) — כולל פתיחות (D-36).
- [x] TOC stress: 300 כותרות ארוכות ללא גלישה/תליה (דטרמיניסטי); תקציב איטרציה נבדק בביקורת שלילה; כותרת בלתי־ניתנת־לעטיפה ⇒ קטיעה + ממצא, אפס תליה.
- [x] first/last-word מתעדכנות אחרי עימוד מחדש (שאלת סשן Z.ai — נענתה בבדיקה); תואמות את גוף העמוד בלי פיסוק.
- [x] pn-overflow/pn-sequence = 0 על canonical ב־5 קונפיגורציות; ביקורת שלילה מוכיחה שהבודק תופס הפרות.
- [x] ניטרליות גיאומטריה נשמרת עם TOC פעיל; גוף העמודים זהה מילה־במילה אחרי ההכנסה.

### החלטות שנרשמו
D-61..D-63 — ראו `DECISIONS.md`.

### ידוע ותועד (לא חוסם S9)
יעדי PDF (bookmarks) נישאים בשורות ה־TOC (`targetPage`/`anchorId`) וייבנו ב־S12; צילומי עמודים ויזואליים — עם ה־UI של S10.

---

## S10 — ממשק משתמש מלא (03.11.2026) — הושלם

### שינויים
- **`src/ui/` (11 מודולים חדשים):** `app-shell` (4 לשוניות עורך/הגדרות/בדיקה/תצוגה, נתיבי ⚡/מסמך, רינדור־קל מרוכז, סנכרונים, תבניות, דיבאג פר־עמוד), `retypeset-policy` (D-64 — מחלקת קל/כבד + טבלת מדיניות לעזרה; צרכן אמיתי של `debounce-light-change-ms` — סגירת D-44), `settings-panel` (12 פאנלים Z2 מהרישום: אקורדיון, חיפוש עברי, איפוס פר־שדה, תבניות שמירה/טעינה עם מיגרציה), `editor-tab` (הדבקה, מונים, מפת ⏎ שאינה מיוצאת לעולם — F-01, ייבוא TXT, DOCX נעול ל־S11), `preview-tab` (קנבס כהה, גלילה אנכית/אופקית, זום +Ctrl־גלגל +fit-width, קפיצה במספר עברי, סנכרון TOC, highlightIssue נראה, כפתור ⏬ לכל עמוד — V21), `testing-tab` (טבלת ממצאים מיון/סינון/הפעלה, מציג מסלול עם סינון שלב, לוח כיסוי עם פטורים מנומקים — כל הנתיבים דרך activateFinding אחיד, כלל 2), `status-strip` (מנוע/התקדמות "עמוד X מתוך Y", המתנות, ⚡ מהבהב, שומר־נתק, גופנים), `caret-map` (סמן↔עמוד דו־כיווני לפי חוזה הטוקנים), `worker-protocol` (D-65 — סכמת הודעות + סריאליזציה plain-JSON), `engine-worker-main` + `inline-transport` (צד Worker + תעבורת בדיקות באותו פרוטוקול), `callgraph-scan` (סריקת F-06 סטטית עם artifact).
- **`src/ui/bindings.generated.js`** — מניפסט 179 כיתובים מהרישום (מחולל: `tools/gen-ui-bindings.js`; מכיל מילולית כל מזהי הפקדים ⇒ סורק dead-control מתהפך ל־0 כמובטח).
- **מנוע (מזערי, no-op מוכח):** `pipeline` + `dp-planner` — מזליף `env.onProgress` ב־10 נקודות ביניים ("עמוד X מתוך Y" מדויק בשלב הכותרות; מוערך ב־DP). הוכחה: hash זהה עם ובלי המזליף (75b8c605…).
- **`ui/` (דפדפן):** `index.html` (RTL, מקומי, אפס רשת), `styles.css` (קנבס כהה, אייקונים, נגישות), `engine-worker.bundle.js` + `app.bundle.js` (מחוללים: `tools/build-worker-bundle.js` — בונדלר CJS זעיר + שימת SHA-256 סינכרונית שקולה ל־Node crypto). הפרדה מוכחת: המנוע רק ב־Worker; אצרור ה־UI בלי pipeline.
- **`tools/`:** `gen-ui-bindings.js`, `build-worker-bundle.js` (כפול), `scan-control-triggers.js` (CLI + artifact `tests/artifacts/s10-callgraph.json`).
- **`tests/harness.js`** — תמיכת async סדרתית (תואם לאחור; S1–S9 ללא שינוי פלט).
- **רישום:** `debounce-light-change-ms` חזר עם צרכן חי + בדיקת אפקט (סגירת D-44). 180 מפתחות — כולם נצרכים בפועל; dead-control = 0.

### בדיקות
```
parser:            17/17
typography:        14/14
registry-integration: 8/8   (dead-control הופך ל־0 — הבטחת התיעוד קוימה)
layout-s5-s6:      17/17
e2e-pipeline:      14/14
s7-gate:           15/15
s8-decoration:     39/39
s9-headers:        25/25
s10-ui:            37/37    (חדש — כל שערי S10.2 + REQ-UI-01..07 + D-64/D-65 + F-06 + חבילות)
canonical:          6/6
negative-controls: 16/16
————— סה"כ: 208 בדיקות ירוקות (לשעבר 171)
test:determinism   OK (75b8c605ca3f3dd7 — זהה ל־S9; המנוע לא הוסט)
test:scan (F-06)   0 הפרות · 3 נתיבים מפורשים בלבד
```

### שערי S10 (S10.2) — מצב
- [x] e2e: הדבקת מסמך 646 עמודים (≥639) ⇒ progress "עמוד X מתוך Y" זורם; אינטראקציות שנדגמו (לשוניות/חיפוש/קפיצה) < 100ms; hash התוצאה זהה לריצת headless.
- [x] סריקת no-auto-retypeset עוברת (call-graph artifact: 3 קצוות — ⚡/Worker/שער — 0 הפרות); הוכחת ראנטיים: שינוי כבד לא מעמד גם אחרי המתנה, ⚡ מיידי משנה hash.
- [x] חיפוש עברי מוצא מפתח לפי שם («רוחב טור»); איפוס פר־שדה מחזיר ברירת מחדל מהרישום; תבניות שמירה/טעינה כולל מיגרציה v1.
- [x] קפיצות/סנכרונים: מספר עברי (גימטריה כולל גרשיים), TOC click, סמן↔עמוד שני הכיוונים + מסלול הלוך־ושוב יציב, עגינת הערות־שוליים.
- [x] דיבאג: JSON לכל עמוד (גיאומטריה מלאה + טורים + פרוסת ledger + מסלול + ממצאים) עובר structured-clone; highlightIssue נראה (מחלקה + קו מיתאר inline + קפיצה).
- [x] שינוי קל: מרוכז לפי ההגדרה (60ms בבדיקה) ⇒ רינדור בלבד ≤2s, hash לא משתנה, אפקט נראה; כבד דורש ⚡; טבלת המדיניות מרונדרת בעזרה.
- [x] רגרסיה: כל המערכת 208/208 ירוקה (נעילת ui-e2e של Orange במפה המקבילה של Red — שרשרת הבדיקות המלאה).
- [x] בונוס — D-64: מחלקת הקלים מוכחת שקילות־רינדור מלאה (רינדור־קל === ריצת מנוע עבור כל 7 המפתחות); כבד לדוגמה שובר שקילות.

### החלטות שנרשמו
D-64..D-67 — ראו `DECISIONS.md`.

### ידוע ותועד (לא חוסם S10)
פאנל בונה ה־SVG (Z2-2) — כניסה מגודרת עם הסבר (המודל החי ב־theme-sets; העורך הויזואלי המלא עם S11). פעולות דפדפן בלבד (פתיחת קבצים/הורדות) נבדקות ארכיטקטונית (bundle separation + offline) — הרצה חיה בדפדפן היא בדיקת עשן ידנית. בדיקת axe-core מלאה — S13 (REQ-UI-08).
