# מפת pipeline ומפת מודולים/תלויות — RED (נוצרה אוטומטית מהקוד על HEAD 6f80156)

> תוצר סוכן 2 (משימת פתיחה). **סוכן 5**: לסנכרן עם `LAYOUT_DEPENDENCY_MAP.md`. הטבלאות נוצרו בסקריפט מהקוד (require / `emit(`) ולא ידנית; אינן מחליפות את המסמך הקיים.

## 1. שני מסלולי עימוד (הממצא החשוב ביותר במיפוי)
| מסלול | נקודת כניסה | מתי נבחר |
|---|---|---|
| מודרני | `typeset()` — `core/pipeline.js:111` (פונקציה אחת, ~1,150 שורות) | ברירת מחדל (`getDefaultSettings()`) |
| legacy-IMUD (פורט נאמן למנוע המקור) | `legacyTypeset` — `layout/legacy-imud-flow.js` (2,981 שורות) | כש-`settings['_layout-profile']==='imud' && settings._imudRaw` (הגדרות מיובאות דרך `importImudSettings`); לפי הערת הכותרת של `tools/layout-parity/run-ours.js` זה המסלול החי של האפליקציה (לא אומת בהרצת UI) |

השלכות: (א) כל תיקון מנוע חייב לציין באיזה מסלול הוא; (ב) מדד ה-parity (P6/P7) ובדיקת `s62` רצים על מסלול legacy; (ג) על אותו קלט שני המסלולים נותנים תוצאות שונות — באג שקיים באחד לא בהכרח קיים בשני (אושר: אובדן "לשון/הפוסקים" — legacy בלבד).

## 2. אתרי `emit(` במסלול המודרני (`core/pipeline.js`) — שלב : label (שורה)
| שורה | שלב | label |
|---:|---|---|
| 168 | parse | cp1-parsed |
| 174 | scope-map | cp2-scope |
| 293 | parse | endnote-class-directive |
| 572 | measure | cp2-measured |
| 597 | page-plan | shaar-pages-inserted |
| 674 | toc | toc-pages-inserted |
| 725 | folio | endnote-pages-appended |
| 736 | decorations | cp4-decoration-pass |
| 1109 | scope-map | paren-ranges-populated |
| 1113 | ledger-finalize | summary |
| 1115 | render | cp5-render-ready |

**Checkpoints שנמצאו בקוד המנוע (כל הקבצים):** cp1-parsed, cp2-measured, cp2-scope, cp4-decoration-pass, cp5-render-ready — **אין `cp3`** (תכנון עמודים / הגנות / איזון / נסיגה אינו מסומן כ-checkpoint; האירועים שלו נפלטים ממודולי `layout/` ללא תווית cp).

