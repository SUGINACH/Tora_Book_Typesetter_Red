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

---

## S11 — הרחבות: סגנונות מותאמים, DOCX, המלצות עריכה (03.11.2026) — הושלם

### שינויים
- **`src/engine/extensions/` (חדש):** `style-schema` (חוזה מלא: trigger leaf/combinator AND/OR, layoutMode שישה מצבים, style, counter, linkedOrnaments — אימות עם שגיאות עברית מאובחנות {code,path,styleId,message}; מפריד סימטרי ~…~ חוקי — D-68), `apply-styles` (matchBlockStyle first-match-wins, matchInlineStyles אי־חפיפה, inlineRanges עם טוגל לסימטריים, CustomStyleCounters דרך markerFor, inlineSizeFactor), `extensions-io` (חבילת tora-typesetter-extensions v1 — D-69).
- **`src/engine/import/` (חדש):** `zip-reader` (STORE+DEFLATE; מנפח טהור ≡ zlib ביט־לביט; crc32; safeName נגד traversal), `xml-lite` ( SAX-ish events עם truncated/too-deep=100), `docx-import` (Heading1–7→כותרת N, הערות וורד→[...] במקום ההפניה, דחיית פורמט עברית — D-70).
- **`src/engine/audit/` (חדש):** `editing-recommendations` (הוכחת dry-run חיה: הסרה+אפס חדשים+שינוי hash; ≤8 runs/≤3 recs; שומר >200 עמודים; qualifyingFindings לפי kind), `text-edits` (applyEdit — מקור יחיד טהור להוכחה ולהחלה).
- **`src/engine/output/zip-writer.js` (חדש):** אריזה עצמאית (משמש DOCX-fixture, הרחבות והכנת S12).
- **מנוע (`pipeline`, `dp-planner`, `dom-renderer`):** התאמת סגנונות **לפני המדידה** (דפוס D-42); סנטינל E101 לטווחי inline (מדידה בפקטור הסגנון); פס full-width חוצה־טורים עם מונה גלוי (cs-counter) + עיטור מקושר שמזמין גובה (csOrnPadTop — דפוס F-08); זרימות footnote/endnote שלמות עם חשבונאות סמנים מלאה (D-30: הסמן נספר במקור פעם אחת); side-note עם isCustomStyle; עמודים מותאמים `before-shaar-main` בראש המסמך גם בלי ערכת נושא + שדה name.
- **`src/ui/`:** `extensions-panel` (ייבוא/ייצוא/שיתוף + שגיאות עבריות; ⚡ בלבד — F-06), `editor-tab` (כפתור DOCX פעיל), `testing-tab` (סקציית המלצות: כותרת, diff לפני/אחרי, הוכחה גלויה "ממצאים חדשים: 0", כפתור החלה דרך applyEdit), `app-shell` (importDocxFile + applyRecommendation — נתיב מיידי ⚡).
- **מחוללי UI:** bundles נבנו מחדש (41+41 מודולים; המנוע רק ב־engine-worker).
- **תיקוני שורש שנמצאו בסגירת השער:** (1) collectFootnoteText — בדיקת עומק שגויה השמיטה את כל הערות הוורד; (2) planCustomPages — before-shaar-main נדחה בשקט בלי ערכת נושא; (3) חשבונאות סמנים לזרימות footnote/endnote מותאמות (הסמן לא נספר במקור ⇒ contentPreserved=false).

### בדיקות
```
parser:            17/17
typography:        14/14
registry-integration: 8/8
layout-s5-s6:      17/17
e2e-pipeline:      14/14
s7-gate:           15/15
s8-decoration:     39/39
s9-headers:        25/25
s10-ui:            37/37
s11-extensions:    50/50    (חדש — כל שערי S11.2 + REQ-PAR-06/07 + REQ-GOV-11 + §8.3 + חוק 14)
canonical:          6/6
negative-controls: 16/16
————— סה"כ: 258 בדיקות ירוקות (לשעבר 208)
test:determinism   OK (75b8c605ca3f3dd7 — זהה ל־S9/S10; המנוע לא הוסט)
test:scan (F-06)   0 הפרות · 3 נתיבים מפורשים בלבד
```

