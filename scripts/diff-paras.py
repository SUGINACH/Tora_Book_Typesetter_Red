#!/usr/bin/env python3
"""diff-paras: השוואת רצפי פסקאות ייחוס מול שלנו — מיפוי מדויק של פערי P6."""
import json, difflib, sys, re, unicodedata

ref = json.load(open('audits/layout-reference.json'))
ours = json.load(open('audits/layout-parity-artifacts/ours-model.json'))
rp = ref['document']['paragraphSeq']
op = ours['document']['paragraphSeq']

def norm(s):
    if s is None:
        return ""
    s = unicodedata.normalize("NFKC", str(s))
    s = re.sub(r"[\u0591-\u05C7]", "", s)
    s = re.sub(r"[\"״׳'()\[\].,;:!?־–\-]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

rh = [norm(" ".join((p.get('head') or '').split()[:3])) for p in rp]
oh = [norm(" ".join((p.get('head') or '').split()[:3])) for p in op]

sm = difflib.SequenceMatcher(None, rh, oh, autojunk=False)
n_eq = 0
print(f"ref={len(rp)} ours={len(op)}")
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'equal':
        n_eq += i2 - i1
        continue
    print(f"\n== {tag}: ref[{i1}:{i2}] vs ours[{j1}:{j2}]")
    for k in range(i1, min(i2, i1 + 4)):
        print(f"  R{k:3d} {rp[k]['lines']:3d}l {rp[k]['words']:4d}w | {rh[k][:44]}")
    if i2 - i1 > 4: print(f"  ... (+{i2-i1-4} more ref)")
    for k in range(j1, min(j2, j1 + 4)):
        print(f"  O{k:3d} {op[k]['lines']:3d}l {op[k]['words']:4d}w | {oh[k][:44]}")
    if j2 - j1 > 4: print(f"  ... (+{j2-j1-4} more ours)")
print(f"\naligned: {n_eq} / ref {len(rp)}")