## 3. אתרי `emit(` במודולי המנוע האחרים (מודול:שורה → שלב : label)
- `decoration/legacy-ornaments.js:114` → ornaments : legacy-h2-ornaments
- `decoration/numbering-audit.js:88` → folio : pn-audit
- `decoration/ornament-plan.js:292` → decorations : ornament-pass
- `decoration/toc-builder.js:211` → toc : toc-pages-built
- `decoration/toc-builder.js:261` → toc : binding-parity-rebuild
- `layout/balancing.js:124` → balance : chapter-end-natural
- `layout/dp-planner.js:182` → balance : fix-drop-word
- `layout/dp-planner.js:186` → balance : column-balance
- `layout/dp-planner.js:272` → notes-budget : fn-split
- `layout/dp-planner.js:277` → notes-budget : fn-moved-whole
- `layout/dp-planner.js:315` → notes-budget : footnote-rejected-to-body
- `layout/dp-planner.js:341` → page-plan : heading-new-page-mode
- `layout/dp-planner.js:352` → page-plan : part-opening
- `layout/dp-planner.js:365` → page-plan : heading-side-note
- `layout/dp-planner.js:375` → page-plan : custom-style-new-location
- `layout/dp-planner.js:386` → page-plan : custom-style-side-note
- `layout/dp-planner.js:399` → page-plan : custom-style-band
- `layout/dp-planner.js:425` → page-plan : h3-spanning
- `layout/dp-planner.js:441` → page-plan : h2-new-page
- `layout/dp-planner.js:456` → page-plan : h2-spanning
- `layout/dp-planner.js:471` → page-plan : heading-escort-push
- `layout/dp-planner.js:514` → notes-budget : fn-tail-continuation
- `layout/dp-planner.js:622` → protections : candidate-split
- `layout/dp-planner.js:626` → protections : legal-split
- `layout/endnote-pages.js:132` → notes-budget : endnote-pages-built
- `layout/legacy-imud-flow.js:2763` → parse : legacy-imud: tokenize + sections
- `layout/legacy-imud-flow.js:2764` → measure : legacy-imud: line breaking
- `layout/legacy-imud-flow.js:2765` → page-plan : legacy-imud: flow + columns
- `layout/legacy-imud-flow.js:2766` → folio : legacy-imud: folios + TOC
- `layout/legacy-imud-flow.js:2767` → render : legacy-imud: result
- `layout/legacy-imud-flow.js:2860` → render : legacy-imud: אובדן תוכן — החשבונאות אדומה
- `layout/legacy-imud-flow.js:2943` → decorations : legacy-imud: gate design + header rule
- `layout/retreat-loop.js:65` → protections : retreat-converged
- `layout/retreat-loop.js:81` → protections : oscillation-detected
- `layout/retreat-loop.js:119` → protections : retreat-frozen
- `layout/retreat-loop.js:122` → protections : retreat-iteration
- `layout/side-notes.js:146` → decorations : side-notes-tail-page

## 4. מסלול legacy — עוגני קוד (שורה: הגדרה)
```
766:function headingItemH(level) {
803:function legacyTypeset(rawText, settings, env) {
1306:      const openBlock = (yTop) => {
1317:      const rollbackTrailingHeadings = () => {
1339:      const finalizeBlock = (blk, nextTok, sectionEnd, pageClose = false, reason = '') => {
1473:      const effCols = (blk) => blk.split ? [blk.split.r, blk.split.l] : [blk.cols[0], blk.cols[1]];
2245:  function balanceBlock(block, availH) {
```
אירועי legacy (שלב : label): 

