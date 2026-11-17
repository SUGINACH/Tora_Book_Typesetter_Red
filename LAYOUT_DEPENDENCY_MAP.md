# LAYOUT_DEPENDENCY_MAP.md — מפת תלויות חיה · Tora Book Typesetter Red
> נבנית אוטומטית מה־require-ים בפועל (סקריפט: `node tools/deps.js` או לפי הטבלה). מצב: 03.11.2026 (אחרי S9 — 66 קשתות); **עודכן ב־15.11.2026 — ראו "תוספת 15.11" בסוף המסמך (178 קשתות)**.

## שכבות (מלמטה למעלה)
```
parser/        : dfa-lexer → block-tokenizer → bracket-scanner   (אין תלויות כלפי מטה)
typography/    : measure-api, kp-linebreak, protectors, dropword  (אין תלויות כלפי מטה)
notes/markers  : אין תלויות (מקור סמכות לסמנים)
layout/ordering: אין תלויות (moveLineForward — D-49)
layout/        : page-templates ← column-flow
                 footnote-budget (מקור יחיד לתקציב) ← dp-planner
                 dp-planner ← protections-matrix ← balancing ← ordering
                 dp-planner ← retreat-loop, candidate-generator, headings-escort
                 dp-planner ← side-notes, endnote-pages (מזומנים מהצינור)
                 balancing ← ordering; balancing ← dp-planner? לא — דרך ordering בלבד (מניעת מעגל)
decoration/    : ornament-fit (מקור יחיד למידות והזמנות — F-08/F-09)
                 dividers ← ornament-fit; ornament-plan ← ornament-fit + dividers
                 theme-sets, shaar-boxes, svg-sanitize (אין תלויות פנימיות)
                 assets-import ← svg-sanitize + theme-sets
                 shaar-pages ← theme-sets + custom-pages + page-templates
                 custom-pages ← page-templates; page-decorations ← page-templates
                 folio; headers-builder (עצמאות פר‑סלוט — D-61)
                 toc-builder ← page-templates (עמודי TOC אמיתיים — D-62)
                 numbering-audit (pn-sequence/pn-overflow — S9.1.6)
output/        : dom-renderer ← notes/markers + page-decorations + shaar-boxes + ornament-fit + page-templates + folio (isCssFrame)
                 html-export; project-io ← settings-registry
audit/         : report-schema ← dp-planner(layoutHash); scanners ← settings-registry
core/          : pipeline ← כל השכבות (כולל shaar-pages/ornament-plan/custom-pages — S8); events/ledger (שעון לוגי)
```

## קשרים קריטיים (אסור לשבור)
- `footnote-budget.getFootnotesReservedHeight` — מקור יחיד לתקציב המרזב (probe==reserved).
- `notes/markers.markerFor` — מקור יחיד לסמנים (גוף + מרזב + עמודי הערות).
- `layout/ordering.moveLineForward` — הזזות טורים חוקיות בלבד (P0-3).
- `core/pipeline` — הצרכן היחיד של planPages/placeSideNotes/buildEndnotePages (סדר CP1..CP5).
- `bodyGeometryHash` — האינווריאנט T1 (D-47); אסור שפאס העיטורים יזיז שורות.
- **S8:** `ornament-fit` — מקור יחיד למידות עיטורים ולהזמנות גובה (F-08/F-09); הרנדרר והפלנר
  צורכים אותו — אין עותקים מקומיים.
- **S8:** `theme-sets.activateThemeSet` — הפעלת ערכה מפעילה את שלושת השערים (F-10 נעול);
  `uniqueShaarId` מבטיח ייחודיות מזהים (שיעור packerandconfigurator).
- **S8:** `shaar-pages.insertShaarPages` — מוזמן מהצינור לפני צילום ה־hash של CP4 (השערים
  חלק מהבסיס הנמדד; תוספת מוצהרת — לא מוטציה).

## תלויות זמן־ריצה
- אפס תלויות חיצוניות (zero runtime dependencies; engines: node>=18).
- offline-guard: exit 7 על בקשה חיצונית (Orange doctrine).


## תוספת 15.11.2026 (סוכן 5) — סנכרון עם הקוד הנוכחי