### שערי S11 (S11.2) — מצב
- [x] 3 דוגמאות סגנון מקצה־לקצה: ציטוט «…» (span.w--custom + data-style + נטוי/צבע; הסנטינל לא דולף), הערת צד בקידומת (מחוץ לטורים, מעוגנת, מחלקת side-note--custom), קריאה חוצת טורים (פס + מונה א׳ + עיטור מזמין גובה בפועל padding-top) — כולל מדידה בגודל הסגנון (hash מושפע, לא רק צבע).
- [x] קומבינטורים AND/OR; מפרידים שרירותיים ~…~ כמו «…»; endnote זורם לעמודי ההערות (הטקסט המלא שם, אפס בגוף); footnote יורד למרזב עם סמן בגוף (שימור תוכן מוכח בשתי הזרימות).
- [x] עמוד לוגו לפני הפתיחה: מוצב כעמוד הראשון, נספר (יש גיליון), התוכן הקבוע מרונדר.
- [x] DOCX roundtrip diff=0 מול ציפייה ממוספרת־ביד; הערות וורד → הערות־סוגריים במקום ההפניה ובהמשך למרזב המנוע; zip: STORE+DEFLATE, pure≡zlib; traversal נדחה; xml קטוע/עמוק — error מפורש.
- [x] פורמט לא נתמך: 4 גרסאות דחייה (PDF/לא-zip/XML-שבור/בלי document.xml) — אין קריסה, אין טעינה, הודעה עברית «פורמט לא נתמך».
- [x] המלצות: כל המלצה עם proof מלא (אפס חדשים, הסרה, שינוי hash, diff, מפתחות שורות); החלה מחזירה בדיוק את ה־hash המוכח; בלי ממצאים ⇒ computed:true + סיבה; שומר גודל >200 עמודים + force.
- [x] הרחבות export→import→hash זהה; export דטרמיניסטי (אין תאריך); shareSummary קריא (שמות, מיקום בעברית).
- [x] UI: פאנל הרחבות (ייבוא/רשימה/הזרקה/⚡/ללא עימוד אוטומטי), ייבוא פגום ⇒ שגיאות עבריות וללא טעינה, DOCX בעורך (טקסט+עימוד מיידי; סירוב לא משנה כלום), המלצות בבדיקה עם הוכחה והחלה, אין PUA בטקסט העורך.

### החלטות שנרשמו
D-68..D-71 — ראו `DECISIONS.md`.

### ידוע ותועד (לא חוסם S11)
עורך SVG ויזואלי לערכות (Z2-2) עדיין כניסה מגודרת (המודל החי ב־theme-sets; עריכת JSON דרך ההרחבות זמינה כעת). HarfBuzz/metrics מתמטיים, ייצוא PDF/HTML/ZIP — S12. בדיקת axe-core — S13.

---

## S12 — ייצוא מושלם: PDF, HTML עצמאי, ZIP + שכבת מדידה מתמטית (03.11.2026) — הושלם

