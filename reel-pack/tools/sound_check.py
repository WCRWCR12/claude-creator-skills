"""Sound check before any reel is shown to anyone. Checks, prints a verdict and writes <reel>-soundcheck.txt + .png:
  1. music loudness over time (1 s RMS, 100 ms hop) while it plays: FAIL a swing over 8 dB inside 2 s, WARN 6-8 dB;
     FAIL a hard cut to or from a real break (silence >= 0.5 s) inside 0.3 s;
  2. whole bed (music + SFX, if given) swings, reported as info;
  3. first 3 s: when the first word starts and how loud the bed is against it (voice must start straight away, < 0.5 s);
  4. whisper word check (faster-whisper medium.en, 16 kHz numpy, 6 s chunks every 4 s) against the script lines;
  5. loudness (target -15 LUFS) and true peak (<= -1 dBTP);
  6. line endings AND onsets (21 Nov): no line may lose its last or first consonant; exact with --voice + --take
     (tools/check_line_tails.py);
  7. flash clips: every shot must be >= 0.6 s
     (tools/check_flash_cuts.py; an intentional drop transition = one shot; --drop S[-E] ..., --flash-ignore T ... for cleared false cuts). FAIL.

Usage: python tools/sound_check.py <reel.mp4> [script: vo-lines.json | lines.txt] [--music remix-music.wav] [--sfx remix-sfx.wav]
                                   [--ignore A-B ...]   (seconds where a big music change is on purpose)
                                   [--voice voice-stem.wav --take original-take.wav] [--drop S[-E] ...] [--flash-ignore T ...]
"""
import argparse, difflib, json, os, re, subprocess
import numpy as np
from scipy.io import wavfile

ap = argparse.ArgumentParser(); ap.add_argument("reel"); ap.add_argument("script", nargs="?", help="vo-lines.json or lines.txt; omit for a reel with no voice (levels-only check)")
ap.add_argument("--music"); ap.add_argument("--sfx"); ap.add_argument("--ignore", nargs="*", default=[]); ap.add_argument("--no-words", action="store_true")
ap.add_argument("--voice", help="placed voice stem (for the exact line-ending check)"); ap.add_argument("--take", help="original continuous take")
ap.add_argument("--drop", nargs="*", help="intentional drop transition S or S-E (s), for the flash-clip check; default read from NOTES.md")
ap.add_argument("--flash-ignore", nargs="*", type=float, default=[], help="detected cuts (s) looked at and cleared (explosions)")
A = ap.parse_args()
if not A.script: A.no_words = True
rep = []; fails = []
say = lambda s: (print(s), rep.append(s))

def wav16(path):
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
def curve(path, win=0.4):
    x = wav16(path); w, h = int(win * 16000), 1600
    v = np.array([np.sqrt(np.mean(x[i:i + w] ** 2)) for i in range(0, max(1, len(x) - w), h)])
    return np.arange(len(v)) * 0.1 + 0.2, 20 * np.log10(v + 1e-9)
ign = [tuple(float(v) for v in s.split("-")) for s in A.ignore]
def swings(ts, d, floor=-50, end_skip=3.8):
    out = []; T = ts[-1]
    for i, t0 in enumerate(ts):
        j = np.searchsorted(ts, t0 + 2.0)
        if j >= len(ts) or t0 > T - end_skip: break
        seg = d[i:j]; seg = seg[seg > floor]
        if len(seg) < 5: continue
        sw = seg.max() - seg.min()
        if sw > 6 and not any(a <= t0 <= b for a, b in ign): out.append((round(t0, 1), round(float(sw), 1)))
    merged = []
    for t0, sw in out:
        if merged and t0 - merged[-1][1] <= 1.0: merged[-1] = (merged[-1][0], t0, max(merged[-1][2], sw))
        else: merged.append((t0, t0, sw))
    return merged

e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", A.reel, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]); tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])
say(f"loudness {I} LUFS, true peak {tp} dBTP")
if abs(I + 15) > 1.5: fails.append(f"loudness {I} LUFS (target -15)")
if tp > -1.0: fails.append(f"true peak {tp} dBTP (> -1)")