> נוצר מ־`node tools/deps.js` על `main`@`de92fa0`: **178 קשתות ב־87 מודולים**. המפה שלעיל (03.11, 66 קשתות) נשמרת כרקע מושגי; היא אינה מכסה את 44 המודולים שבטבלה שלהלן. בתחום engine+audit הגרף זהה, זוג־זוג (לפי שם קובץ), למפה שנוצרה מהקוד בידי סוכן 2 — `docs/reports/agent-2/PIPELINE_AND_MODULE_MAP.md` (123 זוגות מודול→מודול).

| מודול | תלוי ב־ | נצרך על ידי |
|---|---|---|
| `engine/audit/editing-recommendations.js` | text-edits, pipeline, block-tokenizer, dfa-lexer | pipeline |
| `engine/audit/text-edits.js` | — | editing-recommendations, app-shell |
| `engine/core/legacy-settings-map.js` | — | app-shell, imud-library |
| `engine/decoration/asset-registry.js` | svg-sanitize | ornament-ink, dom-renderer, engine-worker-main, imud-library |
| `engine/decoration/legacy-ornaments.js` | ornament-fit | legacy-imud-flow |
| `engine/decoration/ornament-ink.js` | asset-registry | dom-renderer, geometry-projector, legacy-projector |
| `engine/extensions/apply-styles.js` | markers | pipeline |
| `engine/extensions/extensions-io.js` | custom-pages, style-schema | export-api, extensions-panel |
| `engine/extensions/style-schema.js` | — | pipeline, extensions-io |
| `engine/import/docx-import.js` | xml-lite, zip-reader | app-shell |
| `engine/import/xml-lite.js` | — | docx-import |
| `engine/import/zip-reader.js` | — | docx-import, export-api, zip-writer |
| `engine/layout/legacy-imud-flow.js` | events, ledger, legacy-ornaments, measure-api | report-schema, pipeline, dom-renderer, legacy-projector |
| `engine/output/export-api.js` | pipeline, settings-registry, extensions-io, zip-reader, page-templates, dom-renderer, geometry-projector, html-export … | app-shell, engine-worker-main |
| `engine/output/geometry-projector.js` | ornament-ink, footnote-budget, side-notes, markers, dom-renderer, line-font, shaar-content, measure-api | export-api |
| `engine/output/legacy-projector.js` | ornament-ink, legacy-imud-flow, line-font, measure-api | export-api |
| `engine/output/line-font.js` | — | dom-renderer, geometry-projector, legacy-projector |
| `engine/output/pdf-writer.js` | — | export-api |
| `engine/output/shaar-content.js` | — | dom-renderer, geometry-projector |
| `engine/output/zip-writer.js` | zip-reader | export-api |
| `engine/typography/font-metrics.js` | — | export-api, font-subset, measure-api |
| `engine/typography/font-subset.js` | font-metrics | export-api |
| `engine/typography/measure-table.js` | — | measure-api |
| `ui/app-shell.js` | text-edits, legacy-settings-map, settings-registry, docx-import, page-templates, export-api, project-io, caret-map … | browser-entry |
| `ui/bindings.generated.js` | — | settings-panel |
| `ui/boot-failure.js` | — | browser-entry |
| `ui/browser-entry.js` | html-export, app-shell, boot-failure, imud-library, settings-persistence, text-decode, worker-client | — |
| `ui/caret-map.js` | dfa-lexer | app-shell |
| `ui/editor-tab.js` | folio | app-shell |
| `ui/engine-worker-main.js` | pipeline, asset-registry, export-api, measure-api, worker-protocol | inline-transport |
| `ui/extensions-panel.js` | extensions-io | app-shell |
| `ui/imud-library.js` | legacy-settings-map, settings-registry, asset-registry | browser-entry |
| `ui/inline-transport.js` | engine-worker-main | app-shell |
| `ui/preview-tab.js` | dom-renderer | app-shell |
| `ui/retypeset-policy.js` | — | app-shell |
| `ui/run-info.js` | — | app-shell |
| `ui/settings-panel.js` | bindings.generated | app-shell |
| `ui/settings-persistence.js` | — | app-shell, browser-entry |
| `ui/status-strip.js` | — | app-shell |
| `ui/test-doc-generator.js` | — | app-shell |
| `ui/testing-tab.js` | report-schema, ledger | app-shell |
| `ui/text-decode.js` | — | browser-entry |
| `ui/worker-client.js` | — | app-shell, browser-entry |
| `ui/worker-protocol.js` | report-schema | engine-worker-main |
