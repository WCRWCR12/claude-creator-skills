---
name: animation-ground-truth
description: A complete spec for the "breakout card" animation style for 9:16 reels - richly decorated cards where animated characters, data viz and UI elements physically break out of or sit on top of card borders - plus a sibling split-screen talking-head-with-inserts style and an images-first animation workflow. Use for faceless animated reels, animated explainers, workflow/tool explainers, any code-made animation, or "make it look like that breakout-card style". Not for plain live-action talking-head takes (use reel-style for those).
version: 1.0
---

# Animation Ground Truth: Breakout Card Style

**Source:** the style was studied frame by frame from public Instagram reels (main reference: instagram.com/reel/DewfwFatY8F, Oct 2026). Use the reference reel as a visual check if you can view it; this file is written so it works without it.

Pick this as the one house style for every animated piece in a project, so every animation and every piece of animated content looks like one series.

## Setup
- Remotion (`npx create-video@latest`) or any code-based animation tool; ffmpeg for contact sheets and QA.
- Optional, images-first workflow only (section 9): an image generator of the user's choice. Claude never pays for or runs a paid generator without the user's explicit OK.

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
