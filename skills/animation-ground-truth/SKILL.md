---
name: animation-ground-truth
description: A house animation style for motion graphics and faceless reels. Current method is "camera through a built scene": build a real-feeling scene (world, props, characters, lighting) and move a virtual camera through it (pull back, dolly zoom, crane and land, orbit, zoom-through, follow) instead of animating drawn objects popping in. Also keeps the alternate "breakout card" style spec (cards with characters breaking over the borders), a split-screen presenter style and an images-first workflow. Use for faceless animated reels, explainers and any code-made animation. Not for plain live-action talking-head takes (use reel-style).
version: 2.0
---

# Animation Ground Truth: Camera Through a Built Scene

Technique inspired by: @science_in_8bit (Instagram)

Pick one house style for every animated piece in a project so everything looks like one series. The current default is the camera-through-a-scene method below. The older breakout-card style is kept further down as an alternate; use it only when a brief asks for it by name.

## Setup
- Remotion (`npx create-video@latest`) or any code-based animation tool; Three.js or Blender-exported scenes for true 3D; ffmpeg for contact sheets and QA.
- Optional, images-first workflow only (section 9 of the alternate style): an image generator of your choice. Never pay for or run a paid generator without explicit OK.

## The rule (one line)

Build the full scene first. Then move a virtual camera through it. The camera move is the animation.

## What that means in practice

