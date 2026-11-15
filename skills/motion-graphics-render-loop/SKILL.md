---
name: motion-graphics-render-loop
description: Make premium coded motion-graphics reels (spring physics, real UI assets, cuts locked to a beat) with Remotion, plus a self-critique loop that hunts dead frames. Use for product promos, explainers, "motion graphics reel", "animate this", or any "animation in this style" request. No paid AI video needed.
---

# Motion-graphics render loop

Claude doesn't make video directly: it writes code that paints every frame. Remotion (React for video) does the rendering, so the output is crisp, on-brand and repeatable, with no AI-video wobble.

## Setup
- Node 18+ and Remotion (`npx create-video@latest` in the user's project folder).
- ffmpeg on PATH for frame extraction and contact sheets.

## The style
- Coded 2D motion graphics: real-looking UI cards and screens (chat box, product card, dashboard, phone screen, calendar), not clip-art.
- Two looks that work:
  - warm cream or off-white with dark text and one accent colour
  - near-black with one bright accent
- Motion is spring physics: overshoot, then settle. Use snap or stretch on entrances and eased draw-on lines. Never use default linear or CSS easing. Avoid "ALL CAPS centred text on a gradient", which reads as AI slop.
- Every cut and key hit is locked to the beat, e.g. 120 BPM with a cut every 2 beats. SFX sit on the same grid.
- Pacing: a new visual about every 1.5–3 s, one idea per shot, and text on screen long enough to read.

## Recipe
1. **Brief:** one sentence of message, the audience, 3–6 beats and the BPM. Collect REAL assets first: product photos, screenshots, logo, brand fonts. Reference frames beat adjectives.
2. **Set up once:**
   - a Remotion project (`npx create-video@latest`) with fonts and colour tokens
   - a `spring()` helper: damping 12–18, stiffness 120–200, mass 1
   - a beat clock: `beatFrame = Math.round(fps * 60 / BPM)`
3. **Build** one `Scene` component per beat inside `<Sequence from={n * beatFrame * k}>`. Use `spring` or `interpolate` for every property; never CSS transitions.
4. **Audio:** a licensed track at the target BPM, preferably one that doesn't obviously loop. Place SFX on the hits with `<Audio>` at beat frames.
5. **Draft:** render low-res with `npx remotion render --scale=0.5`.
6. **Critique loop (the real secret):**
   - Extract frames: `ffmpeg -i draft.mp4 -vf fps=10 f%03d.png`.
   - Build contact sheets and grade each scene out of 10 on: something moving every 0.5 s, readable text, clear hierarchy, cuts on the beat.
   - A dead frame is one where nothing moves for more than 0.7 s or the text is unreadable.
   - Fix, re-render only those scenes, and repeat until every scene scores 8/10 or more.
7. **Final:** render 1080x1920 at 30 fps, then QA it against the brief before handing it over.

## Timing rules
- Entrance takes 8–14 frames; the spring settles by about frame 20. Hold text for at least 1 s per ~6 words. Shots run 0.8 s minimum, 3 s maximum.
- Cut on the beat, never between beats. Text lands on the beat and settles within half a beat.
- One accent colour per scene, 2 type sizes max. Safe margins: 120 px at the sides, 250 px at the bottom for captions and the IG UI.

## Component checklist
SpringCard, TypeReveal (word by word), CaptionPill, BeatClock, SceneWrapper, UIMock (chat, product, calendar etc. built in HTML, not images), LineDraw (SVG path), CounterTick, CursorClick, Transition (push or mask wipe), EndCard (CTA), SfxTrack, DeadFrameChecker (a script that flags spans where consecutive frames barely differ).

## Limits
- Hand-drawn illustration (characters, 3D) is slow in code. Isometric and icon styles need a component library built once.
- Music needs a licence. This skill uses no paid AI video, voice or audio generation; if the user wants any, they choose and run it themselves.
