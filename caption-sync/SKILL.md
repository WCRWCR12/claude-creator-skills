---
name: caption-sync
description: Burns word-by-word captions into a video. Two short lines low on the frame, with a pale-blue box behind the word being said. Timing comes from the audio itself, then the finished video is tested and every caption must land within 50 ms of its word. Use when someone says "caption this video", "add subtitles", "my captions are out of sync", or "add word-by-word captions".
---

# caption-sync

Finished video in, captioned video out, plus a sync report that proves every word lands on time.

## Setup (one time)
1. ffmpeg on PATH (`ffmpeg -version`). If it's missing: Windows `winget install Gyan.FFmpeg`, Mac `brew install ffmpeg`, Linux `sudo apt install ffmpeg`.
2. Python 3.9+ and `pip install faster-whisper numpy pillow`. The first run downloads a small speech model (about 500 MB).

## Run it
```
python <this skill folder>/scripts/captions.py "<video>"
```
It writes the following next to the video:
- `<name>-captions.mp4`: the video with captions burned in.
- `<name>-captions.ass`: the caption file, if they'd rather upload captions than burn them in.
- `<name>-captions-sync.json`: the sync report.

Options:
- `--y 0.70`: where the caption block sits, as a fraction of the height. 0.70 sits low on the chest in a talking-head video. On 9:16, keep it at 0.77 or less, or the Instagram and TikTok buttons cover it.
- `--size 0.036`: text height as a fraction of the frame height.
- `--font "<path to .ttf>"`: any TrueType font. It defaults to Arial Bold (Windows/Mac) or DejaVu Sans Bold (Linux).
- `--voice vo.wav`: when the video has music under the voice, pass the clean voice track (same timeline) so timing is measured on the voice alone.
- `--script script.txt`: a text file of what is said, so names, brand words and numbers are spelled right.
- `--model small.en`: the speech model. It only finds which words were said; timing comes from the audio.
- `--tolerance-ms 50`: how far out of sync a caption may be before it's flagged.

## What it does
1. Transcribes the audio with a rough timestamp on every word.
2. Moves each word's start to the exact moment its sound rises out of a pause, measured from the audio level. Words inside connected speech keep the model's time but never start in silence.
3. Groups words into blocks of up to two short lines. A new block starts at the end of a sentence or at a pause.
4. Draws every word in white with a dark outline. The word being said turns dark on a rounded pale-blue box.
5. Burns the captions into the video. The audio is copied untouched.
6. **Sync test:** reads the caption file back and measures the finished video's audio again from scratch:
   - every caption paired with a measurable onset must start within the tolerance of it;
   - every clear phrase start in the audio must have a caption on it;
   - no caption may start in silence.

Exit code 0 means every check passed; 1 means something is listed in `over_tolerance`.

## Reading the report
- `worst_ms`: the furthest any measured caption is out. Under 50 is the bar.
- `over_tolerance`: each problem with its time. Kinds: an onset more than the tolerance away, "starts in silence", or "phrase start with no caption on it".
  - Fix by hand in the `.ass` file: each word's lines start with `Dialogue:`, and the start time is the second field. Then burn it again with ffmpeg (`-vf "ass=<file>.ass"`).
  - Or tell the user which words they are.
- `measured` lower than `captions` is normal: words inside connected speech have no pause before them to measure.

Before handing it back, play the clip or pull two frames with ffmpeg and look at them. Check that the box sits behind one whole word and that nothing covers a face.

## Limits
- English only as written. Change `language="en"` in the script for other languages.
- It captions speech. Song lyrics over loud music sync badly; use `--voice` with a clean vocal if you have one.
