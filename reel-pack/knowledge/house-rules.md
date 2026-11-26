# House rules (read once per session before building)

Distilled from many rounds of real reviewer notes on coded reels. Each rule is here because breaking it got a reel rejected.

## Picture
1. **Camera through a built scene.** Build the world (ground, set, props, characters, light), then move a camera through it. The camera move is the animation. No elements popping, bouncing or sliding onto a flat canvas.
2. **You must be able to see it.** Judge every frame at phone size (about 6 cm wide). Light the subject clearly; shadow is an accent. But readable must not mean flat: fix dark shots with more light, never by turning the scene into a diagram.
3. **Cinematic, not slide deck.** Flat top-down diagrams, boxes of text and "school poster" graphics fail even when clear. A top-down or explainer view still lives in the 3D world.
4. **Every picture shows its line,** at the moment it is said. Never show the payoff or product before it is named. If a viewer could not explain the line from the picture, change the picture.
5. **Physically right.** Things sit on the ground, nothing clips through anything, scale is real, vehicles in a column are spaced and offset, machines have their real parts. Check full-resolution frames against real reference photos.
6. **Motion with weight.** Arcs not straight lines, anticipation before big actions, overshoot and settle after, secondary motion, idle life (breathing, drift, blinks). Stiff motion = fail; if a character cannot clear the bar, use hands/props or drop the character.
7. **Full frame rate.** Never step motion to 10-15 fps for a "stop-motion look"; it reads as lag. Texture comes from light, haze and grain.
8. **POV shots that put you there** are usually the best frames (looking up through trees at aircraft, riding the projectile, inside the cabin).
9. **No repeated footage** in one reel. Every shot is new.
10. **No decorative gradients** (corner glows, gradient cards, halo behind text). Flat colour; depth from light, space and type. A flat dark scrim behind text for legibility is fine.
11. **No decorative micro-text**: tiny monospace labels, status strips, fake readouts, eyebrow tags. Only real content text at a readable size.

## Text
12. **Lower third only** for persistent text on 9:16: y 1200-1680 of 1920. The top ~400 px is covered by the app's username and audio strip; below ~1760 by the like/comment icons and caption. Full-screen takeover text (a hook on black) can go anywhere.
13. **Headline 1-3 words**, a different font from the captions. Captions word-by-word with the live word highlighted, 62-72 px on a 1080-wide frame.
14. **Readable size**: nothing a viewer must read under ~40 px on the 1080 canvas; hold text at least 1 s per ~6 words.

## Edit and pace
15. **No shot under 0.6 s.** Sub-half-second pop-up clips read as glitches and are tiring. `tools/check_flash_cuts.py` enforces it.
16. **Shots 1.2-3 s** with a camera move each; one idea per shot.
17. **No dead air**: gaps between sentences under ~0.3 s in social reels, but never by chopping words (rule 19).
18. **Hook in frame 1**: the first line and first frame are the same idea, and something is already moving.

## Voice
19. **Never clip a line.** Every line keeps its last consonant, its release and a 150-250 ms tail before the next line or a cut. Cut where the voice has decayed, not at the word timestamp. `tools/check_line_tails.py` enforces it.
20. **Never speed a voice up** to fit; cut words instead. One continuous take, never stitched line takes.
21. **Plain full sentences** a 12-year-old gets. No clipped fragments ("Arrows first."), no stock phrases. A signature phrase once per reel, max.
22. **Drafts use a free voice**; paid voices only for an approved script.

## Sound
23. **Each reel gets its own score**: its own key, tempo, theme, where it grows and stops. Never one default bed for everything.
24. **Serious subjects get low, weighty music** that opens on a deep drone; never bright, plucky, march-like or "kids' TV".
25. **Music well under the voice, gentle ducking** (3-6 dB swing, slow attack/release, never pumping). Voice starts within the first 10 frames. Big SFX under the voice.
26. **Real sound where the picture shows it** (and nowhere else). Hit the key moments, not every movement.
27. **Sound check before anyone watches**: -15 LUFS, true peak under -1 dBTP, no music swings over ~6-8 dB inside 2 s. `tools/sound_check.py`.

## Truth and process
28. **Facts must be right.** Physics computed, not eyeballed. Safety advice from authoritative sources, main advice first. If it cannot be verified, cut it.
29. **Licences**: only your own work, CC0/public domain, or CC-BY with credit. No TV show names, logos or footage. Copy techniques from reference reels, never their words, characters or footage.
30. **Gates passing is not "good".** After the mechanical checks, a cold viewer (the `first-time-viewer` agent) must be able to say in one sentence what the video was about, and you look at a contact sheet yourself. A beat that is only words on a flat background or a static screenshot fails whatever the checks say.
31. **One reel at a time, finished properly**, beats a batch of half-done ones. Regenerate only the part that changed.

## Explainers with a character (the myth-explainer format; where these differ from the rules above, these win for that format)
32. **One picture per clause, about one shot a second.** Each shot shows exactly the words being said. Still nothing under 0.6 s. (This replaces rule 16's 1.2-3 s for this format only.)
33. **Captions are 1-3 words**, changing on the spoken word, and they are the only text on screen. Big blocks of text are hard to read on a phone and lose people.
34. **A human character moves from a real source**: a library clip on a rigged body, or physics, or a held pose under 1.2 s that breathes and blinks. A body built from boxes and hand-keyed reads as a puppet. Make every added motion big enough for a 6 cm screen, with a wind-up, an arc and a settle, and run the body and the props off one clock.
35. **Clothes must read as clothes.** Trousers near skin colour make a character look undressed. Pick a cloth colour far from the skin in both hue and brightness.
36. **Under a narrator in an explainer: a quiet held chord, no beat, no tune** (`tools/make_pad.py`), 10-14 dB under the voice. Slow minor strings and drones (rule 24) are for serious history, not for explainers, where they feel like a disaster film; plucky tunes feel like a cartoon. A different key for each video.
37. **The narrator speaks at a normal level.** "Calm and low-energy" direction turns into whispering; hype turns into shouting. Ask for flat, plain and unhurried.
38. **When fixing something a viewer mostly liked, change only what was named** and keep the rest. If a note can be read two ways, take the reading that removes more of the thing complained about.
