# LAYOUT_DEPENDENCY_MAP.md — מפת תלויות חיה · Tora Book Typesetter Red
> נבנית אוטומטית מה־require-ים בפועל (סקריפט: `node tools/deps.js` או לפי הטבלה). מצב: 02.11.2026.

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
decoration/    : folio, headers-builder, toc-builder, dividers, ornament-fit, page-decorations
output/        : dom-renderer ← notes/markers; html-export; project-io ← settings-registry
audit/         : report-schema ← dp-planner(layoutHash); scanners ← settings-registry
core/          : pipeline ← כל השכבות; events/ledger (שעון לוגי — P1-6)
```

## קשרים קריטיים (אסור לשבור)
- `footnote-budget.getFootnotesReservedHeight` — מקור יחיד לתקציב המרזב (probe==reserved).
- `notes/markers.markerFor` — מקור יחיד לסמנים (גוף + מרזב + עמודי הערות).
- `layout/ordering.moveLineForward` — הזזות טורים חוקיות בלבד (P0-3).
- `core/pipeline` — הצרכן היחיד של planPages/placeSideNotes/buildEndnotePages (סדר CP1..CP5).
- `bodyGeometryHash` — האינווריאנט T1 (D-47); אסור שפאס העיטורים יזיז שורות.

## תלויות זמן־ריצה
- אפס תלויות חיצוניות (zero runtime dependencies; engines: node>=18).
- offline-guard: exit 7 על בקשה חיצונית (Orange doctrine).
