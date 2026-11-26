# The script

You write every spoken word. The whole script is 75-95 words and does six things. Lint it: `python tools/myth_script_lint.py script.txt`.

## Picking the idea (before a word is written)
An idea fits only if all five are yes:
1. Most people would guess wrong, and the wrong guess is one picture.
2. The truth turns on one principle that a simpler second test can show.
3. Both tests fit in one empty room with a man and two or three props.
4. The answer is known and sourced, not a guess. Write the source in the project notes.
5. The opening can be said in 16 words starting "If you", or as one question of 20 words or fewer.

Prefer everyday things: falls, water, cars, heat, pressure, magnets, ice, coins, lifts. Avoid weapons where another object makes the same point.

## Part A: the five moves (56-68 words, 18-22 s)
| # | Move | Pattern | Rule |
|---|---|---|---|
| 1 | **The dare** | "If you dropped a coin from the top of a skyscraper," | Opens with "If you". Second person, past tense, one act you can picture, already happening on screen. 10-16 words |
| 2 | **The wrong guess** | "most people assume it would crack the pavement." | "most people assume" plus the picture in everyone's head. Runs on from move 1 in the same sentence. 6-10 words |
| 3 | **The denial** | "But that's not exactly what would happen." | These seven words, or a version of nine or fewer starting "But". No explaining yet |
| 4 | **The simpler case** | "You see, if you dropped a marble and a feather in a room with no air, they would fall side by side." | Opens with "You see, if you". A second, simpler test that teaches the one principle the answer needs, and ends on that principle. 18-26 words |
| 5 | **The cut** | "But when you drop a coin through a mile of air, the coin" | Opens with "But when you", names the first test again, then the thing itself as the last words. No verb after it. No full stop. 9-13 words |

**The question hook.** For a "which one" idea, moves 1 and 2 may be a question instead: "Which would hit the ground first, a ball you drop or a ball you roll off a table? Most people assume the dropped one." The question is 20 words or fewer, both options are on screen while it is asked, and "most people assume" still follows. Moves 3, 4 and 5 do not change.

Never add: a greeting, "did you know", a second principle, numbers the picture cannot show, the word "myth", any verdict word, or any I, me or my. The narrator is nobody.

## Part C: the answer with a short build-up (30 words at most, 5-8 s)
It is the rest of the sentence that move 5 left open, so it starts with a verb, in lower case, and it does three things in order:
1. **What really happens**, in plain present tense: "...flutters and slows to the speed of a falling leaf."
2. **Why**, in one clause the picture can show: "The air pushes back as hard as gravity pulls."
3. **The callback** to the simpler case, as the last words: "...just like the feather."

One picture per clause here too. If the topic is safety, the answer is the full correct steps, in order, and may run to 40 words. Give the main advice, not the last resort.

## Voice on the page
- About 190 words a minute. Read it against a clock: part A must land in 18-22 s.
- Plain short words, a ten-year-old's reading level. No jargon unless the picture is the thing being named.
- Each clause is one picture. If you cannot say what the camera sees for a clause, cut the clause.
- Deadpan. No exclamation marks, no jokes in the words. The dry humour lives in the picture.
- Conditional mood through part A ("if you", "would", "could"). The answer is plain present tense.
- Nothing that only makes sense in one country.

## Caption chunks
Break every line into chunks of 1-3 words with a slash, at the natural stress: IF YOU / DROPPED / A COIN / FROM THE TOP / OF A / SKYSCRAPER. Never split a name or a number across chunks. The last chunk of part A is the noun ("THE COIN"). Put them in the script file as `CHUNKS:`; the lint checks they spell out part A exactly.

## Script file
A worked, passing example is `tools/myth_script_example.txt`. The layout:

```
A: If you ... , most people assume ... . But that's not exactly what would happen. You see, if you ... .
   But when you ... , the two balls
C: hit the floor at the same moment. Moving sideways does not slow a fall, ... just like the marbles.
SAFETY: no
CHUNKS: IF YOU / ROLLED / A BALL / ...
```

## Checklist
- [ ] Part A is 56-68 words. Move 1 starts "If you" (or is a question hook). Move 2 says "most people assume". Move 3 is a "But" sentence of nine words or fewer. Move 4 starts "You see, if you". Move 5 starts "But when you" and ends on a noun with no full stop.
- [ ] Part C is 30 words or fewer (40 for safety), starts in lower case, does not repeat the noun, and ends on the callback.
- [ ] No I, me or my. No "myth", no verdict words, no show name.
- [ ] Every clause has a picture in the shot list.
- [ ] Every caption chunk is 1-3 words.
- [ ] The answer's source is in the notes.
- [ ] The post caption is the open question, then one line of your own, then one or two hashtags. It never holds back safety advice.
