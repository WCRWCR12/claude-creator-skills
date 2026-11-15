---
name: live-editable-video-editor
description: Build a lightweight video editor with Claude so a creator can tweak captions, stickers and audio live instead of describing changes in chat and triggering full re-renders. Audit past edit notes, find the repeating asks, build a live-preview editor with non-destructive layers, and keep "always" rules. Use when edit feedback loops cost too many renders.
---

# Live-editable video editor (non-destructive layer approach)

Technique inspired by: @joshuablatch (Instagram)

**Problem this solves:** When a human gives an AI editor incremental feedback ("make the font smaller", "shadow's wrong"), each cycle needs a full render. One video can cost four or more renders for caption tweaks alone. The fix is to never burn editable elements into the video until the creator approves.

## The technique

### 1. Audit past notes first
Before building anything, have Claude read every edit note the creator has given. Cluster the asks. The top three recurring requests become the first features of the editor. This prevents building the wrong controls.

### 2. Keep every element as a live layer
- Captions are not burned into the video. Each caption is a live object.
- Each caption exposes text, font, size, colour, outline, background box and animation-in style.
- Changes apply to one caption or to all captions in one action.

### 3. Drag-in stickers
Any asset (image, logo, graphic) dragged in becomes a sticker: moveable, resizable, snapped to word timing. It stays on its own layer until render time.

### 4. Split audio track
Voice and music are separate. Controls: per-track volume, sliding the song's start point, and word-level bleep or cut straight from the transcript display.

### 5. The WYSIWYG render contract (the most important piece)
What you see in the editor must be exactly what renders. On export, rebuild the video from the layer state, not from the original file plus a diff. This guarantee removes "it rendered differently."

### 6. Version flip and phone preview
After each render the creator can:
- Flip back to the previous version to see the difference.
- Preview with the platform's native UI overlaid (for example Instagram's buttons on top).
- A/B two opening variants side by side.

### 7. "Always" rule memory
Any setting the creator marks as always becomes a persistent rule, and Claude never asks for that note again. Examples: "caption font is always Inter Bold", "music is always at 5%".

## Build order (minimum viable)
1. Caption layer editor (biggest time saver).
2. WYSIWYG render guarantee.
3. Version history and flip.
4. Sticker layer.
5. Split audio and transcript-based cut tool.
6. Phone-preview mode (platform overlay).
7. "Always" rule store.

## What makes this hard to get right
- The render must reconstruct from layer state, not apply a diff. A patch approach breaks the WYSIWYG contract the moment the creator changes two things at once.
- Font rendering must match between the editor preview and the ffmpeg/Remotion render.
- Surface the "always" store clearly. If the creator can't see what rules exist, they lose trust in it.

## What the demo reel shows
- Opens with a talking-head pain point: the back-and-forth editing loop is obnoxious.
- A dark-theme editor UI with a live caption panel on the right.
- Clicking a caption and changing font, colour and animation in the panel.
- A transcript-based audio cut UI with a waveform.
- Phone-preview mode with Instagram chrome overlaid.
- A version-flip control (before/after toggle).
