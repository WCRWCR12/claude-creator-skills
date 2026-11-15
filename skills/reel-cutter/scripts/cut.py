"""reel-cutter: raw talking video in, tight reel out.

Cuts every silence longer than --max-gap, drops filler words (um, uh), stutters ("I I") and abandoned
takes (a sentence you started, stopped and said again: the LAST take is kept). Word edges are found from the
audio itself, so no word gets its first or last sound clipped. Then it transcribes the finished file and
checks that every kept word is still there and nothing extra slipped in at a join.

  python cut.py raw.mp4                      # writes raw-cut.mp4, raw-cut-plan.json, raw-cut-report.json
  python cut.py raw.mp4 --plan-only          # just the plan (what stays, what goes, and why)
  python cut.py raw.mp4 --plan raw-cut-plan.json   # render from a plan you (or Claude) edited

Needs: ffmpeg on PATH, and `pip install faster-whisper numpy`.
"""
import argparse, difflib, json, os, re, subprocess, sys, tempfile, wave
import numpy as np

FILLERS = {"um", "uh", "er", "erm", "ah", "uhm", "hmm", "mm"}
SR = 16000
norm = lambda w: re.sub(r"[^a-z0-9']", "", w.lower())


def run(cmd):
    subprocess.run(cmd, check=True)


def load_audio(src, wav):
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", str(SR), wav])
    with wave.open(wav) as wf:
        return np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0


def transcribe(model, x):
    segs, _ = model.transcribe(x, language="en", beam_size=5, word_timestamps=True, vad_filter=False,
                                condition_on_previous_text=False)
    # zero-length words are Whisper repeating itself at the end of a clip, not speech
    return [{"w": w.word.strip(), "s": float(w.start), "e": float(w.end)} for sg in segs for w in sg.words
            if norm(w.word) and w.end - w.start > 0.02]


def fps_of(src):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=avg_frame_rate",
                          "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip()
    try:
        a, b = out.split("/"); f = float(a) / float(b)
        return round(f) if f > 1 else 30
    except Exception:
        return 30


def plan_words(words):
    """Mark each word keep/drop with a reason. Last take wins."""
    for w in words:
        w["keep"], w["why"] = True, ""
    for w in words:
        if norm(w["w"]) in FILLERS:
            w["keep"], w["why"] = False, "filler"
    for a, b in zip(words, words[1:]):  # stutter: same word twice in a row, close together
        if a["keep"] and norm(a["w"]) == norm(b["w"]) and b["s"] - a["e"] < 0.6:
            a["keep"], a["why"] = False, "stutter"
    # phrases = runs split at sentence punctuation or a pause over 0.5 s
    phrases, cur = [], []
    for i, w in enumerate(words):
        if cur and (w["s"] - words[i - 1]["e"] > 0.5):
            phrases.append(cur); cur = []
        cur.append(i)
        if w["w"][-1:] in ".?!":
            phrases.append(cur); cur = []
    if cur:
        phrases.append(cur)
    # retake: the words that open phrase p turn up again at a later phrase q (within 30 s) -> everything from
    # p up to q was a take that got redone. Drop it; the last take wins.
    starts = [p[0] for p in phrases]
    kept_from = lambda i, n: [norm(words[j]["w"]) for j in range(i, len(words)) if words[j]["keep"]][:n]
    k = 0
    while k < len(starts):
        p, hit = starts[k], None
        for q in starts[k + 1:]:
            if words[q]["s"] - words[p]["s"] > 30:
                break
            n = 4 if len(kept_from(p, 6)) >= 6 else 3
            if len(kept_from(p, n)) == n and kept_from(p, n) == kept_from(q, n):
                hit = q
        if hit is not None:
            for j in range(p, hit):
                if words[j]["keep"]:
                    words[j]["keep"], words[j]["why"] = False, "retake (said again later)"
            k = starts.index(hit)
        else:
            k += 1
    return words


def voiced_mask(x):
    """10 ms frames: True where someone is making sound. Read from the audio, not from Whisper's timings
    (Whisper stretches words across pauses, so its gaps under-report silence)."""
    hop = int(0.01 * SR)
    n = len(x) // hop
    db = 20 * np.log10(np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1)) + 1e-9)
    noise, speech = np.percentile(db, 10), np.percentile(db, 90)
    v = db > max(noise + 6, speech - 32)
    k = 4  # keep 40 ms either side of any sound so soft starts and word tails survive
    return np.convolve(v.astype(int), np.ones(2 * k + 1, int), "same") > 0


