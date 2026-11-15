---
name: hook-virality-check
description: Compare several hook variants of one reel before posting, pick the winner, and find the drop-off point to re-edit. Uses a structured scoring rubric, and can read scores from a virality or retention prediction tool if the user already has one. Use for "which hook is best", "test my hooks", "virality check", "score this clip", "will this perform", or before posting any reel that has more than one hook option.
---

# Hook virality check

Make several versions of the same reel's opening, score them the same way, keep the winner, and fix the spot where viewers would leave. Treat every score as a relative ranking tool, never as proof. Never promise a reel "will go viral".

## Setup
- ffmpeg on PATH, to export the variant clips.
- Optional: a virality or retention predictor the user already has access to (some AI media platforms offer one; they typically take a ~15 s clip and return a 0-100 hook score and a retention curve). This skill never pays for or runs one on its own: the user runs it, or tells Claude to and confirms any cost first, then the scores are read here.

## Method
1. **Make variants:** keep the same body and make 3-7 different first 3-5 seconds, i.e. a different opening line or visual. Use the `hook-writer` and `instagram-edit` skills. Export each as a ~15 s 9:16 clip at the same loudness (`ffmpeg -t 15 ...`), named hookA, hookB and so on.
2. **Score each variant** with the rubric below (always) and, if available, the predictor's hook score and retention curve. Record per variant: rubric total, predictor score, the steepest drop on the curve, any notes, in a small table.
3. **Pick:** the highest score wins. If two are within a few points, prefer the one with the flatter curve after second 3 (or the higher "promise clear by 1.5 s" score) and say it's close.
4. **Find the drop-off:** the second where retention falls (from the curve, or where the rubric says the hook goes vague). Re-edit that point:
   - tighten the cut
   - add a pattern interrupt, caption pop or zoom
   - move the payoff earlier
   - trim dead air

   Re-score once. One re-edit round unless asked for more.
5. **Report in a few lines:** the winner, the scores, the drop-off second, and what changed. Later, compare with the real post analytics to learn how far to trust the scores.

## Scoring rubric (out of 10 each, total out of 50)
- Does something happen in frame 1?
- Is the promise or tension clear by 1.5 s?
- Would the sound-off viewer get it from the text?
- Is it specific, not generic?
- Does it match what the rest of the video delivers?

## Guardrails
- Never spend credits or pay for a tool from inside this skill; any paid run needs the user's explicit OK first.
- Present scores as predictions, never as results.
