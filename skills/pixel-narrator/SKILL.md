---
name: pixel-narrator
description: Build a coded pixel-art narrator character in Remotion, a Stardew-style game portrait that pops up in the corner of a reel, lip-syncs to the voiceover, and pops away for motion-graphics-only beats. Use when a creator wants a game-character version of themselves or a host character over motion graphics. Remotion code only, no image or video generation.
---

# Pixel narrator

A game-style host character, drawn in code. Nothing is generated. Lessons from three iterations: a hand-drawn 60 px sprite read as a caricature; a sprite built from photo pixels was "mega creepy" and its pointing hand read as a rude gesture; the third approach (below) works.

## Hard rules
- **Never build the sprite from the photo's pixels, and never use a single raised finger.**
- **Hands are real fingers plus a separate thumb, never a mitten or tube.** Open hand: four 2-px fingers fanned, a 1-px dark line between each, rounded tips of different lengths, thumb angled out with a gap, palm crease, wrist and sleeve cuff, about 12-16 px wide. Fist: knuckle bumps on top, finger seams, tucked thumb. Check the hand as a black silhouette at 4x; if it could read as anything but a hand, redraw it.
- It must read as a video-game character first and as the person second. If it looks like a filtered photo, it fails.
- Match hair and beard colour to the real person. Check the palette, since a wrong tone changes the whole read.

## What the output looks like
A Stardew Valley / SNES RPG dialogue portrait: head and shoulders, 56 x 64 pixels, bold dark outline, about 15 flat colours, slightly big head, friendly simple face. It sits on a small dark plate in the bottom-right corner, about 448 px wide on a 1080 px frame. It pops up from the bottom edge, explains a line with its mouth moving to the voiceover, blinks, bobs a pixel, holds out an open palm to present the graphic, then pops away so the motion graphic gets the whole frame.

## Drawing a game sprite of someone (in code)
- Grid 48 to 64 px tall. Build it from simple shapes in drawing order, each with a 1-px dark outline: shirt, neck, ears, face, beard, faded sides, hair, then brows, nose, eyes, mouth.
- Palette of 12 to 16 colours, two or three tones per material (light edge, base, shade edge).
- Game proportions: head slightly big, slim face tapering to the chin, simple features. Eyes are a lid line plus a 3-cell eye (one catchlight, iris, dark), a 2-cell nose shade, a 1-px mouth line.
- Hair as round clumps, each with a dark crescent and a highlight pixel. Keep it tight, not a helmet.
- Use the photo only to pick colours and key features (hair, beard, skin tone, eye colour, brows, a signature accessory).
- Check: put the sprite, a game-portrait style description and the photo side by side. Ask: is it creepy? Does it read as a game character? Could any hand read as rude?

## Making it narrate from a voiceover file
- `useAudioData` plus `visualizeAudio` per frame; average the speech bins and divide by the voiceover's own 90th-percentile loudness. Mouth: closed below 0.15, small below 0.4, open below 0.75, else wide; average with the previous frame so it doesn't flicker.
- Blinks every 2.3 to 5 s (seeded `random()`), 1-px bob every 6 frames while talking.
- Off-screen it isn't drawn at all, so lip-sync only happens while it is visible.

## Popping in and out (the important rule)
- `appear={[[start, end], ...]}` in frames. In: rises from the bottom edge and scales 0 to 110% to 100% in 2-frame steps over 7 frames. Out is the reverse. Outside the windows the motion graphics have the full frame.
- It appears on the hook, on lines where it explains something, and on the CTA.
- It is off for pure demo or visual beats (screen recordings, graphics doing the explaining).
- Roughly half the beats on, never all of them. Plan the graphics so they can grow to full frame when it is off.

## Poses
Hands are drawn hands (see hard rules), never a lone digit. `talk` (no arms), `present` (open hand, palm out, fingers fanned, with a small gold sparkle: use when the line names the thing on screen, or on the payoff), `think` (front-view fist with knuckles and tucked thumb under the chin: the problem line). Switch with `poses={[{ at: seconds, pose }]}`. Arms stay inside the plate.

## Where it sits
Bottom-right, 48 px from the right edge, 110 px up. It never covers the motion graphic: keep the graphic in the top ~1250 px while the character is on, and keep captions clear of its box.

## Calling it in a reel
```tsx
import { PixelNarrator } from "../characters/PixelNarrator"; // your own component
<PixelNarrator audioSrc={staticFile("vo.wav")} playAudio={false}
  appear={[[0, 90], [210, 330], [520, 600]]}
  poses={[{ at: 7.5, pose: "present" }, { at: 11, pose: "talk" }]} />
```
- `playAudio={false}` when the reel already plays the voiceover; `audioStartFrom` (frames) if it is trimmed.
- Put it last in the tree so it draws above the graphics. Inside a `<Sequence>`, frames are relative to it.
- Export a `popProgress(frame, appear)` helper so the graphics can grow when the character leaves.
