# Install instructions (for Claude)

The user has dragged this folder in and asked to install the skills. Do the following, then report back in a short list.

## 1. Copy the skills

Every skill is a folder inside `skills/` that contains a `SKILL.md`. Copy each of those folders into the user's personal skills folder:

- Mac / Linux: `~/.claude/skills/`
- Windows: `%USERPROFILE%\.claude\skills\`

Create the folder if it doesn't exist. Copy whole folders, including `scripts/`, `references/`, `assets/`, `evals/` and `LICENSE` files. If a skill with the same name is already installed, ask the user before replacing it. Don't copy `README.md`, `INSTALL.md`, `LICENSES.md` or `FORMAT-GUIDE.md`.

## 2. Check the free tools

Only check the tools the installed skills need. Run each check and tell the user what's present and what's missing. Don't install anything without asking; show the install command and let them say yes.

| Tool | Check | Needed for | Install if missing |
|------|-------|-----------|--------------------|
| ffmpeg | `ffmpeg -version` | anything that cuts, captions, renders or reads video | Windows `winget install Gyan.FFmpeg`, Mac `brew install ffmpeg`, Linux `sudo apt install ffmpeg` |
| Python 3.9+ | `python --version` (or `python3`) | reel-cutter, caption-sync, instagram-edit, video-contact-sheet, voice-studio-local-tts | python.org, or `winget install Python.Python.3.12` / `brew install python` |
| Python packages | `python -c "import faster_whisper, numpy, PIL"` | reel-cutter, caption-sync, instagram-edit, video-contact-sheet | `pip install faster-whisper numpy pillow` (first run downloads a ~500 MB speech model) |
| yt-dlp | `python -m yt_dlp --version` | studying reference videos (video-contact-sheet, hook-flip-reel-scout, one-to-one-style) | `pip install yt-dlp` |
| Node 18+ | `node --version` | every animation skill (animation-styles, logo-animation, motion-graphics-render-loop, animation-ground-truth, pixel-narrator) | nodejs.org, or `winget install OpenJS.NodeJS.LTS` / `brew install node`. Remotion is set up per project with `npx create-video@latest`. |

The writing, planning and SEO skills need nothing installed.

## 3. Show the user how to start

For each installed skill, read its `SKILL.md` description and give the user one example prompt they can say. Keep it to one line per skill. If the animation skills were installed, add this first:

> Try: **"Make me a 10-second cartoon of a red ball rolling over hills, then show it in three styles from the animation-styles library."**

## 4. Finish

Tell the user which skills are installed (or which failed and why), which tools are missing, and that they may need to start a new chat for the skills to appear.

Nothing in these skills posts, sends, publishes or pays for anything on its own. Every step that would leave the user's computer asks them first.
