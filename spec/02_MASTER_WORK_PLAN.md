# תכנית עבודה מאסטר — מיזוג והשלמת מנוע העימוד (IMUD_TORANI / Unified Edition)

> **גרסה:** 1.0 · **תאריך:** 2026-11-02 · **מסמך־אם:** `01_MASTER_SPECIFICATION.md` (כל שלב מציין את ה‑REQ שהוא סוגר)
> **עיקרון תכנון אנטי־טלאי:** כל שינוי נכנס רק אם 4 שכבות מעודכנות יחד — **פקד ↔ מפתח ↔ מנגנון ↔ בדיקה** — ואם יש לו שער קבלה מדיד בסוף השלב. אף שלב לא מסתיים ב"ירוק" בלי ראיות (artifacts). סדר השלבים נקבע כך שתלויות נפתרות **לפני** שבונות עליהן (מדידה → שבירת שורות → פריסה → קישוט → ממשק → ייצוא), מה שמונע רובד תיקונים חוזרים (לקח V1→V4 ו‑Green→Orange: השמטות נבעו מכך שבנו UI לפני חוזה הגדרות, ומנוע לפני מדידה).

---

## 0. מפות החלטות ומבנה העבודה

### 0.1 עקרונות מחייבים לכל שלב (from Spec §0.3)
1. commit-per-feature + test (מודל Orange); אין לערבב ניקיון קבצים עם תיקוני engine (כלל V23).
2. כל החלטה מתועדת ב‑DECISIONS.md (D-series) + WORKLOG per phase; registry של בעיות (ISSUE_REGISTRY) — P0/P1/P2.
3. לא לטעון ללא ראיה; לא להוריד ממצאים כדי להצהיר ניצחון; לא להשבית אבחון; לא להגדיל timeout עיוור.
4. לא למחוק לפי שם/גודל; dependency-map לפני מגע; heritage → archive.
5. CI: להפעיל, למסור קישורים, לא להמתין; המשתמש יודיע על סיום; ואז לסקור logs+artifacts.
6. כל תיקון חייב לעבור במסמך המלא (canonical corpus) — לא רק בfixture.
7. no-op proof: מכשור/trace חייב להוכיח שהשאיר layout hash זהה.

### 0.2 מבנה ענפים
```
UNIFIED  ← ענף העבודה היחיד (base: Orange HEAD)
  ├─ phase/S1..S13 branches (PR per feature, squash-merge with artifacts link)
main     ← נשאר IMUD live עד S13 cutover (no direct merges V21↔V23 — K-7)
archive/*← legacy lines (V20.x, old_ver, debug/) — read-only
```

### 0.3 מפת REQ → שלבים (traceability matrix — חלקית, השלמה בכל PR)

| משפחת REQ | S0 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 | S11 | S12 | S13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PAR (parser/scope) | | ● | ■ | | ○ | | | | | | | ■(styles/docx) | | |
| LB (typography) | | | ○ | ■ | ○ | | | | | | | | ○ | |
| BAL (layout) | | | | ○ | | ■ | ■ | | | | | | | |
| FN (notes) | | | | ○ | | ○ | ■ | ■ | | | | | | |
| ORN (decorations) | | | | | | | | | ■ | | | | | |
| HDR (headers/folio/TOC) | | | | | | | | | | ■ | | | | |
| UI | | | | | | | | | | | ■ | | | |
| EXP (export) | | | | | | | | | | | | ○ | ■ | |
| GOV (audit/CI/gates) | ■ | ■ | ○ | ○ | ■ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ■ |

■=primary closure · ○=partial/verification · ●=foundation work.

---

# שלב S0 — יסודות, תשתית וניהול (Foundation & Governance)
**מטרה:** הכנת הקרקע כך שאף שלב אחר לא ייתקע בתשתית ולא יאבד מידע. **סוגר:** REQ-GOV-08/09/10, D-01/D-10/D-12.

### S0.1 משימות
1. ליצור ענף `UNIFIED` מ‑Orange HEAD; לחתום sha256 של כל 15 קבצי הנתונים (כבר ≡ 5/5) ב‑PROVENANCE.
2. לאמץ את `LAYOUT_DEPENDENCY_MAP.md` (814L) כמפה חיה; להריץ scanner חדשות לכל PR.
3. להקים `DECISIONS.md`, `WORKLOG.md`, `OPEN_QUESTIONS.md`, `ISSUE_REGISTRY.md` (פורמט: ID|severity|status|evidence links|fix commit|regression test id).
4. לארגן `tests/` מחדש: `tests/unit`, `tests/fixtures`, `tests/corpus`, `tests/e2e`, `tests/audit`; להעתיק (לא למזוג!) את אוצר הבדיקות: 21 scenarios של IMUD + 8 feature suites + Gold test-triggers (6 kinds) + Orange 8 node tests + Yellow unit tests.
5. להגדיר npm scripts תקניים: `test:unit`, `test:settings`, `test:layout:quick` (~1min), `test:audit:default`, `test:audit:ornaments`, `test:determinism`, `test:e2e:ui`, `report:screenshot-pdf`.
6. lockfile אחיד (`package-lock.json` מ‑Gold; Playwright pinned 1.55.0; Chromium version recorded).
7. AGENTS/AI_WORKFLOW מסמך הנחיות AI חדש (כולל פרומפט continuation מעודכן V23 + כללי Z.ai 8 + Claude §6.4 12).
8. **אוסף הזהב של antis-patterns:** לרכז את 14 תיקוני ה‑false-positive של Z.ai + F-01..F-21 של Claude כ‑`tests/negative-controls/` (כל pattern עם fixture שמראה "לא לדווח").

