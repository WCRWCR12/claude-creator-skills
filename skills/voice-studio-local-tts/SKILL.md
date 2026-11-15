---
name: voice-studio-local-tts
description: Run open-source text-to-speech or voice cloning locally for faceless reel narration at no per-generation cost. Lists the main open-source options, where local TTS fits in a content pipeline, and the consent and licence checks to do first. Use when a creator wants AI voiceover without paying for an API.
---

# Local text-to-speech / voice cloning

Technique inspired by: @albert.olgaard (Instagram)

## What it is

Open-source voice models that run on your own machine rather than a cloud API. Once installed there is no per-generation cost. The creator's pitch: install the repo through Claude Code and tell Claude to run it on your computer.

## Options to evaluate

The reel did not name its repo on screen. Popular local-voice projects to consider:
- GPT-SoVITS
- Coqui TTS (upstream archived but still widely used)
- F5-TTS
- OpenVoice
- Chatterbox
- Bark
- Fish-Speech

Pick one based on your hardware (GPU or not), language support and licence. Read the repo's README and licence before installing.

## Where it fits

| Job | Without local TTS | With local TTS |
|-----|-------------------|----------------|
| Faceless animated reel series | Blocked on narration or paid API | Local voiceover from the script, free |
| Educational motion-graphics reels | Need to record every one yourself | Record one clean sample for cloning, generate the rest from scripts |
| On-camera content | Your real voice | Still your real voice. Don't swap in a synthetic one |

## Hard rules

- Use it for faceless or animated content, not for videos where you appear on camera.
- Only clone a voice you have explicit permission to clone (your own, or a person who has agreed).
- Check the licence of any model the repo downloads (HuggingFace or elsewhere) before using output commercially.
- Review any unknown repo before running it: read the install script, check stars and recent activity, and run it in a virtual environment.
- Direct the output with the `vo-delivery-direction` skill: one continuous take, pacing written into the text.