### שינויים
- **`src/engine/typography/font-metrics.js` (חדש):** פרנסר טבלאות גופן עצמאי — sfnt/head/hhea/hmtx/maxp/cmap (fmt4+fmt12)/kern fmt0/GPOS PairPos fmt1/OS/2 (sCapHeight@88 — אומת מול גופן אמיתי). דחיות שקופות (too-small/bad-sfnt/missing-table) — אפס קריסות.
- **`font-subset.js` (חדש):** מצמצם TrueType לגליפי המסמך (glyf/loca/hmtx/cmap נבנים; רמזים מועתקים) עם בדיקת tofu מובנית (לא־ממופה או ריק־וחסר־רוחב ⇒ כשל) + שימור רוחבים מדויק (מאומת חוזר בפרנסר שלנו וב־fontTools חיצונית).
- **`measure-table.js` (חדש) + `measure-api.js`:** הפרדת טבלאות מכוילות; מימוש `font-metrics` מאחורי דגל (registerFont מפורש; נפילה שקופה); קרנינג בר־מילה; capHeightEm/ascentEm/descentEm מפרופיל אמת.
- **`geometry-projector.js` (חדש):** מקור גיאומטריה יחיד — CP5 → מלבנים מפורשים (מילים RTL/יישור/justify/AQ, בסיסי שורה CSS-line-box, מרזב, גיליון, כותרת, פס, שורות TOC) + ink-bbox לכל עמוד.
- **`pdf-writer.js` (חדש):** PDF 1.4 טהור — Type0/CIDFontType2 + FontFile2 מוטמע + ToUnicode + W; Outlines (UTF-16BE) מכותרות; קישורי TOC (GoTo); סימני חיתוך + Trim/BleedBox; RTL ויזואלי; אפס תאריכים.
- **`export-api.js` (חדש):** מנהה ייצוא — HTML עצמאי (בטוח־דפדפן), PDF (עימוד במדידת הגופן המוטמע — מסלול עקבי אחד), ZIP פרויקט. פיצול node-only להפרדת חבילות (D-75).
- **`html-export.js`:** כללי @page מרישום גדלי העמוד + מידות עמוד מפורשות.
- **`dropword.js`:** fw.capHeightEm מה־API (מדדי אמת; סגירת דחוי S3).
- **רישום:** 4 מפתחות חיים (measure-impl/pdf-crop-marks/export-bleed-mm/export-html-page-rules) + פאנל "ייצוא ומדידה" (13 במניפסט); bindings ובאנדלים נבנו מחדש; באנדלר תומך סמן node-only.
- **UI:** סרגל ייצוא בתצוגה (HTML/PDF/ZIP) — קריאה בלבד (F-06); שומר Buffer בדפדפן עם הודעה עברית מפורשת.
- **תיקוני שורש שנמצאו בסגירת השער:** מלאי גופן מהטקסט המצויר (גרשיים נגזרים הושמטו בשקט ⇒ אובדן תוכן); כותרות סימניות UTF-16BE; W בסוגריים; בסיס שורה CSS-line-box (היה 0.78em מלמטה — היסט ~15px).

### בדיקות
```
parser:            17/17     typography:        14/14
registry-integration: 8/8    layout-s5-s6:      17/17
e2e-pipeline:      14/14     s7-gate:           15/15
s8-decoration:     39/39     s9-headers:        25/25
s10-ui:            37/37     s11-extensions:    50/50
s12-export:        24/24     (חדש — כל שערי S12.2)
canonical:          6/6      negative-controls: 16/16
————— סה"כ: 282 בדיקות ירוקות (לשעבר 258)
test:determinism   OK (75b8c605ca3f3dd7 — ברירת המחדל לא הוסטה)
test:scan (F-06)   0 הפרות
```

### שערי S12 (S12.2) — מצב
- [x] **Parity report:** pdfinfo page-count equality; pdftotext ≡ כל הטקסט המצויר (מולטיסט תווים מדויק — אחרי נטרול ארטיפקטים bidi של המחלץ); ink-bbox מודל↔רסטר ≤6px בדגימה (סביבות גליף מתועדות) + פסי שורות מיושרים ±2px (38 פסים ↔ 38 צמרות מודל בעמוד גוף) — artifact s12-parity.json.
- [x] **PDF:** סימניות עץ H1/H2 עם כותרות עברית מדויקות + יעדים; קישורי TOC = מספר שורות עם יעד; סימני חיתוך מוכחים ברסטר (הדיו מתרחב מעבר לתבנית) וכבויים כברירת מחדל.
- [x] **HTML עצמאי:** חד־קובץ, dir=rtl, @page מהרישום, אפס הפניות חיצוניות (offline-guard עובד עם exit 7); כל עמוד ≡ הרינדור החי מילה־במילה; ייצוא כפול ⇒ בתים זהים.
- [x] **MeasureAPI-B מאחורי דגל:** שקילות שבירות מלאה על הקנוני (18 עמודים/589 שורות/0 הבדלים) — artifact s12-linebreak-equality.json; parity A↔B ≤0.01px; ברירת המחדל נשארת table (רציפות hash).
- [x] **מצמום גופנים:** 0 tofu (בדיקה מובנית + fontTools חיצונית); חיסכון 89% תועד (artifact s12-font-subset.json).
- [x] **דטרמיניזם בין נתיבים:** PDF ×2 ⇒ בתים זהים; HTML ×2 ⇒ זהים; ZIP ×2 ⇒ זהים; אפס תאריכים.
- [x] **ZIP:** כל החלקים (manifest/document/settings/extensions/theme) ב־JSON מובנה; roundtrip מלא; מיגרציית v1→v2 בתוך החבילה; דחיות שקופות.
- [x] **cap-height:** fw.capHeightEm ממדדי אמת (OS/2 או נפילה מתועדת) — סגירת דחוי S3.

