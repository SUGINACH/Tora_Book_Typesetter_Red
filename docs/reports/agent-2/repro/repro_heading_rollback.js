// repro_heading_rollback.js — שחזור באג "אובדן שתי המילים" (לשון/הפוסקים) במסלול legacy-imud.
// הרצה מתוך שורש הריפו:  node <path>/repro_heading_rollback.js            (RED_ROOT ברירת מחדל = cwd)
//                        RED_ROOT=/path/to/sandbox node repro_heading_rollback.js
// לא כותב קבצים ולא משנה את הריפו. קלט מינימלי: min_two_words.txt (בתיקייה זו).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(process.env.RED_ROOT || process.cwd());
const RB = path.join(ROOT, 'red-build');
const { legacyTypeset } = require(path.join(RB, 'src/engine/layout/legacy-imud-flow'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const { getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { generateTestDocument } = require(path.join(RB, 'src/ui/test-doc-generator'));

const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
const settings = () => importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), {}).settings;
const txt = a => (a.words || []).map(w => (w && w.t != null ? w.t : w)).join(' ');

function dupHeadings(r) { // כותרות עוקבות זהות באותו טור (סימן לכפילות/אובדן; חזרה אמיתית במקור תופיע גם היא)
  const out = [];
  r.pages.forEach((p, pi) => (p.columns || []).forEach((c, ci) => {
    for (let i = 1; i < c.length; i++) {
      const a = c[i - 1], b = c[i];
      if ((a.type || a.kind) === 'heading' && (b.type || b.kind) === 'heading' && a.level === b.level && txt(a) && txt(a) === txt(b)) {
        out.push(`page-index ${pi} col ${ci} h${a.level} "${txt(a).slice(0, 30)}"`);
      }
    }
  }));
  return out;
}

function run(name, text) {
  const r = legacyTypeset(text, settings(), {});
  const loss = [...r.ledger.issues.values()].filter(x => x.kind === 'content-loss').map(x => x.predicate_before.sample);
  console.log(`${name}: pages=${r.pages.length} contentPreserved=${r.contentPreserved} loss=[${loss.join('; ')}] hash=${r.layoutHash}`);
  const d = dupHeadings(r);
  console.log(`  duplicate consecutive headings: ${d.length}${d.length ? '\n    ' + d.join('\n    ') : ''}`);
}

run('minimal (3 lines)', fs.readFileSync(path.join(__dirname, 'min_two_words.txt'), 'utf8'));
run('fixed test doc (full)', generateTestDocument({ mode: 'fixed', scale: 'full' }));
console.log('צפוי לפני תיקון: preserved=false, loss=לשון/הפוסקים, כפילויות 3 (אחת מהן חזרה אמיתית במקור — שורה 1101).');
console.log('צפוי אחרי תיקון: preserved=true, בלי loss, כפילות אחת (החזרה האמיתית במקור).');
