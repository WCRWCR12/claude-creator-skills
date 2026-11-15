"""caption-sync: burn word-by-word captions into a video, then test the result against the sound itself.

Two lines at a time, low on the frame. The word being said gets a pale-blue box behind it.

Timing comes from the AUDIO, not from a speech model. Whisper only says which words were spoken and roughly where;
each caption then starts on that word's measured onset: the moment its sound rises out of a pause. Words inside
connected speech (no pause before them) keep the model's time, but never start in silence.

The sync test reads the burned caption file back and measures the finished video's audio again, from scratch:
  - every caption paired with a measurable onset must start within the tolerance of it;
  - every clear phrase start in the audio must have a caption starting within the tolerance;
  - no caption may start in silence.
It does not compare against a second speech model: two models disagree with each other by 100-250 ms at word starts,
which is more than the 50 ms being tested.

  python captions.py talk.mp4                         # -> talk-captions.mp4 + .ass + -sync.json
  python captions.py reel.mp4 --voice vo.wav          # video has music: measure onsets on the clean voice track
  python captions.py talk.mp4 --script script.txt     # use the script's spelling (names, brand words, numbers)

Needs: ffmpeg on PATH (with libass, as all standard builds have), `pip install faster-whisper numpy pillow`.
"""
import argparse, difflib, json, os, re, shutil, subprocess, sys, tempfile, wave
import numpy as np
from PIL import ImageFont

SR = 16000
HOP = 0.005                      # envelope step, s
norm = lambda w: re.sub(r"[^a-z0-9']", "", w.lower())
FONT_GUESSES = ["C:/Windows/Fonts/arialbd.ttf", "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
                "/Library/Fonts/Arial Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]


def run(cmd, **kw):
    subprocess.run(cmd, check=True, **kw)


def audio(src):
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, "a.wav")
        run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", str(SR), p])
        with wave.open(p) as wf:
            return np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0


# ---------- the sound itself ----------
class Env:
    """5 ms loudness envelope. `onsets` = where sound rises out of a pause (>= quiet_s below the speech threshold)."""
    def __init__(self, x, quiet_s=0.06):
        h = int(HOP * SR); n = len(x) // h
        self.db = 20 * np.log10(np.sqrt(np.mean(x[:n * h].reshape(n, h) ** 2, axis=1)) + 1e-9)
        self.thr = max(np.percentile(self.db, 10) + 6, np.percentile(self.db, 95) - 35)
        self.loud = self.db >= self.thr
        q = int(round(quiet_s / HOP))
        on, gap, run_q = [], [], q          # the file start counts as a pause
        for i, l in enumerate(self.loud):
            if l:
                if run_q >= q:
                    on.append(i * HOP); gap.append(run_q * HOP)
                run_q = 0
            else:
                run_q += 1
        self.onsets, self.gap = np.array(on), np.array(gap)

    def is_loud(self, t):
        i = int(t / HOP)
        return 0 <= i < len(self.loud) and bool(self.loud[i])

    def next_loud(self, t, reach=0.3):
        i0 = int(t / HOP)
        for i in range(max(0, i0), min(len(self.loud), i0 + int(reach / HOP))):
            if self.loud[i]:
                return i * HOP
        return None


def lag_ms(a, b):
    """Offset of voice track `b` inside the video's audio `a` (1 ms envelope cross-correlation), in ms."""
    def e(x):
        h = int(0.001 * SR); n = min(len(x), 60 * SR) // h
        v = np.sqrt(np.mean(x[:n * h].reshape(n, h) ** 2, axis=1)); return v - v.mean()
    ea, eb = e(a), e(b); n = min(len(ea), len(eb)); ea, eb = ea[:n], eb[:n]
    return max(range(-200, 201), key=lambda L: float(np.dot(ea[max(0, L):n + min(0, L)], eb[max(0, -L):n - max(0, L)])))


# ---------- words ----------
def words_of(model, x):
    segs, _ = model.transcribe(x, language="en", beam_size=5, word_timestamps=True, vad_filter=False,
                               condition_on_previous_text=False)
    return [{"w": w.word.strip(), "s": float(w.start), "e": float(w.end)} for sg in segs for w in sg.words
            if norm(w.word) and w.end - w.start > 0.02]


