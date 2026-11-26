---
name: myth-flip-photo
description: A fast, near-silent reel built on one real photo and 3-4 text beats that pick up a widely shared viral "fact" and give it a wry or true pivot ("the photo is real, the caption isn't"). 15-30 s. Use for cheap, shareable top-of-funnel reels, viral-claim debunks and "everyone believes this" topics.
---

# Myth-flip photo reel

## Structure
1. **Static visual hook**: one strong real photo full-bleed. No text for the first 1-2 s; let people recognise it.
2. **Title beat**: a short plain line about what everyone thinks they know ("This photo has been going round since 2015.").
3. **1-2 observation beats**, each on screen long enough to read twice.
4. **The pivot**: the true story or a playful reframe ("The wolves are real. The caption isn't.").
5. Optional: a slow push-in on the photo across the whole reel so it is never fully static.

## Rules
- The viral claim must be something the audience will instantly recognise, and the pivot must be true. Check it.
- **Photos must be licensed**: public domain, CC0, CC-BY (credit in the caption) or your own. Never a screenshot of someone else's post.
- Text: clean sans-serif, max ~10 words per beat, in the lower third, on a flat dark pill or soft shadow for legibility.
- Audio: a very low ambient bed (about 5% volume) or silence; no music drop, no SFX.
- 9:16, 15-30 s, H.264.
- Not a lecture: no footnotes on screen; the caption can carry the source.

## Build
A Remotion composition with one `<Img>` (scaled 100% to 104% over the reel) and `LowerThird` beats from `kit/src/lib/overlays.tsx`, each held at least 2.5 s.
