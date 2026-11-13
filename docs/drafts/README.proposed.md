> **DRAFT — not adopted.** Proposed replacement for the root `README.md`. Under master plan §11.2 the README may present only data verified on an identified commit, so it is adopted after the baseline (G0) reconciles test counts and parity (see `docs/coordination/SOURCE_OF_TRUTH_MAP.md`, DOC-01…03) and after open PR #33 (which also edits the README) is merged. Facts below are code-level evidence at `6f80156` (the UI changed afterwards in PRs #39–#42 and was not re-verified line by line). Links are relative to the repository root, i.e. valid once the file is moved there.

# RED — Torah Book Typesetter

**A deterministic, offline, zero-runtime-dependency typesetting engine for Hebrew (RTL) Torah books — with a complete in-browser UI.**

[![CI](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/workflows/ci.yml/badge.svg)](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/workflows/ci.yml)
[![layout-parity](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/workflows/layout-parity.yml/badge.svg)](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/workflows/layout-parity.yml)
[![full-math-audit](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/workflows/full-math-audit.yml/badge.svg)](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/workflows/full-math-audit.yml)
[![gh-pages-audit](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/workflows/gh-pages-audit.yml/badge.svg)](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/actions/workflows/gh-pages-audit.yml)

**Live app:** <https://suginach.github.io/Tora_Book_Typesetter_Red/> — runs entirely in your browser (no server, no external requests). It is published by the `deploy-pages` workflow from the `gh-pages` branch (UI bundle only).

