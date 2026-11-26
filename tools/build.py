"""Build the pack zips, the ULTRA zip and the README pack tables.

Run from the repo root:  python tools/build.py
- checks every skill in packs.json exists and has a SKILL.md with name + description
- scans skills/ for secrets and private details (fails the build on a hit)
- writes downloads/<pack-id>.zip and downloads/ULTRA-all-skills.zip (stable timestamps)
- for each entry in packs.json "bundles" (a whole folder shipped as one zip, e.g. the Reel Pack studio): scans it the
  same way and writes downloads/<bundle-id>.zip
- rewrites the blocks between <!-- PACKS:START --> / <!-- PACKS:END --> and
  <!-- SKILLS:START --> / <!-- SKILLS:END --> in README.md
"""
import json
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILLS = os.path.join(ROOT, "skills")
DL = os.path.join(ROOT, "downloads")
STAMP = (2026, 1, 1, 0, 0, 0)
SKIP_DIRS = {".git", "__pycache__", "node_modules", ".venv", "out"}
SKIP_EXT = {".pyc", ".mp4", ".mov", ".bak"}

# Private details and secrets that must never ship. Case-sensitive on purpose ("will" the verb is fine).
BLOCK = [
    r"TempAdmin", r"[A-Z]:\\Users\\", r"/Users/wcr", r"earthpoints", r"systemgc\.com\.au",
    r"London Gazebo", r"System GC", r"Will's", r"Ask Will", r"\bSGC\b", r"pixel Will", r"HostWill", r"\bLGH\b", r"\bIndi\b", r"\bSterling\b", r"Vera Social", r"office bus",
    r"telegram-outbox", r"people\.md", r"wellbeing\.md",
    r"sk-ant-[A-Za-z0-9_-]{10,}", r"ghp_[A-Za-z0-9]{20,}", r"github_pat_[A-Za-z0-9_]{20,}",
    r"AKIA[0-9A-Z]{16}", r"AIza[0-9A-Za-z_-]{30,}", r"xox[bap]-[A-Za-z0-9-]{10,}",
    r"\b\d{8,10}:[A-Za-z0-9_-]{30,}\b", r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
]
TEXT_EXT = {".md", ".txt", ".json", ".py", ".js", ".ts", ".tsx", ".jsx", ".css", ".html", ".yml", ".yaml", ".sh", ".csv", ".ps1"}


def frontmatter(path):
    t = open(path, encoding="utf-8", errors="replace").read()
    m = re.match(r"---\s*\n(.*?)\n---", t, re.S)
    fm = m.group(1) if m else ""
    name = re.search(r"^name:\s*(.+)$", fm, re.M)
    desc = re.search(r"^description:\s*(>-?|\|)?\s*\n?((?:.|\n)*?)(?=^\w[\w-]*:|\Z)", fm, re.M)
    d = re.sub(r"\s+", " ", desc.group(2)).strip() if desc else ""
    return (name.group(1).strip() if name else None), d


def short(desc, n=150):
    d = re.sub(r"^(Use (this skill )?(to|when)[^.]*?(--|—|:)\s*)", "", desc)
    first = re.split(r"(?<=[.!?])\s", d)[0]
    return first if len(first) <= n else first[: n - 1].rsplit(" ", 1)[0] + "…"


def files_of(skill):
    base = os.path.join(SKILLS, skill)
    for a, dirs, fs in os.walk(base):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
        for f in fs:
            if os.path.splitext(f)[1].lower() in SKIP_EXT or ".bak" in f:
                continue
            yield os.path.join(a, f)


def scan(skills):
    hits = []
    for s in skills:
        for p in files_of(s):
            if os.path.splitext(p)[1].lower() not in TEXT_EXT:
                continue
            t = open(p, encoding="utf-8", errors="replace").read()
            for pat in BLOCK:
                for m in re.finditer(pat, t):
                    hits.append(f"{os.path.relpath(p, ROOT)}: {pat} -> {m.group(0)[:40]}")
    return hits


def files_under(base):
    for a, dirs, fs in os.walk(base):
        dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS)
        for f in sorted(fs):
            if os.path.splitext(f)[1].lower() in SKIP_EXT or ".bak" in f:
                continue
            yield os.path.join(a, f)


def scan_tree(base):
    hits = []
    for p in files_under(base):
        if os.path.splitext(p)[1].lower() not in TEXT_EXT:
            continue
        t = open(p, encoding="utf-8", errors="replace").read()
        for pat in BLOCK:
            for m in re.finditer(pat, t):
                hits.append(f"{os.path.relpath(p, ROOT)}: {pat} -> {m.group(0)[:40]}")
    return hits


def write_tree_zip(path, top, base):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for p in files_under(base):
            rel = os.path.relpath(p, base).replace(os.sep, "/")
            zi = zipfile.ZipInfo(f"{top}/{rel}", STAMP)
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = (0o755 if rel.endswith(".sh") else 0o644) << 16
            z.writestr(zi, open(p, "rb").read())


def write_zip(path, top, skills, extra):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        def add(arc, data):
            zi = zipfile.ZipInfo(arc, STAMP)
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o644 << 16
            z.writestr(zi, data)
        for name, data in extra:
            add(f"{top}/{name}", data)
        for s in skills:
            for p in sorted(files_of(s)):
                rel = os.path.relpath(p, SKILLS).replace(os.sep, "/")
                add(f"{top}/skills/{rel}", open(p, "rb").read())


def replace_block(text, tag, body):
    a, b = f"<!-- {tag}:START -->", f"<!-- {tag}:END -->"
    if a not in text:
        return text
    pre, rest = text.split(a, 1)
    post = rest.split(b, 1)[1]
    return f"{pre}{a}\n{body}\n{b}{post}"


