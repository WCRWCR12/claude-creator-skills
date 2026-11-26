# Ship checklist (run before anyone else watches)

## Picture
- [ ] Contact sheet made (1 frame per 1-2 s) and looked at by you at phone size
- [ ] Every shot has a camera move; the camera moves through a built scene
- [ ] Subject readable at 6 cm wide in every shot
- [ ] Nothing floating, clipping, nose-to-tail; real proportions; real parts (full-res crops checked for machines)
- [ ] Persistent text only in y 1200-1680; nothing important in the top 400 px
- [ ] No decorative gradients, no micro-text, no repeated footage
- [ ] `python tools/check_flash_cuts.py <reel.mp4>` -> PASS (no shot under 0.6 s)
- [ ] Myth explainer only: script passes `python tools/myth_script_lint.py <script.txt>`; the reference-diff table (skill `myth-explainer`, `references/shots.md`) is filled in; frame strips of every shot the man moves in were looked at

## Sound
- [ ] Voice from frame 0-10; every line ends whole (`tools/check_line_tails.py <voice-stem.wav> --take <take.wav>` -> PASS)
- [ ] Music under the voice, gentle ducking, its own bed for this reel
- [ ] SFX on the key moments the picture shows
- [ ] Loudness finished: `python tools/finish_audio.py in.mp4` (writes `in-final.mp4`)
- [ ] `python tools/sound_check.py <reel.mp4> [script]` -> PASS

## Story and truth
- [ ] Hook is in frame 1 and the video pays it off
- [ ] Facts checked by the contextualiser; physics computed
- [ ] Every image/sound/model is yours, CC0/public domain, or CC-BY credited in the caption
- [ ] `first-time-viewer` agent verdict PASS (it watched cold)
- [ ] Caption written: second hook, short body, one CTA, 1-3 hashtags
