---
name: vo-delivery-direction
description: Direct a voiceover so it sounds like a person talking, not an AI reading. Marks each line's pace, weight and pauses before voicing, then voices the whole script as one continuous take. Use before generating any voiceover for reels or explainers, and when a VO is described as too quick, choppy, read-out or flat.
---

# VO delivery direction

Problem: AI voiceovers get rejected as "too quick, cut out at points, wrong tonality, feels really AI led". The fix is one continuous take, written-in pacing and one calm direction tag.

## The rules (in order of how often they get broken)
1. **Never speed it up.** Render at 1.0x. Speeding a voice up by 4-8% to fit a reel makes it sound rushed. If the reel is too long, cut words from the script, not time from the voice.
2. **One continuous take, never line-by-line stitching.** Splicing separate line takes causes cut-outs and mismatched tone. To change a line, regenerate the whole script as one take. Splice only as a last resort.
3. **Read the script for meaning before voicing it.** Mark every line with one of:
   - HOOK: confident, a touch quicker, lands hard on the key word.
   - SETUP / PROBLEM: conversational, slightly slower, a little dry.
   - TURN ("Until now.", "But with this skill..."): a beat of silence before it, slower, more weight.
   - PROOF / LIST: even and clear, a small pause between items. A list of three gets commas and a breath, never a rattle.
   - PAYOFF: the slowest line in the script, most gravitas.
   - CTA: warm, direct, unhurried. Never salesy.
4. **Write the pacing into the text.** That is how the model takes direction:
   - a full stop for a breath
   - a comma for a short pause
   - "..." for a held beat before a turn or payoff
   - commas between list items
   - spell out numbers ("twenty-nine dollars") and say acronyms as letters ("A. P. I.")
   - spell regional words as they are said if the model mispronounces them
5. **Model and direction tag.** Use the most expressive model your TTS tool offers. Start with one direction tag, for example "[calm, confident, flowing, with quiet gravitas]". Add at most two or three inline tags in the whole script ("[slower]", "[warmly]", "[pause]") and only on TURN and PAYOFF lines. More than that and it sounds acted.
6. **One take per generation.** Only make a second take if the first fails a check.

## Before voicing (write this out)
| line | role | pace | pause after | emphasis word |
|------|------|------|-------------|---------------|

Target pace: about 150-165 words a minute overall. Hooks up to about 175, payoff down to about 130. Count words divided by the take's length after generating; if it is over 170 wpm the take is too quick.

## After voicing (all of these must pass before it goes to the render)
- A speech-to-text transcript (Whisper works) matches the script exactly, with no tag words spoken.
- Words per minute is within the target. No gap over 0.8 s and none under 0.15 s between sentences.
- Scan for coughs and breaths. A cloned voice can reproduce real ones from its training audio.
- Listen notes: does the TURN have its beat? Is the PAYOFF the slowest line? Is anything rushed? If yes, rewrite the punctuation and regenerate once.

## Learn your own natural delivery
When there is time, measure your own filmed takes: words per minute per line type, pause lengths before turns, where you slow down. Fill in this table so the targets come from you, not from defaults:
| line type | your wpm | pause before | notes |
|-----------|----------|--------------|-------|
| (to measure) | | | |
