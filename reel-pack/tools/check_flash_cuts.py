"""Flash-clip check: no shot in a reel may be shorter than 0.6 s. Sub-half-second pop-up clips read as glitches on a phone
and are tiring to watch.

  python tools/check_flash_cuts.py <reel.mp4> [--drop S | S-E ...] [--ignore T ...] [--min 0.6] [--thr 0.2] [--json out.json] [--quiet]

Scene detection with ffmpeg (select scene > thr) on the ffmpeg pts clock. Every shot shorter than --min seconds (default 0.6 s)
FAILS. A "drop" is an intentional fast transition (for example an Earth-zoom drop to a location) that counts as ONE shot: cuts
inside it are ignored and its start/end are boundaries, so a sliver of footage left either side of it is caught. Zones reported:
BEFORE-DROP (1 s before the drop), AFTER-DROP (4 s after the drop ends), else ELSEWHERE. All zones fail.
--drop: start (end = start + 3.2 s) or start-end; several drops allowed.
--ignore T: a detected "cut" at T s (+-1 frame) that is not a cut (an explosion or muzzle flash inside one shot): looked at and
cleared. Without --drop, the reel folder's NOTES.md is read for "Earth drop ... at X s" or "X-Y s"; if nothing is found every
short shot is still flagged (zone ELSEWHERE).
Each ffmpeg cut is confirmed on the frame-difference curve (the jump must be >= 3x the motion around it), so a fast pan, a
walking figure or ffmpeg firing again on the frame after a cut is not a shot.
Frame numbers printed are ffmpeg decode indices.
Exit 0 = PASS, 1 = flash clips found.
"""
import argparse, json, math, os, re, subprocess, sys
import numpy as np

DROP_LEN = 3.2


def probe(path):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate,nb_frames:format=duration",
                        "-of", "json", path], capture_output=True, text=True).stdout
    j = json.loads(o); s = j["streams"][0]
    a, b = s["r_frame_rate"].split("/"); fps = float(a) / float(b)
    return fps, float(j["format"]["duration"])


def scene_cuts(path, thr=0.2):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-an", "-vf",
                        f"scale=540:960,select='gt(scene,{thr})',showinfo", "-f", "null", "-"], capture_output=True, text=True).stderr
    return [float(m) for m in re.findall(r"pts_time:\s*([\d.]+)", e)]


def frame_diffs(path, w=72, h=128):
    """d[i] = mean abs RGB difference between decoded frames i-1 and i (tiny frames, ffmpeg decode clock)."""
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         stdout=subprocess.PIPE)
    d, prev = [0.0], None
    while True:
        b = p.stdout.read(w * h * 3)
        if len(b) < w * h * 3:
            break
        f = np.frombuffer(b, np.uint8).astype(np.int16)
        if prev is not None:
            d.append(float(np.abs(f - prev).mean()))
        prev = f
    return np.array(d)


def confirmed(k, d, ratio=3.0, floor=10.0):
    """A cut at frame k is real when that one frame-to-frame change stands out from the motion around it (a fast pan or a
    walking figure changes every frame and does not count; ffmpeg's scene score double-fires on the frame after a cut)."""
    if k <= 0 or k >= len(d):
        return False
    nb = np.concatenate([d[max(1, k - 4):k], d[k + 1:k + 5]])
    return d[k] >= floor and d[k] >= ratio * (float(np.median(nb)) if len(nb) else 0.0)


def drop_from_notes(path):
    n = os.path.join(os.path.dirname(os.path.abspath(path)), "NOTES.md")
    if not os.path.exists(n):
        return None
    txt = open(n, encoding="utf-8", errors="replace").read()
    for pat in [r"Earth drops?[^\n]*?\((\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*s\)",
                r"Earth drop\s*\|\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*s",
                r"OrbitalDrop[^\n]*?(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*s",
                r"Earth drop:[^\n]*? at (\d+(?:\.\d+)?)\s*s"]:
        m = re.search(pat, txt)
        if m:
            g = [float(v) for v in m.groups() if v]
            return [(g[0], g[1]) if len(g) > 1 else (g[0], g[0] + DROP_LEN)]
    return None


def shots(path, drop=None, thr=0.2, ignore=()):
    fps, dur = probe(path)
    d = frame_diffs(path)
    cuts = [c for c in scene_cuts(path, thr) if not any(abs(c - t) <= 1.01 / fps for t in ignore) and confirmed(int(round(c * fps)), d)]
    for s, e in (drop or []):
        # the drop covers frames i with s <= i/fps < e, i.e. ceil(s*fps) .. ceil(e*fps)-1
        s, e = math.ceil(s * fps - 1e-6) / fps, math.ceil(e * fps - 1e-6) / fps
        cuts = [c for c in cuts if not (s - 1.5 / fps < c < e + 1.5 / fps)] + [s, e]
    cuts = sorted(set(round(c, 4) for c in cuts if 0 < c < dur - 0.5 / fps))
    b = [0.0] + cuts + [dur]
    return fps, dur, [(b[i], b[i + 1]) for i in range(len(b) - 1)]


def check(path, drop=None, min_s=0.6, thr=0.2, quiet=False, ignore=()):
    if drop is None:
        drop = drop_from_notes(path)
    fps, dur, sh = shots(path, drop, thr, ignore)
    flags = []
    for a, b in sh:
        d = b - a
        if any(abs(a - math.ceil(s0 * fps - 1e-6) / fps) < 1e-3 and abs(b - math.ceil(e0 * fps - 1e-6) / fps) < 1e-3 for s0, e0 in (drop or [])):
            continue                                   # a drop itself
        if d < min_s - 0.5 / fps:
            zone = "ELSEWHERE"
            for s0, e0 in (drop or []):
                if s0 - 1.0 <= b <= s0 + 1e-3:
                    zone = "BEFORE-DROP"
                elif e0 - 1e-3 <= a <= e0 + 4.0:
                    zone = "AFTER-DROP"
            flags.append({"start": round(a, 3), "end": round(b, 3), "dur": round(d, 3), "f0": int(round(a * fps)),
                          "f1": int(round(b * fps)), "zone": zone})
    if not quiet:
        print(f"{os.path.basename(path)}: {len(sh)} shots, {fps:g} fps, {dur:.2f} s, drop {drop}")
        for f in flags:
            print(f"FLASH  {f['start']:7.2f}-{f['end']:6.2f} s  ({f['dur']:.2f} s, frames {f['f0']}-{f['f1']})  {f['zone']}")
        print(f"FLASH CUTS {'PASS' if not flags else 'FAIL'}: {len(flags)} shots under {min_s} s")
    return {"file": path, "fps": fps, "dur": dur, "drop": drop, "shots": sh, "flags": flags}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("media"); ap.add_argument("--drop", nargs="*"); ap.add_argument("--ignore", nargs="*", type=float, default=[]); ap.add_argument("--min", type=float, default=0.6)
    ap.add_argument("--thr", type=float, default=0.2); ap.add_argument("--json"); ap.add_argument("--quiet", action="store_true")
    A = ap.parse_args()
    dr = None
    if A.drop:
        dr = []
        for d in A.drop:
            p = [float(v) for v in d.split("-")]
            dr.append((p[0], p[1] if len(p) > 1 else p[0] + DROP_LEN))
    r = check(A.media, dr, A.min, A.thr, A.quiet, A.ignore)
    if A.json:
        json.dump(r, open(A.json, "w"), indent=1)
    sys.exit(1 if r["flags"] else 0)