curves = {}
if A.music:
    ts, d = curve(A.music); curves["music"] = (ts, d)
    med = float(np.median(d[d > -60]))
    ts1, d1 = curve(A.music, 1.0)                 # swings on a 1 s loudness window (a sub-second breath is not a swing)
    sw = swings(ts1, d1, floor=med - 12)          # swings while the music is playing (composed breaks/fades are checked below)
    big = [x for x in sw if x[2] > 8]
    say(f"music: median {med:.1f} dBFS, swings in 2 s while playing: {len(big)} over 8 dB (fail), {len(sw) - len(big)} at 6-8 dB (warn)" + ("" if not sw else " -> " + ", ".join(f"{a}-{b}s ({s} dB)" for a, b, s in sw)))
    if big: fails.append(f"music swings over 8 dB: {len(big)}")
    hi, lo = d >= med - 6, d <= med - 24        # hard cut = full level to (almost) nothing, or back, inside 0.3 s
    lo5 = np.array([lo[i:i + 5].all() for i in range(len(lo))])          # silence that lasts >= 0.5 s (a real break)
    cuts = [round(float(ts[i]), 1) for i in range(5, len(d) - 8) if (hi[i] and lo5[i + 3]) or (lo5[i - 5 + 3 - 3] and lo[i] and hi[i + 3])]
    cuts = [c for k, c in enumerate(cuts) if not k or c - cuts[k - 1] > 1.0]
    say(f"music hard cuts in/out (<0.3 s): {len(cuts)}" + ("" if not cuts else " at " + ", ".join(f"{c}s" for c in cuts)))
    if cuts: fails.append(f"music hard cuts: {len(cuts)}")
if A.sfx:
    ts, d = curve(A.sfx); curves["sfx"] = (ts, d)
    say(f"sfx: median {np.median(d[d > -50]):.1f} dBFS, loudest 400 ms {d.max():.1f} dBFS (info)")
ts, d = curve(A.reel); curves["mix"] = (ts, d)

# 6. line endings: no line may lose its last consonant. Any clipped tail = FAIL.
#    Decisive with --voice <placed voice stem> --take <original take>: every place a line stops is found in the take and must
#    not have thrown voice away. Without them the full mix is screened (abrupt drop to the bed with no release after it);
#    that screen can also catch natural endings, so a mix-only flag FAILS until the stem+take check clears it.
import sys as _sys
_sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from check_line_tails import check as _tails
_lines = A.script if (A.script or "").endswith(".json") else None
if A.voice and A.take:
    _rows = [r for r in _tails(A.voice, _lines, quiet=True, take=A.take) if r[0] == "CLIPPED"]
    _ons = [r for r in _tails(A.voice, _lines, quiet=True, take=A.take) if r[0] == "ONSET"]
    say(f"line endings (stem vs take): {len(_rows)} clipped" + ("" if not _rows else " at " + ", ".join(f"{t:.2f}s {w!r}" for _, t, w, _ in _rows)))
    say(f"line onsets (stem vs take): {len(_ons)} cut" + ("" if not _ons else " at " + ", ".join(f"{t:.2f}s" for _, t, _, _ in _ons)))
    if _ons: fails.append(f"cut line onsets: {len(_ons)}")
else:
    _scr = _tails(A.reel, _lines, quiet=True, mode="mix")
    say(f"line endings NOT verified (give --voice and --take for the exact check). Mix screen, listen at: " +
        (", ".join(f"{t:.2f}s" for _, t, w, _ in _scr) or "nothing flagged"))
    _rows = []
if _rows: fails.append(f"clipped line endings: {len(_rows)}")

# 7. flash clips: any shot under 0.6 s = FAIL
from check_flash_cuts import check as _flash, DROP_LEN as _DL
_dr = None
if A.drop:
    _dr = []
    for _d in A.drop:
        _p = [float(v) for v in _d.split("-")]; _dr.append((_p[0], _p[1] if len(_p) > 1 else _p[0] + _DL))
_fl = _flash(A.reel, _dr, quiet=True, ignore=A.flash_ignore)["flags"]
say(f"flash clips (shots < 0.6 s): {len(_fl)}" + ("" if not _fl else " at " + ", ".join(f"{f['start']:.2f}-{f['end']:.2f}s {f['zone']}" for f in _fl)))
if _fl: fails.append(f"flash clips: {len(_fl)}")

if A.no_words:
    say("SOUND CHECK (levels only) " + ("PASS" if not fails else "FAIL: " + "; ".join(fails))); raise SystemExit
# script words
if A.script.endswith(".json"):
    rows = json.load(open(A.script, encoding="utf-8")); lines = [r["text"] for r in rows if not r.get("onscreen_only")]
