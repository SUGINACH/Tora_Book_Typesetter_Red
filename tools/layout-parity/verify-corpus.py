#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
verify-corpus.py — אימות אינווריאנטים מוחלטים של העימוד על קורפוס כלשהו.

בקשת המשתמש (04.11): "כל הבדיקות צריכות להיעשות על הקובץ ה'גדול מאוד'"
(audits/very_long_test_text.txt — 3.4MB, 2,571 כותרות, 10 חלקים).

ההבדל מ-compare.py: אין כאן ייחוס של הגרסה הישנה (הייחוס קיים רק ל-no_long).
במקום זה — אינווריאנטים מוחלטים: תכונות שכל עימוד נכון חייב לקיים בפני עצמו,
בלי תלות בפלט של אף גרסה. כל בדיקה כאן ניתנת להוכחה מתמטית מהקוד:

  C1  שימור תוכן — מולטיסט המילים בפלט (גוף+הערות) זהה למקור
      (הערות [..] עוברות למרזב — אותה התמרה בשני הצדדים).
  C2  אפס חפיפות שורות ב-PDF — שורה אחת על גבי רעותה.
  C3  כל הטקסט בתוך גבולות העמוד.
  C4  יישור — שורות גוף מגיעות לשתי שפות הטור (רצפה מכוילת: הגרסה
      הישנה עצמה מגיעה ל-69.1% בייחוס; הרצפה נמוכה בכוונה).
  C5  רצף עמודונים — המונה מתקדם בכל עמוד פרט לשערים הראשיים; גימטריה
      תקנית (טו/טז); נסתר ב-blank/שער-משנה; גלוי בשאר (כמו המקור).
  C6  מכונת מצבים של סוגי עמודים — שערים → תוכן-כללי → [ריק] → שער-משנה
      → תוכן-מפורט → גוף; מספר שערי-המשנה == מספר ה-h1 במקור;
      מספר פתיחות-הפרק == מספר ה-h0.
  C7  שלמות תוכן-העניינים — כמות הערכים לפי רמה תואמת את המקור, כל ערך
      הוא כותרת אמיתית מהמקור, והעמודון בערך מצביע על העמוד שבו הכותרת
      מופיעה בפועל (h1 → שער לא-ממוספר, כמו המקור).
  C8  כותרות עליונות — ימין/שמאל = חצאי שם הספר מהמסמך; מרכז = כותרת
      h0/h2 אמיתית מהמקור (הסעיף הזורם).
  C9  שימור כותרות — כל כותרת h0..h6 מהמקור מופיעה בפלט.
  C10 הערות שוליים — אפס כפילויות בתוך עמוד; סמנים עוקבים מ-א' בכל עמוד
      (כמקור); כל הערה בפלט היא הערת [..] אמיתית מהמקור; כל הערת מקור
      מופיעה בפלט לפחות פעם אחת.
  C11 תקינות PDF — נפתח, מספר עמודים תואם למודל, כל הגופנים מוטמעים.

הדטרמיניזם נבדק בנפרד על ידי run-ours.js --determinism (הרצה כפולה
בתוך אותו תהליך — hash ועמודים זהים).

שימוש:
  python3 verify-corpus.py <source.txt> <model.json> <ours.pdf> [report.json] [--justify-floor 0.6]

