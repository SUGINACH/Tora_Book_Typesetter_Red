# API Reference

Mirrors `main` at `44357a2` (the engine differs from `510c9d6` by the merged fixes in `legacy-imud-flow.js` and by the D-100 source check; the Worker protocol and the settings registry are unchanged since `6f80156`) — code-level evidence only. Paths are relative to `red-build/src/`.

> **Stability.** The **Worker message protocol** (section 3) is the integration surface and is versioned (`PROTOCOL_VERSION = 1`, extended by v1.1 messages). The module-level APIs in sections 1, 2, 4 and 5 are internal: they are used by the UI and the tests and may change between releases. New protocol messages must be additive and must not change existing ones.

## 1. Engine API (`engine/core/pipeline.js`)

```js
const { typeset } = require('./src/engine/core/pipeline');      // from red-build/
const { getDefaultSettings } = require('./src/engine/core/settings-registry');

const result = typeset(rawText, settings, env);
```

| Parameter | Type | Meaning |
|---|---|---|
| `rawText` | `string` | The source document: plain text with the markup of the parser requirements (REQ-PAR in `spec/01_MASTER_SPECIFICATION.md`); a working example is `red-build/tests/fixtures/sample.txt` |
| `settings` | `object` | A complete settings object — start from `getDefaultSettings()` and override |
| `env.onProgress` | `(info) => void` | Optional progress callback; instrumentation only (must not affect the layout) |
| `env.doc` | DOM factory | Optional, for oracle rendering |
| `env.noRecommendations` / `env.wantRecommendations` | `boolean` | Skip, or force, editing recommendations (they are not computed automatically above 200 pages) |

`typeset` is synchronous and deterministic: calling it twice with the same arguments returns the same `layoutHash`.

> **Source validation (D-100).** `typeset()` first lexes and tokenizes the source and calls `assertHeadingStructure` (`engine/parser/document-structure.js`). A malformed heading structure throws a `DocumentStructureError` — `name: 'DocumentStructureError'`, `code: 'INVALID_DOCUMENT_STRUCTURE'`, `issues: [...]`, with a Hebrew message that begins "מבנה מסמך לא תקין; העימוד נעצר לפני שלב המדידה" — before any measurement. Issue codes: `heading-title-note-only`, `heading-title-no-meaningful-text`, `heading-chain-not-increasing`, `heading-chain-no-body-text`, `heading-level-invalid` (valid levels are H0–H7). The same module exports `validateHeadingStructure(tokens, opts)` → `{ ok, issues, headingCount }` and `formatHeadingStructureIssues(issues)`. Nothing is repaired automatically.

### Result fields

| Field | Meaning |
|---|---|
| `metadata` | Preamble key → value map, e.g. `{ "ספר": "משלי" }` |
| `tokens` | Parser tokens (`id`, `type`, `level`, `raw`, …) |
| `pages` | Array of page objects (below) |
| `ledger` | Decision/issue ledger (`Ledger`): `summary()`, `toSchemaV2()` |
| `events` | Event log (`EventLog`): `toTraceV2()`, `droppedEvents` (must be 0) |
| `toc`, `tocPages`, `tocInsert` | Table-of-contents data and inserted TOC pages |
| `numbers`, `numberingAudit` | Page numbering and its invariants audit |
| `settings` | The merged settings actually used |
| `contentHashIn`, `contentPreserved` | Input content hash; `true` when the content-preservation invariant holds (output versus tokens — a loss during tokenization, e.g. R-05, is outside it) |
| `layoutHash` | SHA-256 over the final page structure (CP5) |
| `plannedLayoutHash` | Hash of the page plan (CP3) |
| `geometryNeutralVerified` | `true` when the decoration pass left the body geometry unchanged (CP4 == CP5) |
| `ornaments`, `retreat`, `sideNotes`, `endnotePages`, `endnotePagesInfo`, `scope`, `customStyles`, `recommendations` | Decoration plan; retreat-loop record; side notes; endnote pagination; scope map; custom-style result; editing recommendations with proof |

### Page object

Fields of an entry in `result.pages`: `index`, `type`, `template`, `columns`, `footnotes`, `sideNotes`, `headingsOnPage`, `balanceInfo`, `fnReservedHeightPx`, `chapterOpening`, `decorations`, `isShaar`, `shaarInfo`, `isRecto`, `pageNumber`, `folioDisplay`, `pageNumberDisplay`, `headerCtx`, `header`, `firstWord`, `lastWord`, `opensWithHeadingLevel`. Page types and geometry contracts are defined in `engine/layout/page-templates.js` (PT-01…PT-10).

`page.columns` is an **array of columns; each column is an array of line objects**. Example (a heading line):

```json
{ "words": ["פרק", "א"], "widthPx": 68.17, "heightPx": 33.6, "isLast": true, "measureW": 674.65,
  "kind": "heading", "tokenId": "t1", "level": 1,
  "meta": { "tokenId": "t1", "firstOfBlock": true, "docPart": 1 }, "seq": 0 }
```

## 2. Settings API (`engine/core/settings-registry.js`)

| Export | Returns |
|---|---|
| `getDefaultSettings()` | The full default settings object (the 221 registry keys plus the derived key `settings_version`) |
| `getSettingDefs()` | Array of registry entries: `id`, `type` (`enum`/`number`/`bool`/`font`/`string`/`color`), `default`, `panel`, `control`, `consumers`, `effect_test`, and optionally `enum`, `min`, `max`, `step`, `note` |
| `findKey(id)` | The registry entry for one key |
| `derivePlacementFlags(…)` | Derives legacy note-placement flags; `note-placement-mode` is the source of truth |
| `PANELS` | Panel key → Hebrew panel title (13 groups; 11 hold settings) |

