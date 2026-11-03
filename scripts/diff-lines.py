#!/usr/bin/env python3
"""diff-lines: השוואת שורות-קריאה (P7) עם הקשר — עמוד/טור/y/גודל."""
import json, re, unicodedata, sys

ref = json.load(open('audits/layout-reference.json'))
ours = json.load(open('audits/layout-parity-artifacts/ours-model.json'))

def norm(s):
    if s is None: return ""
    s = unicodedata.normalize("NFKC", str(s))
    s = re.sub(r"[\u0591-\u05C7]", "", s)
    s = re.sub(r"[\"״׳'()\[\].,;:!?־–\-]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def reading(doc):
    seq = []
    for pi, p in enumerate(doc['pages']):
        by_col = {"right": [], "left": [], "single": [], None: []}
        for ln in p['lines']:
            by_col.setdefault(ln.get('col'), []).append((pi, ln))
        for name in ("right", "left", "single", None):
            for pi, ln in sorted(by_col.get(name, []), key=lambda t: t[1]['y0']):
                seq.append((pi, ln))
    return seq

rl = reading(ref)
ol = reading(ours)
rn = [norm(l['text']) for _, l in rl]
on = [norm(l['text']) for _, l in ol]

import difflib
sm = difflib.SequenceMatcher(None, rn, on, autojunk=False)
n = 0
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal': continue
    n += 1
    if n > int(sys.argv[1] if len(sys.argv) > 1 else 8): break
    print(f"== {tag}: ref[{i1}:{i2}] ours[{j1}:{j2}]")
    for k in range(max(0, i1-1), min(len(rl), i2+1)):
        pi, l = rl[k]
        mark = 'R' if i1 <= k < i2 else ' '
        print(f"  {mark} p{pi:2d} {str(l.get('col')):6s} y={l['y0']:6.1f} sz={l['size']:4.1f} {l['text'][:52]}")
    for k in range(max(0, j1-1), min(len(ol), j2+1)):
        pi, l = ol[k]
        mark = 'O' if j1 <= k < j2 else ' '
        print(f"  {mark} p{pi:2d} {str(l.get('col')):6s} y={l['y0']:6.1f} sz={l['size']:4.1f} {l['text'][:52]}")
    print()
