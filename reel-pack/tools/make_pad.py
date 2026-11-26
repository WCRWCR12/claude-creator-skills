"""Make a quiet held pad: one sustained chord with no beat and no tune, to sit under a narrator.

    python tools/make_pad.py kit/public/myth/pad.wav --seconds 24
    python tools/make_pad.py out.wav --seconds 20 --root D --mode major --stop-dead

Why this exists: an explainer needs something under the voice, but a tune or a pulse competes with one-second cuts, and
slow minor strings make it feel like a disaster film. A held major chord (root, fifth, octave, third, fifth) that only
swells by a decibel or so is felt, not heard.

  --root       note name of the chord (C, D, Eb, F#...). Default C. Change it per video so no two sound the same.
  --mode       major (default, warm and neutral) or open (root and fifths only: plainer, no third). No minor on purpose.
  --seconds    length. Default 24.
  --stop-dead  end with a 4 ms cut instead of a fade (for a hard cut on a word).
  --level      RMS level in dBFS. Default -30. In the mix keep it 10-14 dB under the voice.

48 kHz stereo 16-bit WAV. Seeded: the same arguments give the same file. Needs numpy only. Made from sine partials in
code: no samples, nothing to license.
"""
import argparse
import os
import wave

import numpy as np

SR = 48000
NOTE = {"C": 0, "C#": 1, "DB": 1, "D": 2, "D#": 3, "EB": 3, "E": 4, "F": 5, "F#": 6, "GB": 6, "G": 7, "G#": 8, "AB": 8, "A": 9, "A#": 10, "BB": 10, "B": 11}


def voice(freq, t, rng, players=5):
    """A small string section on one note: several slightly detuned players, each with slow vibrato and its own slow level drift."""
    out = np.zeros_like(t)
    for _ in range(players):
        det = 2 ** (rng.uniform(-6, 6) / 1200)
        vib = 1 + 0.0022 * np.sin(2 * np.pi * rng.uniform(4.6, 5.6) * t + rng.uniform(0, 6.28)) * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.05, 0.12) * t + rng.uniform(0, 6.28)))
        ph = 2 * np.pi * np.cumsum(freq * det * vib) / SR + rng.uniform(0, 6.28)
        tone = np.zeros_like(t)
        for h in range(1, 13):                      # bowed-string-like partials, rolled off so it stays soft
            if freq * h > 2600:
                break
            tone += np.sin(h * ph + rng.uniform(0, 6.28)) / (h ** 1.55)
        out += tone * (0.75 + 0.25 * np.sin(2 * np.pi * rng.uniform(0.03, 0.09) * t + rng.uniform(0, 6.28)))
    return out / players


def pad(seconds, root="C", mode="major", seed=1):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    base = 65.406 * 2 ** (NOTE[root.upper()] / 12)                      # C2 = 65.4 Hz
    if base > 98:                                                       # keep the chord low: G2 and up drop an octave
        base /= 2
    third = 2 ** (4 / 12)
    # (ratio to the root, gain, pan -1..1): root, fifth, octave, third above that, fifth above that
    notes = [(1, 1.0, -0.25), (1.5, 0.8, 0.2), (2, 0.6, -0.1), (2 * third if mode == "major" else 3, 0.42, 0.3), (3 if mode == "major" else 4, 0.42, -0.3)]
    L = np.zeros(n)
    Rr = np.zeros(n)
    for ratio, gain, pan in notes:
        y = voice(base * ratio, t, rng) * gain
        L += y * np.cos((pan + 1) * np.pi / 4) * 1.41
        Rr += y * np.sin((pan + 1) * np.pi / 4) * 1.41
    swell = 10 ** ((1.2 * np.sin(2 * np.pi * t / 9.0 - 1.2)) / 20)      # +-1.2 dB over 9 s: a breath, not a pulse
    x = np.stack([L, Rr], 1) * swell[:, None]
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-9)


def main():
    ap = argparse.ArgumentParser(description="Quiet held pad: one chord, no beat, no tune.")
    ap.add_argument("out")
    ap.add_argument("--seconds", type=float, default=24)
    ap.add_argument("--root", default="C")
    ap.add_argument("--mode", choices=["major", "open"], default="major")
    ap.add_argument("--stop-dead", action="store_true")
    ap.add_argument("--level", type=float, default=-30.0)
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    if a.root.upper() not in NOTE:
        ap.error("root must be a note name like C, D, Eb, F#")
    x = pad(a.seconds, a.root, a.mode, a.seed) * 10 ** (a.level / 20)
    fi = int(1.0 * SR)
    x[:fi] *= np.linspace(0.25, 1, fi)[:, None]                         # eases in over a second, never from silence
    fo = int((0.004 if a.stop_dead else 1.5) * SR)
    x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with wave.open(a.out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
    print("wrote %s  %.1f s  %s %s  %.0f dBFS RMS" % (a.out, a.seconds, a.root, a.mode, a.level))


if __name__ == "__main__":
    main()