def apply_script(words, script):
    """Keep the model's timings, use the script's spelling. Splits/merges are spread over the matched time span."""
    toks = script.split(); A = [norm(w["w"]) for w in words]; B = [norm(t) for t in toks]
    out = []
    for op, a0, a1, b0, b1 in difflib.SequenceMatcher(None, A, B, autojunk=False).get_opcodes():
        if op == "equal" or (op == "replace" and a1 - a0 == b1 - b0):
            out += [{"w": toks[b0 + k], "s": words[a0 + k]["s"], "e": words[a0 + k]["e"]} for k in range(b1 - b0)]
        elif b1 > b0:
            s = words[a0]["s"] if a1 > a0 else (out[-1]["e"] if out else 0.0)
            e = words[a1 - 1]["e"] if a1 > a0 else s + 0.25 * (b1 - b0)
            L = [len(t) for t in toks[b0:b1]]; c = s
            for k, l in enumerate(L):
                d = (e - s) * l / sum(L); out.append({"w": toks[b0 + k], "s": c, "e": c + d}); c += d
    return out


def place_on_onsets(words, env, reach=0.25):
    """Start each word on its measured onset. Each rise-out-of-a-pause goes to the word whose model time is nearest
    to it (within `reach`); the other words (connected speech) keep the model time, moved off silence onto sound."""
    owner = {}
    for o in env.onsets:
        k = min(range(len(words)), key=lambda i: abs(words[i]["s"] - o), default=None)
        if k is not None and abs(words[k]["s"] - o) <= reach and (k not in owner or abs(owner[k] - words[k]["s"]) > abs(o - words[k]["s"])):
            owner[k] = float(o)
    # A rise left over (its nearest word already had a closer one) goes to the nearest word that has no onset yet,
    # if it is within 0.45 s and keeps the words in order.
    taken = set(owner.values())
    eff = lambda i: owner.get(i, words[i]["s"])
    for o in env.onsets:
        o = float(o)
        if o in taken: continue
        c = [i for i in range(len(words)) if i not in owner and abs(words[i]["s"] - o) <= 0.45
             and (i == 0 or eff(i - 1) + 0.08 < o) and (i + 1 >= len(words) or o + 0.08 < eff(i + 1))]
        if c:
            k = min(c, key=lambda i: abs(words[i]["s"] - o)); owner[k] = o; taken.add(o)
    prev = -1.0
    for k, w in enumerate(words):
        if k in owner and owner[k] > prev + 0.04:
            w["s"] = owner[k]; w["how"] = "onset"
        else:
            if not env.is_loud(w["s"]):
                nl = env.next_loud(w["s"])
                if nl is not None: w["s"] = nl
            w["s"] = max(w["s"], prev + 0.04); w["how"] = "speech"
        w["e"] = max(w["e"], w["s"] + 0.05)
        prev = w["s"]
    return words


# ---------- layout ----------
def size_of(src):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                          "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip().split(",")
    return int(out[0]), int(out[1])


def chunks(words, font, max_w, max_lines=2):
    """Group words into on-screen blocks of up to two lines. A sentence end or a pause always starts a new block,
    and a long sentence is re-packed with narrower lines so its last block never strands one or two words."""
    def pack(ws, mw):
        blocks, lines, line = [], [], []
        for w in ws:
            if line and font.getlength(" ".join(x["w"] for x in line + [w])) > mw:
                lines.append(line); line = []
                if len(lines) == max_lines:
                    blocks.append(lines); lines = []
            line.append(w)
        if line: lines.append(line)
        if lines: blocks.append(lines)
        return blocks
    sentences, cur = [], []
    for i, w in enumerate(words):
        if cur and w["s"] - words[i - 1]["e"] > 0.6:
            sentences.append(cur); cur = []
        cur.append(w)
        if w["w"][-1:] in ".?!":
            sentences.append(cur); cur = []
    if cur: sentences.append(cur)
    out = []
    for sn in sentences:
        mw, best = max_w, pack(sn, max_w)
        for _ in range(8):
            if len(best) < 2 or sum(len(l) for l in best[-1]) >= 3: break
            mw *= 0.92; best = pack(sn, mw)
        out += [{"words": [w for l in b for w in l], "lines": b} for b in best]
    return out


def ts(t):
    cs = int(round(max(0.0, t) * 100)); h, cs = divmod(cs, 360000); m, cs = divmod(cs, 6000)
    return f"{h}:{m:02d}:{cs // 100:02d}.{cs % 100:02d}"