### S0.2 צ'קליסט סיום S0 (Gate)
- [ ] `UNIFIED` branch קיים; Orange HEAD hash מתועד; 15 JSON hashes רשומים.
- [ ] Dependency map עובר lint (כל קובץ src מקושר).
- [ ] 4 קבצי ניהול (DECISIONS/WORKLOG/OPEN_QUESTIONS/ISSUE_REGISTRY) מקוימים עם תבניות.
- [ ] כל 5 אוספי הבדיקות רצים local: unit green, quick-layout green on baseline, triggers runner עובד **אחרי תיקון Bug3** (split('_')→mapping table) — או Issue P1 פתוח עם repro.
- [ ] npm scripts מוגדרים ורשומים ב‑README (truthful, current branch).
- [ ] negative-controls ≥ 14 fixtures, כולם מדווחים 0 findings.
- [ ] PROVENANCE + LICENSE/OFL manifest for fonts.
- [ ] החלטות D-01, D-10, D-12 נרשמו.

**Deliverables:** branch skeleton + governance docs + unified test harness spec. **Time-box:** קצר; אין קוד מנוע בשלב זה.

---

# שלב S1 — שקיפות סיבתית ומכשור אבחון (Causality Instrumentation)
**מטרה:** לפני שמתקנים — מודדים. המשתמש דרש: מנוע **שקוף סיבתית**; כל ממצא עם trace שלבים; lifecycle states; coverage accounting. **סוגר:** REQ-GOV-01/02/03/06/07, U-A1..A7, D-11/D-15.

