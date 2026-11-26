---
name: reel-studio
description: The front door of the reel pack. Turns an idea ("make a 6-second animation of a tank firing", "make a reel about how a lock works") into a finished 9:16 MP4 using the crew, the house rules, the Remotion + three.js kit and the check tools. Use for any request to make, plan, storyboard, script, build, render or check a short-form video (Reels, TikTok, Shorts).
---

# Reel studio

You are a small film studio inside Claude Code. Everything is made in **code**: Remotion renders React (and three.js 3D) frame by frame into an MP4. No AI image or video generation is needed, nothing costs credits, and every render is repeatable.

Read `knowledge/house-rules.md` once per session before building. It is short and it is the difference between "coded animation" and a reel people watch.

## Quick path (a single shot or a short clip, under ~15 s)
Use this when the ask is one scene ("a tank firing", "a rocket lifting off"). If the ask is a myth, a "what if", a "which would", a man testing something, or names the blue grid studio, use the `myth-explainer` skill instead of the steps below.
1. **Plan in 6 lines** (write them in `projects/<slug>/NOTES.md`): what the viewer sees, the camera move (start pose, end pose, ease, duration), the light (key/fill/rim + haze), the key event frame(s), the sound on each event, the one line of lower-third text (or none).
2. **Copy the example scene**: `kit/src/scenes/HeroShot.tsx` to `kit/src/scenes/<Name>.tsx` and set `SUBJECT_WIDTH` / `SUBJECT_HEIGHT` to YOUR subject (its camera distances are computed from them with `fitDistance`; never reuse the example's numbers for a bigger subject). Register it in `kit/src/Root.tsx` with the right `durationInFrames` (seconds x 30).
3. **Build** in this order: camera keys, world (ground, set, hero object in metres, real proportions), light rig, events (one `const` per event frame, shared by FX, shake, SFX and text), overlays, audio. Helpers: `kit/src/lib/camera.tsx` (CameraRig, orbitKey, shake), `lighting.tsx` (GoldenHour, NightInterior, flicker), `fx.tsx` (Flash, Smoke, Debris, DustRing, Tracer, springKick), `overlays.tsx` (LowerThird, WordCaptions, Grain, HitFlash). Skill `scene-3d` has the technique; `hardware-hero-motion` for vehicles and weapons.
   Ready-made models: `kit/src/lib/models/Tank.tsx` (a detailed tank with turning wheels, moving tracks, turret, gun pitch, barrel recoil, suspension rock, antenna sway, and `tankMuzzleWorld()` to place FX at the muzzle). Reuse or adapt models before building from scratch.
4. **Check stills before the full render** (from `kit/`): `npx remotion still src/index.ts <Name> out/<name>-f<n>.png --frame=<n>` at the first frame, the key event, and the last frame. Look at each one (open the PNG) and fix before rendering if ANY of these fail:
   - the hero is fully in frame on the establishing shot (no cropped barrel/wheels/head) and fills roughly 40-70% of the frame width; on the key event frame the event itself (the muzzle and its flash, the impact point) is inside the frame;
   - the parts that tell the story are visible (the barrel when something fires, the wheels when it drives). For a firing shot the camera sits 40-140 degrees off the barrel axis, so barrel, flash and smoke read side-on, never filmed straight down the barrel;
   - no face of the subject is pure black; the subject separates from the background;
   - it sits on the ground, nothing clips or floats, scale looks real;
   - the camera is outside the subject at every key (lerping between distant keys can pass through it: use `orbitKey` for arcs).
   Stills are cheap, renders are not.
5. **Render**: `npx remotion render src/index.ts <Name> out/<name>.mp4` (from `kit/`). For a fast draft add `--scale=0.5`.
6. **Check**: contact sheet (skill `video-contact-sheet`), `python tools/check_flash_cuts.py kit/out/<name>.mp4`, `python tools/sound_check.py kit/out/<name>.mp4` (add the script file if there is a voice). Then the `first-time-viewer` agent on the render. Fix and re-render only what failed.
7. **Finish loudness, always** (the raw render is usually around -20 LUFS and fails the sound check; social target -15 LUFS, true peak under -1 dB):
   `python tools/finish_audio.py kit/out/<name>.mp4` (writes `<name>-final.mp4`: two-step gain + true-peak limiter; plain one-pass loudnorm overshoots on gunshots)

## Full path (a reel with a story, 20-90 s)
Run the crew as passes. Each crew member is an agent in `.claude/agents/`; each pass writes into `projects/<slug>/`.

| # | Pass | Who | Output |
|---|------|-----|--------|
| 1 | One-line promise: who is watching, what they get, how they should feel at the end | you + `writer` | top of NOTES.md |
| 2 | Facts: the true version, the numbers, what is contested | `contextualiser` | FACTS.md |
| 3 | Script draft 1: hook, beats, payoff, one CTA (skills `hooks-and-scripts`, plus a format skill) | `writer` | SCRIPT.md |
| 4 | Treatment: a feeling + a shot for every line; send back lines that cannot be shown | `director` (+ skill `cinematic-director`) | BOARD.md |
| 5 | Camera + lighting plan per shot (lens feel, height, move, key/fill/rim, haze, practicals) | `cinematographer` | NOTES.md |
| 6 | Script draft 2, rewritten to what can be shown; loop 4-6 until nobody marks anything (2-3 rounds) | writer + director + contextualiser | SCRIPT.md v2 |
| 7 | Table read with a free scratch voice (any local TTS) to set the clock | you | timings |
| 8 | Music + sound plan and the bed, made BEFORE picture (skill `sound-and-music`) | `music-director` | MUSIC.md + WAVs |
| 9 | Storyboard: one still per shot on the timeline; cold read | `first-time-viewer` | board PNGs + verdict |
| 10 | Build in layers: world, hero, FX, light, camera, text, sound | you | scenes in kit/ |
| 11 | Dailies: director checks every shot against BOARD.md | `director` | notes |
| 12 | Checks: flash cuts, sound check, contact sheet, cold watch of the final MP4 | tools + `first-time-viewer` | PASS |

Stop for the human's OK after the storyboard (pass 9) and before any paid voice or music.

## Format skills (pick one per reel)
- `mechanism-reveal`: "How does X do Y without Z?" Machine as the subject, 4-6 mechanism beats.
- `build-up-script`: number hook, 5-7 rungs where "you" fix each problem and cause the next, name said last.
- `myth-explainer`: one "what would really happen" idea, tested by a silent man in the blue grid studio in one-second shots with 1-3 word captions. It has its own kit (`kit/src/lib/myth/`), example scene (`kit/src/scenes/MythTwoBalls.tsx`) and script lint, so go straight to that skill for anything in this style, even a single short scene.
- `build-short-3d`: one continuous camera move while a thing assembles itself piece by piece.
- `myth-flip-photo`: one real photo, 3-4 text beats, a viral "fact" and its true pivot.
- `motion-graphics-render-loop`: coded 2D motion graphics locked to a beat, with a dead-frame critique loop.

## Non-negotiables (full list in knowledge/house-rules.md)
- The camera move is the animation. Build the scene, then move the camera through it.
- You must be able to see it at phone size (6 cm wide). Light the subject; mood second.
- Text in the lower third (y 1200-1680 of 1920). Never the top 400 px.
- No shot under 0.6 s. No decorative gradients. No tiny "technical" micro-text.
- Every line of voice keeps its last consonant plus a 150-250 ms tail.
- Music sits well under the voice, swells gently, and each reel gets its own bed.
- Facts must be right. Physics computed, not eyeballed.
- Mechanical gates passing is not the same as good: a cold viewer must be able to say what the video was about.
