#!/usr/bin/env python3
"""Lint a myth-explainer script against the countable rules of the format.

Rules come from .claude/skills/myth-explainer/references/script.md. This checks only what can be counted. It reads a
text file and prints PASS/FAIL lines; it changes nothing.

Script file format (plain text, one block per label; a block runs until the next label; lines starting # are ignored):
    A: If you ... the two balls            the test: five moves, ends mid-sentence on its noun
    C: hit the floor at the same ...       the answer: finishes that sentence, then why, then the callback
    SAFETY: yes                            optional; allows a 40-word answer
    CHUNKS: IF YOU / ROLLED / A BALL ...   optional; caption chunks for part A

Usage: python tools/myth_script_lint.py path/to/script.txt        (try tools/myth_script_example.txt)
Exit code 0 = all pass, 1 = at least one fail, 2 = bad input. Python 3.8+, no packages.
"""
import re
import sys

WPM = 190
BANNED = ["mythbusters", "myth busters", "mythbuster", "busted", "confirmed", "plausible", "debunked", "myth"]
LABELS = ("A", "C", "SAFETY", "CHUNKS")
ME = ("i", "me", "my", "mine", "i'm", "i'll", "i've", "i'd")


def words(text):
    return re.findall(r"[A-Za-z0-9']+", text)


def sentences(text):
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def parse(raw):
    blocks, cur = {}, None
    for line in raw.splitlines():
        m = re.match(r"^\s*(%s)\s*:\s*(.*)$" % "|".join(LABELS), line)
        if m:
            cur = m.group(1)
            blocks[cur] = m.group(2).strip()
        elif cur and line.strip() and not line.lstrip().startswith("#"):
            blocks[cur] += " " + line.strip()
    return blocks


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    try:
        raw = open(sys.argv[1], encoding="utf-8").read()
    except OSError as e:
        print("cannot read:", e)
        return 2
    b = parse(raw)
    if "A" not in b:
        print("no 'A:' block found")
        return 2
    A, C = b.get("A", ""), b.get("C", "")
    safety = b.get("SAFETY", "no").lower().startswith("y")
    results = []

    def check(ok, label, detail=""):
        results.append((bool(ok), label, detail))

    aw = words(A)
    sents = sentences(A)
    check(56 <= len(aw) <= 68, "A is 56-68 words", "%d words, about %.1f s at %d wpm" % (len(aw), len(aw) / WPM * 60, WPM))
    first = sents[0] if sents else ""
    question_hook = first.endswith("?") and re.match(r"(?i)(which|what|who|how|can|could|would|will|does|do|is)\b", first)
    check(A.lower().startswith("if you") or question_hook, "move 1 starts 'If you' or is a question hook",
          "question hook" if question_hook else "")
    if question_hook:
        check(len(words(first)) <= 20, "question hook is 20 words or fewer", "%d words" % len(words(first)))
    check("most people assume" in A.lower(), "move 2 says 'most people assume'")
    denial = [s for s in sents if s.lower().startswith("but") and not s.lower().startswith("but when you")]
    check(any(len(words(s)) <= 9 for s in denial), "move 3 is a 'But ...' denial of 9 words or fewer",
          "; ".join("%d w" % len(words(s)) for s in denial) or "no denial sentence found")
    check("you see, if you" in A.lower(), "move 4 starts 'You see, if you'")
    last = sents[-1] if sents else ""
    check(last.lower().startswith("but when you"), "move 5 starts 'But when you'", last[:60])
    check(not re.search(r"[.!?…]\s*$", A.strip()), "move 5 has no full stop (the sentence breaks off)")
    lw = len(words(last))
    check(9 <= lw <= 13, "move 5 is 9-13 words", "%d words" % lw)
    for name, part in (("A", A), ("C", C)):
        hits = [w for w in words(part) if w.lower() in ME]
        check(not hits, "no I/me/my in part %s" % name, ", ".join(hits))
    low = " ".join([A, C, b.get("CHUNKS", "")]).lower()
    hits = [w for w in BANNED if re.search(r"\b%s\b" % re.escape(w), low)]
    check(not hits, "no show name or verdict words", ", ".join(hits))
    if C:
        cw = words(C)
        cap = 40 if safety else 30
        check(len(cw) <= cap, "C is %d words or fewer" % cap, "%d words, about %.1f s" % (len(cw), len(cw) / WPM * 60))
        check(C.strip()[:1].islower(), "C carries on the cut sentence (starts in lower case)", C.strip()[:30])
        if aw:
            check(cw[0].lower() != aw[-1].lower(), "C does not repeat the cut's last word", "'%s'" % cw[0])
        check(re.search(r"[.!?]\s*$", C.strip()), "C ends on a full stop")
        total = len(aw) + len(cw)
        check(True, "total %d words, about %.0f s at %d wpm (aim for 25-32 s)" % (total, total / WPM * 60, WPM))
    else:
        check(False, "C (the answer) is present")
    if b.get("CHUNKS"):
        chunks = [c.strip() for c in b["CHUNKS"].split("/") if c.strip()]
        bad = [c for c in chunks if not 1 <= len(words(c)) <= 3]
        check(not bad, "every caption chunk is 1-3 words", "; ".join(bad[:5]))
        joined = [w.lower() for c in chunks for w in words(c)]
        check(joined == [w.lower() for w in aw], "caption chunks spell out part A exactly",
              "%d chunk words vs %d spoken" % (len(joined), len(aw)))

    fails = 0
    for ok, label, detail in results:
        if not ok:
            fails += 1
        print("%s  %s%s" % ("PASS" if ok else "FAIL", label, ("  [" + detail + "]") if detail else ""))
    print("\n%s: %d checks, %d failed" % ("PASS" if not fails else "FAIL", len(results), fails))
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