else:
    lines = [re.sub(r"^\s*l\d+\s+", "", l).split("  (")[0] for l in open(A.script, encoding="utf-8") if l.strip()]
NUM = {"1918": "nineteen eighteen", "1943": "nineteen forty three", "1944": "nineteen forty four", "1945": "nineteen forty five",
       "1942": "nineteen forty two", "1983": "nineteen eighty three", "1941": "nineteen forty one"}
_ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
_TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
def _say(n):  # 21 Nov: numbers written as digits on either side are compared as spoken words ("1932" = "nineteen thirty two")
    if n < 20: return _ONES[n]
    if n < 100: return _TENS[n // 10] + ("" if n % 10 == 0 else " " + _ONES[n % 10])
    if 1100 <= n <= 1999 or 2010 <= n <= 2099:
        return _say(n // 100) + (" hundred" if n % 100 == 0 else (" oh " + _ONES[n % 100] if n % 100 < 10 else " " + _say(n % 100)))
    if n < 1000: return _ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " and " + _say(n % 100))
    if n < 1000000: return _say(n // 1000) + " thousand" + ("" if n % 1000 == 0 else (" and " if n % 1000 < 100 else " ") + _say(n % 1000))
    return str(n)
def norm(s):
    s = s.lower()
    for k, v in NUM.items(): s = s.replace(k, v)
    s = re.sub(r"(?<=\d),(?=\d{3})", "", s)
    s = re.sub(r"\d+", lambda m: " " + _say(int(m.group())) + " ", s)
    return re.sub(r"[^a-z0-9 ]+", " ", s.replace("-", " ")).split()

from faster_whisper import WhisperModel
m = WhisperModel("medium.en", device="cpu", compute_type="int8")
a = wav16(A.reel); L = len(a) / 16000
words = []
for s in np.arange(0, max(L - 1, 0.1), 4.0):
    segs, _ = m.transcribe(a[int(s * 16000):int(min(L, s + 6) * 16000)], language="en", beam_size=5, word_timestamps=True, vad_filter=False)
    for sg in segs:
        for w in sg.words:
            st = s + w.start
            if not words or st > words[-1][1] + 0.05: words.append((w.word.strip(), st))
heard = norm(" ".join(w for w, _ in words)); want = norm(" ".join(lines))
sm = difflib.SequenceMatcher(None, want, heard, autojunk=False); ratio = sm.ratio()
miss = [" ".join(want[i1:i2]) for op, i1, i2, j1, j2 in sm.get_opcodes() if op in ("delete", "replace")]
say(f"words: match {ratio:.3f}; not heard as written: {miss[:12]}")
if ratio < 0.88: fails.append(f"word match {ratio:.3f}")
first = words[0][1] if words else None
say(f"first word at {first:.2f} s" if first is not None else "no words heard")
if first is None or first > 0.6: fails.append(f"voice starts late ({first})")
x3 = a[: int(3 * 16000)]
say(f"first 3 s: mix RMS {20*np.log10(np.sqrt(np.mean(x3**2))+1e-9):.1f} dBFS, loudest 100 ms {20*np.log10(max(np.sqrt(np.mean(x3[i:i+1600]**2)) for i in range(0,len(x3)-1600,800))+1e-9):.1f} dBFS")

try:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(12, 3.5))
    for k, (ts, d) in curves.items(): ax.plot(ts, d, label=k, lw=1)
    ax.set_ylim(-60, 0); ax.set_xlabel("s"); ax.set_ylabel("dBFS (400 ms RMS)"); ax.legend(); ax.grid(alpha=.3)
    ax.set_title(os.path.basename(A.reel) + " sound check"); fig.tight_layout(); fig.savefig(A.reel.rsplit(".", 1)[0] + "-soundcheck.png", dpi=90)
except Exception as ex:
    with open(A.reel.rsplit(".", 1)[0] + "-soundcheck.csv", "w") as f:
        f.write("t," + ",".join(curves) + "\n")
        n = min(len(v[0]) for v in curves.values())
        for i in range(n): f.write(f"{curves['mix'][0][i]:.1f}," + ",".join(f"{v[1][i]:.1f}" for v in curves.values()) + "\n")
    say("(loudness curve written as CSV; matplotlib not installed)")
verdict = "PASS" if not fails else "FAIL: " + "; ".join(fails)
say("SOUND CHECK " + verdict)
open(A.reel.rsplit(".", 1)[0] + "-soundcheck.txt", "w", encoding="utf-8").write("\n".join(rep) + "\n")
