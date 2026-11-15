# You commented FORMAT. Here's how to make these animations yourself.

Everything in the reel was made by Claude **writing code**, not by an AI video or image generator. That means no credits, no watermarks, and the same look every time. You can do it on your own computer in about 15 minutes of setup.

## What you need

- The **Claude desktop app** (Mac or Windows) with a paid Claude plan, so you get the **Code** tab.
- That's it to start. Claude checks for the free tools (Node, ffmpeg) and tells you exactly what's missing.

## Step 1. Get the skills (2 minutes)

Pick one:

- **Everything:** [Download ULTRA](https://github.com/WCRWCR12/claude-creator-skills/raw/main/downloads/ULTRA-all-skills.zip), every skill in one folder.
- **Just the animations:** [Download the Animation Styles pack](https://github.com/WCRWCR12/claude-creator-skills/raw/main/downloads/01-animation-styles.zip), 8 skills.

Unzip it.

## Step 2. Install (1 minute)

1. Open the Claude desktop app and go to the **Code** tab.
2. Drag the unzipped folder into the chat.
3. Say: **"install these skills"**.

Claude copies the skills into place, checks your tools, and gives you one example prompt per skill. Start a new chat afterwards so the skills load.

## Step 3. Make your first animation (5 minutes)

Say this, word for word:

> **"Make me a 10-second cartoon of a red ball with eyes rolling over hills. Use Remotion. Then show it again in three styles from the animation-styles library."**

The first time, Claude sets up a Remotion project (it asks before installing anything). It writes the scene, renders an mp4, and makes a contact sheet so you can see every beat on one image.

Then try:

| Say | You get |
|---|---|
| "Show me the style families in animation-styles." | The whole style menu, in plain English |
| "Same cartoon, but paper cut-out. Then clay. Then pixel art. Then chalk. Then neon." | One animation re-skinned in five looks, like the reel |
| "Animate my logo: `logo.svg`." | Your logo drawing itself in lines, exploding into parts and snapping back (logo-animation) |
| "Turn this script into a 30-second animated reel, one picture per line." | A full motion-graphics reel, planned beat by beat, with a self-critique pass (motion-graphics-render-loop) |
| "Copy the style of this reel: `reference.mp4`." | A side-by-side of the reference and your version, matched on every dimension (one-to-one-style) |
| "Make a pixel-art presenter who pops in and narrates." | A pixel character that walks into frame and talks (pixel-narrator) |

## Step 4. Make it look good, not like AI

These rules are built into the skills. If something looks off, say the rule out loud to Claude:

1. **Plan the pictures before the code.** Each line of your script gets one picture that explains it with no words. If the picture needs a caption to make sense, it's the wrong picture.
2. **Full frame rate.** Smooth motion, never choppy or stepped.
3. **Flat colour.** No gradients, no glows. Pick a palette from the style and stick to it.
4. **Move the camera through a built scene** instead of making objects jump on and off screen.
5. **No filler text.** No tiny labels, tags or fake interface text. Only words that matter.
6. **Check the contact sheet** against the style before you call it finished.

## Step 5. Finish the reel

Install the other packs (or ULTRA) and keep going in the same chat:

- **Video Editing** (`CUT`): add your voice, cut the pauses, burn word-by-word captions.
- **Hooks and Scripts** (`HOOK`): write the first line seven ways and pick the winner.
- **Captions and Growth** (`CAPTION`): a caption Instagram search can find.

## FAQ

**Does this cost credits?** No generation credits. The skills are free; Claude writes code and your computer renders it. You need a Claude plan with the Code tab.

**Mac or Windows?** Both.

**It says Node or ffmpeg is missing.** Say "install it for me" and approve the command Claude shows you.

**The skill didn't trigger.** Start a new chat after installing, or name it: "use the animation-styles skill".

**Can I use the animations commercially?** Yes, what you make is yours.

---

New free skills every week: **[@will.ai.m_system](https://www.instagram.com/will.ai.m_system/)** · Back to [all packs](README.md)
