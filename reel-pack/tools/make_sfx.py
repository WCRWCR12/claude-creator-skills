"""Synthesise a starter SFX + music-bed library from code (no samples, no licences needed).

    python tools/make_sfx.py kit/public/sfx            # writes all sounds
    python tools/make_sfx.py kit/public/sfx boom drone # only some

Sounds (48 kHz mono 16-bit WAV):
  boom      cannon / explosion: sharp crack + low thump + rumbling tail
  impact    heavy metal hit (shell on armour, hammer on steel)
  debris    gravel and fragments falling after a hit
  whoosh    something fast passing the camera
  rumble    engine / tracks idle loop (6 s, loopable)
  clank     single track-link / mechanism clank
  tick      clock tick, UI tick
  riser     2 s tension riser into a hit
  drone     12 s low cinematic bed (D minor, slow swell): a starting point, not a score
  knock     a ball or small hard thing landing on a floor (short, dry)
  thud      a body or a heavy soft thing hitting the floor

Everything is seeded, so the same file comes out every time. Needs numpy only.
Treat these as placeholders you can ship: for real recorded SFX use CC0 libraries (see knowledge/sound-and-music.md).
"""
import os
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def lowpass_fast(x, cutoff):
    """FFT brick-ish low-pass with a soft knee (fast for long files)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def highpass_fast(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (cutoff / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(X, len(x))


def norm(x, peak_db=-1.0):
    p = np.max(np.abs(x)) + 1e-9
    return x / p * 10 ** (peak_db / 20)


def fade(x, a=0.002, b=0.05):
    n = len(x)
    ia, ib = int(a * SR), int(b * SR)
    if ia:
        x[:ia] *= np.linspace(0, 1, ia)
    if ib:
        x[-ib:] *= np.linspace(1, 0, ib)
    return x


def boom():
    t = t_axis(3.5)
    crack = rng.standard_normal(len(t)) * np.exp(-t * 60)
    crack = highpass_fast(crack, 900)
    thump = np.sin(2 * np.pi * (55 * t - 20 * t * t)) * np.exp(-t * 6)
    rumble = lowpass_fast(rng.standard_normal(len(t)), 180) * np.exp(-t * 1.4) * 3.0
    x = 0.9 * crack + 1.0 * thump + 0.9 * rumble
    return fade(norm(np.tanh(x * 1.5)))


def impact():
    t = t_axis(2.0)
    x = np.zeros_like(t)
    for f, d, a in [(180, 7, 1.0), (433, 9, 0.6), (871, 12, 0.4), (1290, 16, 0.3), (2210, 22, 0.2)]:
        x += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * d)
    hit = highpass_fast(rng.standard_normal(len(t)), 1500) * np.exp(-t * 80)
    low = np.sin(2 * np.pi * 60 * t) * np.exp(-t * 10)
    return fade(norm(np.tanh(1.3 * (x + 0.8 * hit + 0.8 * low))))


def debris():
    t = t_axis(2.5)
    x = np.zeros_like(t)
    for _ in range(90):
        t0 = rng.uniform(0.0, 1.6) ** 1.4
        i0 = int(t0 * SR)
        n = int(rng.uniform(0.01, 0.05) * SR)
        if i0 + n >= len(x):
            continue
        g = rng.standard_normal(n) * np.exp(-np.linspace(0, 8, n)) * rng.uniform(0.2, 1.0) * np.exp(-t0 * 1.2)
        x[i0:i0 + n] += g
    x = lowpass_fast(highpass_fast(x, 300), 6000)
    return fade(norm(x, -3))


def whoosh():
    t = t_axis(1.2)
    env = np.exp(-((t - 0.55) / 0.18) ** 2)
    n = rng.standard_normal(len(t))
    # sweep a band from low to high and back (Doppler feel)
    lo = lowpass_fast(n, 900)
    hi = lowpass_fast(n, 4000) - lowpass_fast(n, 1200)
    mix = np.where(t < 0.55, (t / 0.55), 1 - (t - 0.55) / 0.65)
    x = (lo * (1 - mix) + hi * mix) * env
    return fade(norm(x, -2), 0.01, 0.1)


def rumble():
    t = t_axis(6.0)
    f0 = 32
    eng = sum(np.sin(2 * np.pi * f0 * k * t + k) / k for k in range(1, 7))
    eng *= 1 + 0.25 * np.sin(2 * np.pi * 7.5 * t)  # cylinder throb
    grit = lowpass_fast(rng.standard_normal(len(t)), 400) * 0.6
    clatter = np.zeros_like(t)
    for k in range(int(6 * 6)):
        i0 = int((k / 6 + rng.uniform(-0.01, 0.01)) * SR)
        n = int(0.03 * SR)
        if i0 + n < len(t):
            clatter[i0:i0 + n] += highpass_fast(rng.standard_normal(n), 800) * np.exp(-np.linspace(0, 6, n)) * 0.5
    x = eng * 0.5 + grit + clatter
    # make it loop cleanly: crossfade end into start
    m = int(0.3 * SR)
    x[:m] = x[:m] * np.linspace(0, 1, m) + x[-m:] * np.linspace(1, 0, m)
    x = x[:-m]
    return norm(x, -4)


def clank():
    t = t_axis(0.6)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d, a in [(520, 30, 1), (1340, 40, 0.5), (2900, 60, 0.3)])
    x += highpass_fast(rng.standard_normal(len(t)), 2000) * np.exp(-t * 120) * 0.8
    return fade(norm(x, -3))


def tick():
    t = t_axis(0.12)
    x = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 90) + highpass_fast(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300) * 0.4
    return fade(norm(x, -6), 0.0005, 0.02)


def riser():
    t = t_axis(2.0)
    f = 120 * (2 ** (t * 2))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.4 * np.sin(2 * ph)
    noise = highpass_fast(rng.standard_normal(len(t)), 2000)
    env = (t / 2.0) ** 2
    x = (tone * 0.6 + noise * 0.4 * env) * env
    return fade(norm(x, -4), 0.05, 0.005)


def drone():
    """Low, serious bed: sustained D minor pad with a slow swell. Sits under a voice. Write a new one per reel."""
    t = t_axis(12.0)
    notes = [36.71, 73.42, 87.31, 110.0, 146.83]  # D1 D2 F2 A2 D3
    x = np.zeros_like(t)
    for i, f in enumerate(notes):
        det = 1 + 0.002 * np.sin(2 * np.pi * (0.07 + 0.03 * i) * t)
        ph = 2 * np.pi * np.cumsum(f * det) / SR
        voice = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
        x += voice * (0.9 if i < 2 else 0.5) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t + i))
    air = lowpass_fast(rng.standard_normal(len(t)), 600) * 0.15
    swell = np.clip(t / 3.0, 0, 1) * (0.85 + 0.15 * np.sin(2 * np.pi * t / 12))
    x = lowpass_fast((x + air) * swell, 900)
    return fade(norm(x, -6), 1.5, 2.0)


def knock():
    t = t_axis(0.25)
    x = np.sin(2 * np.pi * (190 * np.exp(-t * 18) + 95) * t) * np.exp(-t * 34)
    x += 0.35 * np.sin(2 * np.pi * 760 * t) * np.exp(-t * 110)
    x += lowpass_fast(rng.standard_normal(len(t)), 3500) * np.exp(-t * 220) * 0.35
    return fade(norm(x, -4), 0.0005, 0.04)


def thud():
    t = t_axis(0.7)
    x = np.sin(2 * np.pi * (70 * np.exp(-t * 9) + 42) * t) * np.exp(-t * 11)
    x += lowpass_fast(rng.standard_normal(len(t)), 500) * np.exp(-t * 26) * 0.9
    x += lowpass_fast(rng.standard_normal(len(t)), 2500) * np.exp(-t * 90) * 0.2
    return fade(norm(x, -3), 0.001, 0.1)


SOUNDS = {k: v for k, v in globals().items() if k in "boom impact debris whoosh rumble clank tick riser drone knock thud".split()}


def write(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "sfx"
    names = sys.argv[2:] or list(SOUNDS)
    os.makedirs(out, exist_ok=True)
    for n in names:
        if n not in SOUNDS:
            print("unknown sound:", n, "| choose from", ", ".join(SOUNDS))
            continue
        p = os.path.join(out, n + ".wav")
        write(p, SOUNDS[n]())
        print("wrote", p)


if __name__ == "__main__":
    main()
