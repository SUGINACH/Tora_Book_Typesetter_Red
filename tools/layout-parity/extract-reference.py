#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tools/layout-parity/extract-reference.py — חילוץ הייחוס הגיאומטי המוחלט.

מקור: קובצי ה-PDF של הגרסה הישנה (הצהובה) שהועלו ל-audits:
  * "דוגמא מגרסא ישנה.pdf"                          — שכבת הטקסט הנקייה (גיאומטריה אמיתית)
  * "דוגמא מגרסא ישנה - כולל סימון בלוקים פיסקאות שורות.pdf" — תגיות מבנה בלתי־נראות
    (טקסט לבן ב-Consolas/TimesNewRomanPSMT: page / body-flow / block-2col /
     col:right|left | p-end|p-cut Nl Mw "ראשי פסקה" / h2-title / h2-siman ...)

הפלט: audits/layout-reference.json — ייצוג מתמטי מלא של העימוד המקורי:
  * לכל עמוד: סוג, עמודון (מספר עמוד בגימטריה + מיקום), שלושת סלוטי הכותרת העליונה
    (טקסט + מיקום), תיבות הטורים, כל שורות הטקסט (bbox + גופן + גודל + יישור),
    והפסקאות מהתגיות (end/cut + מספר שורות + מספר מילים + מילים ראשונות).
  * ברמת המסמך: רצף סוגי העמודים, רצף העמודונים, ורצף הפסקאות המלא
    (איחוי חתכים בין עמודים/טורים לפי סדר הקריאה ימין→שמאל).

