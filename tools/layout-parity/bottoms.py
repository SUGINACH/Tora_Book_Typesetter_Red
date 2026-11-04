# -*- coding: utf-8 -*-
# מדידת תחתיות תוכן לכל עמוד/טור בייחוס מול שלנו: האם התקציב נכלל בו מרווח אחרון?
import json, sys

ref = json.load(open("audits/layout-reference.json"))
ours = json.load(open("audits/layout-parity-artifacts/ours-model.json"))

def bottoms(doc, name):
    print(f"=== {name} ===")
    print(f"{'pg':>3} {'type':<12} {'Rbot':>7} {'Lbot':>7} {'Rn':>3} {'Ln':>3}  lastR / lastL text")
    for p in doc["pages"]:
        if p.get("type") != "body":
            continue
        cols = {"right": [], "left": []}
        for ln in p["lines"]:
            c = ln.get("col")
            if c in cols and ln.get("size") and ln["size"] >= 7:
                cols[c].append(ln)
        if not (cols["right"] or cols["left"]):
            continue
        out = []
        for c in ("right", "left"):
            if cols[c]:
                last = max(cols[c], key=lambda l: l["y1"])
                out.append((round(last["y1"] * 4 / 3, 1), len(cols[c]), (last.get("text") or "")[:14]))
            else:
                out.append(("-", 0, ""))
        print(f"{p['index']:>3} {p.get('type',''):<12} {out[0][0]:>7} {out[1][0]:>7} {out[0][1]:>3} {out[1][1]:>3}  {out[0][2]} / {out[1][2]}")

bottoms(ref, "REF")
bottoms(ours, "OURS")
