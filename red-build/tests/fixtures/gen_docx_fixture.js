#!/usr/bin/env node
// tests/fixtures/gen_docx_fixture.js — בונה קובץ DOCX תקני מינימלי לבדיקות S11 (REQ-PAR-07)
'use strict';

/**
 * DOCX = ZIP עם word/document.xml + word/footnotes.xml + [Content_Types].xml + _rels/.rels.
 * הפורמט תקני: Reader כלשהו (Word/LO) יפתח אותו; המנוע שלנו קורא אותו ב־importDocx.
 * הפוך־גמור (roundtrip): ההמרה חייבת להתאים בדיוק לציפייה הממוספרת־ביד (diff=0).
 */

const path = require('path');
const fs = require('fs');
const { buildZip } = require('../../src/engine/output/zip-writer');

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>שער ראשי</w:t></w:r></w:p>
<w:p><w:r><w:t>פסקת פתיחה ראשונה בגוף המסמך עם כמה מילים.</w:t></w:r></w:p>
<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>סימן ראשון</w:t></w:r></w:p>
<w:p><w:r><w:t>טקסט לפני ההערה</w:t></w:r><w:r><w:footnoteReference w:id="1"/></w:r><w:r><w:t> וטקסט אחרי ההערה</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">פסקה עם הפניית הערה שנייה </w:t></w:r><w:r><w:footnoteReference w:id="2"/></w:r><w:r><w:t>בסוף המשפט.</w:t></w:r></w:p>
<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>תת סימן</w:t></w:r></w:p>
<w:p><w:r><w:t>פסקה אחרונה לסיום הדוגמה.</w:t></w:r></w:p>
<w:p><w:r><w:t>   </w:t></w:r></w:p>
</w:body>
</w:document>`;

const FOOTNOTES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:footnote w:id="-1"><w:p><w:r><w:t>separator</w:t></w:r></w:p></w:footnote>
<w:footnote w:id="0"><w:p><w:r><w:t>continuation</w:t></w:r></w:p></w:footnote>
<w:footnote w:id="1"><w:p><w:r><w:t>זו ההערה הראשונה מוורד</w:t></w:r></w:p></w:footnote>
<w:footnote w:id="2"><w:p><w:r><w:t>וזו ההערה השנייה</w:t></w:r></w:p></w:footnote>
</w:footnotes>`;

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

function buildDocxFixture() {
  return buildZip([
    { name: '[Content_Types].xml', data: CONTENT_TYPES_XML },
    { name: '_rels/.rels', data: RELS_XML },
    { name: 'word/document.xml', data: DOCUMENT_XML },
    { name: 'word/footnotes.xml', data: FOOTNOTES_XML }
  ]);
}

/** הציפייה הממוספרת־ביד: מה שההמרה חייבת להפיק בדיוק (diff=0). */
const EXPECTED_TEXT = [
  'כותרת 1 - שער ראשי',
  'פסקת פתיחה ראשונה בגוף המסמך עם כמה מילים.',
  'כותרת 2 - סימן ראשון',
  'טקסט לפני ההערה [זו ההערה הראשונה מוורד] וטקסט אחרי ההערה',
  'פסקה עם הפניית הערה שנייה [וזו ההערה השנייה]בסוף המשפט.',
  'כותרת 3 - תת סימן',
  'פסקה אחרונה לסיום הדוגמה.'
].join('\n');

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, 'docx-sample.docx');
  fs.writeFileSync(out, buildDocxFixture());
  console.log(`docx fixture written: ${out} (${buildDocxFixture().length} bytes)`);
}

module.exports = { buildDocxFixture, EXPECTED_TEXT };
