---
name: anti-slop-ai-video-editing
description: Five rules for editing short-form videos with Claude without the output looking like AI slop (captions, imagery, image placement, cuts, motion graphics). Use whenever Claude is asked to edit, cut, caption or add motion graphics to a reel, TikTok or Short.
---

# Anti-slop AI editing rules (five, in order)

Source: technique taught in a public Instagram reel (instagram.com/reel/DfBBG0xPioN, Oct 2026), where a creator lists the rules he gives Claude Code before every edit. Rules below are restated, not quoted.

## 1. Captions and on-screen hooks

- **Captions:** TikTok style (bold sans, word by word). **Never italic serifs.**
- **On-screen hook text:** background = **no background OR solid white OR solid black.** Nothing else. No gradients, no coloured chips, no textured boards.

## 2. Imagery sources

- **Real screen recordings** of the actual product, dashboard or site. Not HTML/CSS mock-ups.
- **Images:** the creator takes or sources them and drops them in a reference folder in the project for Claude to pull from.
- **Never scrape** images automatically from the web. It risks copyright problems and platform bans.

## 3. Image placement

- **No animated images.** Claude's default urge is to Ken-Burns, float or parallax every still. Suppress it.
- **Vertical, straight.** No rounded corners, no white outlines, no drop shadows, no frames.
- Just the image, flat, in position.

## 4. Cuts

- **Cut every dead space longer than 0.1 s.** Plain cuts only (the `reel-cutter` skill does this).
- **No click transitions, no flashes, no whooshes.** They don't move the metric; the idea does.

## 5. Motion graphics

- **Occasional, not constant.**
- **Avoid the stacked-word kinetic-type burst** that gives away AI editing.
- Prefer graphics that draw a real structure or object (a diagram that builds, a UI that fills in, a number that ticks) for educational beats, over kinetic type. The `motion-graphics-render-loop` skill covers building these in code.

## Final frame

- A comment-keyword CTA works well ("comment X and I'll send you the guide"). Only promise what exists.
- Keep the ending clean and quick; the viewer either comments or doesn't.

## When this skill applies

Every time Claude is briefed to edit, cut, caption or add motion graphics to a short-form reel. The rules above override generic editing instincts. If the user's own house style (or another skill in this pack) is stricter on a point, the stricter rule wins.
