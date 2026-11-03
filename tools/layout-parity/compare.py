#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/layout-parity/compare.py — ההשוואה המתמטית־מוחלטת בין העימוד שלנו לייחוס.

קלט:
  * audits/layout-reference.json  — האמת של הגרסה הישנה (חילוץ דטרמיניסטי)
  * ours-model.json               — הדגם המבני של RED (נתיב חי)
  * ours.pdf                      — הייצוא של RED (נתיב חי, גופן אמיתי)

שתי שכבות בדיקה:
  HARD  — אינווריאנטים מוחלטים (נכונות בפני עצמה, בלי ייחוס):
          שימור תוכן, אי־חפיפת שורות, שהייה בגבולות העמוד, יישור לשפות הטור.
  PARITY — השוואה מול הייחוס (זהות להתנהגות המקור):
          מספר עמודים, רצף סוגים, פורמט/רצף עמודונים, כותרות עליונות, תוכן-עניינים
          (כללי+מפורט), רצף פסקאות (שורות/מילים), שקילות שבירת שורות, גיאומטריה
          (גודל עמוד, תיבות טורים, מיקום כותרת/עמודון, גודל גופן, פס שורות),
          וגיאומטריית פתיחת פרק (כותרת פרושה מול קומפקטית).

פלט: report.json + תקציר קריא + קוד יציאה:
  0 = הכל עובר | 1 = כשל HARD | 2 = כשל PARITY | 3 = שניהם
