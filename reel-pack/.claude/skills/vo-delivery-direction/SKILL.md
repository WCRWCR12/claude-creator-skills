---
name: vo-delivery-direction
description: Direct a voice-over so it sounds like a person talking, not AI reading. Mark each line's role, pace, pauses and emphasis before voicing, write the pacing into the punctuation, voice the whole script as one continuous take, then check words, pace and line endings. Use before generating any VO with any TTS or cloned voice, and when a VO sounds rushed, choppy, read-out or flat.
---

# VO delivery direction

## Rules (in order of how often they get broken)
1. **Never speed the voice up** to fit. If the reel is too long, cut words, not time. Sped-up AI voices sound rushed.
2. **One continuous take, never line-by-line stitching.** Separate line takes cause cut-outs and tone jumps. To change one line, regenerate the whole script.
3. **Read the script for meaning, then mark every line:**
   - HOOK: confident, a touch quicker, lands hard on the key word.
   - SETUP / PROBLEM: conversational, slightly slower, a little dry.
   - TURN ("Until now."): a beat of silence before it, slower, more weight.
   - PROOF / LIST: even and clear, a small pause between items. A list of three gets commas and a breath, never a rattle.
   - PAYOFF: the slowest line, most weight.
   - CTA: warm, direct, unhurried. Never salesy.
4. **Write the pacing into the text** (that is how TTS models take direction): a full stop for a breath, a comma for a short pause, "..." for a held beat before a turn or payoff, commas between list items, numbers spelled as said ("twenty-nine dollars"), acronyms as letters ("N. A. S. A." only if it is said that way), unusual words spelled the way they sound.
5. **Direction tags** (for models that support them): one opening tag such as "[calm, confident, flowing]", and at most 2-3 inline tags in the whole script, only on TURN and PAYOFF lines. More sounds acted.
6. **One take per generation** if the voice costs money; a second only if the first fails a check.
7. **Drafts use a free local voice** until the script is approved; a paid or cloned voice only for the final.

## Before voicing (write this table)
| line | role | pace | pause after | emphasis word |
|------|------|------|-------------|---------------|
Target: about 150-165 words a minute overall; hooks up to ~175, payoff down to ~130.

## After voicing (all must pass)
- Transcribe the take (faster-whisper) and diff against the script: every word there, no tag words spoken.
- Words per minute within target; no gap over 0.8 s and none under 0.15 s between sentences.
- Line endings whole: every line keeps its last consonant and a 150-250 ms tail before the next line or a cut. When you cut lines from the take, end each cut where the voice has decayed (below about -45 dBFS), not at the word timestamp (Whisper ends sit before the consonant release). Check with `python tools/check_line_tails.py <voice-stem.wav> --take <original-take.wav>`.
- Listen for coughs, clicks, breaths in the wrong place, static. If a TTS take has hiss or clicks, clean it before the mix:
  `ffmpeg -i vo.wav -af "highpass=f=70,adeclick=w=40:o=75:t=1.5,afftdn=nr=10:nf=-45:tn=1,lowpass=f=11000" vo-clean.wav`
- Does the TURN have its beat? Is the PAYOFF the slowest line? If not, change the punctuation and regenerate once.