| Do | Don't |
|---|---|
| Set up a 3D or 2.5D world: background, mid-ground, hero prop, lighting, characters already placed. | Draw and animate individual shapes popping in, bouncing or sliding onto a flat canvas. |
| Author the shot as a camera path: start frame, end frame, with an ease. | Author the shot as a layer stack where each element has its own entrance animation. |
| Use named cinematic moves: Pull Back (reveal scale), Push In (intensity), Dolly (travel), Crane Up + Land (god's-eye to intimate), Orbit (show it from all sides), Rack Focus (lead the eye). | Use generic "fade in, slide up, bounce". |
| One or two beats per shot; let the camera breathe (1.2-3 s per shot). | Stack ten micro-animations on one card. |
| Make the world in the shot feel real (depth, parallax, consistent lighting), even if stylised. | Float UI chips on a plain background and call it a scene. |
| Put characters in the scene, on the ground with the props, and let the camera find them. | Sit characters on top of a "card" doing pop-up gestures. |

## Reference cinematic moves

The source reel teaches the catalogue as a split-screen hook (same scene, "no camera" vs "with camera"), then walks three moves across flat-colour illustrated harbour scenes:

1. **Pull Back.** Start close on the subject, pull the camera out to reveal the wider scene. Shows scale and context.
2. **Dolly Zoom.** The camera physically moves while the lens zooms the opposite way, so the subject stays the same size and the background warps. Shows unease, importance or realisation.
3. **Crane Up + Land.** Start high, drop down and in on the subject, land at eye level. Shows arrival, discovery, "you are here".

Additional moves that work well in explainers:
4. **360 Orbit.** The camera arcs around a hero object (a bottle, a brain, a server box) so the viewer sees every side. Good for "look at the thing we built".
5. **Zoom-through.** The camera flies into a scene, through a layer, and out the other side into a new scene. Good for transitions (outside a building to inside the team room).
6. **Follow / travel.** The camera tracks an element in motion (a package, an invoice, a signal) through the scene.

## Build pipeline

1. **Plan the camera first.** For every beat, write start pose, end pose, ease and duration before touching textures or extras.
2. **Build the world, then light it.** Use Remotion for 2D/2.5D, Three.js or Blender for 3D. Lock depth and lighting before placing characters.
3. **Place characters and props in the world** at a specific location. The character does not float in; the camera finds the character.
4. **Render the camera move at full frame rate (30 fps minimum).** No stepped frame rates, except possibly one deliberate beat, never the whole reel.
5. **Side-by-side before anyone sees it.** Diff against your reference frame for frame and fix what doesn't match. A contact sheet of the render (`video-contact-sheet` skill) makes this quick.

## Scope

Use for: faceless animated reels, product explainers, office or world animations, site videos, and any motion-graphics piece, by default.

Do not use for:
- Live-action talking-head takes (use the `reel-style` skill).
- Pure UI screen recordings where the "camera" would just be a scroll. Those are their own format.

## Companion skills

- `numbered-technique-showcase-reel`: the hook format from the source reel (split-screen before/after, numbered moves, social-proof CTA). Use when the reel itself teaches a technique.
- `one-to-one-style`: copying a specific reference reel at a chosen fidelity.
- `cinematic-director`: move vocabulary and lensing.
- `motion-graphics-render-loop`: the render and critic cycle.

---

# Alternate style: Breakout Card

Previous default, kept for when a brief asks for "breakout card". Otherwise use the camera-through-a-scene method above. (Where the two conflict, for example "no camera moves", the rules below apply only inside a breakout-card piece.)

Source: studied frame by frame from public Instagram reels. This file is written so it works without the reference.

---

## 1. What the breakout-card look is

A vertical 9:16 reel where the primary visual unit is a **card**: a rounded-rectangle panel with a visible border and background, from which animated elements physically **break out** over the card edges. The card acts as a stage; characters, icons, bar charts, pixel-art monsters and UI widgets have their feet or lower halves inside the card while their heads, hands and highlights pop above the top edge into free space.

| Element | How it looks |
|---|---|
| Cards | Rounded rectangles, cream/off-white or lightly coloured fill, thin dark border, drop shadow. Vary in size from small info chips to near full-screen. |
| Breakout subjects | Animated characters, emoji-scale monsters, icons and rendered figures stand ON TOP of or lean OVER the card border: torso inside, head outside. |
| Pixel/game aesthetic | Small 8-bit-style monsters in primary colours (red, orange, teal, green) sit on or around the cards, giving a playful game-UI feel. Design your own; never copy existing game sprites. |
| Data viz | Bar charts, percentage numbers (e.g. "49%"), status indicators animate inside cards. Numbers tick up, bars grow, status dots pulse. |
| UI overlays | Real or realistic app UI panels (a chat interface, spreadsheet rows, connector toggles) appear inside cards and animate (rows highlight, toggles flip, text types). Prefer real screenshots of the real product. |
| Typography | Bold, friendly sans-serif for numbers; smaller clean sans for body text on cards. Captions outside cards are white, word by word, bold. |
| Colour | Warm-neutral background behind the cards (#F5F0E8 range). Cards are cream or very light. Accent colours come from the characters and UI elements, not from the card itself. |
| Background | Flat warm off-white / light beige. Nothing textured or busy. Cards float on this. |

---

## 2. Animation style (motion rules)

Every animation job must hit all of these:

1. **Breakout entrance:** cards slide or scale in from slightly off-screen (below or side), settle with a short spring overshoot (~3-5% overshoot, settle in ~0.25 s). The breakout subject appears slightly after the card, popping up over the edge with a small bounce.
2. **Element-by-element reveal:** content inside a card does NOT appear all at once. Each row, number, icon or UI element appears in sequence with ~80-150 ms stagger. A typewriter for the whole layout.
3. **Number tickers:** any stat or percentage animates from 0 (or a lower number) to its final value, easing into the end. ~0.5-1.5 s depending on the magnitude.
4. **Toggle flips / status pings:** toggles flip on with a short horizontal squish. Status dots appear with a quick scale pulse (0 -> 1.2 -> 1.0 in ~0.2 s).
5. **Pixel character bounce:** characters hop in with a small arc and settle. Idle: subtle float loop (+/-4 px, ~1.5 s period). They do NOT walk across the screen; they land and bounce.
6. **Cut rhythm:** hard cuts between major scenes, ~2-4 s per card. No dissolves. Brisk but readable: a viewer on a phone should be able to read the card before the cut.
7. **Camera:** no camera moves within a scene. Static frame. The motion IS the card animation.
8. **Exit:** cards either snap out (hard cut to next) or shrink away quickly (scale to ~0.8, opacity 0, ~0.15 s). Outgoing and incoming cards never overlap.
9. **Captions:** white, bold sans, word by word, appearing on the spoken word. Bottom-centre safe zone. Never on top of a card's key content.

---

## 3. Content on the cards

- **Data / proof cards:** one striking number ("49%", "50%+", a count) + a short label below it. The number fills roughly 40% of the card height.
- **List/status cards:** a short list with status indicators (green tick, red X, spinning loader). Each row animates in sequence.
- **UI replica cards:** the relevant part of an app screen, cropped to show ONLY the action, no chrome clutter. Rows highlight, text types, buttons click.
- **Person + card combos:** a small illustrated figure stands behind or on a card, giving human scale to the data point.
- **Connector/tool cards:** logo or icon on the left, toggle or status on the right. Two per screen max.

Tone: direct, proof-first. The card shows the result or the step; the voiceover explains WHY. No empty decorative cards: every card carries a fact, a step or a result.

---

## 4. Typography

| Role | Style |
|---|---|
| Big number on card | Bold display sans, ~72-96 pt equivalent, dark ink on cream card |
| Card label / descriptor | Clean sans, ~16-18 pt, medium weight, muted colour |
| Card list rows | Clean sans, ~14-16 pt, regular weight |
| Voiceover captions | White, Inter ExtraBold or equivalent, ~88 pt, word by word, bottom-centre |
| Accent / highlight text | Red or brand accent, sparingly, one word per card max |

No serif on the cards. No text that wiggles or bounces: text staggers in but does not deform.

---

## 5. Colour palette

| Token | Value / description |
|---|---|
| Card background | Cream / off-white, approx #F7F3EC |
| Card border | Dark grey-brown, ~1-2 px |
| Canvas background | Light warm beige, ~#EDE8DE |
| Character 1 | Bright red/orange monster |
| Character 2 | Teal/cyan monster |
| Character 3 | Green monster |
| UI highlight | Blue (from the app UI chrome) |
| Accent / CTA | Red (same family as the characters) |
| Caption text | Pure white |
| Shadow | Soft, dark, ~10-15% opacity |

No gradients on cards. No transparency on cards (solid fill). No dark-mode cards.

---

## 6. Pacing and structure (scene grammar, ~45 s reel)

- **Opening hook (0-4 s):** one bold card slides in with a provocative statement or number. Breakout character appears. No intro title card, no logo.
- **Problem / proof block (4-20 s):** 3-4 cards in quick succession, each proving the problem. Status/list cards with animated rows. Percentage tickers.
- **Solution reveal (20-35 s):** tool or workflow cards. UI replicas animate step by step. Toggles flip on. A simple agent/workflow diagram if needed.
- **Result card (35-40 s):** outcome number or result state. Ticker or growing bar.
- **CTA card (40-45 s):** comment-prompt card, typed letter by letter, breakout character beside it pointing.

Total: 8-14 distinct cards across the reel.

---

## 7. When to apply this style

Use it for: faceless animated reels, workflow/tool/technique explainers, animated data points, and any code-generated or AI-generated visuals (anything that isn't live footage of a presenter).

Don't use it for: live-action talking-head takes or hook segments inside a talking-head reel (use the `reel-style` skill).

---

## 8. Supporting techniques (from other public reels in the same family)

These supplement the core style. If anything conflicts, sections 1-7 win.

### A. Effects series
Build a library of named effects (match-cut, shutter-strike, screen-push transitions; a liquid-glass overlay; a retention % badge) and show them in rapid succession: the effect name appears as a caption, then it demos for 1.5-2 s. An "effect of the day" grid (a 4x4 mosaic of thumbnails) at the end is a recognisable series format.

### B. Video breakdown sheet (do this on every edit)
Before asking Claude to edit any animated video, first produce a breakdown sheet: timestamp, scene name, animation type, what is on screen. Reference the sheet row in every later edit prompt ("row 7: make the ticker land on the beat"). This dramatically reduces mis-targeted edits.

### C. Name your effects
Give every animation a name ("Gravity Drop intro", "Kinetic number ticker", "Jiggle delete exit", "Prompt Bar", "Icon Strike", "File Drop", "Comment Drop") and use the names in prompts. For a tutorial reel, a persistent side panel listing the steps with the active one highlighted is a clean structure.

### D. Images-first (see section 9)
Generate one still per scene in the target style, then animate the pieces of each still in code.

### E. Hybrid presenter + animation (same style family)
- **Split screen:** animated illustration / pixel art / app UI in the top 40-50%, presenter on camera below. Repeat the split every scene.
- **Agent-swarm scatter chart:** dozens of pixel characters scattered across a single left-to-right axis (e.g. income levels); each character IS a data point. Use it for population/distribution data instead of a bar chart.
- **Live terminal output card (dark):** a dark terminal window with numbered rows, a status per row (green/red/running) in monospace. Pair it with a pixel character watching it whenever an automation is "running".
- **Role-as-pixel-scene:** show abstract roles (a board, a finance team) as small pixel-art environments, not just icons.
- **Install-flow diagram:** a plain two-step diagram (web page -> red arrow -> app window) on clean white, no card border, for setup explainers only.
- **Captions** in this variant: white, all caps, bold sans, word or phrase at a time, on a rounded dark pill.
- **CTA card:** rounded dark card, red Follow and Comment buttons, text types in.

### F. Sibling style: talking head with floating product inserts (live action, NOT breakout cards)
A real presenter in a real room, alternating with floating product mockups. Don't apply the pixel/breakout treatment here.
- **Presenter framing:** medium close-up, chest to top of head, in the lower ~45% of frame; camera slightly below eye line; close, phone-native framing; ~1 head-height of headroom; hands visible and gesturing.
- **Presenter background:** warm, dim home office: wood panels, warm Edison-bulb bokeh, out-of-focus plants, shallow depth of field, soft front-left key light, ~3200-3800K. Cognac/amber/green palette. Or composite the presenter onto a matching backdrop, or a clean white studio.
- **Two alternating modes:** (1) full-frame insert: a rounded browser/device mockup floating on white or a faint near-white grid, drop shadow, no bezel chrome; (2) split: product mockup in the top ~55%, presenter strip in the lower ~45%, divided by a soft edge.
- **CTA frame:** breaks the split; the presenter fills the frame with a white comment-box bar floating over them, a keyword half-typed.
- **Caption badge:** ALL CAPS, 1-4 word bursts, white text in a dark (~#2A2A2A) rounded pill, centred between the two zones.
- **Labels:** stylised serif-italic labels in salmon/coral on the white sections ("Delete these", "Swap in your subject"); section headlines in large dark serif or display type.
- **Inserts:** a polished 3D opener (objects tumbling with light physics), zoom/push-ins on a site headline, a mid-reel dark charcoal (~#1A1A1A) feature panel, small UI cards (input field, style selector, example thumbnails).
- **Pace:** 2-3 hard cuts per 5 s in the middle; presenter moments 3-5 s at open and close; inserts 1-2 s each; ~14-18 shots in ~32 s; no dissolves.
- **Sound:** voiceover throughout, little or no music, no whooshes; pacing follows speech, not a BPM.

---

## 9. Images-first workflow

When the scenes need illustrated art rather than screen recordings or UI mocks:

```
1. Script -> scene list (one image per 2-4 s of final video)
2. For each scene: one still image in the target visual style
   - breakout-card: the card layout as a flat design, then animate elements on top
   - illustrated/collage: the whole scene as one image, then animate its layers
3. Pass the image(s) + an animation spec to Claude
4. Claude writes code that separates visual regions, applies spring/ease motion to each,
   composites frames, outputs mp4
5. Add captions (word by word, synced to audio) and audio
6. No video model needed, no per-second video generation
```

Cost note: image generation is per image, not per second of video. A 45 s reel at ~4 s per scene is ~11 images. Tell the user the image count before anything is generated, and let them choose the tool.

---

## 10. Hard rules

- Every animation in a breakout-card reel matches this spec in feel, pacing and card style. If unsure, build a contact sheet of your render (`video-contact-sheet` skill) and compare it with sections 1-6.
- No scroll-driven or scroll-triggered effects.
- No live-action presenter footage inside fully animated breakout-card reels; for hybrid reels use section 8E.
- Never post or publish; hand the render to the user.
- Never spend on image generation without the user's explicit OK.
- If a reel needs a live-action talking-head segment, use the `reel-style` skill for that segment.