> **Status: pre-release.** The latest tag is `v25-unified-rc1` (release candidate, 2026-11-03); `main` is ahead of it.
> `red-build/package.json` is at version `0.1.0` and is marked `private` / `UNLICENSED`.
> No release has been declared. Promotion requires the acceptance gates G0–G7 and explicit owner approval — see [CUTOVER.md](CUTOVER.md) and [docs/coordination/AGENT_TRACKING.md](docs/coordination/AGENT_TRACKING.md).
> Correctness is judged against user requirements and engineering invariants; the old sample PDFs and the layout-parity scores are a historical diagnostic, not an acceptance target (D-98, in open PR #33).
> Measured numbers (test counts, hashes, parity) live in the machine-readable baseline `audits/baseline/<sha7>/manifest.json` (open PR #36), not in this README.

## What it does

- **Deterministic.** The same text and settings always produce the same layout. Every result carries a SHA-256 `layoutHash`; CI runs determinism checks and a locked canonical corpus.
- **Zero runtime dependencies.** The engine, the UI shell, the PDF writer, the ZIP reader/writer, the DOCX importer and the font-table parser are all written from scratch in plain JavaScript (CommonJS). Node ≥ 18 is needed only for tests and tools.
- **Hebrew typesetting.** Knuth–Plass line breaking (no hyphenation), a multi-column / multi-page dynamic-programming planner, column balancing that preserves reading order, widow/orphan and heading protections, and a retreat loop with documented trade-offs.
- **Notes.** Footnotes (`[...]` in the source), endnotes with dedicated pages, and side notes — with a content-preservation invariant checked on every run.
- **Book furniture.** Title pages, themes, ornaments and dividers, running heads (3×2 independent slots, recto/verso), Hebrew-letter page numbering, general and detailed tables of contents.
- **A settings contract, not a settings pile.** Each registry setting is tied to a UI control, the engine mechanism that consumes it and a test that proves it has an effect. See [docs/SETTINGS.md](docs/SETTINGS.md).
- **Extensions and import.** Custom text styles (`tora-typesetter-extensions` v1), DOCX import (own ZIP/XML readers) and editing recommendations backed by a live re-layout proof.
- **Export.** Standalone single-file HTML (offline, `@page` rules), PDF 1.4 (embedded subset of a TrueType font — WOFF2-only families cannot be embedded — `ToUnicode`, bookmarks, TOC links, crop marks and bleed) and a project ZIP (document + settings + extensions + theme) that migrates older settings automatically.
- **Browser UI.** Four tabs (editor / settings / testing / preview), the engine in a Web Worker with progress and cancel, per-page debug view, Hebrew search across the settings, and settings persistence in `localStorage`.

## Quick start

**Use it right away:** open the [live app](https://suginach.github.io/Tora_Book_Typesetter_Red/).

**Run it locally:**

```bash
git clone https://github.com/SUGINACH/Tora_Book_Typesetter_Red.git
cd Tora_Book_Typesetter_Red
# open red-build/ui/index.html in a browser
```

If your browser refuses to start the engine Worker from a `file://` page, serve the folder over HTTP instead, for example
`python3 -m http.server 8080 --directory red-build/ui` and open <http://localhost:8080>.

**Run the tests** (no `npm install` needed — there are no dependencies):

```bash
cd red-build
npm test
```

Some suites verify PDFs with external tools (`pdfinfo`, `pdftotext`, `pdftoppm` from poppler-utils) and the DejaVu font. CI installs them with `sudo apt-get install poppler-utils fonts-dejavu-core`; install them for a fully green local run.

**Typeset from Node:**

```js
// run from red-build/
const { typeset } = require('./src/engine/core/pipeline');
const { getDefaultSettings } = require('./src/engine/core/settings-registry');

const text = require('fs').readFileSync('tests/fixtures/sample.txt', 'utf8');
const result = typeset(text, getDefaultSettings());

console.log(result.pages.length, result.layoutHash, result.contentPreserved);
```

**Input format** (plain text; formal source-structure rules: `spec/SOURCE_DOCUMENT_STRUCTURAL_VALIDITY.md`, once PR #33 is merged):

```text
שם הספר - משלי

כותרת 1 - פרק א
כותרת 2 - משלי א

פסקה עם הערת שוליים [טקסט ההערה] בתוך הפסקה.
```

## Documentation

| Document | What it covers |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Pipeline (CP1–CP5), module map, Worker/UI split, build, determinism |
| [docs/API.md](docs/API.md) | Engine API, Worker message protocol, export and project APIs |
| [docs/SETTINGS.md](docs/SETTINGS.md) | All registry settings (generated from the source) |
| [docs/coordination/AGENT_TRACKING.md](docs/coordination/AGENT_TRACKING.md) | Five-agent tracking table, acceptance gates, contract owners |
| [docs/coordination/SOURCE_OF_TRUTH_MAP.md](docs/coordination/SOURCE_OF_TRUTH_MAP.md) | Which documents are current, and the documentation contradictions found |
| [RELEASE_NOTES.md](RELEASE_NOTES.md) | Historical notes of the release candidate `v25-unified-rc1` |

Project-governance documents (Hebrew): [DECISIONS.md](DECISIONS.md) · [WORKLOG.md](WORKLOG.md) · [ISSUE_REGISTRY.md](ISSUE_REGISTRY.md) · [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) · [PROVENANCE.md](PROVENANCE.md) · [LAYOUT_DEPENDENCY_MAP.md](LAYOUT_DEPENDENCY_MAP.md) · [MIGRATION.md](MIGRATION.md) · [OPERATIONS.md](OPERATIONS.md) · [SECURITY.md](SECURITY.md) · [ACCESSIBILITY.md](ACCESSIBILITY.md) · [CUTOVER.md](CUTOVER.md). Specifications: [`spec/`](spec/). Independent audits: [`audits/`](audits/). Numbers in the current root `README.md` (test counts, parity score) are historical and are being reconciled — see [docs/coordination/SOURCE_OF_TRUTH_MAP.md](docs/coordination/SOURCE_OF_TRUTH_MAP.md).

## Repository layout

```text
red-build/                 the product: engine + UI + tests
  src/engine/              parser · typography · layout · notes · decoration · output · audit · core · extensions · import
  src/ui/                  UI shell (browser)        src/audit/   report schema + anti-patcha scanners
  ui/                      the built app: index.html, styles.css, app.bundle.js, engine-worker.bundle.js, assets/imud/
  tests/                   unit · integration · layout · e2e · audit · fixtures · artifacts
tools/                     bundler, UI-bindings generator, F-06 scanner, layout audit, layout parity
spec/  audits/             master specification and work plan · independent audits and reference layout
docs/                      this documentation
.github/workflows/         ci · full-math-audit · layout-parity · gh-pages-audit
```

## License

**No license has been granted yet.** `red-build/package.json` declares `UNLICENSED` and the repository contains no `LICENSE` file; the owner has to choose a license before any public release. Font provenance and licenses are tracked in [PROVENANCE.md](PROVENANCE.md).

## תקציר בעברית

RED הוא מנוע עימוד תורני (עברית, RTL) שנבנה מאפס, ללא תלויות ריצה, דטרמיניסטי ועובד אופליין, כולל ממשק מלא בדפדפן (עורך, הגדרות, בדיקה, תצוגה) וייצוא ל־HTML עצמאי, PDF וחבילת פרויקט (ZIP). האפליקציה החיה: <https://suginach.github.io/Tora_Book_Typesetter_Red/>. להרצת הבדיקות: `cd red-build && npm test`. תיעוד הניהול והמפרט נמצא בקובצי ה־Markdown העבריים בשורש הריפו. הריפו נמצא בשלב טרום־מהדורה ועדיין ללא רישיון.
