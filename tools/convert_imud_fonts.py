#!/usr/bin/env python3
"""tools/convert_imud_fonts.py — המרת פונטי העדיפות של IMUD_TORANI (woff2) ל-TTF.

המנוע (font-metrics/parseFont) קורא sfnt (TTF/OTF); woff2 דחוס brotli.
ממירים את כל פונטי fonts-priority.json (439) + fonts-def.css לצורך @font-face.
פלט: red-build/ui/assets/imud/fonts/<file>.ttf + קטלוג imud-fonts.json.
"""
import json
import os
import sys

try:
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit('fonttools required: pip install fonttools brotli')

IMUD = '/home/z/my-project/audit/IMUD_TORANI'
OUT = '/home/z/my-project/audit/Tora_Book_Typesetter_Red/red-build/ui/assets/imud/fonts'
os.makedirs(OUT, exist_ok=True)

with open(os.path.join(IMUD, 'fonts-priority.json'), encoding='utf-8') as f:
    priority = json.load(f)

catalog = []
ok = fail = 0
for entry in priority:
    src = os.path.join(IMUD, 'fonts', entry['file'])
    if not os.path.exists(src):
        fail += 1
        continue
    out_name = os.path.splitext(entry['file'])[0] + '.ttf'
    try:
        font = TTFont(src)
        font.flavor = None  # woff2 → sfnt
        font.save(os.path.join(OUT, out_name))
        catalog.append({'family': entry['family'], 'file': out_name, 'format': 'truetype'})
        ok += 1
    except Exception as e:  # noqa: BLE001
        print(f'FAIL {entry["file"]}: {e}', file=sys.stderr)
        fail += 1

with open(os.path.join(OUT, '..', 'imud-fonts.json'), 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=0)

total_mb = sum(os.path.getsize(os.path.join(OUT, c['file'])) for c in catalog) / 1e6
print(f'converted {ok} fonts ({total_mb:.1f} MB), failed {fail} → {OUT}')
