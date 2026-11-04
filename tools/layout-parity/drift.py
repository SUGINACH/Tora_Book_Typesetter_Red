# -*- coding: utf-8 -*-
# S4.19: מדידת דריפט פר-עמוד/טור אחרי מודל ה-DOM — איפה נולד הפער הנותר?
import json, difflib, sys, importlib.util
from collections import defaultdict

spec = importlib.util.spec_from_file_location("cmp", "tools/layout-parity/compare.py")
cmp_mod = importlib.util.module_from_spec(spec)
sys.modules["cmp"] = cmp_mod
spec.loader.exec_module(cmp_mod)

ref = json.load(open("audits/layout-reference.json"))
ours = json.load(open("audits/layout-parity-artifacts/ours-model.json"))

# reading lines with location, per page/column — text only, body size (>=11)
def lines_of(doc):
    out = []
    for p in doc["pages"]:
        by_col = defaultdict(list)
        for ln in p["lines"]:
            c = ln.get("col")
            sz = ln.get("size") or 0
            if c not in ("right", "left", "single"):
                continue
            if sz < 11:
                continue
            by_col[c].append((ln["y0"], cmp_mod.norm(ln.get("text") or "")))
        for c, lst in by_col.items():
            lst.sort()
            out.append((p["index"], c, [t for _, t in lst if t], [y for y, t in lst if t]))
    return out

R = lines_of(ref)
O = lines_of(ours)
rmap = {(pg, c): (ts, ys) for pg, c, ts, ys in R}
omap = {(pg, c): (ts, ys) for pg, c, ts, ys in O}

print(f"{'pg/col':>10} {'nR':>3} {'nO':>3} {'dMed':>6} {'uniqR':>5} {'uniqO':>5}  first ref-only / ours-only")
for key in rmap:
    rts, rys = rmap[key]
    ots, oys = omap.get(key, ([], []))
    if not rts and not ots:
        continue
    sm = difflib.SequenceMatcher(None, rts, ots, autojunk=False)
    dts = []
    uniq_r, uniq_o = [], []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                dts.append(oys[j1 + k] - rys[i1 + k])
        else:
            uniq_r.extend(rts[i1:i2][:1])
            uniq_o.extend(ots[j1:j2][:1])
    dmed = sorted(dts)[len(dts) // 2] if dts else 0.0
    if uniq_r or uniq_o or abs(dmed) > 3:
        ur = (uniq_r[0][:20] if uniq_r else "")
        uo = (uniq_o[0][:20] if uniq_o else "")
        print(f"{str(key):>10} {len(rts):>3} {len(ots):>3} {dmed:>6.1f} {len(uniq_r):>5} {len(uniq_o):>5}  {ur} / {uo}")
