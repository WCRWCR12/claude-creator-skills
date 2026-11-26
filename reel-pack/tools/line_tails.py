"""Shared helpers so no voice-over line ever loses its ending (house rule: every line keeps its last consonant, its release
and a 150-250 ms tail before the next line or cut; "and hired a ban-" with the D chopped off is the classic failure).

Two jobs:
  1. safe_line_end(...)  used by every tool that cuts a line out of a continuous take: walks forward from the word-timestamp
     end (Whisper ends sit BEFORE the consonant release) until the voice has really decayed to silence, then adds a
     150-250 ms tail. Never cuts while sound is still there.
  2. find_clipped_tails(...)  used by tools/check_line_tails.py and tools/sound_check.py: finds every speech offset in a
     voice stem or a full mix and flags the ones that stop abruptly (a hard cut or a short fade-out on a still-sounding
     word) or that run straight into the next line with no decay.

Envelope: 10 ms RMS windows on a 5 ms hop, in dBFS.
"""
import subprocess
import numpy as np

HOP = 0.005
WIN = 0.010
SIL_DB = -45.0       # absolute silence for a clean voice stem / take
HOLD = 0.08          # the decay must stay down this long to count as "ended"
TAIL = 0.20          # tail kept after the decay point (house range 0.15-0.25 s)


def load(path, sr=48000, mono=True):
    a = ["ffmpeg", "-v", "error", "-i", path] + (["-ac", "1"] if mono else []) + ["-ar", str(sr), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.check_output(a), np.float32).copy()


