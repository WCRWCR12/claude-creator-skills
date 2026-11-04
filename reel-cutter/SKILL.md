---
name: reel-cutter
description: Cuts a raw talking-to-camera video into a tight reel. Removes every pause over 0.1 s, filler words (um, uh), stutters and abandoned takes (keeps your last take), without clipping any word, then checks the finished file by listening to it. Use when someone says "cut this video", "take the pauses out", "tighten this reel", "remove the ums", or hands over a raw clip of themselves talking.
---

# reel-cutter

Raw video in, clean reel out. One script does the cutting; you (Claude) run it, read its report and fix anything it flags.

## Setup (one time)
1. ffmpeg must be on PATH. Check with `ffmpeg -version`. If it's missing:
   - Windows: `winget install Gyan.FFmpeg`
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
2. Python 3.9+ and the packages: `pip install faster-whisper numpy`.
   The first run downloads a speech model (about 500 MB for `small.en`).

## Run it
```
python <this skill folder>/scripts/cut.py "<raw video>"
```
It writes three files next to the video:
- `<name>-cut.mp4`: the reel.
- `<name>-cut-plan.json`: every word, with keep/drop and the reason.
- `<name>-cut-report.json`: the check of the finished file.

Options:
- `--max-gap 0.1`: the longest silence left between words. 0.1 s is tight reel pace; use 0.25 for a calmer talk.
- `--model large-v3`: more accurate, but slow on a laptop. Use it when the report flags words.
- `--plan-only`: write the plan and stop, so you can review it before cutting.

## What it does
1. Transcribes the audio with a timestamp on every word.
2. Drops filler words (um, uh, er, erm, ah, hmm) and stutters (the same word twice in a row).
3. Drops abandoned takes. If the opening words of a sentence come back later (within 30 s), everything from the first attempt up to the retry is dropped. The last take wins.
4. Finds the real start and end of each kept word from the sound itself, not from the transcript. Word edges are never clipped.
5. Squeezes every silence between kept words down to `--max-gap`. Picture and sound are cut on the same frame boundaries, so lip sync holds.
6. Listens to the finished file:
   - every kept word must be heard, in order, with nothing extra at a join;
   - no silence may be longer than the gap allowed.
   Exit code 0 means clean; 1 means something is flagged in the report.

## When the report flags something
- **`mismatches`:** a word expected but not heard, or heard but not expected. Each one has `at_s` (seconds into the output).
  1. Cut 2 seconds of audio around that spot with ffmpeg and transcribe it again with `--model large-v3` before believing it. Whisper sometimes skips a short phrase.
  2. If it's real, open the plan, find the word, flip `"keep"` and render again:
     `python cut.py "<raw video>" --plan "<name>-cut-plan.json"`
- **`long_gaps`:** a silence still longer than allowed. This is usually a breath or room noise counted as sound. Lower the gap or accept it; it's the only flag that is ever safe to ignore.
- **A wrong take kept, or a good line cut as a "retake":** edit the plan (flip `keep` on those words) and render from the plan again.

Never hand the reel back while the report has a mismatch you haven't checked by ear. Tell the user the source and final length, the number of cuts, and what was dropped (for example: "3 retakes, 7 fillers").

## Limits
- It's built for one person talking. Music under the voice confuses the silence detection; cut before adding music.
- It doesn't reframe, caption or colour-grade. It only edits for time.