## 5. מפת מודולים ותלויות (נוצרה אוטומטית: require יחסי → "תלוי ב-"; "נצרך ע"י" = מספר מודולים שדורשים אותו)
| מודול (red-build/src/…) | שורות | תלוי ב- | נצרך ע"י (מס') |
|---|---:|---|---:|
| audit/report-schema.js | 114 | layout/dp-planner.js, layout/legacy-imud-flow.js | 2 |
| audit/scanners.js | 116 | core/settings-registry.js | 0 |
| audit/editing-recommendations.js | 222 | audit/text-edits.js, core/pipeline.js, parser/block-tokenizer.js, parser/dfa-lexer.js | 1 |
| audit/text-edits.js | 48 | — | 2 |
| core/events.js | 48 | — | 2 |
| core/ledger.js | 88 | — | 4 |
| core/legacy-settings-map.js | 398 | — | 2 |
| core/pipeline.js | 1153 | audit/editing-recommendations.js, core/events.js, core/ledger.js, core/settings-registry.js, decoration/custom-pages.js, decoration/folio.js, decoration/headers-builder.js, decoration/numbering-audit.js, decoration/ornament-fit.js, decoration/ornament-plan.js, decoration/shaar-pages.js, decoration/toc-builder.js, extensions/apply-styles.js, extensions/style-schema.js, layout/balancing.js, layout/dp-planner.js, layout/endnote-pages.js, layout/headings-escort.js, layout/legacy-imud-flow.js, layout/page-templates.js, layout/side-notes.js, notes/markers.js, parser/block-tokenizer.js, parser/bracket-scanner.js, parser/dfa-lexer.js, typography/dropword.js, typography/measure-api.js, typography/protectors.js | 3 |
| core/settings-registry.js | 309 | — | 6 |
| decoration/asset-registry.js | 102 | decoration/svg-sanitize.js | 4 |
| decoration/assets-import.js | 115 | decoration/svg-sanitize.js, decoration/theme-sets.js | 0 |
| decoration/custom-pages.js | 133 | layout/page-templates.js | 3 |
| decoration/dividers.js | 111 | decoration/ornament-fit.js | 1 |
| decoration/folio.js | 133 | — | 3 |
| decoration/headers-builder.js | 132 | — | 1 |
| decoration/legacy-ornaments.js | 120 | decoration/ornament-fit.js | 1 |
| decoration/numbering-audit.js | 94 | — | 1 |
| decoration/ornament-fit.js | 176 | — | 5 |
| decoration/ornament-ink.js | 482 | decoration/asset-registry.js | 3 |
| decoration/ornament-plan.js | 398 | decoration/dividers.js, decoration/ornament-fit.js | 1 |
| decoration/page-decorations.js | 130 | layout/page-templates.js | 1 |
| decoration/shaar-boxes.js | 139 | — | 1 |
| decoration/shaar-pages.js | 166 | decoration/custom-pages.js, decoration/theme-sets.js, layout/page-templates.js | 1 |
| decoration/svg-sanitize.js | 95 | — | 2 |
| decoration/theme-sets.js | 159 | — | 2 |
| decoration/toc-builder.js | 323 | layout/page-templates.js | 1 |
| extensions/apply-styles.js | 147 | notes/markers.js | 1 |
| extensions/extensions-io.js | 111 | decoration/custom-pages.js, extensions/style-schema.js | 2 |
| extensions/style-schema.js | 296 | — | 2 |
| import/docx-import.js | 221 | import/xml-lite.js, import/zip-reader.js | 1 |
| import/xml-lite.js | 142 | — | 1 |
| import/zip-reader.js | 300 | — | 3 |
| layout/balancing.js | 210 | layout/column-flow.js | 3 |
| layout/candidate-generator.js | 42 | layout/column-flow.js | 1 |
| layout/column-flow.js | 69 | layout/page-templates.js | 4 |
| layout/dp-planner.js | 631 | core/ledger.js, layout/balancing.js, layout/candidate-generator.js, layout/column-flow.js, layout/footnote-budget.js, layout/ordering.js, layout/page-templates.js, layout/protections-matrix.js, layout/retreat-loop.js, notes/markers.js, typography/protectors.js | 2 |
| layout/endnote-pages.js | 180 | layout/page-templates.js, notes/markers.js | 1 |
| layout/footnote-budget.js | 70 | — | 2 |
| layout/headings-escort.js | 34 | — | 1 |
| layout/legacy-imud-flow.js | 2981 | core/events.js, core/ledger.js, decoration/legacy-ornaments.js, typography/measure-api.js | 4 |
| layout/ordering.js | 30 | — | 1 |
| layout/page-templates.js | 90 | — | 11 |
| layout/protections-matrix.js | 272 | layout/balancing.js, layout/column-flow.js, notes/markers.js | 1 |
| layout/retreat-loop.js | 154 | — | 1 |
| layout/side-notes.js | 174 | — | 2 |
| notes/markers.js | 79 | — | 7 |
| output/dom-renderer.js | 1363 | decoration/asset-registry.js, decoration/folio.js, decoration/ornament-fit.js, decoration/ornament-ink.js, decoration/page-decorations.js, decoration/shaar-boxes.js, layout/legacy-imud-flow.js, layout/page-templates.js, notes/markers.js, output/line-font.js, output/shaar-content.js | 3 |
| output/export-api.js | 511 | core/pipeline.js, core/settings-registry.js, extensions/extensions-io.js, import/zip-reader.js, layout/page-templates.js, output/dom-renderer.js, output/geometry-projector.js, output/html-export.js, output/legacy-projector.js, output/pdf-writer.js, output/project-io.js, output/zip-writer.js, typography/font-metrics.js, typography/font-subset.js, typography/measure-api.js | 2 |
| output/geometry-projector.js | 738 | decoration/ornament-ink.js, layout/footnote-budget.js, layout/side-notes.js, notes/markers.js, output/dom-renderer.js, output/line-font.js, output/shaar-content.js, typography/measure-api.js | 1 |
| output/html-export.js | 188 | — | 2 |
| output/legacy-projector.js | 654 | decoration/ornament-ink.js, layout/legacy-imud-flow.js, output/line-font.js, typography/measure-api.js | 1 |
| output/line-font.js | 45 | — | 3 |
| output/pdf-writer.js | 704 | — | 1 |
| output/project-io.js | 81 | core/settings-registry.js | 2 |
| output/shaar-content.js | 111 | — | 2 |
| output/zip-writer.js | 98 | import/zip-reader.js | 1 |
| parser/block-tokenizer.js | 147 | parser/bracket-scanner.js, parser/dfa-lexer.js | 2 |
| parser/bracket-scanner.js | 157 | — | 2 |
| parser/dfa-lexer.js | 93 | — | 4 |
| typography/dropword.js | 86 | — | 1 |
| typography/font-metrics.js | 377 | — | 3 |
| typography/font-subset.js | 210 | typography/font-metrics.js | 1 |
| typography/kp-linebreak.js | 243 | — | 1 |
| typography/measure-api.js | 248 | typography/font-metrics.js, typography/kp-linebreak.js, typography/measure-table.js | 6 |
| typography/measure-table.js | 44 | — | 1 |
| typography/protectors.js | 116 | — | 2 |