קודי יציאה: 0 = הכל עובר | 1 = כשל אינווריאנט.
"""

import json
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")

# **מקור יחיד לחישוב:** פונקציות החילוץ והנרמול מיובאות מ-compare.py
# (אין מימוש כפול — אותן תוצאות בדיוק בבדיקת הקבלה ובבדיקת הקורפוס).
import importlib.util as _ilu
_spec = _ilu.spec_from_file_location("cmp", os.path.join(HERE, "compare.py"))
cmp = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(cmp)
pdf_rows = cmp.pdf_rows
infer_columns = cmp.infer_columns
gematria = cmp.gematria
norm = cmp.norm

# ---------- מבנה הדוח ----------

class Checks:
    def __init__(self):
        self.rows = []

    def add(self, cid, name, ok, **detail):
        self.rows.append({"id": cid, "name": name, "ok": bool(ok), **detail})
        mark = "✓" if ok else "✗"
        print(f"  {mark} [{cid}] {name}")
        if not ok:
            for k in ("sample", "count", "detail"):
                if k in detail and detail[k]:
                    print(f"        {k}: {str(detail[k])[:400]}")

    def failures(self):
        return [r for r in self.rows if not r["ok"]]


# ---------- פרוס המקור (אותו טוקניזר כמו המנוע) ----------

META_KEYS = ("שם הספר", "נושא מפורט", "נושא", "פרטי מהדורא", "שם המחבר",
             "מקום ושנת הוצאה", "שמירת זכויות", "פרטי הוצאה לאור", "פרטי קשר",
             "פרטים נוספים")
H_RE = re.compile(r"^כותרת\s*(\d+)(?:\s+מספר\s+(\d+))?.*?[-–—]\s*(.*)$")


def parse_source(src_text):
    """מחזיר (meta, headings, body_words_counter, book_title).

    הערה: שורות כותרת נבדקות **לפני** מטא-דאטה — כאן הן נדרשות ל-C6..C9
    (ב-compare.py הן מסוננות ממילא משני הצדדים ואינן נספרות כלל).
    **דה-דופ הערות:** הערה המופיעה במקור פעמיים מילולית (נמצאה בקורפוס הגדול:
    הערה אחת של 114 מילים פעמיים) נספרת פעם אחת — כמו בצד הפלט,
    שם הצגה חוזרת של אותה הערה בין עמודים היא התנהגות מקור מתועדת.
    """
    meta = {}
    headings = []
    body_words = Counter()
    seen_note_texts = set()
    for ln in src_text.split("\n"):
        ln = ln.strip()
        if not ln:
            continue
        h = H_RE.match(ln)
        if h:
            headings.append((int(h.group(1)), h.group(3).strip()))
            continue
        key = ln.split(" - ")[0].strip()
        if key in META_KEYS:
            if " - " in ln:
                meta[key] = ln.split(" - ", 1)[1].strip()
            continue
        # הערות [..] ← הטקסט עובר למרזב (נספר שם — אותה התמרה כמו H1 ב-compare.py)
        def repl(m):
            t = norm(m.group(1))
            if t and t not in seen_note_texts:
                seen_note_texts.add(t)
                body_words.update(t.split())
            return ""
        ln2 = re.sub(r"\[([^\]]*)\]", repl, ln)
        body_words.update(norm(ln2).split())
    book_title = meta.get("שם הספר", "")
    return meta, headings, body_words, book_title


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    justify_floor = 0.6
    for a in sys.argv[1:]:
        if a.startswith("--justify-floor="):
            justify_floor = float(a.split("=", 1)[1])
    src_path = args[0] if len(args) > 0 else os.path.join(ROOT, "audits/very_long_test_text.txt")
    model_path = args[1] if len(args) > 1 else os.path.join(ROOT, "audits/very-long-artifacts/ours-model.json")
    pdf_path = args[2] if len(args) > 2 else os.path.join(ROOT, "audits/very-long-artifacts/ours.pdf")
    out_path = args[3] if len(args) > 3 else os.path.join(os.path.dirname(model_path), "corpus-report.json")

    src_text = open(src_path, encoding="utf-8").read()
    model = json.load(open(model_path, encoding="utf-8"))
    meta, headings, src_words, book_title = parse_source(src_text)
    pages = model["pages"]

    print("═" * 66)
    print("  אימות אינווריאנטים מוחלטים — קורפוס: " + os.path.basename(src_path))
    print(f"  עמודים: {len(pages)} | כותרות במקור: {len(headings)} | "
          f"מילים בגוף המקור: {sum(src_words.values())}")
    print("═" * 66)

    C = Checks()

    # ============ C1: שימור תוכן ============
    ours_words = Counter()
    seen_fn_texts = set()
    for p in pages:
        fns = p.get("footnotes")
        if fns is not None:
            # מבנה מיוצא (run-ours.js): הערה = {marker, text} — הערה שחוזרת
            # בין עמודים (התנהגות מקור) נספרת פעם אחת לפי טקסט מלא
            for f in fns:
                key = norm(f.get("text") or "")
                if key and key not in seen_fn_texts:
                    seen_fn_texts.add(key)
                    ours_words.update(key.split())
        for ln in p.get("lines", []):
            if ln.get("kind") == "body":
                ours_words.update(norm(ln.get("textNoMarkers", ln["text"])).split())
            elif ln.get("kind") == "footnote" and fns is None:
                # מודל ישן בלי מבנה — נפילה לאיחוי לפי שורה
                key = norm(ln.get("textNoMarkers", ln["text"]))
                if key not in seen_fn_texts:
                    seen_fn_texts.add(key)
                    ours_words.update(key.split())
    missing = src_words - ours_words
    extra = ours_words - src_words
    C.add("C1", "שימור תוכן — מולטיסט מילים (גוף+מרזב) זהה למקור",
          not missing and not extra,
          srcTotal=sum(src_words.values()), oursTotal=sum(ours_words.values()),
          missingWords=sum(missing.values()), missingSample=list(missing)[:8],
          extraWords=sum(extra.values()), extraSample=list(extra)[:8])

    # ============ C2-C4, C11: אינווריאנטים גיאומטריים ב-PDF ============
    doc = fitz.open(pdf_path)
    overlaps, oob = [], []
    justify_ratios = []
    fonts_not_embedded = set()
    for pno in range(doc.page_count):
        page = doc[pno]
        rows = pdf_rows(page)
        content = [r for r in rows if 60 < r["y0"] < 780]
        W, H = page.rect.width, page.rect.height
        for r in rows:
            if r["x0"] < -1 or r["y0"] < -1 or r["x1"] > W + 1 or r["y1"] > H + 1:
                oob.append({"page": pno, "text": r["text"][:30],
                            "bbox": [round(r["x0"], 1), round(r["y0"], 1), round(r["x1"], 1), round(r["y1"], 1)]})
        cols = infer_columns(rows)
        if len(cols) == 2:
            for c in cols:
                crows = sorted([r for r in content
                                if r["x0"] >= c["x0"] - 6 and r["x1"] <= c["x1"] + 6],
                               key=lambda r: (r["y0"], r["x0"]))
                vlines = []
                for r in crows:
                    if vlines and abs(r["y0"] - vlines[-1]["y0"]) <= 7:
                        v = vlines[-1]
                        v["x0"] = min(v["x0"], r["x0"]); v["x1"] = max(v["x1"], r["x1"])
                        v["y1"] = max(v["y1"], r["y1"])
                        v["text"] += " " + r["text"]
                    else:
                        vlines.append(dict(r))
                for i in range(1, len(vlines)):
                    ov = vlines[i - 1]["y1"] - vlines[i]["y0"]
                    if ov > 1.5:
                        overlaps.append({"page": pno, "col": c["name"], "px": round(ov, 1),
                                         "a": vlines[i - 1]["text"][:20], "b": vlines[i]["text"][:20]})
                width = c["x1"] - c["x0"]
                nreach = sum(1 for v in vlines if abs((v["x1"] - v["x0"]) - width) < 5)
                if vlines:
                    justify_ratios.append(nreach / len(vlines))
        for f in page.get_fonts(full=True):
            # f: (xref, ext, type, basefont, name, encoding, referencer)
            if f and len(f) > 2 and f[2] == "n/a":
                fonts_not_embedded.add(f[3] if len(f) > 3 else str(f))
    mean_just = sum(justify_ratios) / len(justify_ratios) if justify_ratios else 0.0
    C.add("C2", "אפס חפיפות שורות ב-PDF", not overlaps,
          count=len(overlaps), sample=overlaps[:5])
    C.add("C3", "כל הטקסט בתוך גבולות העמוד", not oob,
          count=len(oob), sample=oob[:5])
    C.add("C4", f"יישור — שיעור הגעה לשתי שפות הטור (רצפה {justify_floor:.0%}, כמקור ~69%)",
          mean_just >= justify_floor,
          meanRatio=round(mean_just, 4), columns=len(justify_ratios))

    # ============ C11: תקינות PDF ============
    C.add("C11", "PDF תקין — מספר עמודים תואם למודל וגופנים מוטמעים",
          doc.page_count == len(pages) and not fonts_not_embedded,
          pdfPages=doc.page_count, modelPages=len(pages),
          fontsNotEmbedded=sorted(fonts_not_embedded)[:5])

    # ============ C5: רצף עמודונים ============
    # המונה מתקדם בכל עמוד פרט לשערים הראשיים; גלוי ב-toc/chapter-open/body;
    # נסתר ב-blank/shaar-sub (הוכח מהייחוס: ריק ושער-משנה צורכים מספר נסתר).
    HIDDEN = {"blank", "shaar-sub"}
    counter = 0
    folio_breaks = []
    for p in pages:
        if p["type"] in ("shaar-main", "shaar-back"):
            if p["folio"]["numbered"]:
                folio_breaks.append({"page": p["index"], "why": "שער ראשי ממוספר"})
            continue
        counter += 1
        if p["type"] in HIDDEN:
            if p["folio"]["numbered"]:
                folio_breaks.append({"page": p["index"], "why": f"{p['type']} צריך להיות נסתר"})
        else:
            if not p["folio"]["numbered"]:
                folio_breaks.append({"page": p["index"], "why": f"{p['type']} לא ממוספר"})
            elif gematria(p["folio"]["text"]) != counter:
                folio_breaks.append({"page": p["index"], "why": f"קיבלנו {p['folio']['text']} צפוי {counter}"})
    C.add("C5", "רצף עמודונים — מונה עוקב, גימטריה תקנית, נסתר בשער-משנה/ריק",
          not folio_breaks, count=len(folio_breaks), sample=folio_breaks[:5],
          detail=f"אחרון: {pages[-1]['folio']['text']} (מונה {counter})")

    # ============ C6: מכונת מצבים של סוגי עמודים ============
    seq = [p["type"] for p in pages]
    h1_count = sum(1 for lvl, _ in headings if lvl == 1)
    h0_count = sum(1 for lvl, _ in headings if lvl == 0)
    problems = []
    if seq and seq[0] != "shaar-main":
        problems.append(f"ראשון {seq[0]} במקום shaar-main")
    if "shaar-back" in seq and seq.index("shaar-back") != 1:
        problems.append("shaar-back אינו שני")
    body_first = next((i for i, t in enumerate(seq) if t in ("body", "chapter-open")), None)
    # toc-general רציף לפני, toc-detailed רציף אחרי שער-המשנה הראשון
    tg = [i for i, t in enumerate(seq) if t == "toc-general"]
    td = [i for i, t in enumerate(seq) if t == "toc-detailed"]
    ss = [i for i, t in enumerate(seq) if t == "shaar-sub"]
    bl = [i for i, t in enumerate(seq) if t == "blank"]
    if tg and tg != list(range(tg[0], tg[0] + len(tg))):
        problems.append("toc-general אינו רציף")
    if td and td != list(range(td[0], td[0] + len(td))):
        problems.append("toc-detailed אינו רציף")
    if td and ss and td[0] != ss[0] + 1:
        problems.append(f"toc-detailed (p{td[0]}) אינו מיד אחרי שער-המשנה הראשון (p{ss[0]})")
    if bl and len(bl) > 1:
        problems.append(f"{len(bl)} עמודים ריקים (מותר אחד)")
    if ss and len(ss) != h1_count:
        problems.append(f"שערי-משנה {len(ss)} ≠ כותרות h1 במקור {h1_count}")
    co = [i for i, t in enumerate(seq) if t == "chapter-open"]
    if len(co) != h0_count:
        problems.append(f"פתיחות-פרק {len(co)} ≠ כותרות h0 במקור {h0_count}")
    # אחרי בלוק ה-toc-detailed: רק shaar-sub/chapter-open/body
    if td:
        after = set(seq[td[-1] + 1:]) - {"shaar-sub", "chapter-open", "body"}
        if after:
            problems.append(f"סוגים זרים אחרי ה-TOC: {sorted(after)}")
    elif body_first is not None and tg:
        after = set(seq[tg[-1] + 1:]) - {"shaar-sub", "chapter-open", "body", "blank"}
        if after:
            problems.append(f"סוגים זרים אחרי ה-TOC: {sorted(after)}")
    C.add("C6", "מכונת מצבים — סדר סוגי עמודים חוקי ותואם למבנה המקור",
          not problems, count=len(problems), sample=problems[:5],
          detail=f"shaar-sub={len(ss)} (h1={h1_count}), chapter-open={len(co)} (h0={h0_count})")

    # ============ C7: שלמות תוכן-העניינים ============
    # מפתח: טקסט כותרת מנורמל → ערכת עמודים שבהם היא מופיעה כשורת כותרת/שער
    heading_pages = defaultdict(set)
    for i, p in enumerate(pages):
        for l in p.get("lines", []):
            if l.get("kind") in ("heading-band", "heading-inline", "gate"):
                heading_pages[norm(l["text"])].add(i)
    toc_bad = []
    checked = 0
    gtoc_lvls = {1, 2, 3, 4, 5, 6}
    dtoc_lvls = {2, 3, 4, 5, 6}
    src_general = [norm(t) for lvl, t in headings if lvl in gtoc_lvls]
    src_detailed = [norm(t) for lvl, t in headings if lvl in dtoc_lvls]
    got_general, got_detailed = [], []
    for p in pages:
        if p["type"] == "toc-general":
            got_general += [norm(e["text"]) for e in (p.get("tocEntries") or [])]
        elif p["type"] == "toc-detailed":
            got_detailed += [norm(e["text"]) for e in (p.get("tocEntries") or [])]
    if got_general != src_general:
        toc_bad.append({"why": "רצף ערכי TOC כללי שונה מהמקור",
                        "src": len(src_general), "got": len(got_general)})
    if got_detailed != src_detailed:
        toc_bad.append({"why": "רצף ערכי TOC מפורט שונה מהמקור",
                        "src": len(src_detailed), "got": len(got_detailed)})
    for p in pages:
        if "toc" not in p["type"]:
            continue
        for e in (p.get("tocEntries") or []):
            checked += 1
            lvl = e.get("level")
            label = e.get("pageLabel") or ""
            if lvl == 1:
                # h1 → שער-משנה לא-ממוספר — גם במקור אין מספר (הוכח מהייחוס)
                if label:
                    toc_bad.append({"why": "לערך h1 יש עמודון (השער נסתר)", "text": e["text"][:30]})
                continue
            if not label:
                toc_bad.append({"why": "ערך ללא עמודון", "text": e["text"][:30]})
                continue
            want = gematria(label)
            cands = heading_pages.get(norm(e["text"]), set())
            if not any(pages[ci]["folio"]["numbered"] and gematria(pages[ci]["folio"]["text"]) == want
                       for ci in cands):
                toc_bad.append({"why": "העמודון אינו מצביע על העמוד שבו הכותרת מופיעה",
                                "text": e["text"][:30], "label": label,
                                "candidatePages": sorted(cands)[:3]})
    C.add("C7", "תוכן-עניינים — ערכים תואמים למקור ועמודונים מצביעים נכון",
          not toc_bad, checked=checked, count=len(toc_bad), sample=toc_bad[:5],
          detail=f"כללי {len(got_general)}/{len(src_general)}, מפורט {len(got_detailed)}/{len(src_detailed)}")

    # ============ C8: כותרות עליונות ============
    tw = book_title.split()
    mid = (len(tw) + 1) // 2
    want_r, want_l = " ".join(tw[:mid]), " ".join(tw[mid:])
    section_names = {norm(t) for lvl, t in headings if lvl in (0, 2)}
    toc_titles = {norm("תוכן עניינים כללי"), norm("תוכן עניינים מפורט")}
    hdr_bad = []
    for i, p in enumerate(pages):
        h = p.get("header") or {}
        if p["type"] in ("toc-general", "toc-detailed"):
            # במקור מרכז עמודי ה-TOC הוא כותרת ה-TOC עצמה
            if norm(h.get("center") or "") not in toc_titles:
                hdr_bad.append({"page": i, "why": "מרכז ה-TOC אינו כותרת ה-TOC",
                                "got": (h.get("center") or "")[:40]})
            continue
        if p["type"] not in ("body", "chapter-open"):
            continue
        if (h.get("right") or "").strip() != want_r or (h.get("left") or "").strip() != want_l:
            hdr_bad.append({"page": i, "why": "ימין/שמאל אינם חצאי שם הספר",
                            "got": [h.get("right"), h.get("left")]})
        c = norm(h.get("center") or "")
        if not c:
            hdr_bad.append({"page": i, "why": "מרכז ריק"})
        elif c not in section_names:
            hdr_bad.append({"page": i, "why": "המרכז אינו כותרת h0/h2 מהמקור",
                            "got": (h.get("center") or "")[:40]})
    C.add("C8", "כותרות עליונות — חצאי שם הספר בצדדים, סעיף h0/h2 אמיתי במרכז",
          not hdr_bad, count=len(hdr_bad), sample=hdr_bad[:5],
          detail=f"שם הספר: \"{want_r} | {want_l}\"")

    # ============ C9: שימור כותרות ============
    out_heading_texts = set()
    for p in pages:
        for l in p.get("lines", []):
            if l.get("kind") in ("heading-band", "heading-inline", "gate", "toc-row"):
                t = norm(l["text"])
                out_heading_texts.add(t)
                out_heading_texts.add(norm(" ".join(reversed(str(l["text"]).split()))))
    missing_h = [f"h{lvl}: {t[:36]}" for lvl, t in headings
                 if lvl <= 6 and norm(t) not in out_heading_texts]
    C.add("C9", "שימור כותרות — כל כותרת h0..h6 מהמקור מופיעה בפלט",
          not missing_h, srcHeadings=sum(1 for lvl, _ in headings if lvl <= 6),
          count=len(missing_h), sample=missing_h[:6])

    # ============ C10: הערות שוליים ============
    fn_bad = []
    seen_out_notes = set()
    pages_with_notes = 0
    for p in pages:
        fns = p.get("footnotes") or []
        if not fns:
            continue
        pages_with_notes += 1
        texts = [norm(f.get("text") or "") for f in fns]
        # אפס כפילויות בתוך העמוד
        dup = [t[:30] for t, c in Counter(texts).items() if c > 1]
        if dup:
            fn_bad.append({"page": p["index"], "why": "הערה כפולה באותו עמוד", "sample": dup[:3]})
        # סמנים עוקבים מ-א' (מספור עמודי — הוכח מהייחוס)
        for i, f in enumerate(fns):
            if gematria((f.get("marker") or "").rstrip(".")) != i + 1:
                fn_bad.append({"page": p["index"], "why": "סמנים אינם עוקבים מ-א'",
                               "got": [x.get("marker") for x in fns[:6]]})
                break
        for t in texts:
            seen_out_notes.add(t)
    src_note_set = set()
    for m in re.finditer(r"\[([^\]]*)\]", src_text):
        t = norm(m.group(1))
        if t:
            src_note_set.add(t)
    invented = [t[:30] for t in seen_out_notes if t not in src_note_set]
    if invented:
        fn_bad.append({"why": "הערות בפלט שאינן קיימות במקור", "sample": invented[:4]})
    missing_notes = [t[:30] for t in src_note_set if t not in seen_out_notes]
    if missing_notes:
        fn_bad.append({"why": "הערות מקור שאינן מופיעות בפלט", "sample": missing_notes[:4]})
    C.add("C10", "הערות שוליים — בלי כפילויות בעמוד, סמנים עוקבים, מקוריות ושלמות",
          not fn_bad, pagesWithNotes=pages_with_notes, srcNotes=len(src_note_set),
          count=len(fn_bad), sample=fn_bad[:5])

    # ============ סיכום ============
    total = len(C.rows)
    passed = total - len(C.failures())
    score = round(100 * passed / total, 1)
    print("─" * 66)
    print(f"  עוברות: {passed}/{total}  |  ציון קורפוס: {score}%")
    report = {
        "corpus": os.path.relpath(src_path, ROOT),
        "model": os.path.relpath(model_path, ROOT),
        "pdf": os.path.relpath(pdf_path, ROOT),
        "meta": model.get("meta", {}),
        "pages": len(pages),
        "paragraphs": len(model.get("document", {}).get("paragraphSeq", [])),
        "sourceHeadings": len(headings),
        "sourceWords": sum(src_words.values()),
        "justifyMeanRatio": round(mean_just, 4),
        "checks": C.rows,
        "passed": passed, "total": total, "score": score,
        "verdict": "PASS" if not C.failures() else "FAIL",
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"  דוח מלא: {out_path}")
    print("═" * 66)
    sys.exit(0 if not C.failures() else 1)


if __name__ == "__main__":
    main()
