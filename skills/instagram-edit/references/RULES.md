# Edit rules (house style for cuts, captions, sound, output)

Simple rules the edit follows. When the user corrects an edit, add or change a rule here and the next
edit follows it. Numbers in [brackets] are the settings in `rules.json`.
Graphics (XP pops, banners, callouts, B-roll) have their own house style: `GRAPHICS.md`.

## Pipeline
Cut (reel-cutter skill) -> words file on the cut timeline -> Claude writes `<name>-graphics.json` per GRAPHICS.md ->
Remotion draws zooms, graphics and captions -> `<name>-edit.mp4` + stills.

## Cut
1. Open on the first word of the hook. No "um, so", no settling in.
2. Silence longer than [0.35s] gets cut down to a tight gap.
3. Leave [0.18s] before each kept phrase and [0.15s] after, so words never clip.
3b. Then snap each cut edge OUTWARD (up to [0.25s]) to the first true quiet point in the audio:
    two 10 ms RMS frames in a row near the room's noise floor [floor + up to 8 dB]. If there is no
    clearly quieter point (steady room noise), keep the padded edge. Cuts land in silence, never in a word.
3c. Every join gets an [18 ms] raised-cosine fade out/in; audio is spliced sample-exact (no AAC seams)
    and edges are rounded outward to whole frames so sound and picture stay locked.
3d. Report the loudness just inside every cut edge; every join must read as quiet.
4. Filler words on their own (um, uh, er, erm, ah) are cut.
5. Said a line twice or restarted it? Keep the LAST complete take, drop the earlier ones.
6. Nothing sits still for more than ~3 s: every cut alternates normal / punch-in [112%].
   Punch-ins inside one continuous take ease over 5 frames (smooth); across a real cut they stay hard;
   every shot drifts in slowly (1.00 -> 1.03).
7. Shorts land at 30-60 s. Over [90s] gets flagged to the user, not trimmed blind.
8. End within half a second of the last word.

## Captions
9. 2-3 words at a time, one line, [max 16 characters].
10. White, bold, lowercase, black outline + soft shadow, centred at ~[72%] down the frame
    (clear of the Instagram/TikTok buttons).
11. Numbers, money and the strong words (`rules.json` "emphasis") go yellow.

## Emotion
12. Emotional peaks (money, numbers, strong words, "!" moments) get a harder punch-in [120%].
13. The last line (the CTA) is never cut.

## Sound
14. Voice normalised to [-14 LUFS], peaks under -1 dB.
15. Music, when added, sits [-15 dB] under the voice.
15b. No sound effects by default [sfx_volume 0]. Graphics are silent; add SFX only if the user asks.

## Output
16. 1080x1920, 30 fps, H.264 + AAC. Output lands in `edit/out/` named after the raw clip.
    Under [48 MB] so it moves easily between phone and desktop (re-encode at a lower bitrate if needed).
17. Never post. The user watches the edit and says ship / fix.

## Teaching log (the user's corrections, newest first)
| date | what was said | rule changed |
|------|----------------|--------------|
| (example) | "audio clipped at cut starts/ends, words sound cut off" | rule 3 pads raised to 0.18/0.15 s; added 3b (snap edges outward to a quiet point), 3c (18 ms fades, sample-exact splice), 3d (join loudness check) |
| (example) | "no sound effects, they're annoying" | rule 15b: SFX off, graphics silent by default |