### S1.1 משימות
1. **Port Yellow engine-diagnostics trio** (engine-inputs.js, engine-trace.js, engine-diagnostics.js + `diagnose` bridge + one-click report button) onto UNIFIED.
2. **Complete step-by-step audit (Gold)**: recordLayoutGeometryStage already partial → add stages vocabulary: parse→style-prepass→measure→line-break→column-fill→balance→justify→shrink→reclaim→notes-insert→divider-fit→folio→final; captureLineRects + captureComputedStyle behind flags; pageIndex per event; droppedEvents counter must equal 0.
3. **Lifecycle state machine** (10 states מ‑V23 handoff): implement ledger schema v2: `{issue_id, kind, page, target, first_seen_stage, transitions[], predicate_before, predicate_after, candidates[], capacity_before/after, route, selected, rollback_reason}`.
4. **Coverage accountant**: every page classified evaluated/excluded(reason)/not-evaluated; explain the 17(default)/18(ornaments) missing `.page-body-flow` pages by structural role; report gate refuses "full coverage" claim without accounting.
5. **Restore lost Green audit kinds**: container-overlap, tolerated-containment-rounding; **port Yellow kinds**: chain-broken, empty-column, heading-at-bottom, pua-char; **port Gold kinds**: block-gap, ornament-asymmetry/overflow/overlap, settings-verification → union catalog of 26+ kinds in ONE `kinds-catalog.js` with Hebrew names (GEOM_KIND_NAMES) and per-kind: definition, exclusions, measurement predicate, severity defaults.
6. **Fix CLI waitForFunction timeout root cause** per protocol (predicate correctness + init order; not blind timeout increase) — document experiment log.
7. **Determinism harness**: repeat-render layout hash; inter-commit baseline regression vs `expected_baseline.json`; fingerprint block (Chromium/Playwright/fonts/input sha).
8. **Screenshot-PDF report port** (Gold issues-screenshot-pdf): bookmarks, white bg, per-issue page, saved into repo reports dir (user preference: no full-workflow zip download).
9. **no-op proof gate**: instrumentation PRs must show identical layout hash pre/post on canonical doc both configs.
10. **Trigger-hit matrix**: record which fixtures/triggers actually exercised per run; NOT EXERCISED explicitly marked (environment coverage problem #37).

### S1.2 Gate S1
- [ ] Canonical runs produce trace files passing schema v2 validation; droppedEvents=0.
- [ ] Repro of ch3/p4 imbalance shows stage where created + why correction blocked/reverted (ledger demo, like V23 did for p376).
- [ ] All 26+ kinds registered, Hebrew display names active in UI/report (Working_rules #1).
- [ ] Coverage table published: N evaluated / M excluded-with-reason / K not-evaluated; zero unexplained.
- [ ] Determinism: two-run hash equality PASS; baseline diff report generated vs Orange@HEAD.
- [ ] CLI timeout root-cause documented with before/after evidence (protocol §1 checklist attached).
- [ ] Instrumentation commits proven no-op (hash equality artifacts).
- [ ] One-click diagnostic report works in UI (Yellow feature alive).
- [ ] Negative controls still 0-finding after kinds expansion (no new false positives introduced!).

---

# שלב S2 — שכבה 1: פיענוח וטוקניזציה (DFA Parser + Bracket Scope)
**מטרה:** eliminate at root the metadata-misparse and paren family that spawned the entire V23 investigation. **סוגר:** REQ-PAR-01..05, REQ-PAR-ST-01..04, U-E items.

### S2.1 משימות
1. Implement `dfa-lexer.js`: metadata recognition **only** in preamble (until blank line or first heading); mid-document `נושא - …` remains paragraph (Z.ai original bug class).
2. Implement `bracket-scanner.js`: stack-based balanced scanner; nesting depth per position; ranges crossing paragraphs/columns/pages flagged; unmatched closers reported but **never auto-"fixed"** (verify against source first — user doctrine).
3. Global paren **pre-pass ordering fix**: build scope map BEFORE typesetting; apply inside-paren styling BEFORE measurement (this is the causality root found: 9 geometry changes from paren wrapping late). Integrate with L2 pipeline checkpoint CP2.
4. Block tokenizer hardening: H0–H7 dash rules (`-`/`–`/`—` required; silent non-heading otherwise), endnote prefix, editorial `##…##` removal, consecutive-notes `[א][ב]` separation with count conservation assertions.
5. Character hygiene: U+E000 internal spaces protected for measuring only then scrubbed pre-render; PUA per-char policy checklist; gershayim/quote normalization (Z.ai fixes).
6. Content-preservation invariant: token multiset hash input==output (text-completeness kind with punctuation/bracket-content skip rule from Z.ai fix).
7. Wire everything to decision-ledger events (CP1/CP2 emitted through S1 machinery).

### S2.2 Gate S2
- [ ] Unit suite: 12+ metadata vectors incl. `mid-doc-metadata-like-line.txt` — 0 misclassifications.
- [ ] Scope map on canonical doc reproduces V23 numbers within tolerance: ~2,483 matched pairs, ~97 cross-column, ~51 cross-page, 3 unmatched-closers each individually justified vs source text (report artifact).
- [ ] Nested-parens fixture: depth map correct; cross-boundary styling consistent measure-vs-render (counterfactual captureParenFont: 0 divergence).
- [ ] Consecutive notes fixture: 2 notes extracted, markers preserved, nothing swallowed.
- [ ] Text-completeness = 0 findings on canonical (post-skip-rules); U+E000 absent from final DOM.
- [ ] Canonical audit deltas attributable: any finding-count change explained item-by-item in registry (no silent drops).
- [ ] Layout hash changed ONLY where expected (styling-before-measure legitimately alters breaks) — diff report reviewed & approved.

---

# שלב S3 — שכבה 2: מיקרו־טיפוגרפיה (Measure API + Knuth-Plass + Protectors)
**מטרה:** שורות אופטימליות דטרמיניסטיות עם הגנות עבריות. **סוגר:** REQ-LB-01..04, REQ-LB-07, fixDropWordInColumns port, part of K-1 prevention.

### S3.1 משימות
1. Refactor ALL scattered `offsetHeight/scrollHeight/getClientRects` reads into `measure-api.js` single entry (grep-enforced lint rule in CI). DOM implementation stays as oracle.
2. Port Gold `fixDropWordInColumns` + line-rect measurement lessons (Range.getClientRects truth; RTL rect.right−colRect.left trap fix from Z.ai #5).
3. Implement KP line-breaking core (pure JS, no shapery yet): boxes/glues/penalties from AST tokens; badness thresholds; looseness; active-list DP; **no-hyphenation glue table**; NBSP units respected.
4. Protectors as penalty tables: note-marker+word, gersh/grushayim, abbreviations, min-phrase tails; oversized glued pair → drop gluing (Claude §6.2(5)).
5. Atomic footnote marker width: \uE000 substitution during measure so a note never splits columns/pages (V3/V4 breakthrough ported properly now at L3).
6. Runt protection at break-selection time (≥50% last p-cut line default; configurable strictness levels per Mapping request C-6 widow/orphan strictness select).
7. Memoized `getLinesFromParagraph` cache (perf plan) + cache hit telemetry.
8. First-word window v1: modes Drop/Inline/Bold/None, length 1–2, threshold 2/3; alignment-to-cap-height deferred to S8? NO — keep REQ-LB-05 here with font metrics hook (needs capHeight from metrics; do minimal vertical-align solution now, refine in S12 with math metrics).
9. Golden parity tests: KP vs current greedy on corpus → fit-score improvement report; line-break diffs manually reviewed for regressions.

### S3.2 Gate S3
- [ ] measure-api lint: 0 direct geometry reads outside api (+ allowlist file).
- [ ] KP unit suite: classic pathological examples + Hebrew fixtures; determinism hash stable.
- [ ] sparse-line findings (p-cut only) reduced vs S2 baseline on canonical; every remaining one ledger-justified.
- [ ] note-marker-line-break = 0; fn atomicity holds (0 fn-split across columns/pages).
- [ ] Widow/orphan raw counts = 0 on canonical except ledger-approved exceptions (K-1 conflicts resolved by optimal cut selection).
- [ ] Perf: measure-cache hit ≥80% warm; total runtime not regressed >10% (budget tracked).
- [ ] First-word modes render; cap-alignment fixture ≤1px deviation (or documented blocker issue P1 with metrics dependency noted for S12).

---

# שלב S4 — חוזה הגדרות שלושת־השכבות (Settings Registry Contract) — **השלב האנטי־טלאי המרכזי**
**מטרה:** למנוע פיזית את מחלת ה"פקד מת / מפתח רפ / מנגנון יתום" שתועדה ב‑F-13/F-19 וב‑Monster §6.2. **סוגר:** REQ-GOV-04/05, gap-register items (font-picker preserve-value, V4 audits), all future panel work depends on this.

### S4.1 משימות
1. Build `core/settings-registry.js`: declarative table for **every key** (~280 keys superset): {id, type, range/enum, panel, control-id, consumers[], effect-test-id, default, migration}. Generate from it: default_settings.json superschema + HTML control bindings + docs table (single source!).
2. Version field + migrations (v1→v2 rename map for merged panels).
3. Port IMUD `settings-manager` font-picker preserve-missing-value (+14 lines) into registry behavior.
4. Implement scanners as permanent CI jobs: dead-control (every control id consumed), phantom-key (every json key has consumer+control), orphan-mechanism (every mechanism gated by a key), dynamic-id awareness (`prefix+'-w'`).
5. settings-effect harness (IMUD tests/audit/settings-effect.js ported+extended): change value → assert computed style/DOM/measured geometry responds (Gold settings-verification kind consumes this).
6. Audit the 24-point "לא לשמוט" list (Monster §10.2) — convert each into a registry row or an explicit exclusion with reason.
7. Retire duplicate/dead flags: avoid-runt-word phantom in Yellow/Green lineage (must be real here), balance-chapter-end half-port (completed in S5 but registered NOW).
8. Panel restructure mapping (Z2 12-panel architecture) defined as data (not HTML yet) so S8–S10 just render from registry.

### S4.2 Gate S4
- [ ] Registry covers 100% of union keys; generation outputs match hand-reviewed diff.
- [ ] All three scanners PASS in CI (zero mismatches) — this gate protects every later phase.
- [ ] settings-effect: ≥90% of keys have at least one automated effect assertion; remainder listed with justification (internal-only switches).
- [ ] Migration test: load v1 exports (all 5 repos' default_settings variants + user templates makom-bina) → upgrade lossless.
- [ ] font-picker preserves unknown saved font via injected option (regression test).
- [ ] Monster §10.2 24-item list: each closed with commit/test reference or documented decision.

---

# שלב S5 — שכבה 3: תכנון עמודים וטורים (DP Planner + Balancing + Protections Matrix)
**מטרה:** הלב המקרו־מבני: בחירת פיצולים עם הקשר, קיבולת, ולולאת נסיגה מאוחדת. **סוגר:** REQ-BAL-01..05, REQ-BAL-08..11, K-1..K-4 adjudications, restore-lost (terminal-residual, chapter-end).

### S5.1 משימות
1. Page-template model per PT-01..PT-10 (types with margins/heights/footnote budget/verso rules) driven by registry.
2. Candidate generator: split points from L3 line boxes; scoring = f(Δ height, **capacityBefore/capacityAfter justify**, next-block context H3/full-width, penalties ladder: whole-paragraph moves > line moves > leading > para-spacing; overflow = HARD reject not ×2000 soft).
3. Multi-column DP planner replacing greedy fill; memoization; bounded search window (perf plan step 2).
4. Protections matrix enforcement (Claude §2.5.4): after EVERY cut-moving operation (balanceColumns, ornament fit, note-area growth, divider insert, rollback) re-run full protection set: widow/orphan/heading-escort/runt/marker/paren-consistency.
5. Unified retreat loop (K-3): single iteration controller owning paren-protection ↔ widow/orphan ↔ balance ↔ heading interactions with convergence criteria + oscillation detector (if ping-pong >N → freeze best legal compromise + ledger 'rollback-compromise').
6. Restore Green-lost: `allow-terminal-residual-fallback` mechanism + `balance-chapter-end` full modes {balance,stretch,natural} with tests (fixture ch63_final_paragraph_failure_case).
7. Port Gold rebalance2-after-parens; integrate with pre-pass from S2 (parens styled early → less need, but keep safety net).
8. Rollback integrity (REQ-BAL-09): snapshot includes footnotes positions, side notes, heading-divider state (forgetHeadingSeen semantics), inserted ornaments counters.
9. Widow/orphan separate toggles top-of-page/bottom-of-page (Mapping request #4) wired via registry.
10. Decision ledger writes for every rejected candidate (why) — feeds S1 trace.

### S5.2 Gate S5
- [ ] imbalance Δ>5px findings = 0 on canonical both configs except documented compromises (each with capacity evidence).
- [ ] p376-class fixture: selected candidate ≠ naive-min-diff; capacity numbers in ledger prove reasoning.
- [ ] Oscillation detector: 0 unresolved ping-pongs; competing-repair side-effects classified in ledger.
- [ ] terminal-residual + chapter-end modes: 3-mode diff report matches spec table; CSS class honored again (was orphan class).
- [ ] Protection matrix: mutation testing — inject artificial post-move scenario, verify protections fire (unit).
- [ ] Full-corpus regression vs S3 baseline: no new findings without registry entry; page count drift explained.
- [ ] Perf within budget (DP search bounded; profile attached before/after).

---

# שלב S6 — הערות שוליים, תקציבי גובה ו‑AutoQuality
**מטרה:** מערכת הערות חסינה + מתיחות איכות אוטומטיות בגבולות מוצהרים. **סוגר:** REQ-FN-01..02, REQ-BAL-06..07, stretch-overshoot, AQ full stack.

### S6.1 משימות
1. Footnote budget model: reserve formula unified (probe == reserved — close F-17), includes notes of the paragraph currently being measured (V2/V4 lesson), grows/shrinks with column ops; re-fit pass after flushFootnotes (Claude §6.2(3) S6 gap): overflow → return last lines to queue.
2. Long-footnote policy: split across pages preserving marker/order/structure OR move-whole with continuation mark — implement chosen default + setting; fixture suite incl. multi-note pages.
3. Overlap pairwise checks + push-down with minTop for footnotes area; containment thresholds per registry (10px rounding classification vs true overlap — semantic separation per S1 catalog).
4. Port Gold AutoQuality complete: stretchBy{Word,Letter,Heading}Spacing stages, shared-load, caps (0.95–1.05 ws etc.), compress/stretch direction logic, thresholds; register 11 aq-* keys + 18 controls + mechanism + effect tests (three-layer satisfied by construction).
5. StretchPageToBottom clamp 20px overshoot (ch3p4/ch3p17/ch72p9 class eliminated structurally).
6. AQ report mode: on/off diff + per-stage contribution to fit score (transparency requirement).

### S6.2 Gate S6
- [ ] fn-* kinds all = 0 on canonical (both configs) except ledger'd long-note cases handled per policy.
- [ ] Reserve-formula unit test: probe==reserved identity.
- [ ] Long-note fixtures: split/move policies verified visually (screenshots) + geometrically (rects).
- [ ] AQ on/off: word-spacing never exceeds declared bounds anywhere (scan report); imbalance improvements quantified.
- [ ] containment-rounding vs overlap: each of the historical 6–10 rounding findings re-adjudicated with examples (open question closed or escalated to user with 3 concrete samples).
- [ ] Overshoot: 0 pages stretched beyond clamp; short-last-page natural endings untouched (K-4 respected).

---

# שלב S7 — הערות סיום, הערות צד (H7), מצבי פריסת הערות
**מטרה:** סגירת כל משפחת ההערות המבנית. **סוגר:** REQ-FN-03..07, FN continuous mode completion.

### S7.1 משימות
1. Endnote pages engine: "הערות"/"הערות (המשך)" pagination at part end; per-part counters reset; 1/2 column setting; title+side ornaments; f/s-note-body font/size; last-line align per note body.
2. Side-notes (marginalia) full contract: anchor token binding, placement at paragraph top, push-down cascade, batch consecutive H7s, cleanup pagePendingNotes post-balance, reposition on paragraph moves, outer-margin recto/verso aware, 20px containment.
3. h7-conversion accuracy: per-paragraph comparison (user correction about duplicate text false positive), token-linked evidence.
4. fn-layout-mode {block, continuous} complete port from V21 (IMUD had patch-only) + IMUD's own 70-footnotes-continuous suite adopted.
5. Note numbering styles (hebrew-letter+geresh / asterisks / parentheses / decimal), separator rule styles (regular/circles/sparkle/star/diamond/none) — registry-driven rendering.
6. Counter reset policies {continuous/page/section/part} tested across part boundaries incl. shaar-sub resets.

### S7.2 Gate S7
- [ ] Endnote E2E: multi-part doc → correct pages, no running head/folio unless configured, continuation headers right.
- [ ] side-note-overflow=0, overlap=0 on canonical+stress fixture; H7 batch stacking visual check.
- [ ] h7-conversion false-positive injection test passes (duplicate text present in body → not flagged).
- [ ] Both fn-layout modes audit-clean; continuous mode counters verified against source order.
- [ ] Numbering×separator×reset matrix: sampled renders match settings (settings-effect tests green).

---

# שלב S8 — שערים, עיטורים, מפרידים וגרפיקה (Decoration Pass L5)
**מטרה:** כל הגרפיקה בפאס סינכרוני **שאסור** לשנות גובה שנמדד (invariant T1). **סוגר:** REQ-ORN-01..08, F-08/F-09/F-10/F-21 closures, theme-sets user request.

### S8.1 משימות
1. `decoration/ornament-fit.js`: fit-to-text width (H2) & height-match (H3 sides) via JS measurement; sync re-fit without shifting; single-source sizing (no !important vs inline — F-09); margin symmetry (H2 top/bottom equal −0.08em centering lesson).
2. Chapter-end ornament fitting within remaining budget (pyramid/lance/shoshanta/scroll/image/none + w/h); never blocks geometric shaar.
3. Heading dividers H3–H6 enhanced Orange version retained; ensure fits() measured at ALL insertion sites; rollback-aware counters; reset per document.
4. Shaar dividers main/sub; divider between columns style {none/thin/dashed/double} + Math.min height −8px rule enforced.
5. Theme sets picker: group shaars by set number ("1 ראשי/משנה/אחורי"), preview image from main, "הצג שער משנה" toggle button, visual pickers (image+name) everywhere (user requests U-C1/C2, V21 gallery ask).
6. Shaar box editor: drag+resize per shaar id persistence; embed `box` into exported JSON (V4); packager id uniqueness (index/hash suffix — packerandconfigurator regex lesson).
7. JPG/PNG support wrapShaarMedia + folder import (webkitdirectory) with path-safe validation; presets makom-bina ported.
8. Backgrounds panel merged into themes panel (3 page classes; color/texture/image+opacity; insets mm) — registry migration.
9. Custom page types JSON renderer (PT-09) with fixed content/boxes/images/positions.
10. SVG sanitize + CSP (security hooks; full pass in S13).

### S8.2 Gate S8
- [ ] ornament-* kinds (overflow/overlap/asymmetry) = 0 on canonical+ornaments config; pixel diff ≤1px vs manual expectations on sample pages.
- [ ] F-10 regression test: loading a JSON theme-set activates ALL THREE shaars (not only main) — user-reported bug locked forever.
- [ ] Box persistence roundtrip: move boxes → export JSON → reload → identical positions.
- [ ] Divider height follows Math.min rule under stress (unequal columns).
- [ ] Decoration pass provably geometry-neutral: CP4 vs CP5 hashes equal modulo declared decoration rects.
- [ ] Folder-import security fixture (path traversal attempt rejected).
- [ ] Picker previews render images (E2E screenshot).

---

# שלב S9 — כותרות עליונות, מספור עמודים, TOC (Headers/Folio/TOC)
**מטרה:** Headmatter+running elements מדויקים, recto/verso מלא, TOC לחיץ. **סוגר:** REQ-HDR-01..06, restored V1 initial-value, Orange wirings verified.

### S9.1 משימות
1. Headers builder from registry: 3 areas × recto/verso full independence (type/align/font/size/**width%**), same_as_odd/even with circular-resolution guard (Orange ✓ keep), dedicated header for pages opening with H2/H3, separator line none/gray/black.
2. Content sources: book-name split at first dash (`extractH1TitleMain`; hdr-h1-title-mode main/full), H1/H2 text, page number, first/last words of page (IMUD fillHeaderFirstLastWords port), custom text.
3. Folio: formats (hebrew letters / "דף"+letters / numerals), frame {none/circle/square/parens/squares/floral/diamond}, positions {bottom-center/outer-left/outer-right/top/in-header/none}, start-value + **initial-value** + carry/skip per page-type (count/show pairs incl. shaar/toc checkboxes V2).
4. TOC general/detail: per-level show/inline/group, leader dots, clickable links (PDF destinations), page labels matching folio format; TOC overflow/stress fixtures (long titles, many entries, multi-part) + stuck-typeset timeout guards (catalog TOC row).
5. verso-center slot fix (IMUD bc7892f) kept + regression.
6. Numbering consistency invariant checker: sequence monotonic, no dup/skip except declared blanks; feeds audit kind pn-*.

### S9.2 Gate S9
- [ ] Header matrix test: every source×alignment×width combo renders correctly recto AND verso (golden screenshots).
- [ ] Volume-2-style fixture starts at configured initial value; count/show pairs behave (shaar pages unnumbered etc.).
- [ ] TOC stress: no overflow, no hang (<time budget), bookmarks resolve to correct pages in PDF smoke (full PDF in S12).
- [ ] first/last-word headers update after re-typeset (paste/refresh doesn't revert — Z.ai session question answered by test).
- [ ] pn-overflow/pn-sequence = 0 on canonical.

---

# שלב S10 — ממשק משתמש מלא (UI: tabs, panels, worker, preview, debug)
**מטרה:** חוויית המשתמש מ‑Spec §5 + בקשות Z.ai/U-D; לוח 12 הפאנלים מה־registry; מנוע ב‑Worker. **סוגר:** REQ-UI-01..08, D-19.

### S10.1 משימות
1. Worker engine client: staged progress events ("עמוד X מתוך Y"), non-blocking UI, cancel/resume; debounce light-change 350ms; heavy-change → blinking ⚡ button with **immediate path** on click (no debounce) — F-06 discipline: automated scan forbids indirect typesetDocument() calls from controls.
2. Rebuild settings panel from registry (12 panels Z2): accordions, search bar over settings, per-field reset, template save/load; move typography controls per Mapping request #8.
3. Editor tab: plain-text paste area, page-break markers display (⏎, never exported — F-01), char/line counts, TXT/DOCX import buttons (docx engine lands S11; UI stub guarded), clear.
4. Preview tab: vertical/horizontal scroll modes, zoom (+Ctrl-wheel, fit-width), click-page-to-scroll, jump by hebrew-numeral input, TOC click sync, caret↔page bidirectional sync.
5. Testing tab (בדיקה): findings table (sort/filter/jump-to-page), highlightIssue activation for EVERY report path (Working_rules #2), per-page debug download button (V21 request), trace viewer for ledger entries, coverage dashboard from S1 accountant.
6. Status/warnings strip: pending-changes indicator, offline-guard status, font-loading status.
7. ui-e2e extension of Orange iframe suite to cover tabs/panels above; accessibility labels baked in (audit S13).
8. Visual polish: dark canvas behind pages, icons per action, clean professional look per Spec §5.

### S10.2 Gate S10
- [ ] e2e: paste 639-page doc → progress shown, UI responsive (<100ms interaction latency sampled), result identical to headless render (hash).
- [ ] No-control-triggers-auto-retypeset scan passes (call-graph artifact).
- [ ] Settings search finds key by Hebrew name; per-field reset restores registry default with immediate preview if light-class.
- [ ] Jump/sync features tested incl. footnote/side-note anchors; caret sync both directions.
- [ ] Debug download produces JSON with page geometry+ledger slice; highlightIssue visibly marks offending element.
- [ ] Light-change refresh ≤2s; heavy flow requires explicit ⚡ (policy table rendered in UI help).
- [ ] Orange ui-e2e still green after rebuild (regression lock).

---

# שלב S11 — הרחבות: Custom Styles/JSON extensions, DOCX import, Editing recommendations
**מטרה:** יכולת ההרחבה שהמשתמש דרש (§8 Spec) + ייבוא וורד + הצעות עריכה מוכחות. **סוגר:** REQ-PAR-06/07, REQ-GOV-11.

### S11.1 משימות
1. Extensions importer UI+engine: custom page types, custom text styles (trigger/layoutMode/style/counterReset/linkedOrnaments), embedded images; JSON schema validation with human-readable Hebrew errors; import/export/share of everything (§8.3).
2. Combinator conditions (AND/OR) for triggers; arbitrary delimiter styles («…» etc.) per Spec §8 principle "כל סוגי הטקסט… נתונים לבחירת המשתמש".
3. DOCX import: mammoth-based conversion Heading1–7→כותרת N, footnotes→[...], body→paragraphs; plain-text into editor; unsupported formats silently refused + clear message (§9.4/§12).
4. Editing recommendations module: when engine exhausts legal options (capacity-limited residuals, unresolvable runts), propose textual edits (move word/split sentence) **with dry-run reflow proof** that the suggestion removes the finding without creating new ones (feasibility gate — user transparency demand).
5. Recommendations surfaced in Testing tab with before/after preview diff.

### S11.2 Gate S11
- [ ] 3 custom-style examples (quote block via «», side-note via prefix, full-width callout) render per contract end-to-end.
- [ ] Custom page JSON (logo page before preface) placed/counted correctly.
- [ ] DOCX fixture roundtrip: structure diff=0 vs hand-tagged expectation; Word footnotes become bracket notes.
- [ ] Unsupported file: no crash, no load, localized notice.
- [ ] Every recommendation carries proof artifact; rejecting proof-less suggestions tested.
- [ ] Extensions export→fresh-instance import→identical render hash.

---

# שלב S12 — ייצוא מושלם: PDF, HTML עצמאי, ZIP, Print parity + Metrics math layer
**מטרה:** "מסמך הייצוא זהה לחלוטין למרונדר" + PDF מקצועי + שכבת מדידה מתמטית (סיום הדטרמיניזם). **סוגר:** REQ-EXP-01..04, REQ-LB-01 math impl, D-18.

### S12.1 משימות
1. Geometry-model single source: renderer + print + export all project from CP5 model (kills live-vs-export divergence class).
2. Standalone HTML export: single-file, subset base64 fonts, embedded SVG/CSS vars, dir=rtl, @page+break rules, paginated view, opens offline identically.
3. PDF via Chromium print pipeline: bookmarks tree from outline model, clickable TOC destinations, real selectable text, crop marks toggle, bleed/trim sizes from page-size registry; **parity harness**: per-page rect diff live-DOM vs PDF raster/vector ≤0.5px sampled + text/page-count equality.
4. ZIP export bundle (document+assets+settings incl. shaar boxes) robust packaging (regex-replacement pitfalls fixed with structured templating).
5. HarfBuzz-WASM + fontkit/opentype.js metrics layer (math MeasureAPI impl B): glyph widths, kerning, GPOS for niqud/te'amim; parity A(DOM-oracle)↔B(math) ≤0.01px on corpus words; line-break equality on canonical doc (0 diffs) before switching default.
6. Cap-height alignment for first-word finalized using metrics (closes S3 deferred item).
7. Offline guard maintained (exit 7 on external request); self-hosted fonts only; broken-glyph documentation carried from Orange.
8. Font subsetting for exports (size budget) with tofu regression check post-subset.

### S12.2 Gate S12
- [ ] Parity report: 0 divergences >0.5px; identical text extraction & page counts.
- [ ] PDF: bookmarks navigate; TOC clicks land right pages; crop marks toggle verified on imposition proof sheet.
- [ ] Single-file HTML offline-open byte-compare against live DOM screenshots (visual regression suite).
- [ ] MeasureAPI-B enabled behind flag; canonical run: same page count, same line breaks (equality artifact stored); perf compared.
- [ ] Subset fonts: 0 tofu on canonical glyph inventory; size reduction recorded.
- [ ] Determinism across export paths: export twice → identical bytes (modulo timestamps normalized).

---

# שלב S13 — QA מערכתי, אבטחה, נגישות, תיעוד ו‑Cutover
**מטרה:** מסירה רשמית: כל השערים ירוקים יחד, תיעוד אמיתי, ענף חיים מוחלף. **סוגר:** REQ-GOV-12, NFRs, README-truth lesson.

### S13.1 משימות
1. Full-matrix regression: canonical doc × {default, ornaments, AQ-on, continuous-notes, verso-headers, custom-styles} × {live, html-export, pdf} — aggregate report; compare vs baselines of ALL five source repos (acceptance: ≤ Orange's 39 findings with every residual finding either 0-severity or ledger'd compromise with user-visible explanation).
2. Environment matrix: Chromium pinned × 2 scales × bundled fonts; trigger-hit accounting (NOT EXERCISED list shrunk to explained-only).
3. Performance budgets met (T4 table) with profiling artifacts; memory ceiling test 1,000-page synthetic.
4. Security pass: CSP headers/local policy, SVG sanitize tests, JSON import fuzz, path traversal, XSS regression suite (SECURITY.md items re-audited fresh).
5. Accessibility audit fresh: landmarks, ARIA, contrast AA, keyboard flows (ACCESSIBILITY.md history ≠ proof — redo).
6. Documentation rewrite truthful per branch: README (current capabilities only), FEATURES map, RELEASE NOTES (user explicitly asked for release-notes workflow), MIGRATION guide (settings v1→v2), OPERATIONS (how to run CI, get reports), AI_WORKFLOW/handoff prompt updated.
7. Cutover plan: tag `v25-unified-rc1`; deploy Pages from UNIFIED; keep previous main archived; rollback procedure documented; ISSUE_REGISTRY final review — open P2s transferred to backlog with owner decision.
8. Post-launch monitoring kit: error reporting hook (local log), repro-zip generator from UI diagnostics.

### S13.2 Gate S13 (Final Acceptance Checklist)
- [ ] Iron laws B3 §1–17 all demonstrated green on canonical matrix (table of evidence links).
- [ ] Zero HIGH findings; MEDIUM/Low each with ledger justification visible in report.
- [ ] Determinism triple-proof: repeat, inter-commit, cross-path (live/html/pdf).
- [ ] Three-layer settings contract: 100% coverage, scanners green since S4 continuously.
- [ ] All U-A..U-F user-request rows closed or explicitly deferred **by user decision** (sign-off list).
- [ ] Negative controls (14+) still 0-finding; no false-positive epidemic reintroduced.
- [ ] Perf budgets met; offline operation proven (network-disabled lab run).
- [ ] Docs truthful; release notes published; PROVENANCE complete for every ported feature.
- [ ] User sign-off ritual: sample-book printed (PDF) reviewed page-by-page with user; findings triaged; RC promoted only after explicit approval.

---

## נספח א — לוח זמנים יחסי (equal phases, dependencies)

```
S0 ─► S1 ─► S2 ─► S3 ─► S4 ─┬─► S5 ─► S6 ─► S7 ─┐
                             ├─► S8 ─► S9 ───────┼─► S10 ─► S11 ─► S12 ─► S13
                             └───────────────────┘
```
- S4 can partially overlap S3 tail (registry scaffolding), but S5 REQUIRES both.
- S8/S9 depend on S4+S5 (geometry frozen inputs) — parallelizable tracks after S5.
- S10 UI assembly needs S4 registry + S1 diagnostics APIs; features land progressively but gate waits for S9 outputs.
- Each phase sized ≈ equally by splitting large ones (S5 largest algorithmic; compensate by narrower scope elsewhere).

## נספח ב — תבנית PR מחייבת (אנטי־טלאי)
```
Title: [S<n>][REQ-xxx] תיאור
Body:
 - Layers touched: [ ]control [ ]key [ ]mechanism [ ]test  ← all four or exemption note
 - Artifacts: trace/report/parity links, ledger ids
 - no-op proof (if tooling)
 - Baseline delta table (findings ±, each justified)
 - Registry update (D-xx if decision)
```

## נספח ג — סדר פעולות מנוע (canonical, enforced in code comments)
parse → scope-map → style-prepass → fonts-ready → measure → line-plan(KP) → page-plan(DP) → protections → balance → justify/AQ → notes-budget/refit → decorations(sync) → headers/folio/TOC → ledger-finalize → render/print/export projection.
**אסור** לפוסט־פרוסס שמשנה גובה אחרי page-plan (Claude §6.4(4)).

## נספח ד — Open questions להכרעת משתמש (to present, not guess)
1. Default for `hdr-h1-title-mode` (main vs full) — Orange chose 'main'; confirm.
2. Rounding-tolerance exemplars (6–10 containment-rounding): accept as normal or tighten?
3. Long footnote policy: split-with-continuation vs move-whole (default?).
4. P2.5 extended balancing before H4/H6 — needed or obsolete?
5. Sparse-page exclusion when chapter-end has notes — desired behavior?
6. Widow/orphan strictness levels granularity (per Mapping C-6 proposal).
7. Page-size catalog beyond A4 (which sizes ship in v1).
8. Whether back-shaar 4 sections remain free-text or templated fields.

*סוף תכנית העבודה. ביצוע: שלב אחר שלב, שער אחר שער; אין לדלוג; אין "להתקין" טלאים — אם התגלה פגם ששייך לשלב קודם, פותחים Branch-back-fix מאותו שלב עם עדכון Registry + בדיקת רגרסיה, לא תיקון נקודתי בענף ראשי.*
