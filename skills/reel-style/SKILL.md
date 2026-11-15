---
name: reel-style
description: A complete house style for face-to-camera tech/tool explainer reels - a title-card hook, a face-to-camera base layer, full-frame UI/screenshot/number-card B-roll, 1-2 word synced captions and a single-word comment CTA - with a script skeleton, shot plan and QA checklist. Animated sections use animation-ground-truth. Use for "make it look like a tool-explainer reel", "produce this video in our reel style", or any live-action or mixed reel for a personal channel.
version: 2.1.0
---

# Reel style: face-to-camera tool explainer

**Source:** the format was studied frame by frame from public Instagram reels in one creator's "comment WORD to get X" tool-explainer family (main reference: instagram.com/reel/De15bfEPMcP, ~34 s, Oct 2026). This file is written to work without the reference.

Make every live-action social video match this spec or better. For animated sections, use the `animation-ground-truth` skill.

## Setup
- ffmpeg on PATH. For the cut and captions, the `reel-cutter` and `caption-sync` skills in this pack; for number cards and the hook card, Remotion or any editor.
- To check a render against the spec, the `video-contact-sheet` skill.

---

## 1. The format in one line

**Face-to-camera base layer in a fixed location + full-frame UI/screenshot/number B-roll cut in on the beat + one or two spoken-synced caption words at the bottom + a title-card hook that holds 2-4 s + a single-word CTA.**

## 2. Hard rules (tick every box before handing it over)

### Shot framing
- 9:16, 1080x1920. Nothing important in the top 180 px or bottom 350 px (platform UI).
- Presenter base shot: MCU, head centred-left or centred, chest in frame, ~15 cm of air above the hair.
- Same backdrop for every face shot in a video (the reference used blurred palm trees). A consistent "home".
- Wardrobe: plain dark top. No logos, no stripes, nothing white.

### Hook (first 2-4 seconds)
- Static title card. Two or three short lines of bold, serif-ish text.
- ONE phrase gets a filled highlight bar/block under it in a brand accent (the reference used a red-pink bar). Everything else is black on near-white.
- Two small media thumbnails under the title tease what's inside (e.g. a phone screen + a code screenshot).
- The hook card holds while the voiceover delivers the first 1-2 lines. No motion. Hard cut out.
- First VO line names the thing + the CTA keyword: "Comment [WORD] to get [tool] and let [it do the payoff]."

### Cut rhythm
- A new visual every 1.5-3 s. The reference: 17 beats in ~34 s = ~2 s each.
- Hard cuts only. No dissolves, no wipes, no whooshes.
- Caption changes land ON the spoken word, not before.

### B-roll vs face ratio
- Roughly 50/50 across the reel. Face-to-camera is the base layer; B-roll beats cut away full frame.
- B-roll types: phone screen recordings (app grid, maps, chat, settings), full-screen number cards ("99% success rate", "13.8k stars"), repo/readme screenshots, benchmark bar charts, real UI captures.
- Insert full-frame, never picture-in-picture, and never a card on top of the face. The face shot cuts out, the insert comes in on the beat.
- Number proof points get their own full-frame card (big typeset number + small label).

### Captions
- One or two words per beat, bottom-centred, white bold sans (Inter ExtraBold weight) with a soft shadow.
- Word-by-word reveal, synced to the voice. Never ahead.
- No punctuation on screen. No em/en dashes. No "AI tells".
- Accent-word treatment (small coloured block + light tilt) max twice per video.

### Voiceover / script
- Short declarative sentences. One idea per line. Write the transcript one sentence per line, because that is how it is cut.
- Specific numbers, not adjectives ("99% success rate", "13,000 stars", not "amazing results").
- Plain words.
- One analogy per video, max.
- CTA at the end: a single word in quotes on screen while the VO says "comment [WORD]".

### Audio
- VO around -14 LUFS. Breaths between lines but no gaps.
- Music bed: present, low, non-looping, matches the energy. No obvious drops.
- No stock whooshes, no keyboard-click SFX unless the script marks one.

## 3. Script skeleton (capability-list version)

1. **Hook / promise:** "Comment X to get Y and let your Z do W." (names the tool + CTA + payoff in one line)
2. **Setup:** one sentence of context ("X just open-sourced a free tool that lets Y.")
3. **Capability list:** 2-3 short "it can do A, B, C" lines
4. **Proof:** one number card ("99% success rate on a major benchmark")
5. **Why it matters:** one analogy ("like handing your phone to a patient assistant")
6. **Use cases:** 2-3 short "you can..." lines
7. **Closer:** one strong fact ("completely free and open source")
8. **CTA:** single word in quotes on screen + voice "comment [WORD]"

When the topic is already trending, use the story-hook variant instead: `references/story-hook-variant.md`.

## 4. Shot plan (copy for new videos)

| Beat | Visual | Caption |
|---|---|---|
| 1 | Hook card (title + highlight bar + two thumbnails) | none |
| 2 | Hook card holds | 1-2 words from VO |
| 3 | Phone screen recording (relevant UI, full frame) | 1 word |
| 4 | Second phone screen (different UI step) | 1 word |
| 5 | Face shot (base) | 1-2 words |
| 6 | Face shot (base) | 1-2 words |
| 7 | Benchmark / data screenshot | 1 word |
| 8 | Big number card ("99%") | 1-2 words |
| 9 | Repo / readme screenshot | 1 word |
| 10 | Big number card ("13.8k") | 1-2 words |
| 11-14 | Alternate face shots and UI inserts for use cases | 1-2 words each |
| 15-16 | Face shot | 1-2 words |
| 17 (end) | Face shot + quoted CTA word | "WORD" (in quotes) |

## 5. QA checklist (run before the user sees anything)

- [ ] 9:16 1080x1920, 25-45 s long
- [ ] Hook card holds 2-4 s, with one highlighted phrase and two media thumbnails
- [ ] Visual change every 1.5-3 s, hard cuts only
- [ ] Captions 1-2 words, bottom-centred, white bold sans, synced on the spoken word
- [ ] At least one full-frame big-number card for proof
- [ ] Every face shot in the video uses the same backdrop
- [ ] CTA = single word in quotes on screen while VO says "comment [WORD]"
- [ ] No em/en dashes, no SFX unless scripted, no scroll effects
- [ ] Contact sheet of the render (`video-contact-sheet`): ~1 visual change per 2 s, matching section 4
- [ ] Nothing published

## 6. Hard rules that always apply

- Never post or publish. Hand the render to the user.
- Never spend on image or video generation without the user's explicit OK.
- No scroll-driven effects anywhere.
- Live-action framing and edit = this skill. Animated sections = `animation-ground-truth`. Where they conflict in a live-action reel, this skill wins.