### החלטות שנרשמו
D-72..D-75 — ראו `DECISIONS.md`.

### ידוע ותועד (לא חוסם S12)
סימניות עומק 1–2 (H1/H2) — עומק מלא H3+ בהמשך לפי ביקוש. ייצוא PDF בדפדפן דורש סביבת Node (Buffer) — הודעה מפורשת; בדפדפן נתיב HTML+הדפסה מהדפדפן. סימניות/קישורים מאומתים ע"י פענוח עצמי + כלי poppler (pdfinfo/pdftotext/pdftoppm) — אין Chromium בסביבה; "Chromium print pipeline" נתיב ה־HTML העצמאי עם @page (מוכן להדפסה מהדפדפן). בדיקת axe-core — S13.

---

## S13 — QA מערכתי, אבטחה, נגישות, תיעוד ו־Cutover (03.11.2026) — הושלם (ממתין לאישור משתמש)

### שינויים
- **`tests/e2e/s13-acceptance.test.js` (חדש, 11 בדיקות):** מטריצת רגרסיה מלאה 6 קונפיגורציות × 3 נתיבים עם דוח מצטבר (artifact); דטרמיניזם משולש; תקציבי T4 במדידה (מסמך 720 עמודים, זמן/זיכרון/hit-rate); חשבונאות טריגרים (11 שלבי צינור נפגשים); ערכת ניטור — repro-zip מעגל סגור + יומן מקומי (trace-v2).
- **`tests/audit/s13-security-a11y.test.js` (חדש, 12 בדיקות):** אבטחה נבדקה מחדש — SVG sanitizer (script/onload/foreignObject מוסרים ומתועדים), CSP בלי unsafe-eval/מקורות חיצוניים, JSON fuzz (12 קלטים עוותים — אפס קריסות, דחיות עבריות), path traversal, XSS regression (טקסט עוין מסולף בפלט), אפס eval/Function בקוד חי, offline (אפס הפניות חיצוניות בחבילות — עם הבחנת מרחבי־שמות XML). נגישות מבנית — landmarks, תוויות לכל כפתור/שדה, aria-live ≥2, ניגודיות AA (מדידת תאורה מחושבת), נתיב מקלדת.
- **תיעוד מסירה מלא:** `RELEASE_NOTES.md` (v25-unified-rc1), `MIGRATION.md` (v1→v2), `OPERATIONS.md` (הרצה/בדיקות/ארטיפקטים/CI/ניטור), `SECURITY.md` (מודל איומים מטופל), `ACCESSIBILITY.md` (ביקורת חדשה + פתוח מתועד), `CUTOVER.md` (תוכנית + טבלת שערים + טקס אישור + rollback).
- **תג:** `v25-unified-rc1`.

