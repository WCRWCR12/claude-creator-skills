"""Finish a reel's loudness for social: -15 LUFS integrated, true peak at or below -1.5 dBTP, video stream copied untouched.

    python tools/finish_audio.py kit/out/reel.mp4            -> kit/out/reel-final.mp4
    python tools/finish_audio.py in.mp4 out.mp4 [--lufs -15]

Measured gain plus a true-peak limiter, re-measured and corrected up to 4 times. (A single loudnorm pass on a short clip
with a big transient, a gunshot or an explosion, misses the target or overshoots the peak.)
Exit 0 and prints the measured result.
"""
import argparse
import re
import subprocess
import sys


def run(args):
    return subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")


def measure_final(path):
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"])
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr)[-1])
    p = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)[-1])
    return i, p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst", nargs="?")
    ap.add_argument("--lufs", type=float, default=-15.0)
    ap.add_argument("--tp", type=float, default=-1.5)
    a = ap.parse_args()
    dst = a.dst or re.sub(r"(\.\w+)$", r"-final\1", a.src)
    # gain + true-peak limiter, re-measured and corrected up to 4 times (a short clip with a gunshot has a huge
    # crest factor, so plain loudnorm either misses the target or overshoots the peak)
    lim = 10 ** ((a.tp - 0.3) / 20)
    i0, _ = measure_final(a.src)
    gain = a.lufs - i0
    for _ in range(4):
        af = f"volume={gain:.2f}dB,alimiter=limit={lim:.4f}:attack=0.5:release=50:level=disabled,aresample=48000"
        r = run(["ffmpeg", "-y", "-hide_banner", "-i", a.src, "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "192k", dst])
        if r.returncode:
            sys.exit(r.stderr[-1500:])
        i, p = measure_final(dst)
        if abs(i - a.lufs) <= 0.5 and p <= -1.0:
            break
        gain += a.lufs - i
    ok = abs(i - a.lufs) <= 1.5 and p <= -1.0
    print(f"{dst}: {i:.1f} LUFS, true peak {p:.1f} dBTP -> {'OK' if ok else 'CHECK (run again or lower the loudest SFX)'}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
