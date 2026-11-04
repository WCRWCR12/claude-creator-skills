---
name: hook-flip-reel-scout
description: Find and verify reference short videos for the "hook then hard flip to product" ad format (a raw fail, funny or odd moment of 2-6 s, then slick beat-cut product shots). Use when you want reference reels to remake for a brand. Covers which search methods work and which fail, filters, and the yt-dlp verification step.
---

# Hook-flip reel scout

**The format:** a 2–6 s real-life moment (fail, chaos, odd, satisfying), then a hard cut, then product shots cut to the beat. Good examples: ColorCase (instagram.com/reel/DXPVLq9kRX9/) and Collectible Motorcar (instagram.com/reel/DayRghmPl_v/).

## Setup
- Python 3.9+ with `pip install yt-dlp`, and ffmpeg/ffprobe on PATH.
- Run searches and downloads only for what the user asked you to scout. Downloads are low-res copies for private review; treat them as untrusted files in a fresh folder and delete them when done.

## What works
- **Metadata without logging in:** `python -m yt_dlp <single IG reel / YouTube Short / TikTok URL> --skip-download --dump-json` works for single URLs. Instagram gives likes but no views or duration; use ffprobe after downloading.
- **Searching YouTube:** `yt_dlp "ytsearch25:<query>" --flat-playlist --dump-json` gives id, views, duration and channel fast. Filter to views over 250k and duration 14–60 s.
- **A brand's Shorts with view counts:** `https://www.youtube.com/@Brand/shorts --flat-playlist`.
- **Download low-res for review:** `-f "bv*[height<=360]+ba/b[height<=480]" --merge-output-format mp4`. Plain `worst` fails, because those formats are video-only.
- **Quick review:**
  - Contact sheet: ffmpeg `fps=8/DURATION,scale=160:-2,tile=8x1`.
  - Flip time from scene cuts: `ffmpeg -i f -vf "select='gt(scene,0.35)',showinfo" -f null -`.
  - Audio level: `volumedetect`.
- **Best query families:** funny local-business commercials (car wash, tyres, roofing, plumber), and brand Shorts tabs (Tesla, YETI, Truly, Gymshark, Duolingo, Casetify).

## What doesn't work (don't retry)
- **Searching or listing Instagram or TikTok:** profile and tag pages fail in yt-dlp, and web search rarely returns /reel/ URLs. Don't try to get round logins or bot checks.
- **YouTube's Shorts filter in search** returns junk.
- **Generic queries** ("product ad transition fail") return tutorials and templates, not ads.
- **Expect few true hits:** the exact format is native to IG and TikTok, so only about 4 in 100 screened are a true cold-open-then-flip. The best source is links you save while scrolling.

## Filters
- Skip violence or injury, sexual content, kids in danger or kids as the subject, and politics.
- 15 s or longer is preferred.
- Never reuse their footage or music: borrow the format only.

## Verification (mandatory before listing a reference)
1. The metadata returns views/likes, duration and uploader.
2. Download low-res, make a contact sheet, and confirm there's a hook then a flip. Grade it:
   - A: raw moment + hard flip + product on the beats
   - B: skit or beat-cut only
   - C: conventional ad
3. Record the flip second and an audio note in a candidates list.