def build_ass(words, W, H, font_path, y_frac, size_frac, path):
    px = int(H * size_frac)
    # ASS sizes a font by its full line height, PIL by its em; measure with the matching em so boxes fit the words
    probe = ImageFont.truetype(font_path, 100)
    asc, desc = probe.getmetrics()
    em = px * 100 / (asc + desc)
    font = ImageFont.truetype(font_path, max(8, int(round(em))))
    family = font.getname()[0]
    space, pad, lh = font.getlength(" ") + px * 0.28, px * 0.18, px * 1.25  # room for the box between words
    blocks = chunks(words, font, min(W * 0.82, H * 0.5))  # short lines, also on landscape video
    ev = []
    for bi, b in enumerate(blocks):
        b_start = b["words"][0]["s"]
        b_end = blocks[bi + 1]["words"][0]["s"] if bi + 1 < len(blocks) else b["words"][-1]["e"] + 0.4
        b_end = min(b_end, b["words"][-1]["e"] + 1.0)
        top = H * y_frac - lh * len(b["lines"]) / 2
        for li, line in enumerate(b["lines"]):
            widths = [font.getlength(w["w"]) for w in line]
            x = (W - (sum(widths) + space * (len(line) - 1))) / 2
            cy = top + lh * (li + 0.5)
            for w, wd in zip(line, widths):
                cx = x + wd / 2
                k = words.index(w)
                live_s = w["s"]
                live_e = min(words[k + 1]["s"], b_end) if k + 1 < len(words) and words[k + 1] in b["words"] else b_end
                x0, y0, x1, y1 = x - pad, cy - px * 0.62, x + wd + pad, cy + px * 0.62
                r = px * 0.22
                box = (f"m {x0 + r:.0f} {y0:.0f} l {x1 - r:.0f} {y0:.0f} b {x1:.0f} {y0:.0f} {x1:.0f} {y0:.0f} {x1:.0f} {y0 + r:.0f} "
                       f"l {x1:.0f} {y1 - r:.0f} b {x1:.0f} {y1:.0f} {x1:.0f} {y1:.0f} {x1 - r:.0f} {y1:.0f} "
                       f"l {x0 + r:.0f} {y1:.0f} b {x0:.0f} {y1:.0f} {x0:.0f} {y1:.0f} {x0:.0f} {y1 - r:.0f} "
                       f"l {x0:.0f} {y0 + r:.0f} b {x0:.0f} {y0:.0f} {x0:.0f} {y0:.0f} {x0 + r:.0f} {y0:.0f}")
                ev.append((0, live_s, live_e, r"{\an7\pos(0,0)\bord0\shad0\1c&HFFE3BF&\1a&H10&\p1}" + box))
                for t0, t1, col, bord in ((b_start, live_s, "&HFFFFFF&", 3), (live_s, live_e, "&H40250A&", 0),
                                          (live_e, b_end, "&HFFFFFF&", 3)):
                    if t1 - t0 > 0.005:
                        ev.append((1, t0, t1, rf"{{\an5\pos({cx:.0f},{cy:.0f})\1c{col}\bord{bord}\3c&H000000&\shad0}}{w['w']}"))
                x += wd + space
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"[Script Info]\nScriptType: v4.00+\nPlayResX: {W}\nPlayResY: {H}\nWrapStyle: 2\n"
                "ScaledBorderAndShadow: yes\n\n[V4+ Styles]\n"
                "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
                "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, "
                "MarginR, MarginV, Encoding\n"
                f"Style: Default,{family},{px},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,3,0,5,0,0,0,1\n\n"
                "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
        for layer, t0, t1, txt in ev:
            f.write(f"Dialogue: {layer},{ts(t0)},{ts(t1)},Default,,0,0,0,,{txt}\n")
    return len(blocks)


def burn(src, ass, font_path, out):
    d = os.path.dirname(os.path.abspath(ass))
    shutil.copy(font_path, os.path.join(d, os.path.basename(font_path)))
    run(["ffmpeg", "-v", "error", "-y", "-i", os.path.abspath(src), "-vf", "subtitles=caps.ass:fontsdir=.",
         "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy",
         os.path.abspath(out)], cwd=d)


# ---------- the test ----------
def caption_starts(ass_path):
    """Start time of every live-word box actually written to the caption file (layer 0 = the boxes)."""
    out = []
    for line in open(ass_path, encoding="utf-8"):
        if line.startswith("Dialogue: 0,"):
            h, m, s = line.split(",")[1].split(":"); out.append(int(h) * 3600 + int(m) * 60 + float(s))
    return sorted(out)