החילוץ דטרמיניסטי לחלוטין — אותו קלט תמיד ייתן אותו JSON (ברירת מחדל ל-committed).
"""
import fitz
import json
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
AUD = os.path.join(ROOT, "audits")

PLAIN = os.path.join(AUD, "דוגמא מגרסא ישנה.pdf")
MARKED = os.path.join(AUD, "דוגמא מגרסא ישנה - כולל סימון בלוקים פיסקאות שורות.pdf")
OUT = os.path.join(AUD, "layout-reference.json")

LABEL_FONTS = {"Consolas", "TimesNewRomanPSMT"}
LABEL_COLOR = 0xFFFFFF
PX = 0.75  # 1px(96dpi) = 0.75pt — יחידות המקור של התוכנה הישנה


def span_rows(page, labels=False):
    """שורות תוכן מקוריות של PyMuPDF (אובייקט line אחד = שורה ויזואלית).

    הקיבוע המקורי של PyPDF מפריד כבר שורות טור מהערות שוליים ומשורות הטור
    השני — בדוק מול הייחוס. הטקסט נבנה בסדר לוגי RTL (spans לפי x1 יורד).
    """
    rows = []
    d = page.get_text("dict")
    for block in d["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            spans = [s for s in line["spans"] if s["text"].strip()]
            if not spans:
                continue
            is_label = all(s["font"] in LABEL_FONTS and s["color"] == LABEL_COLOR for s in spans)
            if labels != is_label:
                continue
            x0 = min(s["bbox"][0] for s in spans)
            y0 = min(s["bbox"][1] for s in spans)
            x1 = max(s["bbox"][2] for s in spans)
            y1 = max(s["bbox"][3] for s in spans)
            if labels:
                ordered = sorted(spans, key=lambda s: s["bbox"][0])  # תגיות: קידומת LTR
            else:
                ordered = sorted(spans, key=lambda s: -s["bbox"][2])  # RTL: ימין → שמאל
            text = " ".join(s["text"].strip() for s in ordered if s["text"].strip())
            rows.append({
                "y0": round(y0, 2), "y1": round(y1, 2),
                "x0": round(x0, 2), "x1": round(x1, 2),
                "font": spans[0]["font"].split("+")[-1], "size": round(spans[0]["size"], 2),
                "text": text,
            })
    rows.sort(key=lambda r: (r["y0"], r["x0"]))
    return rows


def raw_label_spans(page):
    """כל ה-spans של תגיות (לבנות) עם מיקום — ללא איחוי שורות.

    תגית אחת = span אחד ב-Consolas ('p-end 13l 85w "', 'col:left 269×336 | ...',
    'body-flow 680×810', ...). המשך עברי (ראש הפסקה בתוך הגרשיים) מגיע כ-spans
    נפרדים ב-TimesNewRomanPSMT המתחילים בדיוק בקצה הימני של span התגית, בסדר
    ויזואלי הפוך (ימני ביותר = מילה ראשונה).
    """
    out = []
    d = page.get_text("dict")
    for block in d["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            for s in line["spans"]:
                if s["font"] in LABEL_FONTS and s["color"] == LABEL_COLOR and s["text"].strip():
                    x0, y0, x1, y1 = s["bbox"]
                    out.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1,
                                "font": s["font"].split("+")[-1], "text": s["text"]})
    return out


P_RE = re.compile(r"^p-(end|cut)\s+(\d+)l\s+(\d+)w")
DIM_RE = re.compile(r"(\d+)\s*[×x]\s*(\d+)")
KNOWN_KINDS = {"page", "page-number", "wrapper", "header", "body-flow", "block-2col",
               "block-h3-span", "block-single-col", "margin-col", "side-note",
               "h2-title", "h2-siman", "h2-spacer", "h3-title", "h4", "h5", "h6",
               "h7", "fn-num", "note-marker", "other", "col:right", "col:left"}


def same_band(a, b):
    """חפיפת-y של ≥50% מהגובה הקטן."""
    h = min(a["y1"], b["y1"]) - max(a["y0"], b["y0"])
    minh = min(a["y1"] - a["y0"], b["y1"] - b["y0"])
    return minh > 0 and h >= 0.5 * minh


def parse_labels(page):
    """מפרק תגיות מבנה מה-spans הלבנים של עמוד (מהגרסה המסומנת).

    עוגני Consolas באותו פס-y ממוינים לפי x; המשך עברי של עוגן = ה-spans
    שבין קצהו הימני לבין העוגן הבא מימינו (חלון) — מונד גניבת המשכים בין
    שני עוגני p-end של שני הטורים באותו פס.
    """
    spans = raw_label_spans(page)
    anchors = [s for s in spans if s["font"] == "Consolas"]
    labels = []
    for a in anchors:
        t = a["text"].strip()
        m = P_RE.match(t)
        first = t.split()[0] if t.split() else ""
        if not m and first not in KNOWN_KINDS and not t.rstrip('"').strip().isdigit() and t != '"':
            continue  # מספר רוחב שורה / גרשיים — לא תגית מבנה
        head = None
        if m or t.rstrip().endswith('"'):
            # גבול ימני: העוגן הבא מסוג "תיבה" באותו פס (עוגנים תפורים כמו
            # note-marker יושבים בתוך הטקסט עצמו ואינם גבול)
            def boxkind(s2):
                t2 = s2["text"].strip()
                m2 = P_RE.match(t2)
                if m2:
                    return "p-" + m2.group(1)
                w = t2.split()[0] if t2.split() else ""
                return w
            # גבול = רק תגית תיבה מוכרת (p-end/col:*/body-flow/...). סוגריים
            # וגרשיים תפורים בתוך הציטוט ('( ', '"') ומספרי רוחב אינם גבול.
            nxt = min([s["x0"] for s in anchors
                       if s is not a and same_band(a, s) and s["x0"] > a["x0"]
                       and (boxkind(s) in KNOWN_KINDS)], default=1e9)
            cont = [s for s in spans
                    if s["font"] != "Consolas" and same_band(a, s)
                    and s["x0"] >= a["x1"] - 1.5 and s["x1"] <= nxt + 1.5]
            cont.sort(key=lambda s: -s["x1"])  # RTL לוגי
            head = " ".join(s["text"].strip() for s in cont if s["text"].strip()) or None
        kind = ("p-" + m.group(1)) if m else first
        if kind not in KNOWN_KINDS and not m:
            continue
        dim = DIM_RE.search(t)
        labels.append({
            "kind": kind, "y": round(a["y0"], 2), "x": round(a["x0"], 2),
            "lines": int(m.group(2)) if m else None,
            "words": int(m.group(3)) if m else None,
            "head": head,
            "w": int(dim.group(1)) if dim else None,
            "h": int(dim.group(2)) if dim else None,
            "text": (t + (" " + head if head else ""))[:140],
        })
    return labels


def cluster(values, tol):
    """מקבץ ערכים מספריים לאשכולות (מחזיר רשימת ממוצעי אשכול ממוינת)."""
    if not values:
        return []
    vs = sorted(values)
    clusters, cur = [], [vs[0]]
    for v in vs[1:]:
        if v - cur[-1] <= tol:
            cur.append(v)
        else:
            clusters.append(cur); cur = [v]
    clusters.append(cur)
    return [round(sum(c) / len(c), 2) for c in clusters]


def weighted_clusters(values, tol):
    """אשכולות ערכים עם משקל (גודל אשכול) — (מרכז, ספירה)."""
    if not values:
        return []
    vs = sorted(values)
    clusters, cur = [], [vs[0]]
    for v in vs[1:]:
        if v - cur[-1] <= tol:
            cur.append(v)
        else:
            clusters.append(cur); cur = [v]
    clusters.append(cur)
    return [(round(sum(c) / len(c), 2), len(c)) for c in clusters]


def pair_support(rows, x0v, edge):
    """מספר השורות הנמתחות בדיוק בין שתי שפות (±6pt) — תמיכת זוג השפות."""
    return sum(1 for r in rows if abs(r["x0"] - x0v) <= 6 and abs(r["x1"] - edge) <= 6)


def page_columns(content, labels):
    """מסיק את תיבות הטורים משורות התוכן (עמודי גוף/TOC).

    טור = זוג שפות (x0, x1) ששורות רבות נמתחות ביניהן בדיוק (שורות מיושרות).
    רוחב טור תקין: 140–260pt. שורות שוליים קצרות לעולם לא יזווגו — תמיכתן 0.
    """
    rows = [r for r in content if 60 < r["y0"] < 780]
    if not rows:
        return []
    if len(rows) < 3:
        return [{"name": "single", "x0": round(min(r["x0"] for r in rows), 2),
                 "x1": round(max(r["x1"] for r in rows), 2)}]
    minc = max(3, int(0.12 * len(rows)))
    x1c = [c for c in weighted_clusters([r["x1"] for r in rows], 6) if c[1] >= minc]
    x0c = [c for c in weighted_clusters([r["x0"] for r in rows], 8) if c[1] >= minc]
    cols = []
    used = set()
    for edge, _ in sorted(x1c, key=lambda c: -c[0]):
        cands = [(pair_support(rows, x0v, edge), x0v)
                 for x0v, _ in x0c if x0v not in used and edge - 260 <= x0v <= edge - 140]
        if cands:
            sup, x0v = max(cands)
            if sup >= 3:
                cols.append({"name": None, "x0": round(x0v, 2), "x1": round(edge, 2)})
                used.add(x0v)
        if len(cols) == 2:
            break
    if len(cols) == 2:
        cols.sort(key=lambda c: -c["x0"])  # RTL: הימני קודם
        cols[0]["name"], cols[1]["name"] = "right", "left"
        return cols
    return [{"name": "single", "x0": round(min(r["x0"] for r in rows), 2),
             "x1": round(max(r["x1"] for r in rows), 2)}]


def classify(pno, content, labels, folio, header):
    """מסווג את סוג העמוד לפי סימנים נצפים בלבד (ללא הקשחת אינדקסים)."""
    rows = [r for r in content if 60 < r["y0"] < 780]
    has_header = bool(header and any(s and s["text"] for s in header.values()))
    c = (header or {}).get("center") or {}
    center_txt = c.get("text", "")
    max_size = max((r["size"] for r in rows), default=0)
    if not rows and not has_header:
        return "blank"
    if "תוכן" in center_txt and "מפורט" in center_txt:
        return "toc-detailed"
    if "תוכן" in center_txt:
        return "toc-general"
    if not has_header and not folio:
        if any("זכויות" in r["text"] for r in rows):
            return "shaar-back"
        if max_size >= 30:
            return "shaar-main" if pno == 0 else "shaar-sub"
        return "gate"
    kinds = {l["kind"] for l in labels}
    if "block-single-col" in kinds and len(rows) < 30:
        return "chapter-open"
    if "h2-siman" in kinds and len(rows) < 12:
        return "sign-open"
    return "body"


def main():
    plain = fitz.open(PLAIN)
    marked = fitz.open(MARKED)
    n = plain.page_count
    p0 = plain[0]
    doc = {
        "meta": {
            "source": "reference-old-yellow",
            "generator": "tools/layout-parity/extract-reference.py",
            "text": "audits/no_long_test_text.txt",
            "pages": n,
            "pageW": round(p0.rect.width, 2),
            "pageH": round(p0.rect.height, 2),
            "pxToPt": PX,
        },
        "pages": [],
    }

    para_seq = []   # רצף הפסקאות ברמת המסמך (איחוי חתכים)
    open_para = None  # {"lines":..,"words":..,"head":..} בבנייה

    for i in range(n):
        content = span_rows(plain[i], labels=False)
        labels = parse_labels(marked[i])

        # עמודון (folio): שורת תוכן בתחתית
        folio = None
        for r in content:
            if r["y0"] > 780:
                folio = {"text": r["text"].strip(), "x": round((r["x0"] + r["x1"]) / 2, 2),
                         "y": round(r["y0"], 2)}
                break

        # כותרת עליונה: שלושה סלוטים לפי רוחב (ימין/מרכז/שמאל) — איחוי כל
        # השורות של אותו סלוט (הסלוט המרכזי מגיע כשורות נפרדות)
        header = {"right": None, "center": None, "left": None}
        hdr_rows = [r for r in content if r["y1"] < 62]
        for slot in ("right", "center", "left"):
            if slot == "right":
                sel = [r for r in hdr_rows if (r["x0"] + r["x1"]) / 2 > 400]
            elif slot == "left":
                sel = [r for r in hdr_rows if (r["x0"] + r["x1"]) / 2 < 200]
            else:
                sel = [r for r in hdr_rows if 200 <= (r["x0"] + r["x1"]) / 2 <= 400]
            if sel:
                sel_sorted = sorted(sel, key=lambda r: -r["x1"])  # RTL
                header[slot] = {
                    "text": " ".join(r["text"] for r in sel_sorted),
                    "x0": min(r["x0"] for r in sel), "x1": max(r["x1"] for r in sel),
                    "y0": min(r["y0"] for r in sel), "y1": max(r["y1"] for r in sel),
                }

        cols = page_columns(content, labels)
        ptype = classify(i, content, labels, folio, header)

        # שורות תוכן עם שיוך טור + יישור
        body_rows = [r for r in content if 60 < r["y0"] < 780]
        col_w = None
        if cols:
            widths = [c["x1"] - c["x0"] for c in cols if c["x0"] is not None]
            col_w = max(widths) if widths else None
        lines = []
        for r in body_rows:
            col = None
            for ci, c in enumerate(cols):
                if c["x0"] is not None and r["x0"] >= c["x0"] - 6 and r["x1"] <= c["x1"] + 6:
                    col = c["name"]
                    break
            justified = bool(col_w and col and abs((r["x1"] - r["x0"]) - col_w) < 4)
            lines.append({
                "col": col, "text": r["text"], "font": r["font"], "size": r["size"],
                "x0": r["x0"], "x1": r["x1"], "y0": r["y0"], "y1": r["y1"],
                "justified": justified, "widthPx": round((r["x1"] - r["x0"]) / PX, 1),
            })

        # פסקאות מהתגיות בסדר קריאה: טור ימני (ממוין y) ואז טור שמאלי
        paras = []
        if cols:
            order_cols = [c["name"] for c in cols]
            for name in (["right", "left"] if len(cols) > 1 else ["single"]):
                col = next((c for c in cols if c["name"] == name), None)
                if not col or col["x0"] is None:
                    continue
                col_labels = [l for l in labels
                              if l["kind"] in ("p-end", "p-cut") and abs(l["x"] - col["x0"]) <= 8]
                col_labels.sort(key=lambda l: l["y"])
                for l in col_labels:
                    paras.append({"col": name, "end": l["kind"] == "p-end",
                                  "lines": l["lines"], "words": l["words"], "head": l["head"]})
                    # איחוי לרצף מסמך
                    if open_para is None:
                        open_para = {"lines": l["lines"] or 0, "words": l["words"] or 0,
                                     "head": l["head"], "pages": [i]}
                    else:
                        open_para["lines"] += l["lines"] or 0
                        open_para["words"] += l["words"] or 0
                        open_para["pages"].append(i)
                    if l["kind"] == "p-end":
                        para_seq.append(open_para); open_para = None
        if open_para is not None:
            # מסמך נגמר בפסקה פתוחה (חתוכה) — סוגרים בסוף
            para_seq.append(open_para); open_para = None

        doc["pages"].append({
            "index": i, "type": ptype,
            "folio": folio, "header": header,
            "columns": [{"name": c["name"], "x0": c["x0"], "x1": c["x1"]} for c in cols],
            "lines": lines,
            "paragraphs": paras,
            "labels": [{"kind": l["kind"], "w": l["w"], "h": l["h"]} for l in labels
                       if l["kind"] not in ("p-end", "p-cut")],
        })

    # סינון שורות שלא בטור (הערות שוליים וכו') לסטטיסטיקת גוף
    doc["document"] = {
        "typeSeq": [p["type"] for p in doc["pages"]],
        "folioSeq": [{"page": p["index"], "text": p["folio"]["text"]} for p in doc["pages"] if p["folio"]],
        "paragraphSeq": para_seq,
    }

    # ---- אימותים פנימיים (חוזק החילוץ) ----
    types = Counter(doc["document"]["typeSeq"])
    stats = {
        "pages": n,
        "types": dict(types),
        "paragraphs": len(para_seq),
        "paragraphLines": sum(p["lines"] for p in para_seq),
        "paragraphWords": sum(p["words"] for p in para_seq),
        "headsNonEmpty": sum(1 for p in para_seq if p["head"]),
    }
    print("=== אימות חילוץ ===")
    print(json.dumps(stats, ensure_ascii=False, indent=2))

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\nנכתב: {OUT} ({os.path.getsize(OUT) / 1024:.0f} KB)")
    plain.close(); marked.close()


if __name__ == "__main__":
    sys.exit(main())
