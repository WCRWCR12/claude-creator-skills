---
name: logo-animation
description: Animates a logo in code, no After Effects: it draws the logo in lines, explodes it into parts, and snaps it back together in about four seconds, then renders an MP4 (and a transparent version) you can put at the end of every reel or video. Recolour or restyle it by asking ("make it green", "slower", "add a bounce"). Use when someone says "animate my logo", "logo sting", "logo intro/outro", "logo reveal", or gives a logo file and wants it moving.
---

# Logo animation (coded, Remotion)

Turns a logo file into a 4-second animated sting, built with **Remotion** (React video). Everything runs on the user's computer. Free.

## What you need from the user

1. The logo file. **SVG is best.** PNG/JPG works (see step 2). Ask for the version on a plain background.
2. Brand colours (or read them from the logo). Background colour for the video (default: white).
3. Size: square 1080x1080 (default), 9:16 1080x1920 for reels, or 16:9 1920x1080.

Check tools: `node --version` (18+). If missing, show the install command (Windows `winget install OpenJS.NodeJS.LTS`, Mac `brew install node`) and wait for a yes.

## Steps

### 1. Set up the project
`npx create-video@latest logo-sting --template blank` (accept defaults), then `cd logo-sting && npm install`. Put the logo in `public/`.

### 2. Get clean vector parts
- **SVG**: read it. Split it into its natural parts: each separate `<path>`, `<circle>`, letter or shape group becomes one "part". Aim for 3 to 12 parts. Normalise the viewBox.
- **PNG/JPG**: trace it to SVG. Use `npx potrace-cli` or `npm i potrace` (one colour layer per brand colour), or, for simple marks, redraw the shapes by hand as SVG paths that match the original. Show the user the traced SVG next to the original and get an OK before animating. Never ship a wobbly trace.

### 3. Build the composition (4 s at 30 fps = 120 frames)
One component, `LogoSting.tsx`, with props `{colors, background, speed}` so recolouring is a prop change, not a rebuild.

| Frames | Beat | How |
|---|---|---|
| 0-40 | **Draw in lines** | Each part rendered as an outline: `stroke` = brand colour, `fill="none"`, animate `strokeDashoffset` from the path length to 0 (`getLength()` from `@remotion/paths`). Stagger parts by 3-4 frames. |
| 30-50 | **Fill** | Fade the fill in under the stroke (`interpolate` 0→1), then fade the stroke out. |
| 50-75 | **Explode** | Each part moves outward from the logo centre along its own direction (part centre minus logo centre), 120-250 px, with a small rotation (±15-40°) and slight scale. Use `spring()` so it feels physical, not linear. |
| 75-100 | **Snap back** | Spring each part home (`damping` ~12, `stiffness` ~180) with a small overshoot. Add one subtle scale pulse (1.0→1.04→1.0) on the frame it locks. |
| 100-120 | **Hold** | Logo still and centred, clean. Optional wordmark slides up underneath. |

Rules: springs for every move, nothing linear. No glows, gradients, lens flares or drop shadows unless the brand already uses them. Keep the logo's exact proportions and colours. Optional depth: split into layers and give each a slightly different explode distance (parallax).

### 4. Preview, check, render
- `npx remotion studio` to preview. Then render a contact sheet of frames 0, 20, 40, 60, 75, 90, 119 and look at them: the drawn lines match the logo, the parts don't fly off-frame, and the final frame is identical to the original logo.
- Render: `npx remotion render LogoSting out/logo-sting.mp4` and a transparent version for overlays: `npx remotion render LogoSting out/logo-sting.mov --codec=prores --prores-profile=4444`.

### 5. Variations on request
- "Make it green" / "dark version": change the `colors` / `background` props and re-render. Nothing else changes.
- "Faster/slower": `speed` prop scales every frame range.
- "Add a sound": a short whoosh on the explode and a click on the snap (user supplies the audio or picks a royalty-free one).

## Hand-over
Tell the user where the files are (`out/logo-sting.mp4`, `out/logo-sting.mov`) and how to add it to the end of a reel in CapCut, Instagram Edits or any editor (drag it onto the timeline after the last clip).
