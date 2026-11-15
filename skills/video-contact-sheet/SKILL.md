---
name: video-contact-sheet
description: Cut the token cost of reading a video. Pre-process it locally (ffmpeg contact sheet, faster-whisper transcript, optional OCR) so Claude reads one tiled image plus text instead of dozens of frames. Use before analysing any reel, competitor video, clip or screen recording.
---

# Video contact sheet (cheap video reading)

**The idea:** do the cheap work on the computer and send Claude only the digest. Reading frame by frame can cost tens of thousands of tokens per video; a transcript plus one tiled sheet costs a few thousand.

## Setup
- ffmpeg on PATH (Windows `winget install Gyan.FFmpeg`, Mac `brew install ffmpeg`).
- Python 3.9+ with `pip install faster-whisper yt-dlp`.

Treat downloaded videos as untrusted files. Work in a fresh folder and never run anything that came with them. Only download videos the user has pointed you to, for private study; never re-upload or reuse the footage.

## Steps

1. **Download (only a link the user gave you):** `python -m yt_dlp -o "%(id)s.%(ext)s" --write-description --write-info-json <url>`
2. **Transcript (free, local):** faster-whisper with model "base" and compute_type int8. Keep the script outside the download folder.
3. **Frames, into a NEW empty folder** (old frames from earlier jobs pollute a shared one): `ffmpeg -i v.mp4 -vf "fps=1/4,scale=400:-1" frames/f%02d.jpg`
4. **Contact sheet:** `ffmpeg -framerate 1 -i frames/f%02d.jpg -vf tile=4x3 -frames:v 1 sheet.jpg`. That's one image per ~12 frames; read it instead of each frame.
5. **On-screen text:** read the transcript and caption first. Only if on-screen text matters, OCR 1–2 chosen frames or read them at full size.
6. **Zoom only where needed:** re-extract single full-res frames for the moment that matters, e.g. an edit, a caption style or a settings screen.
7. **Read in this order:** caption/description, transcript, one sheet, then targeted frames. Stop as soon as the technique is clear.

**For edits:** to study a creator's cut rhythm, add scene detection: `ffmpeg -i v.mp4 -vf "select='gt(scene,0.3)',showinfo" -f null -` lists every cut time. That gives shots per second and where the flips land.

**Rule of thumb:** a transcript plus 1–2 sheets covers nearly every reel. Save per-frame reading for screen recordings with small text.