"""
import json
import os
import re
import sys
import unicodedata
import difflib
from collections import Counter

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")

PX = 0.75


def gematria(s):
    """ממיר גימטריה למספר (תומך גם בגרשיים)."""
    vals = {"א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7, "ח": 8, "ט": 9,
            "י": 10, "כ": 20, "ך": 20, "ל": 30, "מ": 40, "ם": 40, "נ": 50, "ן": 50,
            "ס": 60, "ע": 70, "פ": 80, "ף": 80, "צ": 90, "ץ": 90, "ק": 100,
            "ר": 200, "ש": 300, "ת": 400}
    s = re.sub(r"[׳״'\"]", "", s)
    total, saw_yod_ten = 0, False
    # ט"ו → 15, ט"ז → 16 מיוצגים כמו שהם (ט+ו=15) — הסכימה הפשוטה מספיקה
    for ch in s:
        if ch in vals:
            total += vals[ch]
        elif ch.strip():
            return None
    return total if total else None


def norm(s):
    """נרמול טקסט להשוואה: NFKC, הסרת ניקוד/סימנים/גרשיים, רווחים."""
    if s is None:
        return ""
    s = unicodedata.normalize("NFKC", str(s))
    s = re.sub(r"[\u0591-\u05C7]", "", s)  # ניקוד + מקף עברי
    s = re.sub(r"[\"״׳'()\[\].,;:!?־–\-]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


# ---------- חילוץ גיאומטריה מה-PDF שלנו (אותן פונקציות עקרונות כמו הייחוס) ----------

def pdf_rows(page):
    """שורות ויזואליות מה-PDF שלנו.

    ה-pdf-writer שלנו כותב כל מילה כפעולת טקסט נפרדת — PyMuPDF מחזיר אותן
    כשורות בודדות. לכן: איחוי לשורות ויזואליות לפי פס-y (±4pt) ורצף x
    (פער < 30pt = אותה שורה; 59pt+ = רווח בין טורים). הטקסט נבנה RTL.
    """
    raw = []
    d = page.get_text("dict")
    for block in d["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            spans = [s for s in line["spans"] if s["text"].strip()]
            if not spans:
                continue
            x0 = min(s["bbox"][0] for s in spans)
            y0 = min(s["bbox"][1] for s in spans)
            x1 = max(s["bbox"][2] for s in spans)
            y1 = max(s["bbox"][3] for s in spans)
            raw.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1,
                        "font": spans[0]["font"].split("+")[-1],
                        "size": max(round(s["size"], 2) for s in spans),
                        "text": " ".join(s["text"].strip() for s in spans)})
    raw.sort(key=lambda r: (round((r["y0"] + r["y1"]) / 2, 1), r["x0"]))
    # איחוי לפי פס-y
    bands = []
    for r in raw:
        cy = (r["y0"] + r["y1"]) / 2
        if bands and abs(cy - bands[-1]["cy"]) <= 4:
            bands[-1]["parts"].append(r)
        else:
            bands.append({"cy": cy, "parts": [r]})
    rows = []
    for b in bands:
        parts = sorted(b["parts"], key=lambda r: r["x0"])
        runs = [dict(parts[0])]
        for r in parts[1:]:
            if r["x0"] - runs[-1]["x1"] < 30:
                runs[-1]["x1"] = max(runs[-1]["x1"], r["x1"])
                runs[-1]["y0"] = min(runs[-1]["y0"], r["y0"])
                runs[-1]["y1"] = max(runs[-1]["y1"], r["y1"])
                runs[-1]["size"] = max(runs[-1]["size"], r["size"])
                runs[-1]["text"] += " " + r["text"]
            else:
                runs.append(dict(r))
        for run in runs:
            ordered = None  # כבר ממוין LTR; הפיכה ל-RTL לוגי
            words = run["text"].split()
            rows.append({
                "y0": round(run["y0"], 2), "y1": round(run["y1"], 2),
                "x0": round(run["x0"], 2), "x1": round(run["x1"], 2),
                "font": run["font"], "size": run["size"],
                "text": " ".join(reversed(words)) if words else "",
            })
    rows.sort(key=lambda r: (r["y0"], r["x0"]))
    return rows


def clusters(vals, tol):
    if not vals:
        return []
    vs = sorted(vals)
    out, cur = [], [vs[0]]
    for v in vs[1:]:
        if v - cur[-1] <= tol:
            cur.append(v)
        else:
            out.append(cur); cur = [v]
    out.append(cur)
    return [(round(sum(c) / len(c), 2), len(c)) for c in out]


def infer_columns(rows):
    """תיבות טורים לפי תמיכת זוגות שפות (כמו בחילוץ הייחוס)."""
    content = [r for r in rows if 60 < r["y0"] < 780]
    if len(content) < 3:
        return []
    minc = max(3, int(0.12 * len(content)))
    x1c = [c for c in clusters([r["x1"] for r in content], 6) if c[1] >= minc]
    x0c = [c for c in clusters([r["x0"] for r in content], 8) if c[1] >= minc]
    cols, used = [], set()
    for edge, _ in sorted(x1c, key=lambda c: -c[0]):
        cands = []
        for x0v, _ in x0c:
            if x0v in used or not (edge - 260 <= x0v <= edge - 140):
                continue
            sup = sum(1 for r in content if abs(r["x0"] - x0v) <= 6 and abs(r["x1"] - edge) <= 6)
            cands.append((sup, x0v))
        if cands:
            sup, x0v = max(cands)
            if sup >= 3:
                cols.append({"x0": x0v, "x1": edge})
                used.add(x0v)
        if len(cols) == 2:
            break
    if len(cols) == 2:
        cols.sort(key=lambda c: -c["x0"])
        return [{"name": "right", **cols[0]}, {"name": "left", **cols[1]}]
    if x1c and x0c:
        return [{"name": "single", "x0": min(c[0] for c in x0c), "x1": max(c[0] for c in x1c)}]
    return []


# ---------- מנוע הבדיקות ----------

class Checks:
    def __init__(self):
        self.items = []

    def add(self, cid, layer, name, ok, **detail):
        self.items.append({"id": cid, "layer": layer, "name": name,
                           "pass": bool(ok), **detail})

    def summary(self):
        hard = [c for c in self.items if c["layer"] == "HARD"]
        par = [c for c in self.items if c["layer"] == "PARITY"]
        hp = sum(1 for c in hard if c["pass"])
        pp = sum(1 for c in par if c["pass"])
        return {"hard": f"{hp}/{len(hard)}", "parity": f"{pp}/{len(par)}",
                "score": round(100 * (hp + pp) / max(1, len(hard) + len(par)), 1)}


def main():
    ref_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "audits/layout-reference.json")
    ours_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "audits/layout-parity-artifacts/ours-model.json")
    pdf_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ROOT, "audits/layout-parity-artifacts/ours.pdf")
    out_path = sys.argv[4] if len(sys.argv) > 4 else os.path.join(ROOT, "audits/layout-parity-artifacts/parity-report.json")

    ref = json.load(open(ref_path, encoding="utf-8"))
    ours = json.load(open(ours_path, encoding="utf-8"))
    src_text = open(os.path.join(ROOT, "audits/no_long_test_text.txt"), encoding="utf-8").read()

    C = Checks()

    # ================= HARD 1: שימור תוכן =================
    IDENT = re.compile(r"^(שם הספר|נושא|פרטי|שם המחבר|מקום ושנת|שמירת|פרטים|כותרת)")
    src_words = Counter()
    for ln in src_text.split("\n"):
        ln = ln.strip()
        if not ln or IDENT.match(ln):
            continue
        src_words.update(norm(ln).split())

    ours_words = Counter()
    for p in ours["pages"]:
        for col in p["columns"]:
            for ln in col["lines"]:
                ours_words.update(norm(ln["text"]).split())
    missing = src_words - ours_words
    extra = ours_words - src_words
    C.add("H1", "HARD", "שימור תוכן — מולטיסט מילים זהה למקור",
          not missing and not extra,
          srcTotal=sum(src_words.values()), oursTotal=sum(ours_words.values()),
          missingWords=sum(missing.values()), missingSample=list(missing)[:8],
          extraWords=sum(extra.values()), extraSample=list(extra)[:8])

    # ================= HARD 2-4: אינווריאנטים גיאומטריים ב-PDF שלנו =================
    doc = fitz.open(pdf_path)
    overlaps, oob, justify_miss = [], [], []
    col_boxes_all = []
    header_ys, folio_pos, body_sizes, pitches = [], [], [], []
    title_gaps = []
    for pno in range(doc.page_count):
        page = doc[pno]
        rows = pdf_rows(page)
        content = [r for r in rows if 60 < r["y0"] < 780]
        # H3: גבולות עמוד
        W, H = page.rect.width, page.rect.height
        for r in rows:
            if r["x0"] < -1 or r["y0"] < -1 or r["x1"] > W + 1 or r["y1"] > H + 1:
                oob.append({"page": pno, "text": r["text"][:30], "bbox": [r["x0"], r["y0"], r["x1"], r["y1"]]})
        cols = infer_columns(rows)
        if len(cols) == 2:
            col_boxes_all.append((pno, cols))
            for c in cols:
                crows = sorted([r for r in content
                                if r["x0"] >= c["x0"] - 6 and r["x1"] <= c["x1"] + 6],
                               key=lambda r: (r["y0"], r["x0"]))
                # איחוי שורות ויזואליות: קטעים באותו פס (y0 ±2.5) = שורה אחת
                # (הפרדת מילים בפערי יישור גדולים אינה שתי שורות)
                vlines = []
                for r in crows:
                    if vlines and abs(r["y0"] - vlines[-1]["y0"]) <= 2.5:
                        v = vlines[-1]
                        v["x0"] = min(v["x0"], r["x0"]); v["x1"] = max(v["x1"], r["x1"])
                        v["y1"] = max(v["y1"], r["y1"])
                        v["text"] += " " + r["text"]
                    else:
                        vlines.append(dict(r))
                # H2: חפיפות אנכיות בין שורות ויזואליות שונות
                for i in range(1, len(vlines)):
                    ov = vlines[i - 1]["y1"] - vlines[i]["y0"]
                    if ov > 1.5:
                        overlaps.append({"page": pno, "col": c["name"], "px": round(ov, 1),
                                         "a": vlines[i - 1]["text"][:20], "b": vlines[i]["text"][:20]})
                # H4: יישור — שורות מגיעות לשתי שפות הטור
                width = c["x1"] - c["x0"]
                nreach = sum(1 for v in vlines if abs((v["x1"] - v["x0"]) - width) < 5)
                if vlines:
                    justify_miss.append(1 - nreach / len(vlines))
                # פס שורות (מרווח בין שורות עוקבות)
                for i in range(2, len(vlines)):
                    d = vlines[i]["y0"] - vlines[i - 2]["y0"]
                    if 8 < d < 40:
                        pitches.append(round(d / 2, 2))
        # גדלי גוף נפוצים
        for r in content:
            body_sizes.append((r["font"], r["size"]))
        # כותרת עליונה/עמודון
        for r in rows:
            if r["y1"] < 62:
                header_ys.append((pno, r["y0"], r["y1"]))
            if r["y0"] > H - 60:
                folio_pos.append({"page": pno, "x": round((r["x0"] + r["x1"]) / 2, 1), "y": r["y0"]})
        # פערי מילים בכותרות פתיחת פרק (שורות גדולות ≥15pt)
        for r in content:
            if r["size"] >= 15:
                d = page.get_text("dict")
                gaps = []
                for b in d["blocks"]:
                    if b["type"] != 0:
                        continue
                    for l in b["lines"]:
                        for s in l["spans"]:
                            if abs(s["bbox"][1] - r["y0"]) < 3 and s["size"] >= 15:
                                gaps.append((s["bbox"][0], s["bbox"][2]))
                gaps.sort()
                for i in range(1, len(gaps)):
                    title_gaps.append(round(gaps[i][0] - gaps[i - 1][1], 1))
    doc.close()

    C.add("H2", "HARD", "אפס חפיפות שורות ב-PDF", len(overlaps) == 0,
          overlaps=len(overlaps), sample=overlaps[:6])
    C.add("H3", "HARD", "כל הטקסט בתוך גבולות העמוד", len(oob) == 0,
          violations=len(oob), sample=oob[:6])
    avg_justify = round(100 * (1 - (sum(justify_miss) / len(justify_miss))), 1) if justify_miss else 0
    C.add("H4", "HARD", "שורות גוף מגיעות לשפות הטור (יישור)",
          justify_miss and avg_justify >= 90,
          reachPct=avg_justify, twoColPages=len(justify_miss))

    # ================= PARITY 1: מספר עמודים =================
    C.add("P1", "PARITY", "מספר עמודים", ours["meta"]["pages"] == ref["meta"]["pages"],
          ref=ref["meta"]["pages"], ours=ours["meta"]["pages"],
          delta=ours["meta"]["pages"] - ref["meta"]["pages"])

    # ================= PARITY 2: רצף סוגי עמודים =================
    rt, ot = ref["document"]["typeSeq"], ours["document"]["typeSeq"]
    sm = difflib.SequenceMatcher(None, rt, ot, autojunk=False)
    C.add("P2", "PARITY", "רצף סוגי עמודים", sm.ratio() >= 0.9,
          ratio=round(sm.ratio(), 4),
          refCounts=dict(Counter(rt)), oursCounts=dict(Counter(ot)),
          firstDiffs=[f"{op}: ref{rt[i1:i2][:3]} vs ours{ot[j1:j2][:3]}"
                      for op, i1, i2, j1, j2 in sm.get_opcodes() if op != "equal"][:6])

    # ================= PARITY 3: עמודונים =================
    rf = [f["text"] for f in ref["document"]["folioSeq"]]
    of = [f["text"] for f in ours["document"]["folioSeq"]]
    bare = all(not re.search(r"[׳״'\"]", t) for t in rf)
    ours_bare = all(not re.search(r"[׳״'\"]", t) for t in of)
    C.add("P3a", "PARITY", "פורמט עמודון — גימטריה יחידה בלי גרשיים (כמקור)", ours_bare and bare,
          refFormatBare=bare, oursFormatBare=ours_bare,
          oursSample=of[:6], refSample=rf[:6])
    ref_vals = [gematria(t) for t in rf]
    ours_vals = [gematria(re.sub(r"[׳״'\"]", "", t)) for t in of]
    C.add("P3b", "PARITY", "רצף ערכי עמודונים (מ־1 ואילך ברצף)",
          ref_vals == ours_vals and len(ref_vals) == len(ours_vals),
          refCount=len(ref_vals), oursCount=len(ours_vals),
          refFirst=ref_vals[:8], oursFirst=ours_vals[:8])

    # ================= PARITY 4: כותרות עליונות =================
    ref_hdr = {}
    for p in ref["pages"]:
        if p["folio"] and p["type"] in ("body", "sign-open", "chapter-open", "toc-general", "toc-detailed"):
            h = p["header"] or {}
            ref_hdr[norm((p["folio"]["text"] or "").replace("׳", "").replace("״", ""))] = (
                norm(h["right"]["text"] if h.get("right") else ""),
                norm(h["center"]["text"] if h.get("center") else ""),
                norm(h["left"]["text"] if h.get("left") else ""))
    ok_hdr, tot_hdr, hdr_bad = 0, 0, []
    for p in ours["pages"]:
        if not p["folio"]["text"]:
            continue
        key = norm(re.sub(r"[׳״'\"]", "", p["folio"]["text"]))
        if key not in ref_hdr:
            continue
        tot_hdr += 1
        h = p["header"] or {}
        got = (norm(h.get("right") or ""), norm(h.get("center") or ""), norm(h.get("left") or ""))
        want = ref_hdr[key]
        if got == want:
            ok_hdr += 1
        elif len(hdr_bad) < 6:
            hdr_bad.append({"folio": key, "want": want, "got": got})
    C.add("P4", "PARITY", "כותרות עליונות בעמודי גוף (ימין/מרכז/שמאל)",
          tot_hdr > 0 and ok_hdr == tot_hdr,
          match=f"{ok_hdr}/{tot_hdr}",
          expected={"right": "מקום (מילה ראשונה של שם הספר מהמסמך)",
                    "center": "שם הפרק הנוכחי", "left": "בינה (שאר שם הספר)"},
          mismatches=hdr_bad)

    # ================= PARITY 5: תוכן-עניינים =================
    ref_toc_gen = sum(1 for p in ref["pages"] if p["type"] == "toc-general")
    ref_toc_det = sum(1 for p in ref["pages"] if p["type"] == "toc-detailed")
    ref_gen_entries = sum(1 for p in ref["pages"] if p["type"] == "toc-general"
                          for r in p["lines"] if r["x0"] < 70)
    ref_det_entries = sum(1 for p in ref["pages"] if p["type"] == "toc-detailed"
                          for r in p["lines"] if r["x0"] < 70)
    ot = ours["document"]["toc"]
    C.add("P5", "PARITY", "תוכן-עניינים כפול (כללי + מפורט)",
          ref_toc_gen == sum(1 for p in ours["pages"] if p["type"] == "toc-general")
          and ref_toc_det == sum(1 for p in ours["pages"] if p["type"] == "toc-detailed")
          and abs(ref_gen_entries - ot["generalCount"]) <= 2
          and abs(ref_det_entries - ot["detailedCount"]) <= 2,
          refGeneralPages=ref_toc_gen, oursGeneralPages=sum(1 for p in ours["pages"] if p["type"] == "toc-general"),
          refDetailedPages=ref_toc_det, oursDetailedPages=sum(1 for p in ours["pages"] if p["type"] == "toc-detailed"),
          refGeneralEntries=ref_gen_entries, oursGeneralEntries=ot["generalCount"],
          refDetailedEntries=ref_det_entries, oursDetailedEntries=ot["detailedCount"])

    # ================= PARITY 6: רצף פסקאות =================
    rp, op = ref["document"]["paragraphSeq"], ours["document"]["paragraphSeq"]
    rh = [norm(" ".join((p.get("head") or "").split()[:3])) for p in rp]
    oh = [norm(" ".join((p.get("head") or "").split()[:3])) for p in op]
    sm6 = difflib.SequenceMatcher(None, rh, oh, autojunk=False)
    matched = sum(i2 - i1 for op_, i1, i2, _, _ in sm6.get_opcodes() if op_ == "equal")
    lines_match = words_match = 0
    for op_, i1, i2, j1, j2 in sm6.get_opcodes():
        if op_ == "equal":
            for k in range(i2 - i1):
                if rp[i1 + k]["lines"] == op[j1 + k]["lines"]:
                    lines_match += 1
                if rp[i1 + k]["words"] == op[j1 + k]["words"]:
                    words_match += 1
    C.add("P6", "PARITY", "רצף פסקאות (מספר/שורות/מילים)",
          len(rp) == len(op) and matched == len(rp),
          refCount=len(rp), oursCount=len(op),
          headAligned=matched, linesMatch=lines_match, wordsMatch=words_match,
          refTotalLines=sum(p["lines"] for p in rp), oursTotalLines=sum(p["lines"] for p in op),
          refTotalWords=sum(p["words"] for p in rp), oursTotalWords=sum(p["words"] for p in op),
          firstDiffs=[f"{t}: ref[{rh[i1:i2][:2]}] ours[{oh[j1:j2][:2]}]"
                      for t, i1, i2, j1, j2 in sm6.get_opcodes() if t != "equal"][:6])

    # ================= PARITY 7: שקילות שבירת שורות =================
    def reading_lines(docjson):
        seq = []
        for p in docjson["pages"]:
            by_col = {"right": [], "left": [], "single": []}
            for ln in p["lines"]:
                by_col.setdefault(ln.get("col") or "single", []).append(ln)
            for name in ("right", "left", "single"):
                for ln in sorted(by_col[name], key=lambda l: l["y0"] if "y0" in l else 0):
                    seq.append(norm(ln["text"]))
        return [s for s in seq if s]

    rl = reading_lines(ref)
    ol = [norm(l["text"]) for p in ours["pages"] for c in p["columns"] for l in c["lines"] if norm(l["text"])]
    sm7 = difflib.SequenceMatcher(None, rl, ol, autojunk=False)
    C.add("P7", "PARITY", "שקילות שבירת שורות (טקסט שורה-אחר-שורה)",
          sm7.ratio() >= 0.995,
          ratio=round(sm7.ratio(), 4), refLines=len(rl), oursLines=len(ol),
          firstDivergences=[f"ref: {a[:40]!r} ≠ ours: {b[:40]!r}"
                            for a, b in list(zip(rl, ol))[:200] if a != b][:4])

    # ================= PARITY 8: גיאומטריה =================
    ref_pages = ref["pages"]
    ref_body = [p for p in ref_pages if p["type"] == "body"]
    ref_col_r = Counter()
    ref_col_l = Counter()
    for p in ref_body:
        for c in p["columns"]:
            if c["name"] == "right":
                ref_col_r[(c["x0"], c["x1"])] += 1
            elif c["name"] == "left":
                ref_col_l[(c["x0"], c["x1"])] += 1
    ref_r = ref_col_r.most_common(1)[0][0] if ref_col_r else None
    ref_l = ref_col_l.most_common(1)[0][0] if ref_col_l else None
    ours_r = Counter()
    ours_l = Counter()
    for _, cols in col_boxes_all:
        for c in cols:
            if c["name"] == "right":
                ours_r[(c["x0"], c["x1"])] += 1
            else:
                ours_l[(c["x0"], c["x1"])] += 1
    o_r = ours_r.most_common(1)[0][0] if ours_r else None
    o_l = ours_l.most_common(1)[0][0] if ours_l else None
    C.add("P8a", "PARITY", "תיבות הטורים (pt)",
          ref_r and o_r and abs(ref_r[0] - o_r[0]) <= 3 and abs(ref_r[1] - o_r[1]) <= 3
          and ref_l and o_l and abs(ref_l[0] - o_l[0]) <= 3 and abs(ref_l[1] - o_l[1]) <= 3,
          refRight=ref_r, oursRight=o_r, refLeft=ref_l, oursLeft=o_l,
          refColWidthPx=round((ref_r[1] - ref_r[0]) / PX) if ref_r else None)

    # כותרת עליונה — פס y
    ref_hdr_y = (42.6, 57.6)
    ours_hdr_y = (round(min(y[1] for y in header_ys), 1), round(max(y[2] for y in header_ys), 1)) if header_ys else None
    C.add("P8b", "PARITY", "פס הכותרת העליונה (y)", ours_hdr_y and abs(ours_hdr_y[0] - ref_hdr_y[0]) <= 4,
          ref=ref_hdr_y, ours=ours_hdr_y,
          hint="הכותרת חייבת לשבת בראש העמוד (y≈42-58pt) בכל עמודי התוכן")

    # עמודון — מיקום
    ref_folio = next((p["folio"] for p in ref_pages if p["folio"]), None)
    ours_folios_x = Counter(f["x"] for f in folio_pos)
    o_fx = ours_folios_x.most_common(1)[0][0] if ours_folios_x else None
    C.add("P8c", "PARITY", "מיקום העמודון (מרכז תחתון)",
          o_fx is not None and ref_folio and abs(o_fx - ref_folio["x"]) <= 6
          and folio_pos and abs(Counter(f["y"] for f in folio_pos).most_common(1)[0][0] - ref_folio["y"]) <= 6,
          ref=ref_folio, oursX=o_fx,
          oursY=Counter(f["y"] for f in folio_pos).most_common(1)[0][0] if folio_pos else None)

    # גודל גופן הגוף
    ref_body_size = ("GuttmanRashiNormal", 12.0)
    ours_body = Counter(body_sizes).most_common(1)[0][0] if body_sizes else None
    C.add("P8d", "PARITY", "גופן וגודל גוף הטקסט",
          ours_body is not None and abs(ours_body[1] - ref_body_size[1]) <= 0.5,
          ref=f"{ref_body_size[0]}@{ref_body_size[1]}pt", ours=ours_body)

    # פס שורות (pitch)
    ref_pitch = 16.08  # 12pt × 1.34
    o_pitch = Counter(pitches).most_common(1)[0][0] if pitches else None
    C.add("P8e", "PARITY", "פס שורות (מרווח בסיס-בסיס)",
          o_pitch is not None and abs(o_pitch - ref_pitch) <= 1.2,
          ref=ref_pitch, ours=o_pitch,
          oursMedianAll=sorted(pitches)[len(pitches) // 2] if pitches else None)

    # ================= PARITY 9: פתיחת פרק — כותרת קומפקטית =================
    max_gap = max(title_gaps) if title_gaps else 0
    C.add("P9", "PARITY", "כותרות פתיחה קומפקטיות (בלי מתיחת מילים)",
          max_gap <= 20,
          maxWordGapPt=max_gap,
          hint="במקור כותרת h2 יושבת קומפקטית בטור; מתיחה של מילים על רוחב העמוד = באג יישור")

    # ================= דוח =================
    rep = {
        "meta": {
            "reference": os.path.relpath(ref_path, ROOT),
            "ours": os.path.relpath(ours_path, ROOT),
            "pdf": os.path.relpath(pdf_path, ROOT),
            "verdict": None,
        },
        "summary": C.summary(),
        "checks": C.items,
    }
    hard_fail = any(not c["pass"] for c in C.items if c["layer"] == "HARD")
    par_fail = any(not c["pass"] for c in C.items if c["layer"] == "PARITY")
    code = (1 if hard_fail else 0) | (2 if par_fail else 0)
    rep["meta"]["verdict"] = {0: "PASS", 1: "HARD_FAIL", 2: "PARITY_FAIL", 3: "HARD+PARITY_FAIL"}[code]

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(rep, f, ensure_ascii=False, indent=1)

    # תקציר קריא
    print("═" * 64)
    print("  דוח השוואת עימוד מתמטית — RED מול הגרסה הישנה (הייחוס)")
    print("═" * 64)
    for c in C.items:
        mark = "✓" if c["pass"] else "✗"
        line = f"  {mark} [{c['layer']}] {c['name']}"
        print(line)
        if not c["pass"]:
            for k in ("ref", "ours", "delta", "match", "ratio", "refCount", "oursCount",
                      "overlaps", "violations", "reachPct", "missingWords", "extraWords",
                      "maxWordGapPt", "refTotalLines", "oursTotalLines", "oursFormatBare"):
                if k in c and c[k] is not None:
                    print(f"        {k}: {c[k]}")
            for k in ("firstDiffs", "firstDivergences", "mismatches"):
                if k in c and c[k]:
                    for x in c[k][:3]:
                        print(f"        · {x if isinstance(x, str) else json.dumps(x, ensure_ascii=False)}")
    print("─" * 64)
    s = rep["summary"]
    print(f"  HARD: {s['hard']}  |  PARITY: {s['parity']}  |  ציון: {s['score']}%")
    print(f"  פסק־דין: {rep['meta']['verdict']}")
    print(f"  דוח מלא: {out_path}")
    print("═" * 64)
    sys.exit(code)


if __name__ == "__main__":
    main()
