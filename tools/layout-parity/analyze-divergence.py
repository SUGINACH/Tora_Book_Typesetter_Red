# -*- coding: utf-8 -*-
# ניתוח סטיות P7 v2 — כולל merge_window_rows + מיקום כמותי (תחתית/ראש טור)
import json, difflib, sys, importlib.util
from collections import Counter

spec = importlib.util.spec_from_file_location("cmp", "tools/layout-parity/compare.py")
cmp_mod = importlib.util.module_from_spec(spec)
sys.modules["cmp"] = cmp_mod
spec.loader.exec_module(cmp_mod)

ref = json.load(open("audits/layout-reference.json"))
ours = json.load(open("audits/layout-parity-artifacts/ours-model.json"))


def is_window_row(r, col_x0=None, col_x1=None):
    if r.get("window"):
        return True
    try:
        sz = float(r.get("size") or 0)
    except (TypeError, ValueError):
        sz = 0.0
    if sz > 13 and col_x0 is not None and col_x1 is not None:
        x0 = r.get("x0") or 0
        x1 = r.get("x1") or 0
        return x0 > col_x0 + 40 and x1 >= col_x1 - 3
    return False


def merge_window_rows(rows, col_x0=None, col_x1=None):
    out = []
    i = 0
    while i < len(rows):
        r = rows[i]
        if is_window_row(r, col_x0, col_x1) and i + 1 < len(rows):
            merged = dict(r)
            merged["text"] = (r.get("text") or "") + " " + (rows[i + 1].get("text") or "")
            out.append(merged)
            i += 2
            continue
        out.append(r)
        i += 1
    return out


def reading_lines_located(docjson):
    def cluster_sorted(rows):
        rows = sorted(rows, key=lambda l: l["y0"])
        out = []
        i = 0
        while i < len(rows):
            j = i + 1
            while j < len(rows) and rows[j]["y0"] - rows[j - 1]["y0"] <= 1.5:
                j += 1
            cluster = sorted(rows[i:j], key=lambda l: -(l.get("x0") or 0))
            if len(cluster) == 1:
                out.append(cluster[0])
            else:
                merged = dict(cluster[0])
                merged["text"] = " ".join(
                    (r.get("text") or "").strip() for r in cluster if (r.get("text") or "").strip())
                out.append(merged)
            i = j
        return out

    seq = []
    for p in docjson["pages"]:
        none_rows, mright, mleft = [], [], []
        by_col = {"right": [], "left": [], "single": []}
        for ln in p["lines"]:
            c = ln.get("col")
            if c in ("right", "left", "single"):
                by_col[c].append(ln)
            elif ln.get("size") is not None and ln["size"] < 7:
                (mright if (ln.get("x0") or 0) > 300 else mleft).append(ln)
            else:
                none_rows.append(ln)
        for name in ("right", "left", "single"):
            col_x0 = col_x1 = None
            for c in (p.get("columns") or []):
                if c.get("name") == name and c.get("x0") is not None:
                    col_x0, col_x1 = c["x0"], c.get("x1")
                    break
            col_rows = merge_window_rows(cluster_sorted(by_col[name]), col_x0, col_x1)
            for ln in col_rows:
                seq.append((p["index"], name, ln["y0"], cmp_mod.norm(ln["text"])))
        for ln in cluster_sorted(none_rows):
            seq.append((p["index"], "none", ln["y0"], cmp_mod.norm(ln["text"])))
        for ln in cluster_sorted(mright):
            seq.append((p["index"], "mright", ln["y0"], cmp_mod.norm(ln["text"])))
        for ln in cluster_sorted(mleft):
            seq.append((p["index"], "mleft", ln["y0"], cmp_mod.norm(ln["text"])))
    return [t for t in seq if t[3]]


R = reading_lines_located(ref)
O = reading_lines_located(ours)
bag = lambda s: " ".join(sorted(s.split()))
rl = [bag(t[3]) for t in R]
ol = [bag(t[3]) for t in O]
sm = difflib.SequenceMatcher(None, rl, ol, autojunk=False)
print(f"ref={len(rl)} ours={len(ol)} ratio={sm.ratio():.4f}  (compare.py P7 רשמי: 0.9451)")
print()

opcodes = [op for op in sm.get_opcodes() if op[0] != "equal"]
print(f"non-equal blocks: {len(opcodes)}")

# quantify: where do ref-only lines sit (y) vs ours-only lines
# bottom-of-column = y > 650; top = y < 200
ref_only_pos = Counter()
ours_only_pos = Counter()
blocks_info = []
for tag, i1, i2, j1, j2 in opcodes:
    rls = R[i1:i2]
    ols = O[j1:j2]
    for t in rls:
        y = t[2]
        pos = "bottom" if y > 600 else ("top" if y < 200 else "mid")
        ref_only_pos[(t[1], pos)] += 1
    for t in ols:
        y = t[2]
        pos = "bottom" if y > 600 else ("top" if y < 200 else "mid")
        ours_only_pos[(t[1], pos)] += 1
    if len(rls) or len(ols):
        blocks_info.append((tag, rls, ols))

print("ref-only lines by (col, y-pos):", dict(ref_only_pos))
print("ours-only lines by (col, y-pos):", dict(ours_only_pos))
print()

# Show paired delete/insert where ref lines are at bottom and ours at top of next page/col
print("=== paired bottom→top transfers (the core pattern) ===")
n = 0
for k, (tag, rls, ols) in enumerate(blocks_info):
    if not rls or not ols:
        continue
    r_bottom = [t for t in rls if t[2] > 600]
    o_top = [t for t in ols if t[2] < 200]
    if r_bottom and o_top and r_bottom[0][0] != o_top[0][0]:
        n += 1
        print(f"[{k}] ref p{r_bottom[0][0]}/{r_bottom[0][1]} y{r_bottom[0][2]:.0f} ({len(rls)}R/{len(ols)}O) -> ours p{o_top[0][0]}/{o_top[0][1]} y{o_top[0][2]:.0f}")
        if n >= 20:
            break
