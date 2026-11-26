# Reel studio (Reel Pack v2)

This folder is a reel-making studio for Claude Code. Every video is made in code: Remotion renders React and three.js scenes frame by frame into a 1080x1920 (9:16) 30 fps MP4. No AI image or video generation is needed.

## Start here
- For ANY request to make, plan, script, storyboard, build, render or check a video, use the `reel-studio` skill first. It routes to the other skills and the crew.
- For a myth, a "what if", a "which would", "what would really happen", a man testing something, or anything in the blue grid studio style: use the `myth-explainer` skill. It has its own kit and example.
- Read `knowledge/house-rules.md` once per session before building.
- Put each piece of work in its own folder: `projects/<yyyy-mm-dd>-<slug>/` (NOTES.md, script, shot list, renders). Scenes live in `kit/src/scenes/` and are registered in `kit/src/Root.tsx`.

## Layout
- `.claude/skills/` the skills (reel-studio, myth-explainer, scene-3d, hardware-hero-motion, formats, scripts, sound, checks, cinematic-director)
- `.claude/agents/` the crew: director, writer, contextualiser, cinematographer, music-director, first-time-viewer
- `knowledge/` house rules, formats, ship checklist
- `kit/` the Remotion + three.js starter (run `npm install` in `kit/` once)
  - `kit/src/scenes/HeroShot.tsx` example hero shot; `kit/src/lib/models/Tank.tsx` ready-made tank
  - `kit/src/scenes/MythTwoBalls.tsx` example myth scene; `kit/src/lib/myth/` the blue grid studio, captions, the rigged man, motion helpers
  - `kit/public/myth/` the man's model, textures and 45 motion clips (CC0, see THIRD-PARTY-NOTICES.md)
- `tools/` check tools (flash cuts, line endings, sound check, `myth_script_lint.py`), `finish_audio.py` (final loudness), `make_sfx.py` (code-made sounds), `make_pad.py` (quiet held pad)

## Commands (run from `kit/`)
- Still frame: `npx remotion still src/index.ts <CompId> out/<name>.png --frame=<n>`
- Render: `npx remotion render src/index.ts <CompId> out/<name>.mp4` (add `--scale=0.5` for a quick draft)
- Myth scenes take `--props='{"samples":1}'` for fast drafts and `{"samples":12}` for finals
- Preview in a browser: `npm run studio`
- Sounds: `python ../tools/make_sfx.py public/sfx`; pad: `python ../tools/make_pad.py public/myth/pad.wav --seconds 30 --root D`

## Rules for working here
- If `kit/node_modules` is missing, run `npm install` in `kit/` first (it also needs Node 18+ and ffmpeg on PATH).
- Everything animated is a pure function of the frame; seeded randomness only.
- Look at a still before a full render; look at a contact sheet after it; run the check tools; then the `first-time-viewer` agent.
- Do not spend money (paid voices, music, assets), download assets or publish anything without the user's explicit yes.