def main():
    cfg = json.load(open(os.path.join(ROOT, "packs.json"), encoding="utf-8"))
    repo = cfg["repo"]
    raw = f"https://github.com/{repo}/raw/main/downloads"
    errors, seen, info = [], {}, {}
    for p in cfg["packs"]:
        for s in p["skills"]:
            sk = os.path.join(SKILLS, s, "SKILL.md")
            if not os.path.isfile(sk):
                errors.append(f"missing skill: {s} (pack {p['id']})")
                continue
            if s in seen:
                errors.append(f"{s} is in two packs: {seen[s]} and {p['id']}")
            seen[s] = p["id"]
            name, desc = frontmatter(sk)
            if not desc:
                errors.append(f"{s}: SKILL.md has no description")
            info[s] = desc
    orphans = sorted(d for d in os.listdir(SKILLS) if os.path.isdir(os.path.join(SKILLS, d)) and d not in seen)
    if orphans:
        errors.append("skills not in any pack: " + ", ".join(orphans))
    hits = scan(list(seen))
    bundles = cfg.get("bundles", [])
    for b in bundles:
        base = os.path.join(ROOT, b["path"])
        if not os.path.isfile(os.path.join(base, "README.md")):
            errors.append(f"bundle {b['id']}: {b['path']}/README.md is missing")
            continue
        hits += scan_tree(base)
        b["n_skills"] = sum(1 for p in files_under(os.path.join(base, ".claude", "skills")) if os.path.basename(p) == "SKILL.md" and os.path.dirname(os.path.dirname(p)).endswith("skills"))
    if hits:
        errors += ["private/secret hit: " + h for h in hits]
    if errors:
        print("BUILD FAILED\n  " + "\n  ".join(errors))
        sys.exit(1)

    os.makedirs(DL, exist_ok=True)
    for f in os.listdir(DL):
        if f.endswith(".zip"):
            os.remove(os.path.join(DL, f))
    install = open(os.path.join(ROOT, "INSTALL.md"), "rb").read()
    licence = open(os.path.join(ROOT, "LICENSES.md"), "rb").read()
    all_skills = []
    for p in cfg["packs"]:
        readme = [f"# {p['title']} pack ({len(p['skills'])} free Claude skills)\n", p["blurb"] + "\n",
                  "Install: open the Claude desktop app, Code tab, drag this whole folder into the chat and say **\"install these skills\"**.\n",
                  "| Skill | What it does |", "|---|---|"]
        readme += [f"| `{s}` | {short(info[s])} |" for s in p["skills"]]
        readme.append(f"\nAll packs and the full guide: https://github.com/{repo}\n")
        write_zip(os.path.join(DL, p["id"] + ".zip"), f"claude-skills-{p['id']}", p["skills"],
                  [("README.md", "\n".join(readme).encode()), ("INSTALL.md", install), ("LICENSES.md", licence)])
        all_skills += p["skills"]
    ultra_readme = (f"# ULTRA: all {len(all_skills)} free Claude skills\n\nInstall: open the Claude desktop app, Code tab, drag this whole "
                    f"folder into the chat and say **\"install these skills\"**.\n\nFull list and guide: https://github.com/{repo}\n").encode()
    write_zip(os.path.join(DL, "ULTRA-all-skills.zip"), "claude-skills-ULTRA", all_skills,
              [("README.md", ultra_readme), ("INSTALL.md", install), ("LICENSES.md", licence),
               ("FORMAT-GUIDE.md", open(os.path.join(ROOT, "FORMAT-GUIDE.md"), "rb").read())])

    for b in bundles:
        write_tree_zip(os.path.join(DL, b["id"] + ".zip"), b["id"], os.path.join(ROOT, b["path"]))

    def kb(f):
        return max(1, os.path.getsize(os.path.join(DL, f)) // 1024)

    ultra_kb = kb("ULTRA-all-skills.zip")
    rows = [f"| **ULTRA** (everything) | {len(all_skills)} | **[Download ULTRA ({ultra_kb} KB)]({raw}/ULTRA-all-skills.zip)** | every pack below in one folder |"]
    for b in bundles:
        mb = kb(b["id"] + ".zip") / 1024
        rows.append(f"| **{b['title']}** (`{b['keyword']}`) | {b['n_skills']} + studio kit | **[Download]({raw}/{b['id']}.zip)** ({mb:.1f} MB) | {b['blurb']} [What's inside]({b['path']}/README.md) |")
    for p in cfg["packs"]:
        rows.append(f"| **{p['title']}** (`{p['keyword']}`) | {len(p['skills'])} | [Download]({raw}/{p['id']}.zip) ({kb(p['id'] + '.zip')} KB) | {p['blurb']} |")
    packs_md = "| Pack | Skills | Download | What you get |\n|---|---|---|---|\n" + "\n".join(rows)
    sk_md = []
    for p in cfg["packs"]:
        sk_md.append(f"\n### {p['title']} (`{p['keyword']}`)\n")
        sk_md += [f"- **[{s}](skills/{s}/SKILL.md)**: {short(info[s])}" for s in p["skills"]]
    rp = os.path.join(ROOT, "README.md")
    t = open(rp, encoding="utf-8").read()
    t = replace_block(t, "PACKS", packs_md)
    t = replace_block(t, "SKILLS", "\n".join(sk_md).strip())
    t = re.sub(r"\b\d+ free Claude skills\b", f"{len(all_skills)} free Claude skills", t)
    open(rp, "w", encoding="utf-8", newline="\n").write(t)
    print(f"OK: {len(cfg['packs'])} packs, {len(all_skills)} skills, ULTRA {ultra_kb} KB")
    for f in sorted(os.listdir(DL)):
        print(f"  downloads/{f}  {kb(f)} KB")


if __name__ == "__main__":
    main()
