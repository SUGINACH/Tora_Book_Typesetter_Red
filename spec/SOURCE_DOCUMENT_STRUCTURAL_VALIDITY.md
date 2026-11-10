# Source Document Structural Validity — D-100

**Status:** Binding source-structure contract  
**Decision:** D-100  
**Introduced:** 10 November 2026  
**Scope:** All input documents sent to the RED typesetting pipeline, including fixed and random test documents.

## 1. Principle

Typesetting is not a repair mechanism for a structurally broken manuscript. RED must validate the source document before measurement, pagination, or rendering. The validator reports defects; it does not silently delete headings, change their levels, invent prose, or reinterpret the source to make it pass.

## 2. Heading hierarchy

Heading levels H0–H7 are supported. A run of headings with no intervening body prose is valid only when it forms a strictly descending hierarchy in depth, expressed by strictly increasing numeric level:

- Valid: H1 → H2 → H3 → H4 → H5 → H6 → H7 → body prose.
- Also valid: H1 → H3 → H6 → body prose. Intermediate levels are optional.
- Invalid: H3 → H3 → body prose.
- Invalid: H2 → H4 → H3 → body prose.
- Invalid: H1 → H2 → end of document, with no body prose below H2.

A parent heading may have no direct paragraph of its own when it introduces a deeper child section. The deepest/last heading in the uninterrupted chain must, however, be followed by meaningful body prose before another same-or-shallower heading closes that chain or the document ends.

The special visual or marginal-note behavior of a heading level does not by itself exempt that heading from source-structure validity.

## 3. What counts as body prose

A paragraph counts as body prose when it contains at least one meaningful letter or numeral outside note-reference ranges.

The following do **not** satisfy the body-prose requirement:

- A paragraph consisting only of footnote references/content.
- A heading title that contains only a footnote reference/content and no independent title text.
- Blank lines, whitespace, punctuation-only fragments, layout directives, decorations, or endnote directives by themselves.

A paragraph containing ordinary prose together with one or more footnote references does count as body prose. A heading title containing ordinary title text plus a footnote reference is also valid.

Footnote recognition follows the document's effective configured delimiters. An explicit configuration that disables footnote delimiters disables that interpretation; the validator must not invent a different delimiter.

## 4. Validation behavior

The structure check runs before either the DP layout path or the Legacy/IMUD path and before measurement.

Invalid input raises a typed `DocumentStructureError` with code `INVALID_DOCUMENT_STRUCTURE` and actionable issue codes, including:

- `heading-chain-not-increasing`
- `heading-chain-no-body-text`
- `heading-title-note-only`
- `heading-level-invalid`

The error identifies the offending token and levels. No automatic source repair is permitted. After the manuscript is corrected by its author/editor, the same source is submitted again.

## 5. Test-document generator contract

The fixed and random generators are subject to exactly the same structural validator as ordinary input.

- Fixed mode must remain byte-for-byte deterministic for the same version and settings.
- Random mode may vary its content, but every generated document must satisfy D-100 for every seed.
- CI exercises the fixed generator and at least 180 explicit random seeds.
- A generator failure is a generator defect; it is not a reason to weaken the source validator.

## 6. Acceptance fixtures

| Fixture | Expected result |
|---|---|
| H1→H2→H3→H4→H5→H6→H7 followed by prose | Accept |
| H1→H3→H7 followed by prose | Accept |
| H4→H4 followed by prose | Reject |
| H2→H3→H2 before prose | Reject |
| H3 followed only by a footnote paragraph | Reject |
| H5 title consisting only of a footnote | Reject |
| H2 followed by prose plus a footnote | Accept |
| Heading chain at end of document without prose | Reject |

## 7. Existing corpus findings

The historical large test manuscript `audits/very_long_test_text.txt` is not silently rewritten by this rule. The first D-100 run found five non-increasing heading transitions and seven marker-only H6 titles (`*`). These are source defects to review, not pagination defects. The source file remains unchanged until an editorial decision is made.

## 8. Traceability

- User instruction: conversation of 10 November 2026 — consecutive same-level headings without text are invalid; a nested chain such as 1→2→3→4→5→6→7 is allowed only if the deepest heading has actual text; a heading containing only a footnote is invalid.
- Decision record: `DECISIONS.md`, D-100.
- Implementation: `red-build/src/engine/parser/document-structure.js`, called from `red-build/src/engine/core/pipeline.js`.
- Regression suite: `red-build/tests/unit/document-structure.test.js`.
- Generator: `red-build/src/ui/test-doc-generator.js`.