def segments(x, words, max_gap, dur):
    """Keep every kept word (with room either side, never reaching into a dropped word), then squeeze every
    silence inside what's kept down to max_gap: a short tail after the sound, a short lead-in before the next."""
    keep = np.zeros(int(dur / 0.01) + 1, bool)
    for i, w in enumerate(words):
        if not w["keep"]:
            continue
        lo = max(w["s"] - 0.15, (words[i - 1]["e"] + w["s"]) / 2 if i and not words[i - 1]["keep"] else 0)
        hi = min(w["e"] + 0.25, (w["e"] + words[i + 1]["s"]) / 2 if i + 1 < len(words) and not words[i + 1]["keep"] else dur)
        keep[int(lo / 0.01):int(hi / 0.01) + 1] = True
    v = voiced_mask(x)[:len(keep)]
    keep = keep[:len(v)]
    sound = keep & v
    # a burst of sound that doesn't touch any kept word is something else (a cut-off next word, a cough): drop it
    core = np.zeros_like(keep)
    for w in words:
        if w["keep"]:
            core[int(w["s"] / 0.01):int(w["e"] / 0.01) + 1] = True
    s0 = None
    for i, on in enumerate(np.append(sound, False)):
        if on and s0 is None: s0 = i
        if not on and s0 is not None:
            if not core[s0:i].any(): sound[s0:i] = False
            s0 = None
    tail, lead = int(round(max_gap * 0.6 / 0.01)), int(round(max_gap * 0.4 / 0.01))
    out = np.zeros_like(keep)
    idx = np.flatnonzero(sound)
    for i in idx:
        out[i] = True
    # fill short holes between sounds (they are part of speech), cap long ones
    for a, b in zip(idx, idx[1:]):
        if b - a > 1:
            if (b - a - 1) * 0.01 <= max_gap:
                out[a:b] = True
            else:
                out[a:a + 1 + tail] = True; out[b - lead:b] = True
    out[idx[-1]:idx[-1] + 1 + tail] = True if len(idx) else False
    segs, start = [], None
    for i, on in enumerate(np.append(out, False)):
        if on and start is None: start = i
        if not on and start is not None:
            segs.append([start * 0.01, i * 0.01]); start = None
    return segs


def render(src, segs, fps, out):
    snap = lambda t, up: (np.ceil(t * fps) if up else np.floor(t * fps)) / fps  # same cut points for picture and sound
    segs = [(snap(a, False), snap(b, True)) for a, b in segs]
    sel = "+".join(f"between(t,{a:.4f},{b - 0.0001:.4f})" for a, b in segs)
    graph = (f"[0:v]fps={fps},select='{sel}',setpts=N/FRAME_RATE/TB[v];"
             f"[0:a]aselect='{sel}',asetpts=N/SR/TB[a]")
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        f.write(graph); gpath = f.name
    run(["ffmpeg", "-v", "error", "-y", "-i", src, "-/filter_complex", gpath, "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", out])
    os.unlink(gpath)
    return segs


def check(model, out, words, max_gap):
    x = load_audio(out, out + ".wav"); os.unlink(out + ".wav")
    heard = transcribe(model, x)
    want = [norm(w["w"]) for w in words if w["keep"]]
    got = [norm(w["w"]) for w in heard]
    problems = []
    for op, a0, a1, b0, b1 in difflib.SequenceMatcher(None, want, got, autojunk=False).get_opcodes():
        if op == "equal":
            continue
        # Whisper often skips a short phrase in a long clip. Re-listen to just that spot before calling it a fault.
        t0 = heard[b0 - 1]["e"] if b0 else 0.0
        t1 = heard[b1]["s"] if b1 < len(heard) else len(x) / SR
        clip = x[max(0, int((t0 - 0.4) * SR)):int((t1 + 0.4) * SR)]
        again = [norm(w["w"]) for w in transcribe(model, clip)] if len(clip) > SR * 0.2 else []
        missing = [w for w in want[a0:a1] if w not in again]
        extra = [w for w in got[b0:b1] if w not in want[max(0, a0 - 3):a1 + 3] and w not in again]
        if missing or extra:
            problems.append({"at_s": round(t0, 2), "expected": " ".join(want[a0:a1]), "heard": " ".join(again or got[b0:b1])})
    v, gaps, s = voiced_mask(x), [], None
    for i, on in enumerate(np.append(v, True)):
        if not on and s is None: s = i
        if on and s is not None:
            if (i - s) * 0.01 > max_gap + 0.1 and s > 0 and i < len(v):
                gaps.append({"at_s": round(s * 0.01, 2), "gap_s": round((i - s) * 0.01, 2)})
            s = None
    return {"words_expected": len(want), "words_heard": len(got), "mismatches": problems, "long_gaps": gaps,
            "duration_s": round(len(x) / SR, 2)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("-o", "--out")
    ap.add_argument("--max-gap", type=float, default=0.1, help="longest silence allowed between words (s)")
    ap.add_argument("--model", default="small.en", help="faster-whisper model (small.en fast, large-v3 best)")
    ap.add_argument("--plan-only", action="store_true"); ap.add_argument("--plan")
    a = ap.parse_args()
    base = os.path.splitext(a.out or a.src)[0] + ("" if a.out else "-cut")
    out = base + ".mp4"
    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    x = load_audio(a.src, base + "-src.wav"); os.unlink(base + "-src.wav")
    dur = len(x) / SR
    if a.plan:
        words = json.load(open(a.plan, encoding="utf-8"))["words"]
    else:
        words = plan_words(transcribe(model, x))
        json.dump({"src": a.src, "words": words}, open(base + "-plan.json", "w", encoding="utf-8"), indent=1)
    dropped = [w for w in words if not w["keep"]]
    print(f"{len(words)} words, dropping {len(dropped)}: " + ", ".join(f"'{w['w']}' ({w['why']})" for w in dropped[:20]))
    if a.plan_only:
        print("plan:", base + "-plan.json"); return
    segs = render(a.src, segments(x, words, a.max_gap, dur), fps_of(a.src), out)
    rep = check(model, out, words, a.max_gap)
    rep.update({"source_s": round(dur, 2), "cuts": len(segs) - 1, "output": out})
    json.dump(rep, open(base + "-report.json", "w", encoding="utf-8"), indent=1)
    print(f"{dur:.1f}s -> {rep['duration_s']}s, {rep['cuts']} cuts, "
          f"{len(rep['mismatches'])} word mismatches, {len(rep['long_gaps'])} long gaps. Report: {base}-report.json")
    sys.exit(1 if rep["mismatches"] or rep["long_gaps"] else 0)


if __name__ == "__main__":
    main()