**ממשק UI (בבעלות סוכן 1):** 19 קבצים, 7785 שורות. תלויות חוצות-גבול UI→מנוע/audit: 22 (app-shell.js→audit/text-edits.js; app-shell.js→core/legacy-settings-map.js; app-shell.js→core/settings-registry.js; app-shell.js→import/docx-import.js; app-shell.js→layout/page-templates.js; app-shell.js→output/export-api.js; app-shell.js→output/project-io.js; browser-entry.js→output/html-export.js; caret-map.js→parser/dfa-lexer.js; editor-tab.js→decoration/folio.js; engine-worker-main.js→core/pipeline.js; engine-worker-main.js→decoration/asset-registry.js; engine-worker-main.js→output/export-api.js; engine-worker-main.js→typography/measure-api.js; …).

**סה"כ מנוע+audit:** 66 קבצים, 17951 שורות.

## 6. עובדות תשתית שנמצאו במיפוי
- `red-build/ui/engine-worker.bundle.js` ו-`app.bundle.js` הם **תוצרי build שנכנסים ל-git** (`tools/build-worker-bundle.js`: "מחוללים מחדש בכל שינוי מנוע"). נבדק: בנייה מחדש על HEAD נותנת קובץ זהה בייט-לבייט (md5 `25e25a0980bf…`) — הבנייה דטרמיניסטית והבאנדל עדכני. **סיכון תיאום:** כל PR שמשנה מנוע חייב לכלול באנדל מחודש ⇒ התנגשויות מיזוג בין PRs (סוכנים 1, 2, 5).
- אינדקסי עמוד ב-ledger: נצפה שבמסלול המודרני אינדקסי `column-imbalance` (2,5,8,…) אינם תואמים לאינדקסי העמודים הסופיים (אחרי שערים/תוכן). **לא אומת** — נדרש לפני קישור ממצא-ledger לעמוד סופי (ראו gap analysis, שורה 7).