All settings are documented in [SETTINGS.md](SETTINGS.md).

## 3. Worker protocol (`ui/worker-protocol.js`)

Requests are validated by `validateRequest`; an invalid message is answered with a `typeset-error` carrying the offending `jobId`. Every request needs a non-empty string `jobId`; every reply echoes it.

### Messages to the Worker

| `type` | Fields | Reply |
|---|---|---|
| `typeset-request` | `jobId`, `text: string`, `settings: object` | `progress*`, then `typeset-result` or `typeset-error` |
| `cancel` | `jobId` | none (the client terminates and respawns the Worker) |
| `register-font` *(v1.1)* | `jobId`, `name: string`, `bytes: ArrayBuffer \| TypedArray` (TTF) | `register-font-result` |
| `register-assets` *(v1.1)* | `jobId`, `collection: string`, `items: array` | `register-assets-result` |
| `export-request` *(v1.1)* | `jobId`, `kind: 'pdf' \| 'zip'`, `text`, `settings`, `fontBytes?` (required for `pdf`), `fontName?`, `extensions?` | `export-result` or `export-error` |

### Messages from the Worker

| `type` | Fields |
|---|---|
| `progress` | `jobId`, `stage`, `pct`, `label`, `pageIndex?`, `totalPages?`, `estimatedTotal?` |
| `typeset-result` | `jobId`, `result` — the serialized result (below) |
| `typeset-error` | `jobId`, `message` |
| `register-font-result` | `jobId`, `name`, `ok`, `glyphCount?`, `error?` |
| `register-assets-result` | `jobId`, `collection`, `registered`, `rejected: [{ id, reason }]` |
| `export-result` | `jobId`, `kind`, `ok`, `bytes?: Uint8Array`, `info?`, `error?` (e.g. `'no-embedded-font'`) |
| `export-error` | `jobId`, `message` |

### Serialized result (`schema: 'ui-result-v1'`)

`layoutHash`, `plannedLayoutHash`, `contentHashIn`, `contentPreserved`, `geometryNeutralVerified`, `deterministic`, `metadata`, `settings`, `pages`, `report` (diagnostics report v2: findings, counts, retreat), `trace` (event log, trace v2), `ledger` (issues with full lifecycle), `ledgerSummary`, `toc`, `tocInsert`, `numberingAudit`, `tokens` (`id`, `type`, `level`, `raw`), `droppedEvents`, `recommendations`, `customStyles` (`ok`, `count`, `errors`). The result is plain JSON and survives structured clone.

### Client (`ui/worker-client.js`)

```js
const { WorkerEngineClient, workerTransport } = require('./worker-client');
const engine = new WorkerEngineClient(
  workerTransport(() => new Worker('engine-worker.bundle.js'))
);

const { promise, jobId, cancel } = engine.requestTypeset({
  text, settings,
  onProgress: ({ stage, pct, label, pageIndex, totalPages }) => { /* update UI */ }
});
const result = await promise;                       // serialized result

await engine.registerFont({ name, bytes });         // TTF for real-font measurement
await engine.registerAssets({ collection, items });
const exp = await engine.requestExport({ kind: 'zip', text, settings, extensions });  // exp.bytes: Uint8Array
```

A new `requestTypeset` while one is running cancels the previous one (single-flight). `cancel()` terminates the Worker and the next post builds a fresh one; in-flight side jobs are rejected with `RESTART_ERROR`. In the browser, load the bundle built by `tools/build-worker-bundle.js` (see [ARCHITECTURE.md](ARCHITECTURE.md)).

> **Contract changes.** Any change to this protocol or to the result schema needs a documented proposal (owner, backward compatibility, contract tests) — master plan §7.3 and §9.4. One proposal is open — CP-1, additive diagnostics fields (`docs/reports/agent-2/proposals/CONTRACT_PROPOSAL_diagnostics.md`); it is not part of the current protocol. See [coordination/AGENT_TRACKING.md](coordination/AGENT_TRACKING.md) §6.

## 4. Export and project API (`engine/output/export-api.js`, `project-io.js`)

| Function | Returns |
|---|---|
| `exportHtml(result, settings, doc, meta = {})` | Standalone single-file HTML (offline). `doc` is a DOM-like factory (`{ createElement }`) — pass `document` in a browser; `meta` takes `title` and `fontCss` |
| `exportPdf(text, settings, fontBytes, fontName, env)` | `{ ok, error?, bytes?, result?, projected?, info? }` — PDF 1.4 with an embedded subset of `fontBytes` (a TTF; WOFF2-only families are display-only per D-106 and cannot be embedded) |
| `exportProjectZip(text, settings, { extensions })` | Project ZIP bytes (document, settings, extensions, theme) |
| `importProjectZip(bytes)` | `{ ok, error?, text?, settings?, extensions?, theme?, unknownKeys?, issues? }` — settings are migrated to the current version |
| `pageMmOf(settings)` | Page size in millimetres |

`project-io.js` exports `migrate`, `mergeWithDefaults`, `exportProject`, `importProject` and the `MIGRATIONS` table; the rules are in [MIGRATION.md](../MIGRATION.md).

Round trip (verified): `importProjectZip(exportProjectZip(text, settings, {}))` returns the same `text`, with no unknown keys and no issues.

## 5. Measurement (`engine/typography/measure-api.js`)

`registerFont(name, uint8Array)` → `{ ok, profile?, error? }` registers a TTF so that the `measure-impl` setting can measure with real font tables (`hmtx`, `cmap`, `kern`, `GPOS`, `OS/2`). The Worker exposes it as the `register-font` message.