### בדיקות
```
parser: 17/17 · typography: 14/14 · registry: 8/8 · layout: 17/17 · pipeline: 14/14
s7: 15/15 · s8: 39/39 · s9: 25/25 · s10: 37/37 · s11: 50/50 · s12: 24/24
s13-acceptance: 11/11 · s13-security-a11y: 12/12
canonical: 6/6 · negative-controls: 16/16
————— סה"כ: 305 בדיקות ירוקות ב־15 קבצים
test:determinism OK (75b8c605 — נעול מ־S9; הוכחה בין־קומיטית)
test:scan (F-06) 0 הפרות
```

### שערי S13 (S13.2) — מצב
- [x] חוקי ברזל על המטריצה הקנונית — 6×3, דוח מצטבר עם ראיות (artifact).
- [x] אפס HIGH פתוחים בכל המטריצה; ממצאים פתוחים מתועדים ב־ledger עם סוג וסיבה.
- [x] דטרמיניזם משולש: repeat + inter-commit (75b8c605) + cross-path (live/HTML/PDF).
- [x] חוזה הגדרות: 100% כיסוי, סורקים ירוקים רציפים מ־S4 (dead=0).
- [x] שורות U-A..U-F: U-A..U-E סגורות (ראיות לכל שורה); שאלות פתוחות (נספח ד') — מוגשות להכרעת המשתמש, לא נוחשו.
- [x] ביקורות שלילה 16 — עדיין 0 ממצאים (אפס חיובי־שקר).
- [x] תקציבי ביצועים: 720 עמודים בפועל תחת 45s; heap ≤1.5GB; cache-hit ≥90% (artifact s13-perf.json).
- [x] אופליין מוכח; אבטחה ונגישות נבדקו מחדש (12+12 בדיקות).
- [x] תיעוד אמת: README + RELEASE_NOTES + MIGRATION + OPERATIONS + SECURITY + ACCESSIBILITY + PROVENANCE + CUTOVER.
- [ ] **אישור משתמש מפורש** — ספר־דוגמה מודפס (PDF קנוני ב־tests/artifacts) עמוד־עמוד; ה־RC יקודם למהדורה רק לאחר אישור. **ממתין למשתמש — מכוח התוכנית, לא נעקף.**

### החלטות שנרשמו
D-76.


---

## פריסה — GitHub Pages (03.11.2026)

- **ענף `gh-pages`** (orphan): ‏index.html + styles.css + app.bundle.js (429,768B) + engine-worker.bundle.js (384,945B) + ‏.nojekyll — חבילת ה־UI בלבד, נתיבים יחסיים (תואמים לנתיב־המשנה של Pages), ה־Worker נטען יחסית (`new Worker('engine-worker.bundle.js')`), אפס הפניות חיצוניות (K-9; ההפניה היחידה בקוד היא מרחב־השם של SVG — לא בקשת רשת).
- **Pages הופעל** (מקור: gh-pages/‎/) והאתר חי: ‏<https://suginach.github.io/Tora_Book_Typesetter_Red/> — נבדק בפועל: ‏index 200, שתי החבילות 200 בגדלים זהים־בתים למקומיים, ‏styles 200, ‏.nojekyll 200.
- **ה־main לא הוכפל** (אין docs/ בענף הראשי) — עדכון עתידי = בנייה מחדש ודחיפת gh-pages. ה־CI (main/UNIFIED) אינו מופעל לדחיפות gh-pages.
- **ידוע ותועד:** בדפדפן ייצוא PDF/ZIP דורש Node (Buffer) — הודעה עברית מפורשת ביישום (D-75); נתיב HTML עצמאי והרינדור החי עובדים בדפדפן במלואם.


---

## הידוק ביקורת חיצונית 03.11 (post-S13) — CI, החייאת Knuth-Plass, נעילות וחיזוק קבלה

### רקע
ביקורת חיצונית של המשתמש (03.11) קבעה: (1) ריצת ה-CI האחרונה נכשלה (pdftotext חסר בסביבה); (2) "305 בדיקות ירוקות" אינן הוכחת איכות עימוד; (3) שלוש נקודות קוד לביקורת. הוחלט (D-77): הקפאת פיתוח תכונות; השלב הבא — הידוק אמינות והוכחות.

### הממצא הגדול — ה-DP של Knuth-Plass היה מת מאז S1 (EXT-5)
- **שורש 1 — off-by-one:** שבירת הסיום של הפסקה נכתבה ל-`cost[j]`‏(=n−1) במקום `cost[n]`‏ — הלה נותר INF לעולם ⇒ `greedyFallback` תמיד. **כל שבירות השורות במנוע מאז S1 יצאו מהגיבוי הגרידי** — כולל באג ה-NBSP שהביקורת תפסה בקצה (הביקורת זיהתה את ה-literal; האבחון גילה שהגיבוי הוא המסלור היחיד שרץ).
- **שורש 2 — רוחבי glue:** ‏w ב-DP לא כלל רוחבי רווחים ⇒ שורות "מדומות כמידודות" בעוד רוחבן הטבעי חורג מהטור (הקנוני התנפח ל־42 עמודים בלי תיקון זה).
- **השלמת מודל ragged:** ‏`raggedEnd` (כמו \raggedright של TeX — מתיחת סוף-שורה; כיבוי עתידי לשורות מיושרות דרך `opts.raggedEnd=false`) + `LINE_DEMERIT=100` — בלעדיהן min Σ badness מתפוצץ לשורות מילה-בודדת (כותרת "ענף ב של חלק 1" נפרמה ל־5 שורות של מילה בודדת).
- **נעילת הגיבוי לאיסורי המסלור הראשי (EXT-2):** ‏penalty אסור לעולם אינו מסיים שורה; יחידת NBSP נשמרת שלמה עם \u00A0 שלה (בעבר נקרעה בין שורות ואיבדה את צמדהּ — אובדן תוכן BRZ-15); רוחבי טוקנים נצברים מהפריטים (תיבות + glue פנימי) — זהה למסלור הראשי.
- **תוצאה:** הקנוני 18 עמודים (כמו הגרירה) אך באופטימליות מתמטית מוכחת; ממצאים פתוחים במטריצה: ‏115→51 (ברירת מחדל), ‏129→65 (עיטורים); runt 50→10; שבירת סמנים 48→24. **hash ננעל מחדש: 7ccad899d2107ee1** — המנעול הקודם 75b8c605 תיעד מצב גרידי; ההוכחה הבין-קומיטית מתחילה מחדש (מתועד בבדיקה).

### שורשים נוספים שנחשפו ותוקנו
- **EXT-7 — רשומות מתות ב-WIDE_MARKS:** ׳/״ נלכדו בסל העברי 0x0590–0x05FF‏(0.5em) לפני בדיקת WIDE_MARKS (0.18em/0.36em) ⇒ impl A מדד גרשיים 0.5em בעוש impl B (פיקסטשור שנבנה מ-WIDE_MARKS) 0.18em — הפרש מדידות בין המימושים הסיט 12 שורות ב-DP. סדר הבדיקות ב-charWidthEm תוקן; פיקסטשור לבדיקת השקילות נבנה נטול-קרנינג (kern:false — גם צמד קרנינג בפיקסטשור אינו שקילות מדידה).
- **EXT-6 — מפרידים לכל שורת כותרת:** כותרת גולשת (5 שורות) קיבלה 5 מפרידים בעלי מפתח rollback זהה — התנגשות מונים (8≠40). תוקן: מפריד אחד לכל כותרת, מתחת לשורתה האחרונה (כולל שמירה על המשך בין-טורים).
- **D-81 — מקור יחיד לגיאומטריית כותרת-עליונה/גיליון:** הקרן מחשב x/w (מדידה 9pt/10pt); ‏pdf-writer ו-ink-bounds צורכים אותם (נפילה מתועדת לנוסחאות הישנות). בעבר הכותרת לא נצברה כלל בתיבת הדיו — נחשף ע"י ה-parity המחוזק (תצורת verso-headers).

### תשתית ובדיקות
- **CI (EXT-1):** ‏poppler-utils + fonts-dejavu-core מותקנים כשלב מפורש + ודיקת קיום fail-fast; התווית 171→307. הפופלר הפך דרישת קבלה קשיחה — כשל מפורש בעברית, לא ENOENT שקט (החלטת המשתמש: להתקין, לא לוותר).
- **חיזוק הקבלה (EXT-3):** ‏cross-path — מולטיסט תווים מדויק מול כל הטקסט המצויר בכל 6 התצורות (במקום סף 85% בברירת מחדל בלבד) + pdfinfo≡live≡pdf + parity גיאומטרי ≤6px לכל תצורה. תוצאה מדודה: זהות מלאה בכולן; bbox גרוע 3.73px (artifact s13-crosspath.json).
- **בדיקות חדשות:** typography 14→16 (נעילת הגיבוי + אחידות איסורים בין שני המסלורים); סה"כ 305→307. Bundles נבנו מחדש.

### בדיקות (סבב מלא מקומי)
```
parser: 17/17 · typography: 16/16 · registry: 8/8 · layout: 17/17 · pipeline: 14/14
s7: 15/15 · s8: 39/39 · s9: 25/25 · s10: 37/37 · s11: 50/50 · s12: 24/24 · s13-acceptance: 11/11
canonical: 6/6 · negative-controls: 16/16 · security-a11y: 12/12
————— סה"כ: 307/307 בדיקות ירוקות ב-15 קבצים
test:determinism OK (7ccad899d2107ee1 — נעילה מחדש מתועדת בקוד הבדיקה)
test:scan (F-06) 0 הפרות
```

### החלטות שנרשמו
D-77..D-82 — ראו DECISIONS.md.

### נותר פתוח (הוגש להכרעה/בעלות — לא נוחש)
EXT-4 (ציור עיטורים — הגיאומטריה קיימת במודל אך אין דיו: לא ב-CSS החי ולא ב-PDF), ‏EXT-8 (איזון טורים גלובלי), ‏EXT-9 (גופנים תורניים אמיתיים), ‏EXT-10 (קורפוס/ספר אמיתי), ‏EXT-11 (שאר ממצאי P2 לפי המטריצה המעודכנת).

---

## 03.11 (ב') — קריסת ספר־אמת ב-Pages החי: אבחון, תיקון, קורפוס אמת (D-83/D-84)

### הדוח שהגיע מהמשתמש
בדיקה חיה ב-GitHub Pages: ייבוא טקסט + עימוד לא הסתיים — הודעת "engine: Maximum call stack size exceeded". שאלות נלוות: האם נבדקו קבצי text_files_for_typesetter_tests? ‏טקסט ארוך? האם העימוד משביע רצון בלי חריגים? האם נכסי המקור הוטמעו?

### אבחון (שוחזר במלואו)
- **שורש (EXT-12/D-83):** `gOut.push(...outWordsOfAll())` — spread של כל מילות הפלט כארגומנטים. V8 מוגבל ל-125,154 ארגומנטים; ספר של 291,719 מילים קורס. העימוד עצמו הושלם — הקריסה בבדיקת שימור־התוכן שבסוף ה-pipeline.
- **למה הבדיקות לא תפסו:** מבחן העומס = קורפוס סינתטי ×40 = ‏33,750 מילים — פי 4 מתחת לסף. בדיוק הפער "סינתטי מול אמת" שהביקורת החיצונית הזהירה ממנו.
- **בעיה שנייה שנחשפה בדרך (D-84):** גם אחרי תיקון המנוע, ה-preview היה מרנדר 1,000+ עמודים ל-DOM בבת אחת (מיליוני צמתים) ומקפיא את הדפדפן.

### תיקונים
1. **D-83 — pushAll בלולאה** ב-pipeline (בדיקת שימור) וב-font-subset (טבלאות glyf/cmap בספר גדול).
2. **D-84 — רינדור מחלונות ב-preview:** מעל 60 עמודים — placeholders בגובה התבנית + חלון חי עצל סביב הגלילה/היעד (הגולל האמיתי = ‏.tab-panel); קפיצה/הדגשה/סמן מרנדרים יעד לפני פעולה; עד 60 עמודים — ההתנהגות המקורית במלואה.

### קורפוס אמת (EXT-10 חלקי) — מענה ישיר לשאלות המשתמש
- ‏7/7 קבצי IMUD_TORANI אומתו: ‏88/235/1,021/1,048/1,023/1,213/1,213 עמודים — ‏**0 קריסות, שימור תוכן מלא, דטרמיניזם כפול** (very_long×2 ⇒ hash זהה).
- ‏3 קבצים נכנסו ל-fixtures/real ולשרשרת ה-CI (no_long, mid_long, long — הקובץ ששחזר את הקריסה) + רגרסיית סף סינתטית 130K מילים (מעל מגבלת V8 במכוון).
- **מטריצת ממצאים על ספר האמת** (real-book-matrix.json, ‏5 קונפיגורציות × ‏1,021 עמודים): ‏0 HIGH; ‏open: ‏candidate-rejected 2,971 (חשבונאות DP), ‏widow-bottom 1,015, ‏orphan-top 666 (סמני זרימה — פסקה שפותחת/ממשיכה בקצה טור), ‏note-marker-line-break 420, ‏column-imbalance 394, ‏page-underfill 246, ‏orphan-bottom 110, ‏rollback-compromise 8, ‏runt-line 4, ‏widow-top 1.
- **PDF של ספר אמת שלם** (real-book-long.pdf): ‏1,000 עמודים, ‏16.4MB, ‏pdfinfo ✓ — לבדיקת עין (CUTOVER). נמסר מחוץ לגיט (16MB) בתיקיית המסירה; בריפו נשמר real-book-matrix.json בלבד.
- **ממצא חדש (EXT-13, ‏P1):** סחף עמודים live↔PDF — ‏1,021 מול 1,000 (2%): ה-live מודד בטבלה, ה-PDF במטריקות DejaVu אמיתיות; על 18 עמודים הפער 0. נרשם להידוק (איחוד מקור מדידה).
- **שאלת ההטמעה (EXT-14):** נכסי המקור (11 קובצי JSON של שערים/עיטורים/מפרידים, ‏1,754 גופנים ‏272MB, ‏default_settings ‏264 מפתחות) **אינם מוטמעים** — ל-Red יש את המנגנונים המקבילים (S8 + ייבוא נכסים עם זיהוי תפקיד) אך לא ממיר לפורמט האוספים; נרשם כפער גלוי.

### אימות בדפדפן אמיתי (agent-browser + מלצר מקומי)
הזרקת long_test_text (1.5MB) → ⚡ → **1,021 עמודים, אפס שגיאות console**; ‏DOM: ‏9 חיים + 1,012 placeholders; גלילה לאמצע הספר ⇒ חלון חי [509..511]; צילום מסך מאומת (תוכן מרונדר). נסגר מלצר ודפדפן.

### בדיקות
```
parser 17 · typography 16 · registry 8 · layout 17 · pipeline 14 · s7 15 · s8 39 · s9 25
s10 40 (37+3 וירטואליזציה) · s11 50 · s12 24 · s13 11 · canonical 6 · long-real-text 4 (חדש)
negative-controls 16 · security-a11y 12 ————— סה"כ 314/314 ב-16 קבצים
```
Bundles נבנו מחדש (worker 340.3KB, app 381.4KB); ‏hash קנוני 7ccad899 נשמר (תיקון D-83 אינו נוגע בפריסה).

### פריסה
main נדחף; ‏gh-pages נבנה מחדש מהחבילות המתוקנות ונפרס (אימות בייטים מול החי).

### החלטות שנרשמו
D-83, ‏D-84 — ראו DECISIONS.md. ממצאים חדשים: ‏EXT-12 (תוקן), ‏EXT-13 (P1 פתוח), ‏EXT-14 (P2 פתוח), ‏EXT-10 (בטיפול חלקי).
