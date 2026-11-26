"""Clipped line-ending AND line-onset check. A line that loses its last consonant ("ban-" for "band") or its first one
("-ry" for "try") FAILS.

  python tools/check_line_tails.py <reel.mp4 | voice.wav> [--lines vo-lines.json | words.json] [--from S] [--to S] [--quiet]

Flags every place where a spoken line stops abruptly (hard cut / short fade on a still-sounding word: level falls >= 15 dB
inside 30 ms to the floor with no release burst after it) and, when --lines gives line starts/ends, every line that runs
straight into the next with no decay (< 80 ms of quiet between them). Works on a voice stem (best) or a full mix (the floor
is measured locally, so a music bed under the voice is allowed for).
ONSET rows: with --take, every place a placed line starts in the stem is found in the take; if the take already had voice in
the 30 ms before the cut, the first sound was thrown away (FAIL). Stem mode without a take: a line that starts already at
speech level (>= -30 dBFS in its first 10 ms) is flagged as a screen. --no-onsets skips them.
Exit code 0 = PASS, 1 = clipped tails/onsets found. Prints one row per flag with the timestamp and the word.
"""
import argparse, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from line_tails import load, find_clipped_tails, butted_lines, stem_segment_ends, clipped_stem_ends, removed_tails, removed_onsets, clipped_stem_starts


def read_lines(p):
    if not p:
        return None, None
    d = json.load(open(p, encoding="utf-8"))
    if isinstance(d, list) and d and "w" in d[0]:           # words.json: [{w,s,e}]
        return None, [(w["w"], float(w["s"]), float(w["e"])) for w in d]
    if isinstance(d, list) and d and "t" in d[0]:           # vo-lines.json: [{t,end,text}]
        rows = [r for r in d if not r.get("onscreen_only")]
        words = []
        for r in rows:
            if "end" in r:
                words.append((r["text"].split()[-1], float(r["t"]), float(r["end"])))
        return rows, words
    return None, None


def check(path, lines_path=None, t0=0.0, t1=None, quiet=False, mode="auto", take=None, onsets=True):
    sr = 48000
    x = load(path, sr)
    lines, words = read_lines(lines_path)
    if mode == "auto":   # a voice stem has digital silence between placed lines; a mix has a bed under everything
        mode = "stem" if len(stem_segment_ends(x, sr)) >= 2 else "mix"
    rows = []
    def word_at(t):
        if words:
            c = min(words, key=lambda w: abs(w[2] - t))
            if abs(c[2] - t) < 0.6:
                return c[0]
        return ""
    if take:
        tx = load(take, sr)
        for t, tb, lv, m, tp in removed_tails(x, tx, sr):
            if t >= t0 and (t1 is None or t <= t1):
                if tb is None:
                    rows.append(("UNPLACED", t, word_at(t), f"could not find this line ending in the take (match {m}); listen"))
                elif tb == "SOURCE":
                    rows.append(("CLIPPED", t, word_at(t), f"the take FILE itself stops while the voice is at {lv:.0f} dBFS (truncated generation): re-voice this line"))
                else:
                    rows.append(("CLIPPED", t, word_at(t), f"cut while still sounding: the take carries on at {lv:.0f} dBFS right after the cut (take {tb:.2f} s)"))
        if onsets:
            for t, ta, lv, m, tp in removed_onsets(x, tx, sr):
                if t >= t0 and (t1 is None or t <= t1):
                    rows.append(("UNPLACED", t, "", f"could not find this line start in the take (match {m}); listen") if ta is None else
                                ("ONSET", t, "", f"first sound cut: the take already had voice at {lv:.0f} dBFS in the 30 ms before the cut (take {ta:.2f} s)"))
        mode = "take"
    elif mode == "stem":
        if onsets:
            for t, lv in clipped_stem_starts(x, sr):
                if t >= t0 and (t1 is None or t <= t1):
                    rows.append(("ONSET", t, "", f"line starts already at {lv:.0f} dBFS in its first 10 ms (screen; confirm with --take)"))
        for t, lv in clipped_stem_ends(x, sr):
            if t >= t0 and (t1 is None or t <= t1):
                rows.append(("CLIPPED", t, word_at(t), f"still at {lv:.0f} dBFS in the 80 ms before the line's audio stops (needs < -45)"))
    else:
        for t, before, fl, fall in find_clipped_tails(x, sr):
            if t >= t0 and (t1 is None or t <= t1):
                rows.append(("CLIPPED", t, word_at(t), f"fell {fall:.0f} dB in <=30 ms from {before:.0f} dBFS to the floor ({fl:.0f}), no release after"))
    if lines and all("end" in r for r in lines):
        for a, b, q in butted_lines(x, sr, [r for r in lines if "end" in r]):
            if a["end"] >= t0 and (t1 is None or a["end"] <= t1):
                rows.append(("BUTTED", a["end"], a["text"].split()[-1], f"only {q*1000:.0f} ms of quiet before the next line at {b['t']:.2f} s"))
    rows.sort(key=lambda r: r[1])
    if not quiet:
        for kind, t, w, why in rows:
            print(f"{kind:8s} {t:7.2f}s  {w!r:18s} {why}")
        print(f"LINE TAILS+ONSETS {'PASS' if not rows else 'FAIL'}: {len(rows)} clipped/butted line endings or cut onsets in {os.path.basename(path)} ({mode} mode)")
    return rows


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("media"); ap.add_argument("--lines"); ap.add_argument("--from", dest="t0", type=float, default=0.0)
    ap.add_argument("--to", dest="t1", type=float, default=None); ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--mode", choices=["auto", "stem", "mix"], default="auto")
    ap.add_argument("--take", help="the original continuous take: decisive check of what each cut threw away (voice stem input)")
    ap.add_argument("--no-onsets", action="store_true")
    A = ap.parse_args()
    r = check(A.media, A.lines, A.t0, A.t1, A.quiet, A.mode, A.take, not A.no_onsets)
    sys.exit(1 if r else 0)
