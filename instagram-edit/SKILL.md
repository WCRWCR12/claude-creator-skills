---
name: instagram-edit
description: Write and edit talking-head Instagram Reels and TikToks. Writing covers hooks, hook stacking, script structure, CTAs and a pre-filming checklist (references/WRITING.md). Editing turns raw clips into finished 9:16 reels with tight cuts, captions, punch-in zooms and motion graphics (XP pops, level-up banners, progress bars, counters, callouts, keyword slams, icon pops, B-roll slots), silent by default, using a local pipeline (faster-whisper + ffmpeg + Remotion). Use when the user says "help me write a script", "write me a reel", "give me a hook", "script this idea", "edit my video", "edit this reel/clip", "make an Instagram edit", "TikTok edit", "cut this down", "add graphics", "add captions", or gives notes on an edit ("fix the cut", "audio is clipped", "more graphics").
---

# Instagram / TikTok write + edit

## Which file to read when

| The user asks for... | read first |
|------------------|-----------|
| a script, hook, CTA, "what should I say", an idea turned into a reel | `references/WRITING.md` (formulas, templates, checklist; section 6 = how to answer) |
| an edit of a clip | `references/RULES.md` + `references/GRAPHICS.md`, then the run steps below |
| "do it like <reference>" | study the reference with the `video-contact-sheet` skill first, then write its numbers into `RULES.md`/`rules.json` as a named preset |

When a script is written here, mark each beat with its visual; after filming, those notes become the graphics plan.

Files in this skill:

| file | what |
|------|------|
| `references/RULES.md` | house style for cuts, captions, sound, output, plus the teaching log. Read first. |
| `references/GRAPHICS.md` | house style for graphics: vocabulary, zones, density, originality. Read first. |
| `references/WRITING.md` | script-writing guide: hook formulas, hook stacking, structure templates, CTA patterns, pre-filming checklist |
| `references/rules.json` | the numbers behind RULES.md (pads, snap, zooms, captions, face box, size cap) |

## Setup (one time, in the user's project folder)

- ffmpeg on PATH, Python 3.9+, `pip install faster-whisper numpy`.
- Node 18+ and a Remotion project for the graphics stage: `npx create-video@latest` inside an `edit/remotion/` folder in the user's project. Claude builds the components below the first time and reuses them after.
- Work folder layout (create it in the user's project): `edit/raw/`, `edit/broll/` (optional clips and images the user supplies), `edit/out/` (all outputs).

## Run it on a new clip

1. **Cut.** Use the `reel-cutter` skill on the raw clip (`--max-gap 0.35` for this house style, or 0.1 for very tight reels). It drops fillers, stutters and abandoned takes, keeps the last take, and checks every join by listening. Then write `<name>-words.json`: every kept word with `t_start`/`t_end` on the NEW (cut) timeline (transcribe the cut file with faster-whisper, word timestamps on). Grab one frame (`ffmpeg -ss 2 -i cut.mp4 -frames:v 1 frame.jpg`) to set the face box.
2. **Plan graphics.** Read `GRAPHICS.md`, the words file and the frame, then write `<name>-graphics.json` (format in GRAPHICS.md). Check it before rendering: every type is in the vocabulary, times sit inside the clip, no gap over 4.5 s without an event, no two top-zone overlays at once, nothing in the CTA's last 1.5 s except one small graphic.
3. **Render with Remotion.** One component per graphic type (`Graphics.tsx`), a timeline (`Edit.tsx`) that plays the cut video with smooth punch-ins (RULES.md rule 6), draws captions in the RULES.md look, and places each event in its zone. Render 1080x1920, 30 fps. Normalise loudness to -14 LUFS with ffmpeg `loudnorm` afterwards. If the file is over the size cap, re-encode at a lower bitrate.
4. **Stills.** Export one frame per graphic (`npx remotion still` at each event's midpoint, or ffmpeg `-ss`) into `<name>-stills/`.

Captions can also come from the `caption-sync` skill instead of Remotion (burn them after the Remotion render).

## Checks before handing over (always)

1. Every cut lands in silence: the reel-cutter report is clean, and the kept words read as the final take of each line.
2. Read 6+ stills (or tile them with ffmpeg into one sheet): every graphic visible and readable, off the face, nothing in the top 12% / bottom 20% / right 12%, nothing on the caption line. Fix the plan (zone, shorter text, timing) or the component, re-render, re-check.
3. Output under the size cap in `rules.json` (`max_mb`).
4. Tell the user: path, length, size, the graphics timeline, and any B-roll slots that still need clips.

## Teaching loop (the user's notes)

The user watches and gives notes. For every note:
1. Add a row to the teaching log in `RULES.md` (cuts/captions/sound) or `GRAPHICS.md` (graphics): `| date | what was said | what changed |`.
2. Change the rule text AND the number in `rules.json`, or the Remotion component, or the planning guidance in GRAPHICS.md, so the next edit follows it without being told.
3. Re-run (the transcript is cached, so it's quick) and hand back the new version.

## Hard rules

- Never post, upload or schedule anything. The user reviews every edit and publishes it themselves.
- No paid APIs, no spending. Everything runs locally.
- All graphics original: no game logos, sprites, fonts, screenshots or trademarked art, no downloaded copyrighted audio. Generic gaming-HUD style is fine.
- No sound effects by default. Graphics are silent unless the user asks for SFX.
- Only write inside the user's `edit/` folder (and npm installs inside `edit/remotion/`).
