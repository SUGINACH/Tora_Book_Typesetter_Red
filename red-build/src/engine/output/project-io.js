// src/engine/output/project-io.js — Project JSON export/import with settings_version + migrations (S4.1.2, S12)
'use strict';

const { getDefaultSettings, registry, derivePlacementFlags } = require('../core/settings-registry');

/**
 * מיפויי נדידה v1→v2: כינויים ישנים מכל 5 הריפואים → מפתח canonical.
 * ערכים לא־ידועים נשמרים (font-picker preserve-missing-value — IMUD port).
 */
const MIGRATIONS = [
  { version: 2, renames: {
    'pageNumFormat': 'page-num-format',
    'pageNumFrame': 'page-num-frame',
    'pageNumPosition': 'page-num-position',
    'initialPageNumber': 'page-num-initial-value',
    'bodyFontSize': 'body-font-size-pt',
    'lineHeight': 'body-line-height',
    'colWidthPct': 'grid-col-width-pct',
    'marginSidePct': 'grid-margin-side-pct',
    'gutterPct': 'grid-gutter-pct',
    'balanceChapterEnd': 'balance-chapter-end',
    'tocLevel1Show': 'toc-level-1-show',
    'avoid-runt-word': 'runt-min-width-pct' // פנטום Yellow/Green → מנגנון אמיתי כאן
  } }
];

function migrate(raw) {
  let s = { ...raw };
  const from = Number(s.settings_version || 1);
  for (const m of MIGRATIONS) {
    if (m.version > from) {
      for (const [oldK, newK] of Object.entries(m.renames)) {
        if (oldK in s && !(newK in s)) { s[newK] = s[oldK]; delete s[oldK]; }
      }
      s.settings_version = m.version;
    }
  }
  if (!s.settings_version) s.settings_version = 2;
  return s;
}

/** איחוד עם defaults; אי‑התאמות מדווחות ולא משמיטות (audit deltas attributable). */
function mergeWithDefaults(migrated) {
  const defs = getDefaultSettings();
  // derivePlacementFlags **אחרי** האיחוד — mode הוא מקור־האמת; דגלים שהומרו מקובץ
  // v1 ישן (ללא mode) נגזרים שוב כך שלעולם לא ייווצר מצב סותר מאובדן הערות (BRZ-15).
  const merged = derivePlacementFlags({ ...defs, ...migrated, settings_version: 2 });
  // **S4.6:** מפתחות פנימיים (קו-תחתון — נכסי זמן-ריצה כמו _legacy-ui-state/_customStyles)
  // אינם "מפתחות לא מוכרים" — הם מבנה נתונים מתועד; ערכיהם עוברים במיזוג.
  const unknownKeys = Object.keys(migrated).filter(k => !(k in defs) && !k.startsWith('_'));
  const issues = [];
  for (const r of registry) {
    const v = merged[r.id];
    if (r.type === 'enum' && r.enum && !r.enum.includes(v)) issues.push({ key: r.id, value: v, reason: 'not-in-enum', kept: true });
    if (r.type === 'number' && ((r.min != null && v < r.min) || (r.max != null && v > r.max))) issues.push({ key: r.id, value: v, reason: 'out-of-range', kept: true });
  }
  return { merged, unknownKeys, issues };
}

function exportProject(pagesData, settings, meta) {
  return JSON.stringify({
    format: 'tora-typesetter-project',
    format_version: 1,
    engine: 'red-unified',
    exported_at: (meta && meta.timestamp) || null, // דטרמיניסטי: אין Date() אוטומטי בליטה
    settings,
    meta: meta || {},
    pages: pagesData
  }, null, 2);
}

function importProject(json) {
  const raw = typeof json === 'string' ? JSON.parse(json) : json;
  if (raw.format !== 'tora-typesetter-project') throw new Error('unknown project format');
  const migrated = migrate(raw.settings || {});
  const { merged, unknownKeys, issues } = mergeWithDefaults(migrated);
  return { settings: merged, pages: raw.pages || [], meta: raw.meta || {}, unknownKeys, issues };
}

module.exports = { migrate, mergeWithDefaults, exportProject, importProject, MIGRATIONS };
