#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/perf/font-license-scan.py — Agent 3 (DOC-07): מלאי גופנים מתוך הקבצים עצמם.

קריאה בלבד. סורק את כל קובצי ה-TTF וה-WOFF2 שב-red-build/ui/assets/imud/fonts ומפיק:
  - רישוי לפי מטא-דאטה בתוך הגופן (name: 0 זכויות יוצרים, 13 תיאור רישיון, 14 כתובת רישיון) — סיווג **אינדיקטיבי בלבד**, לא חוות דעת משפטית;
  - הרשאות הטמעה (OS/2 fsType) — רלוונטי להטמעת תת-גופן ב-PDF;
  - כיסוי עברית (U+05D0), סוג קווי מתאר (glyf / CFF) — קובע אם ייצוא PDF אפשרי אחרי המרה;
  - כפילויות קטלוג: האם שני הקבצים של אותה משפחה זהים בבתים / במדדי רוחב (hmtx).
שימוש:  python3 tools/perf/font-license-scan.py [--root <repo>] [--out docs/perf/font-inventory.json] [--cache /tmp/scan.json] [--budget 240]
דורש:   pip install fonttools brotli
"""
import argparse, collections, hashlib, json, os, re, sys, time

from fontTools.ttLib import TTFont

ap = argparse.ArgumentParser()
ap.add_argument('--root', default=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
ap.add_argument('--out', default=None)
ap.add_argument('--cache', default=None)
ap.add_argument('--budget', type=float, default=240.0, help='שניות; בסיום התקציב נשמרת מטמון חלקי וניתן להריץ שוב')
args = ap.parse_args()

ASSETS = os.path.join(args.root, 'red-build', 'ui', 'assets', 'imud')
FONTS = os.path.join(ASSETS, 'fonts')
rd = lambda f: json.load(open(os.path.join(ASSETS, f), encoding='utf-8'))
imud, ext = rd('imud-fonts.json'), rd('fonts-extended.json')

LICENSE_RULES = [  # סדר חשוב: המסווג הראשון שמתאים
    ('OFL', r'sil open font licen|open font licen|scripts\.sil\.org/ofl|openfontlicense\.org'),
    ('Apache-2.0', r'apache licen|apache\.org/licenses'),
    ('UFL', r'ubuntu font licen'),
    ('GPL/LGPL', r'gnu general public|\bgpl\b|gnu lesser|\blgpl\b'),
    ('CC/public-domain', r'creative commons|\bcc0\b|cc-by|public domain'),
    ('MIT-like', r'\bmit licen|permission is hereby granted'),
    ('Bitstream-Vera-like', r'bitstream vera|dejavu'),
]
VENDOR_HINTS = r'microsoft|monotype|linotype|adobe|agfa|bitstream|international typeface|\bitc\b|ascender|apple inc|hewlett|esselte|fontfont|URW|paratype'


redact = lambda x: re.sub(r'\d{6,}', '<id>', x or '')  # מזהים מספריים ארוכים (למשל סימון רישיון-ללקוח) אינם נשמרים בפלט


def classify(c0, c13, c14):
    t = ' '.join(x for x in (c0, c13, c14) if x).lower()
    if not t.strip():
        return 'no-license-metadata', None
    for name, rx in LICENSE_RULES:
        if re.search(rx, t):
            return name, None
    m = re.search(VENDOR_HINTS, t, re.I)
    return 'notice-without-recognized-free-license', (m.group(0).lower() if m else None)


def scan_file(path, want_hmtx=False):
    f = TTFont(path, lazy=True)
    nm = f['name']
    g = lambda i: (nm.getDebugName(i) or '').strip()
    c0, fam, full, c13, c14 = redact(g(0)), g(1), g(4), redact(g(13)), redact(g(14))
    fs = f['OS/2'].fsType if 'OS/2' in f else None
    outl = 'glyf' if 'glyf' in f else 'CFF' if 'CFF ' in f else 'CFF2' if 'CFF2' in f else 'other'
    cmap = f.getBestCmap() or {}
    cls, vendor = classify(c0, c13, c14)
    row = {'family': fam, 'full': full, 'cls': cls, 'vendor': vendor, 'fsType': fs, 'outlines': outl, 'hebrew': 0x05D0 in cmap,
           'upm': f['head'].unitsPerEm, 'glyphs': f['maxp'].numGlyphs, 'c0': c0[:100],
           'licensedFor': bool(re.search(r'licensed for', ' '.join((c0, c13)), re.I))}
    if want_hmtx:
        row['hmtx'] = hashlib.sha1(f.getTableData('hmtx')).hexdigest()[:16]
    f.close()
    return row


# --- אילו קבצים נדרשים ל-hmtx (רק משפחות כפולות בקטלוג) ---
def dup_families(cat):
    m = collections.defaultdict(list)
    for e in cat:
        m[e['family']].append(e['file'])
    return {k: v for k, v in m.items() if len(v) > 1}

dupI, dupE = dup_families(imud), dup_families(ext)
need_hmtx = {f for v in list(dupI.values()) + list(dupE.values()) for f in v}

files = sorted(f for f in os.listdir(FONTS) if re.search(r'\.(ttf|woff2)$', f, re.I))
cache = json.load(open(args.cache, encoding='utf-8')) if args.cache and os.path.exists(args.cache) else {}
t0 = time.time(); done = 0
for f in files:
    if f in cache:
        continue
    if time.time() - t0 > args.budget:
        break
    p = os.path.join(FONTS, f)
    try:
        r = scan_file(p, want_hmtx=f in need_hmtx)
        r['bytes'] = os.path.getsize(p)
        r['sha1'] = hashlib.sha1(open(p, 'rb').read()).hexdigest()[:16] if f in need_hmtx else None
    except Exception as e:  # noqa: BLE001
        r = {'error': str(e)[:120], 'bytes': os.path.getsize(p)}
    cache[f] = r; done += 1
    if args.cache and done % 100 == 0:
        json.dump(cache, open(args.cache, 'w', encoding='utf-8'), ensure_ascii=False)
if args.cache:
    json.dump(cache, open(args.cache, 'w', encoding='utf-8'), ensure_ascii=False)
remaining = [f for f in files if f not in cache]
if remaining:
    print(f'לא הושלם: נסרקו {len(cache)}/{len(files)} — הרץ שוב עם אותו --cache'); sys.exit(3)

# ---------------- סיכום ----------------
setof = lambda f: 'ttf' if f.lower().endswith('.ttf') else 'woff2'
S = {'ttf': {}, 'woff2': {}}
for f, r in cache.items():
    S[setof(f)][f] = r
pct = lambda a, b: round(100 * a / b, 1) if b else 0
summary = {'baseCommitFiles': len(files)}
for s, rows in S.items():
    ok = {f: r for f, r in rows.items() if 'error' not in r}
    n = len(ok)
    fsflags = collections.Counter()
    for r in ok.values():
        v = r['fsType']
        if v is None: fsflags['no-OS/2'] += 1; continue
        if v == 0: fsflags['installable(0)'] += 1
        if v & 0x0002: fsflags['restricted(0x2)'] += 1
        if v & 0x0004: fsflags['preview-print(0x4)'] += 1
        if v & 0x0008: fsflags['editable(0x8)'] += 1
        if v & 0x0100: fsflags['no-subsetting(0x100)'] += 1
        if v & 0x0200: fsflags['bitmap-only(0x200)'] += 1
    cls = collections.Counter(r['cls'] for r in ok.values())
    vend = collections.Counter(r['vendor'] or 'none' for r in ok.values() if r['cls'] == 'notice-without-recognized-free-license')
    summary[s] = {'files': len(rows), 'parsed': n, 'errors': [{'file': f, 'error': r['error']} for f, r in rows.items() if 'error' in r],
                  'totalMB': round(sum(r['bytes'] for r in rows.values()) / 1e6, 1),
                  'licenseClasses': dict(cls.most_common()), 'licenseClassesPct': {k: pct(v, n) for k, v in cls.most_common()},
                  'nonFreeNoticeVendors': dict(vend.most_common(12)), 'fsType': dict(fsflags.most_common()),
                  'fsTypeExactValues': dict(collections.Counter(r['fsType'] for r in ok.values()).most_common()),
                  'perCustomerLicenseMarkers': sum(1 for r in ok.values() if r.get('licensedFor')),
                  'hebrew': {'yes': sum(1 for r in ok.values() if r['hebrew']), 'no': sum(1 for r in ok.values() if not r['hebrew'])},
                  'outlines': dict(collections.Counter(r['outlines'] for r in ok.values()).most_common())}

# קטלוגים: הפניות, יתומים, משפחות לבחירה (סמנטיקת runtime: TTF — האחרון זוכה; מורחב — הראשון, ואינו דורס)
ref_i, ref_e = {e['file'] for e in imud}, {e['file'] for e in ext}
summary['catalogs'] = {'imudTtf': {'entries': len(imud), 'families': len({e['family'] for e in imud}), 'files': len(ref_i), 'missingOnDisk': sorted(f for f in ref_i if f not in cache)},
                       'extendedWoff2': {'entries': len(ext), 'families': len({e['family'] for e in ext}), 'files': len(ref_e), 'missingOnDisk': sorted(f for f in ref_e if f not in cache)},
                       'unreferencedFiles': sorted(f for f in cache if f not in ref_i and f not in ref_e)}
famI = {}
for e in imud: famI[e['family']] = e['file']
famE = {}
for e in ext: famE.setdefault(e['family'], e['file'])
only_ext = {k: v for k, v in famE.items() if k not in famI}
mat = collections.Counter()
for fam, f in only_ext.items():
    r = cache.get(f, {})
    if 'error' in r: mat['error'] += 1; continue
    mat[('hebrew' if r['hebrew'] else 'no-hebrew') + '+' + r['outlines']] += 1
summary['woff2OnlyFamilies'] = {'total': len(only_ext), 'matrix': dict(mat.most_common()),
                                'convertibleHebrewGlyf': mat.get('hebrew+glyf', 0), 'hebrewCFF': mat.get('hebrew+CFF', 0) + mat.get('hebrew+CFF2', 0),
                                'noHebrew': sum(v for k, v in mat.items() if str(k).startswith('no-hebrew'))}
summary['selectableFamilies'] = {'total': len(set(famI) | set(famE)), 'ttf': len(famI), 'woff2Only': len(only_ext)}

# כפילויות
def dup_report(dups, cat_name):
    same_bytes = same_metrics = differ = 0; differing = []
    for fam, fl in dups.items():
        rs = [cache[f] for f in fl]
        if len({r.get('sha1') for r in rs}) == 1: same_bytes += 1
        if len({(r.get('hmtx'), r.get('upm'), r.get('glyphs')) for r in rs}) == 1:
            same_metrics += 1
        else:
            differ += 1; differing.append({'family': fam, 'files': fl})
    return {'families': len(dups), 'byteIdentical': same_bytes, 'metricsIdentical(hmtx+upm+glyphs)': same_metrics, 'metricsDiffer': differ, 'metricsDifferFamilies': differing[:60]}
summary['duplicates'] = {'imudTtf(last-wins)': dup_report(dupI, 'ttf'), 'extendedWoff2(first-wins)': dup_report(dupE, 'woff2')}

# קבצים "מוצללים": כפילויות שהקובץ שלהן לעולם אינו נבחר ב-runtime (TTF: האחרון זוכה; מורחב: הראשון)
def shadowed(cat, last_wins):
    out = []
    m = collections.defaultdict(list)
    for e in cat: m[e['family']].append(e['file'])
    for fam, fl in m.items():
        if len(fl) > 1: out += (fl[:-1] if last_wins else fl[1:])
    return sorted(set(out) - {f for e in cat for f in [e['file']] if False})
sh_t, sh_w = shadowed(imud, True), shadowed(ext, False)
summary['shadowedFiles'] = {'ttf': {'files': len(sh_t), 'MB': round(sum(cache[f]['bytes'] for f in sh_t) / 1e6, 2)}, 'woff2': {'files': len(sh_w), 'MB': round(sum(cache[f]['bytes'] for f in sh_w) / 1e6, 2)}}
# שורות מקוצרות (עמודות קבועות) — לשחזור/סינון
cols = ['file', 'set', 'family', 'cls', 'vendor', 'fsType', 'outlines', 'hebrew', 'bytes', 'c0']
rows = [[f, setof(f), r.get('family'), r.get('cls'), r.get('vendor'), r.get('fsType'), r.get('outlines'), r.get('hebrew'), r['bytes'], r.get('c0')] if 'error' not in r else [f, setof(f), None, 'error', None, None, None, None, r['bytes'], r['error']] for f, r in sorted(cache.items())]
out = {'note': 'סיווג רישוי אינדיקטיבי ממטא-דאטה בתוך הגופן; אינו חוות דעת משפטית.', 'summary': summary, 'rowColumns': cols, 'rows': rows}
if args.out:
    json.dump(out, open(args.out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('נכתב', args.out, os.path.getsize(args.out) // 1024, 'KB')
print(json.dumps(summary, ensure_ascii=False, indent=1)[:6000])
