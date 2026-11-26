---
name: sound-and-music
description: Music and sound design for short vertical videos. Score each reel on its own (tempo, key, a short theme, where it grows, where it stops), keep the bed well under the voice with gentle ducking, put real sound effects on the moments the picture shows, make the bed before the picture, and pass a sound check. Covers free/licensed sources and code-synthesised SFX. Use for "add music", "sound design", "SFX", "the music is too loud", or the music-director pass.
---

# Sound and music

## The music director's job (per reel, before picture)
Write a one-line musical concept in NOTES.md before making anything: "low D-minor drone, 70 BPM, a three-note cello theme that comes back bigger at the payoff, everything drops out for one second before the hit". Each reel gets its own. Never reuse one default bed across reels.

Plan:
| beat | time | music does | key SFX |
|------|------|-----------|---------|
- **Tempo** set from the voice pace and the edit rhythm; cuts and big hits land on beats.
- **One short theme** that grows. **One silence** before the biggest moment.
- **Mood**: serious subjects (war, history, disaster, survival) get a low, weighty underscore that opens on a deep sustained drone with slow swells, never bright, plucky, march-like or "kids' TV". Playful subjects can be lighter, still not cartoonish.
- **Hit the key moments, not every movement** (a sound on every action gets tiring).

## Levels (the most common failure)
- Music well under the voice: start the bed around -26 to -30 LUFS-equivalent under a -15 LUFS voice mix; if in doubt, quieter.
- Duck gently: slow attack/release (about 300 ms in, 800-1500 ms out), total swing 3-6 dB. Never pumping word by word.
- The voice starts on frame 0-10: no loud sting or dead air before it.
- Big SFX sit under the voice, not over it.
- Final mix: -15 LUFS integrated, true peak at or below -1 dBTP:
  `python tools/finish_audio.py in.mp4` (writes `in-final.mp4`)
- Then `python tools/sound_check.py out.mp4 [script]` must say PASS (music swings, hard cuts, loudness, first words, line endings, flash clips, word match).

## Sources
- **A quiet held pad for explainers**: `python tools/make_pad.py kit/public/myth/pad.wav --seconds 30 --root D` writes one sustained major chord with no beat and no tune. Use it under a narrator in explainer and myth videos, 10-14 dB under the voice, a different `--root` per video. Do not use a minor drone or a plucked tune there.
- **Synthesised in code** (no licence questions): `python tools/make_sfx.py kit/public/sfx` gives boom, impact, debris, whoosh, rumble loop, clank, tick, riser, knock, thud and a drone bed. Edit the functions to make new ones (change pitch, decay, noise colour). A drone bed made this way is a fine starting point for a serious reel; write a new variation per reel.
- **Free and licensed**: CC0 sound libraries (for example Freesound items marked CC0, Sonniss GDC bundles, Kenney audio packs) and CC-BY items with credit in the caption. Read each item's licence.
- **Paid generation** (AI music or SFX services): only with a yes from whoever pays, and check the commercial-use terms of the plan.
- **Trending/copyright songs**: only added natively inside the app, never baked into the file.

## In Remotion
```tsx
<Audio src={staticFile("music/bed.wav")} volume={(f) => interpolate(f, [0, 15, total - 30, total], [0, 0.3, 0.3, 0], { extrapolateRight: "clamp" })} />
<Sequence from={FIRE}><Audio src={staticFile("sfx/boom.wav")} volume={0.9} /></Sequence>
```
Fade music in over ~0.5 s and out over ~1 s; never hard-cut it.