def sync_test(out, ass_path, tol_ms, voice=None):
    """Measure onsets in the FINISHED file's audio (or in the clean voice track, after checking it lines up with the
    finished file) and compare them with the caption starts read back from the caption file. No speech model."""
    a = audio(out); lag = 0
    if voice is not None:
        lag = lag_ms(a, voice)
        if abs(lag) > 5:
            raise SystemExit(f"--voice track is {lag} ms off the video's audio; it must be on the same timeline")
    env = Env(voice if voice is not None else a)
    caps = caption_starts(ass_path); tol = tol_ms / 1000
    # pair each onset with its nearest caption (and only if that caption has no nearer onset)
    pair = {}
    for o in env.onsets:
        if not caps: break
        c = min(range(len(caps)), key=lambda i: abs(caps[i] - o))
        if abs(caps[c] - o) <= 0.25 and (c not in pair or abs(pair[c] - caps[c]) > abs(o - caps[c])):
            pair[c] = float(o)
    rows, bad = [], []
    for i, c in enumerate(caps):
        if i in pair:
            r = {"caption_s": round(c, 3), "onset_s": round(pair[i], 3), "off_ms": round((c - pair[i]) * 1000), "kind": "onset"}
            if abs(c - pair[i]) > tol: bad.append(r)
        elif not any(env.is_loud(c + d) for d in np.arange(0, tol + 1e-9, HOP)):
            r = {"caption_s": round(c, 3), "kind": "starts in silence"}; bad.append(r)
        else:
            r = {"caption_s": round(c, 3), "kind": "inside speech (no pause before it to measure)"}
        rows.append(r)
    phrase = [float(o) for o, g in zip(env.onsets, env.gap) if g >= 0.25]  # a clear pause; shorter quiet can be inside a word (s + stop)
    missed = [{"onset_s": round(o, 3), "kind": "phrase start with no caption on it"} for o in phrase
              if min((abs(c - o) for c in caps), default=9) > tol]
    measured = [r for r in rows if r["kind"] == "onset"]
    return {"captions": len(caps), "measured": len(measured), "phrase_starts": len(phrase),
            "worst_ms": max((abs(r["off_ms"]) for r in measured), default=0), "voice_lag_ms": lag,
            "over_tolerance": bad + missed, "rows": rows}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("-o", "--out")
    ap.add_argument("--font", default=next((f for f in FONT_GUESSES if os.path.exists(f)), None))
    ap.add_argument("--y", type=float, default=0.70, help="caption centre, as a fraction of the height")
    ap.add_argument("--size", type=float, default=0.036, help="text height, as a fraction of the height")
    ap.add_argument("--model", default="small.en", help="speech model: only finds the words, not their timing")
    ap.add_argument("--voice", help="clean voice-only audio on the same timeline (use when the video has music)")
    ap.add_argument("--script", help="text file of what is said, to use its spelling for names and numbers")
    ap.add_argument("--tolerance-ms", type=int, default=50)
    a = ap.parse_args()
    if not a.font:
        sys.exit("No font found. Pass --font with the path to a .ttf file.")
    out = a.out or os.path.splitext(a.src)[0] + "-captions.mp4"
    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    W, H = size_of(a.src)
    voice = audio(a.voice) if a.voice else None
    speech = voice if voice is not None else audio(a.src)
    words = words_of(model, speech)
    if a.script:
        words = apply_script(words, open(a.script, encoding="utf-8").read())
    words = place_on_onsets(words, Env(speech))
    work = tempfile.mkdtemp()
    ass = os.path.join(work, "caps.ass")
    n = build_ass(words, W, H, a.font, a.y, a.size, ass)
    burn(a.src, ass, a.font, out)
    rep = sync_test(out, ass, a.tolerance_ms, voice)
    shutil.copy(ass, os.path.splitext(out)[0] + ".ass")
    rep = {"output": out, "words": len(words), "blocks": n, "tolerance_ms": a.tolerance_ms, **rep}
    json.dump(rep, open(os.path.splitext(out)[0] + "-sync.json", "w", encoding="utf-8"), indent=1)
    print(f"{len(words)} words in {n} blocks. {rep['measured']} captions measured against an audio onset, worst "
          f"{rep['worst_ms']} ms; {len(rep['over_tolerance'])} problems. Report: {os.path.splitext(out)[0]}-sync.json")
    sys.exit(1 if rep["over_tolerance"] else 0)


if __name__ == "__main__":
    main()
