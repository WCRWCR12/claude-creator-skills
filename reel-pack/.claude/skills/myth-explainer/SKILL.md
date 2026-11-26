---
name: myth-explainer
description: The myth-explainer reel format, 25-32 s, 9:16. A silent 3D man in a blue grid studio tests one "what would really happen" idea in about twenty one-second shots, with 1-3 word captions, a deadpan narrator, a sentence that breaks off on its noun, and an answer that lands with a short build-up. Use for any "what if", "which would", "is it true that" or physics and survival explainer, for its script, shot list, build or review, and whenever a coded human character has to move like a person.
---

# Myth explainer

Technique only. This skill plans, writes, builds and checks a video. It never sends, spends, publishes or fetches anything: paid voices, uploads and downloads are the user's call.

Read in this order: this file, `references/script.md` (every word), `references/shots.md` (every picture and the checklist), `references/motion.md` (the man), `references/kit-guide.md` (the code). A finished example of the format is `kit/src/scenes/MythTwoBalls.tsx`: render it before you write anything, so you have seen the bar.

## What it is
One thing most people believe about how the world works, tested in a clean 3D studio by a silent man and a few realistic props, told by a deadpan narrator. Ideas only: never a TV show's name, cast, verdict words, footage or episode titles, in the video, the caption or the hashtags.

## Why the format holds people (keep all five)
1. **It starts mid-action.** The man is already doing the thing at 0.0 s and the act has happened by 0.6 s. No title, no logo, no "did you know".
2. **A new picture on every clause.** About one shot a second, and each shot shows exactly the words being said.
3. **It shows the wrong guess for real**, with a dry consequence for the man.
4. **The sentence breaks off on its noun**, right before the answer. The open question holds the viewer through the turn.
5. **The answer is earned.** It finishes that same sentence, shows the thing happening, and calls back to the simpler test.

## The shape (25-32 s)
| Part | Length | What happens |
|---|---|---|
| A. The test | 18-22 s | 17-21 shots, 56-68 spoken words, five sentence moves (see `references/script.md`). Ends mid-sentence on a noun |
| C. The answer | 5-8 s | 4-6 shots, 30 words at most. Finishes the cut sentence, shows it, ends on the callback |

The answer follows the test directly, as the end of the same sentence. Nothing may be left for the caption: anything that could save a life (a car in water, fire, electricity) is said in full, in the video.

## The look (match every row)
- **World:** one endless dark-blue studio: glossy blue floor, white grid lines a metre apart, navy curved backdrop with a faint grid, soft top light, soft contact shadows. Nothing else in the room. (`MythStage`)
- **The man:** normal proportions, semi-realistic, short dark hair, plain T-shirt, trousers that are clearly cloth and nowhere near skin colour. The same man in every video. He never talks, never points, never looks at the lens. (`loadMan`)
- **Props:** real materials (steel, glass, rubber, wood, water), drawn several times bigger than life when small. Flying things get a thin bright trail.
- **Text:** captions only. White heavy all-caps with a dark outline, 1-3 words, centred at about two thirds of the frame height, changing on the spoken word. No title, no labels, no arrows, no verdict card. (`MythCaptions`)
- **Camera:** always drifting or pushing, a new angle on every clause.
- **Voice:** a narrator, never the man. Calm, flat, normal speaking level, about 190 words a minute, no gaps between sentences. Not whispered, not shouted. Drafts use any free local voice; a paid voice only after the user says yes to the cost.
- **Sound:** every action has its own sound on the frame it happens. Under the voice, a quiet held chord with no beat and no tune (`tools/make_pad.py`), 10-14 dB under the voice. Never slow minor strings or a drone: they make an explainer feel like a disaster film. Never a plucky tune either: it turns it into a cartoon.

## The motion rule
A character built from boxes and hand-keyed all over reads as a stiff puppet, and one stiff shot sinks the video. So:
- Body motion comes from a real source: a library clip on the rigged man, or physics. Never hand-key a whole body.
- A held pose lasts 1.2 s at most and still breathes, sways and blinks.
- The man's face is in 40% of the test shots or fewer. Props carry the story. But he is in every video: without him it is a different format.
- Hands that touch a prop are put on it with IK, and fingers let go thumb-and-index first (`references/motion.md`).
- Consequences are dry: a flop, a soaked shirt, a singed eyebrow. No wounds, no gore.

## Workflow
1. **Pick the idea** with the five-question test in `references/script.md`. Write down the true answer and where it comes from before any script.
2. **Write the script** as a text file with `A:`, `C:` and `CHUNKS:` blocks, then run `python tools/myth_script_lint.py projects/<slug>/script.txt` until it passes. The lint counts; it cannot tell whether a clause has a picture, so:
3. **Write the shot list**: one row per clause from the cycle in `references/shots.md`. Send back any clause that cannot be shown in the time it takes to say.
4. **Stop for the user's OK** on script and shot list.
5. **Build**: copy `kit/src/scenes/MythTwoBalls.tsx`, follow `references/kit-guide.md`. Block every shot with single-sample stills first.
6. **Sound**: a scratch read with a free voice sets the clock; then caption times come from the real word times. Pad from `tools/make_pad.py` in a key of its own, sounds from `tools/make_sfx.py`.
7. **Check**: the reference-diff table in `references/shots.md` filled in with every row in range, `tools/check_flash_cuts.py`, `tools/finish_audio.py`, `tools/sound_check.py`, a 2 fps contact sheet, dense frame strips of every shot the man moves in, then the `first-time-viewer` agent cold, with the man's motion scored on its own line.

For a single short scene in this style (one test, under 15 s, like the example) skip steps 2-4: write the clause list and captions straight into the scene file, build, check.

## Sign-off (all yes)
1. The diff table is filled in and every row is in range, or the miss is written down with its reason.
2. The script passes the lint.
3. Every caption chunk is 1-3 words and no shot is shorter than 0.6 s.
4. Nothing on screen but captions.
5. No show names, verdict words, real people or borrowed footage anywhere.
6. The answer is true and its source is in the project notes (never on screen). Safety advice is complete and in the video.
7. The man's motion is from clips or physics, and his face is in 40% of the test shots or fewer.
8. A cold viewer can say in one sentence what the video showed.

House rules that still hold: no AI image or video generation, no gradients drawn as graphics (lit 3D falloff is fine), whole words with 150-250 ms tails, never speed a voice up, one video at a time.
