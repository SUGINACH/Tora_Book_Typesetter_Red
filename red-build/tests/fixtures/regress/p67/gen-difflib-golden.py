# מחולל קובץ הזהב של difflib (ראו red-build/tests/fixtures/regress/p67/README.md) — דטרמיניסטי (seed קבוע)
import difflib, json, random, sys
rnd = random.Random(67)
cases = []
def add(a, b, label):
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    cases.append({"label": label, "a": a, "b": b,
                  "blocks": [list(m) for m in sm.get_matching_blocks()],
                  "opcodes": [list(o) for o in sm.get_opcodes()],
                  "ratio": round(sm.ratio(), 12)})
# ידניים: קצוות
add([], [], "empty-empty"); add(["a"], [], "a-empty"); add([], ["a"], "empty-a"); add(["a"], ["a"], "single-equal")
add(["a", "b", "c"], ["c", "b", "a"], "reversed"); add(list("abcabc"), list("abcabc"), "identical-repeat")
add(list("aaaa"), list("aa"), "runs-tie"); add(list("abab"), list("baba"), "tie-break-abab")
add("העשייה של אי העשייה מצאנו".split(), "אי העשייה מצאנו של העשייה".split(), "hebrew-words-shuffled")
# אקראיים: אלפבית קטן (הרבה שוויונות) ושינויים מקומיים כמו בנתוני P7
for n in range(140):
    k = rnd.choice([2, 3, 4, 6, 12])
    alpha = [chr(97 + i) for i in range(k)]
    la = rnd.randint(0, 36)
    a = [rnd.choice(alpha) for _ in range(la)]
    if n % 2 == 0:
        b = [rnd.choice(alpha) for _ in range(rnd.randint(0, 36))]
    else:
        b = list(a)
        for _ in range(rnd.randint(0, 6)):
            op = rnd.choice(["ins", "del", "sub", "move"])
            if op == "ins": b.insert(rnd.randint(0, len(b)), rnd.choice(alpha))
            elif op == "del" and b: b.pop(rnd.randrange(len(b)))
            elif op == "sub" and b: b[rnd.randrange(len(b))] = rnd.choice(alpha)
            elif op == "move" and len(b) > 2:
                i = rnd.randrange(len(b)); x = b.pop(i); b.insert(rnd.randint(0, len(b)), x)
    add(a, b, f"rand-{n}-k{k}")
json.dump({"generator": "python3 difflib.SequenceMatcher(None, a, b, autojunk=False); matching_blocks כולל הסנטינל (la, lb, 0)", "python": sys.version.split()[0], "cases": cases}, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(cases), "cases")
