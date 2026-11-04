# -*- coding: utf-8 -*-
# ניתוח מדויק של p14 בייחוס: שורות, פסים, גבולות פסקה, ותיבת הטור — מול שלנו.
# שימוש: python3 tools/layout-parity/inspect-page.py 14 [ref|ours]
import json, sys

ref = json.load(open("audits/layout-reference.json"))
ours = json.load(open("audits/layout-parity-artifacts/ours-model.json"))

def get(doc, pno):
    for p in doc["pages"]:
        if p["index"] == pno:
            return p
    return None

def show(doc, name, pno):
    p = get(doc, pno)
    print(f"=== {name} page {pno} ===")
    if not p:
        print("  (not found)"); return
    print("  type:", p.get("type"), " columns:", [(c.get("name"), round(c.get("x0",0),1), round(c.get("x1",0),1)) for c in (p.get("columns") or [])])
    lines = sorted(p["lines"], key=lambda l: (-l.get("x0",0), l.get("y0",0)))
    # group by column (x0 threshold)
    right = [l for l in lines if (l.get("x0") or 0) > 300 and (l.get("col") in (None, "right"))]
    left  = [l for l in lines if (l.get("x0") or 0) <= 300 or l.get("col") == "left"]
    for cname, col in (("RIGHT", right), ("LEFT", left)):
        col = sorted(col, key=lambda l: l["y0"])
        print(f"  --- {cname} column: {len(col)} lines ---")
        prev_y0 = None
        for i, l in enumerate(col):
            y0 = l.get("y0"); y1 = l.get("y1")
            pitch = (y0 - prev_y0) if prev_y0 is not None else 0.0
            prev_y0 = y0
            sz = l.get("size")
            txt = (l.get("text") or "")[:38]
            print(f"   {i:2d} y0={y0:7.2f} y1={y1:7.2f} Δ={pitch:6.2f} sz={sz} {txt}")
    return p

pno = int(sys.argv[1]) if len(sys.argv) > 1 else 14
which = sys.argv[2] if len(sys.argv) > 2 else "both"
if which in ("ref", "both"):
    show(ref, "REF", pno)
if which in ("ours", "both"):
    show(ours, "OURS", pno)
