---
name: bot-series-workflow
description: Split a reel and caption pipeline into a series of single-purpose agents (research, pattern, script, edit, critic, caption), each with one input, one output and one hand-off. Includes the key "pattern brief" step that turns what works in your niche into a template before scripting. Use when one big prompt is doing too many jobs or reels feel inconsistent.
---

# Sequential bot series workflow for reel and caption production

Technique inspired by: @liz.on.the.web (Instagram)

The source is a carousel teaching a four-step content system: find the creators winning in your niche, save what is already going viral, spot the repeating pattern, rebuild it in your own voice. This skill is a teaching synthesis of that idea applied to an agent pipeline.

## What the technique is

A "sequential bot series" assigns each distinct job in your content pipeline to a separate, single-purpose AI agent rather than one general prompt that does everything. Each bot has one input, one output and one hand-off. The chain produces captioned, edited, publishable reels without any step doing double duty.

## The bot series

### Bot 1: Research
- Role: find the top 5-10 performing posts in a niche in the last 30 days.
- Input: niche keyword or account list.
- Output: a ranked list with post link, hook text, format, engagement metrics and a one-line reason it worked.
- Hand-off: the output file goes to Bot 2.

### Bot 2: Pattern (the step most people skip)
- Role: identify the repeating structure across the top performers. What is the hook formula? The CTA type? How many slides or seconds? What visual style?
- Input: the research list.
- Output: a one-page "pattern brief": hook formula, body structure, CTA style, visual treatment, estimated length.
- Hand-off: the brief goes to the script bot and the edit bot.

### Bot 3: Script
- Role: write a reel script or carousel copy that follows the pattern brief, in your voice, on one topic from your content pillars.
- Input: pattern brief, a topic, your brand-voice notes.
- Output: a timed script (reel) or slide-by-slide copy (carousel) with hook, body, CTA and a caption with at most two hashtags.
- Hand-off: to the edit bot, and optionally to the caption bot.

### Bot 4: Edit
- Role: take raw footage or the approved script and produce a cut reel matching the brief's visual style and timing, with captions burned in (Whisper plus Remotion or ffmpeg).
- Input: script, footage folder, the brief's visual spec.
- Output: edited 9:16 MP4 with captions, safe-zone checked.
- Hand-off: to the critic.

### Bot 5: Critic
- Role: score the output against the pattern brief and your quality bar. Require 8/10 or better to pass.
- Input: rendered video, caption, pattern brief.
- Output: pass/fail plus line-by-line notes. On fail, return to the script or edit bot with a specific fix.
- Hand-off: on pass, the result goes to you for approval.

### Bot 6: Caption (optional dedicated lane)
- Role: write and lint the caption: hook in the first 125 characters, one or two hashtags, consistent style per your current A/B test.
- Input: the script and your caption-style rotation.
- Output: final caption text.

## The key insight

The pivot between observation (what works) and production (make it in your voice) is the step most creators skip. They either copy blindly or ignore what works. The bot series forces a structured brief to exist between those two steps. The pattern bot's output is that brief, and everything downstream becomes close to deterministic once it exists.

## Worked example

Topic: "an AI assistant manages your calendar automatically".

1. Research: search for the top 5 reels about AI assistants and calendars in the last 30 days and list their hooks.
2. Pattern: from those five, extract the hook formula ("You're still doing X manually?" plus a stat), body (three demos, about 20 s each), CTA (comment keyword), visual (talking head plus screen recording). Output: pattern-brief.md.
3. Script: write the reel from pattern-brief.md. Hook: "You're still booking meetings by hand?" Body: three demos. CTA: "Comment CALENDAR". Caption with one hashtag.
4. Edit: cut your footage to the script, add a screen-recording overlay, burn captions with Whisper.
5. Critic: score 8 or higher, or return to step 3 with notes.
6. Caption: lint against the 125-character rule and your A/B rotation.
7. You approve and post it yourself.

## Pipeline map

| Step | Bot | Typical gap |
|---|---|---|
| Find what works | Research | Usually exists |
| Synthesise a template | Pattern | Usually missing. Add it before scripting |
| Write | Script | Should consume the brief, not start from scratch |
| Cut | Edit | Pass the brief's visual spec as a parameter |
| Review | Critic | Make it a formal, separate step |
| Caption | Caption | Often forgotten; wire it in |

## Try this next

Run the pattern step explicitly. Before writing the script, spend one model call synthesising the top three reels in your niche into a one-page brief, then force the script to match its hook formula, body length and CTA style. Compare the resulting reel's save rate with your previous one. If it wins, make the pattern step a standing part of pre-production.
