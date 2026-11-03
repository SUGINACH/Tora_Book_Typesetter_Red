// tests/integration/registry.test.js — S4 Gate: three-layer contract scanners + defaults + font-picker regression
'use strict';

const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const { getSettingDefs, getDefaultSettings, findKey, registry } = require('../../src/engine/core/settings-registry');
const { scanConsumers } = require('../../src/audit/scanners');

const SRC_ROOT = path.join(__dirname, '..', '..', 'src');

describe('registry self-validation', () => {
  it('every row has id/type/default/panel/control/consumers/effect_test', () => {
    for (const r of registry) {
      assert(typeof r.id === 'string' && r.id.length > 0, `row missing id: ${JSON.stringify(r)}`);
      assert(['bool', 'number', 'enum', 'string', 'font', 'color', 'ornament', 'asset'].includes(r.type), `${r.id}: bad type ${r.type}`);
      assert(typeof r.panel === 'string' && r.panel.length > 0, `${r.id}: missing panel`);
      assert(typeof r.control === 'string' && /^[a-z]+-[a-z0-9-]+$/.test(r.control), `${r.id}: control id malformed '${r.control}'`);
      assert(Array.isArray(r.consumers) && r.consumers.length >= 1, `${r.id}: must declare ≥1 consumer mechanism`);
      assert(typeof r.effect_test === 'string' && r.effect_test.startsWith('fx:'), `${r.id}: missing effect-test id`);
      assert(r.default !== undefined, `${r.id}: missing default`);
    }
  });

  it('enum defaults are inside enum; number defaults inside range', () => {
    for (const r of registry) {
      if (r.enum) assert(r.enum.includes(r.default), `${r.id}: default ${r.default} not in enum`);
      if (r.type === 'number') {
        if (r.min !== undefined) assert(r.default >= r.min, `${r.id}: default below min`);
        if (r.max !== undefined) assert(r.default <= r.max, `${r.id}: default above max`);
      }
    }
  });

  it('no duplicate ids/controls/effect-tests (single source of truth)', () => {
    const ids = new Set(), controls = new Set(), tests = new Set();
    for (const r of registry) {
      assert(!ids.has(r.id), `duplicate key ${r.id}`); ids.add(r.id);
      assert(!controls.has(r.control), `duplicate control ${r.control}`); controls.add(r.control);
      assert(!tests.has(r.effect_test), `duplicate effect test ${r.effect_test}`); tests.add(r.effect_test);
    }
  });
});

describe('S4.1.4 anti-patcha scanners (must be zero-mismatch)', () => {
  const res = scanConsumers(SRC_ROOT);

  it('phantom-key scanner: every registry key is consumed in engine sources', () => {
    assertEq(res.phantomKeys.map(k => k.id), [], 'phantom keys found (key with no consumer in src)');
  });

  it('orphan-mechanism scanner: every declared consumer module exists on disk', () => {
    assertEq(res.orphanMechanisms.map(m => `${m.id}->${m.consumer}`), [], 'consumer modules missing');
  });

  it('dead-control scanner: S10 built the UI — every registry control must be bound (gate flipped to zero)', () => {
    // עד S10 כל הפקדים היו צפויים "מתים" (ה־UI טרם נבנה) — השער הפוך כעת:
    // bindings.generated.js מרנדר את כל הפאנלים מהרישום, ולכן כל פקד חייב להימצא.
    // זה מונע סורק שבור שמדווח שקר־ירוק (המשך תיקון P0-5).
    assertEq(res.deadControls.length, 0, 'dead controls found — UI bindings incomplete: ' + res.deadControls.map(d => d.control).join(', '));
  });
});

describe('getDefaultSettings generation', () => {
  it('returns settings_version 2 and one entry per registry row', () => {
    const s = getDefaultSettings();
    assertEq(s.settings_version, 2);
    assertEq(Object.keys(s).length - 1, registry.length, 'default map size must equal registry size');
  });
  it('findKey returns null for unknown, row for known', () => {
    assert(findKey('no-such-key') === null);
    assert(findKey('body-font-size-pt') !== null);
  });
});

report('registry-integration');