def envelope(x, sr):
    w, h = int(WIN * sr), int(HOP * sr)
    n = max(1, (len(x) - w) // h + 1)
    idx = np.arange(n) * h
    c = np.concatenate([[0.0], np.cumsum(x.astype(np.float64) ** 2)])
    e = (c[idx + w] - c[idx]) / w
    return 10 * np.log10(e + 1e-12)


def _floor(env, i, span=200):
    """Local noise/bed floor around frame i: 10th percentile over +-1 s, never below -70."""
    a, b = max(0, i - span), min(len(env), i + span)
    return max(-70.0, float(np.percentile(env[a:b], 10)))


def decay_point(x, sr, t_from, t_limit, thr=None, hold=HOLD):
    """First time >= t_from where the level stays below thr for `hold` s. thr defaults to max(SIL_DB, floor+6).
    Returns None if the sound has not decayed before t_limit."""
    i0, i1 = int(t_from * sr), int(min(len(x) / sr, t_limit + hold) * sr)
    if i1 <= i0:
        return None
    seg = x[i0:i1]
    env = envelope(seg, sr)
    if thr is None:
        full = envelope(x[max(0, i0 - sr):min(len(x), i1 + sr)], sr)
        thr = max(SIL_DB, float(np.percentile(full, 10)) + 6)
    k = int(round(hold / HOP))
    quiet = env < thr
    run = 0
    for j, q in enumerate(quiet):
        run = run + 1 if q else 0
        if run >= k:
            t = t_from + (j - k + 1) * HOP
            return t if t <= t_limit else None
    return None


def safe_line_end(x, sr, word_end, next_start=None, tail=TAIL, min_gap=0.03):
    """Where to cut a line out of a continuous take so its ending is whole.
    word_end   = word-timestamp end of the line's last word (take clock)
    next_start = word-timestamp start of the next line's first word (or None at the end of the take)
    Returns (cut_time, decay_time, ok). ok is False when the voice never decays before the next word (lines run
    together in the take): cut_time is then the next line's onset and the caller must glue the two lines (see below)."""
    T = len(x) / sr
    if next_start is None:
        # last line: the first real pause (>= 0.15 s, longer than any stop closure) after the word ends the line
        d = decay_point(x, sr, max(0.0, word_end - 0.02), T, hold=0.15) or decay_point(x, sr, max(0.0, word_end - 0.02), T) or T
        return min(T, d + tail), d, True
    # everything that sounds between this line's last word and the next line's real onset (release burst after a stop
    # closure, breath-out) belongs to this line; the line ends after the LAST of it
    on = onset_before(x, sr, next_start, word_end)
    a, b = int(max(0.0, word_end - 0.02) * sr), int(on * sr)
    if b - a <= int(WIN * sr):
        return word_end, None, False
    env = envelope(x[a:b], sr)
    full = envelope(x[max(0, a - sr):min(len(x), b + sr)], sr)
    thr = max(SIL_DB, float(np.percentile(full, 10)) + 6)
    loud = np.nonzero(env >= thr)[0]
    d = (a / sr + loud[-1] * HOP + WIN) if len(loud) else word_end
    ok = on - d >= HOLD
    # not ok = the take runs this line straight into the next (connected speech). There is no clean place to cut, so the
    # caller must GLUE: end this line exactly at the next line's onset and start the next line there, with no fade and no
    # gap between them (the audio is then identical to the take across the join).
    cut = max(min(d + tail, on - min_gap), d + 0.01) if ok else on
    return min(cut, T), d, ok


def onset_before(x, sr, t_word, t_min):
    """Real start of the sound that Whisper calls a word starting at t_word: walk back until the level falls to silence."""
    a = int(max(t_min, t_word - 0.4) * sr); b = int((t_word + 0.35) * sr)
    if b - a < int(WIN * sr) * 2:
        return t_word
    env = envelope(x[a:b], sr)
    fl = max(SIL_DB, float(np.percentile(env, 5)) + 6)
    j = min(len(env) - 1, int((t_word - a / sr) / HOP))
    if env[j] < fl:     # Whisper often starts a word inside the pause before it: walk forward to the real onset
        while j < len(env) - 1 and env[j] < fl:
            j += 1
        return a / sr + j * HOP
    while j > 0 and env[j] >= fl:
        j -= 1
    return a / sr + j * HOP


def find_clipped_tails(x, sr, drop_db=15.0, fall_s=0.03, burst_s=0.15, near_floor=6.0, speech_over=15.0, near_speech=6.0):
    """Every speech offset in x (voice stem or mix). An offset is CLIPPED when the level falls >= drop_db within fall_s
    (a hard cut or a <=40 ms fade on a still-sounding word) to within near_floor dB of the local floor, and nothing
    comes back (release burst of a stop consonant) within burst_s. Returns [(t_offset, level_before, floor, fall_db)]."""
    env = envelope(x, sr)
    n = len(env)
    kf = max(1, int(round(fall_s / HOP)))
    kb = int(round(burst_s / HOP))
    out = []
    j = kf
    while j < n - kb:
        fl = _floor(env, j)
        before = float(np.max(env[j - kf:j]))
        if env[j] <= fl + near_floor and before >= fl + speech_over and before - env[j] >= drop_db:
            # the fall must be steep, not a slow natural decay that happens to end here
            k = j - 1
            while k > j - kf and env[k] > fl + near_floor:
                k -= 1
            a, b = max(0, j - 300), j
            act = env[a:b][env[a:b] > fl + 10]
            speech = float(np.percentile(act, 75)) if len(act) > 10 else before
            # a word that is already tapering (natural ending) starts its last fall well below the line's level;
            # a cut one falls from (near) full speech level
            steep = env[j - kf] - env[j] >= drop_db and env[j - kf] >= speech - near_speech
            back = float(np.max(env[j + 1:j + kb]))
            if steep and back < fl + speech_over - 3:
                # quiet must hold for HOLD (a closure inside a word is shorter)
                if np.all(env[j:j + int(HOLD / HOP)] < fl + near_floor + 3):
                    out.append((round(j * HOP + WIN / 2, 3), round(before, 1), round(fl, 1), round(before - float(env[j]), 1)))
                    j += kb
                    continue
        j += 1
    return out


def stem_segment_ends(x, sr, zero_db=-80.0, min_zero=0.03):
    """Voice stem: times where a placed line's audio ends (sound -> digital silence lasting >= min_zero s)."""
    env = envelope(x, sr)
    z = env < zero_db
    k = int(round(min_zero / HOP))
    ends = []
    j = 1
    while j < len(env) - k:
        if z[j] and not z[j - 1] and z[j:j + k].all():
            ends.append(j * HOP + WIN)   # boundary ~ end of the last non-zero window
            while j < len(env) and z[j]:
                j += 1
            continue
        j += 1
    return ends


def tail_quiet_before(x, sr, t_end, hold=HOLD, thr=SIL_DB, fade=0.0):
    """The rule on a stem: in the `hold` s before a line's audio stops, the voice must already be below thr (a 40 ms
    fade-out only covers half the window, so it cannot hide a cut). Returns the loudest 10 ms level in that window."""
    a = int(max(0.0, t_end - fade - hold) * sr); b = int(max(0.0, t_end - fade) * sr)
    if b - a < int(WIN * sr):
        return -120.0
    return float(np.max(envelope(x[a:b], sr)))


def clipped_stem_ends(x, sr, thr=SIL_DB):
    """[(t_end, loudest_db_in_last_80ms)] for every stem segment end that was still sounding when cut."""
    out = []
    for t in stem_segment_ends(x, sr):
        lv = tail_quiet_before(x, sr, t)
        if lv >= thr:
            out.append((round(t, 3), round(lv, 1)))
    return out


def removed_tails(stem, take, sr, thr=SIL_DB, look=0.6, after=0.02, min_match=0.9):
    """The decisive test when the original take is at hand: for every place a placed line's audio stops in the stem, find
    that audio in the take and ask whether the take still had voice (>= thr, at the stem's gain) in the `after` s that were
    thrown away. A natural pause (the take is silent there too) passes; a cut ending fails.
    Returns [(t_stem, t_take, lost_db, match)] for cut endings, plus [(t_stem, None, None, match)] for ends it cannot place."""
    out = []
    ds = 4  # correlate at sr/4 for speed, refine at full rate
    tk = take[::ds]
    c2 = np.concatenate([[0.0], np.cumsum(tk.astype(np.float64) ** 2)])

    def locate(ref):
        r = ref[::ds]; L = len(r)
        from scipy.signal import fftconvolve
        c = fftconvolve(tk, r[::-1], mode="valid")
        e2 = np.maximum(c2[L:] - c2[:-L], 0)[:len(c)]
        en = np.sqrt(e2) * np.linalg.norm(r) + 1e-9
        sc = np.where(e2 > L * 1e-7, c / en, 0.0)   # silent stretches of the take cannot match (FFT noise / ~0)
        p = int(np.argmax(sc))
        return p * ds, float(sc[p])

    senv = envelope(stem, sr)
    for t in stem_segment_ends(stem, sr):
        b = int((t - 0.06) * sr)
        # the reference must not reach back past this segment's own start (another line was placed there)
        j = int((t - 0.06) / HOP) - 1
        while j > 0 and senv[j] >= -80 and (t - 0.06) - j * HOP < look:
            j -= 1
        a = max(0, int((j * HOP + WIN) * sr))
        if b - a < int(0.12 * sr):
            continue                                  # too short a piece to place; the stem check covers it
        ref = stem[a:b]
        if np.sqrt(np.mean(ref ** 2)) < 10 ** (-50 / 20):
            continue                                  # nothing audible before this end
        p0, m = locate(ref); tempo = 1.0
        if m < min_match:                             # the line may have been sped up (atempo): undo it and look again
            for tp in np.arange(1.01, 1.161, 0.01):
                rr = atempo(ref, sr, 1.0 / tp)
                q, mm = locate(rr)
                if mm > m:
                    p0, m, tempo, ref_t = q, mm, float(tp), rr
            if m < min_match - 0.15:
                out.append((round(t, 3), None, None, round(m, 3), 1.0)); continue
        if tempo == 1.0:
            lo, hi = max(0, p0 - ds), min(len(take) - len(ref), p0 + ds)
            best = max(range(lo, hi + 1), key=lambda q: float(np.dot(take[q:q + len(ref)], ref)))
            span = len(ref)
        else:
            best, span = p0, len(ref_t)
        g = np.linalg.norm(stem[a:b]) / (np.linalg.norm(take[best:best + span]) + 1e-9)
        tb = (best + span) / sr + 0.06 / tempo        # take time of the stem end
        seg = take[int(tb * sr):int((tb + after) * sr)] * g
        if len(seg) < int(WIN * sr):
            continue                                  # end of take: nothing was thrown away
        lv = float(np.max(envelope(seg, sr)))
        if lv >= thr:
            out.append((round(t, 3), round(tb, 3), round(lv, 1), round(m, 3), round(tempo, 3)))
        elif lv < -100:
            # the take itself stops dead here (file end, or the 1.5 s join of per-line takes): was the voice still
            # sounding as it stopped? (a noise-gated pause inside one take is shorter than 1 s, so it is not counted)
            last = float(np.max(envelope(stem[max(0, int((t - 0.04) * sr)):int(t * sr)], sr)))
            z1 = take[int(tb * sr):int((tb + 1.0) * sr)]
            if last >= thr and (len(z1) < int(0.9 * sr) or float(np.max(np.abs(z1))) < 1e-5):
                out.append((round(t, 3), "SOURCE", round(last, 1), round(m, 3), round(tempo, 3)))
    return out


def atempo(x, sr, tempo):
    """ffmpeg atempo on a float mono array (the same stretch the placing tools used)."""
    if abs(tempo - 1.0) < 1e-4:
        return x
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-", "-af", f"atempo={tempo:.4f}",
                        "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(), capture_output=True)
    return np.frombuffer(r.stdout, np.float32).copy()


def butted_lines(x, sr, lines, hold=HOLD):
    """lines = [{"t":start, "end":end, "text":...}] on the same clock as x. A line is BUTTED when the voice has not decayed
    (no `hold` s of quiet at floor+6) anywhere between its last sound and the next line's start."""
    env = envelope(x, sr)
    bad = []
    for a, b in zip(lines, lines[1:]):
        s = int(max(0, a.get("end", b["t"]) - 0.15) / HOP); e = int(b["t"] / HOP) + int(0.05 / HOP)
        e = min(e, len(env))
        if e - s < 2:
            bad.append((a, b, 0.0)); continue
        fl = _floor(env, s)
        q = env[s:e] < max(fl + 6, -70)
        run = best = 0
        for v in q:
            run = run + 1 if v else 0; best = max(best, run)
        if best * HOP < hold:
            bad.append((a, b, round(best * HOP, 3)))
    return bad


# ---- line ONSETS (a cut that eats the first consonant: "-ry" instead of "try") ------------------------------------------
# The mirror of a clipped tail: a placed line whose audio starts after its first consonant has already begun (the cut sits
# inside the T burst or its aspiration), so the word is heard without its first sound.

def stem_segment_starts(x, sr, zero_db=-80.0, min_zero=0.03):
    """Voice stem: times where a placed line's audio starts (digital silence lasting >= min_zero s -> sound)."""
    env = envelope(x, sr)
    z = env < zero_db
    k = int(round(min_zero / HOP))
    return [j * HOP for j in range(k, len(env)) if not z[j] and z[j - k:j].all()]


def clipped_stem_starts(x, sr, thr=-30.0):
    """Screen without a take: [(t_start, dB of first 10 ms)] for stem segments that start already at speech level (a natural
    onset rises from silence). A hard plosive can also start loud, so the take check decides."""
    out = []
    for t in stem_segment_starts(x, sr):
        a = int(t * sr); seg = x[a:a + int(0.01 * sr)]
        if len(seg) < int(0.01 * sr):
            continue
        lv = 20 * np.log10(float(np.sqrt(np.mean(seg ** 2))) + 1e-12)
        if lv >= thr:
            out.append((round(t, 3), round(lv, 1)))
    return out


def removed_onsets(stem, take, sr, thr=SIL_DB, look=0.5, before=0.03, min_match=0.9):
    """Decisive onset test with the original take: for every place a placed line starts in the stem, find that audio in the
    take and ask whether the take already had voice (>= thr at the stem's gain) in the `before` s just ahead of the cut.
    Returns [(t_stem, t_take, lost_db, match, tempo)] for cut onsets; t_take None = could not place it (listen)."""
    from scipy.signal import fftconvolve
    out = []
    ds = 4
    tk = take[::ds]
    c2 = np.concatenate([[0.0], np.cumsum(tk.astype(np.float64) ** 2)])

    def locate(ref):
        r = ref[::ds]; L = len(r)
        c = fftconvolve(tk, r[::-1], mode="valid")
        e2 = np.maximum(c2[L:] - c2[:-L], 0)[:len(c)]
        sc = np.where(e2 > L * 1e-7, c / (np.sqrt(e2) * np.linalg.norm(r) + 1e-9), 0.0)
        p = int(np.argmax(sc))
        return p * ds, float(sc[p])

    senv = envelope(stem, sr)
    for t in stem_segment_starts(stem, sr):
        a = int((t + 0.005) * sr)
        j = int(t / HOP) + 1                       # the reference must not run past this segment's own end
        while j < len(senv) and senv[j] >= -80 and j * HOP - t < look:
            j += 1
        b = min(len(stem), int(j * HOP * sr))
        if b - a < int(0.12 * sr):
            continue
        ref = stem[a:b]
        if np.sqrt(np.mean(ref ** 2)) < 10 ** (-50 / 20):
            continue
        p0, m = locate(ref); tempo = 1.0; span = len(ref)
        if m < min_match:                          # the line may have been sped up (atempo): undo it and look again
            for tp in np.arange(1.01, 1.161, 0.01):
                rr = atempo(ref, sr, 1.0 / tp)
                q, mm = locate(rr)
                if mm > m:
                    p0, m, tempo, span = q, mm, float(tp), len(rr)
            if m < min_match - 0.15:
                out.append((round(t, 3), None, None, round(m, 3), 1.0)); continue
        if tempo == 1.0:
            lo, hi = max(0, p0 - ds), min(len(take) - span, p0 + ds)
            p0 = max(range(lo, hi + 1), key=lambda q: float(np.dot(take[q:q + span], ref)))
        g = np.linalg.norm(stem[a:b]) / (np.linalg.norm(take[p0:p0 + span]) + 1e-9)
        ta = p0 / sr - 0.005 / tempo                 # take time of the stem start
        seg = take[max(0, int((ta - before) * sr)):max(0, int(ta * sr))] * g
        if len(seg) < int(WIN * sr):
            continue                                 # start of the take: nothing before it
        lv = float(np.max(envelope(seg, sr)))
        if lv >= thr:
            out.append((round(t, 3), round(ta, 3), round(lv, 1), round(m, 3), round(tempo, 3)))
    return out
