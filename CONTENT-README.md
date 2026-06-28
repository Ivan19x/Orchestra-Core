# How to add a lesson

You never touch any code to add, change, or reorder a lesson. You write one
Markdown file, drop it in a folder, and push it — the website does the rest.

## The 3 steps

1. **Write the lesson** as a plain-text Markdown file in the format below.
2. **Save it** into `src/content/lessons/` with the name `S<series>M<module>.md`
   (for example `S1M3.md` = Series 1, Module 3).
3. **Commit and push to GitHub.** The site rebuilds and the lesson appears
   automatically — series sort by number, modules sort by number, and the
   free/locked badge sets itself from the `free` field.

That's it. Adding `S2M5.md` and pushing is the whole process.

## The file format

The file has two parts: a small **frontmatter** block at the very top (between
two `---` lines) that tells the website about the lesson, then your **lesson
body** in normal Markdown.

```markdown
---
title: "What Money Actually Is"
series: 1
module: 1
seriesTitle: "Money Basics"
free: true
estMinutes: 18
summary: "Where money came from, what gives it value, and why trust is the real thing behind every shilling."
---

# What Money Actually Is

Your lesson content starts here, written normally.

## A heading inside the lesson

A paragraph of explanation. Just write naturally.

- A bullet point
- Another bullet point

**Bold** for emphasis. Tables, lists, and quotes all work.
```

## What each frontmatter line means

| Field | What it does |
|---|---|
| `title` | The lesson name shown to learners. Always in `"quotes"`. |
| `series` | Which series (1–9). Just the number, no quotes. |
| `module` | Which lesson within that series. Just the number. |
| `seriesTitle` | The human name of the series, e.g. `"Money Basics"`. In `"quotes"`. |
| `free` | `true` = a free starter lesson (readable with a free account). `false` = needs a paid account. No quotes. |
| `estMinutes` | Rough reading time in minutes. Just the number. |
| `summary` | One sentence shown on the lesson cards/lists. In `"quotes"`. |

## The naming rule (this is what makes it work)

Name the file by its series and module: **`S<series>M<module>.md`**

- Series 1, Module 1 → `S1M1.md`
- Series 1, Module 3 → `S1M3.md`
- Series 4, Module 7 → `S4M7.md`

The file name and the frontmatter numbers should match (`S4M7.md` has
`series: 4` and `module: 7`).

## A few rules to avoid breakage

- The frontmatter must be the **very first thing** in the file — the opening
  `---` on line 1, nothing above it.
- Keep the field names spelled exactly as shown (lowercase). A typo like
  `Free` or `modle` will make that one lesson get skipped (the rest are fine).
- `title`, `seriesTitle`, `summary` go in `"quotes"`; `series`, `module`,
  `estMinutes` are plain numbers; `free` is `true` or `false` with no quotes.
- Leave one blank line between the closing `---` and your first `# heading`.
- Write the body in normal Markdown. No HTML or code needed.

## Good to know

- **Order is automatic.** Series show in number order, modules in number order
  — never by when you added the file.
- **Gaps are fine.** If `S1M3` exists but `S1M2` doesn't yet, the site still
  shows what exists.
- **The whole programme is already on the site.** All nine series and every
  planned module show on the lessons page from day one — the ones without a
  content file yet appear greyed out as "Soon". The moment you drop in the
  matching `S<series>M<module>.md` file, that module becomes openable
  automatically. You only touch `src/lib/curriculum.ts` to change the *plan*
  itself (rename a planned module, add one beyond the list, reorder) — never to
  publish a lesson.
- **A bad file is skipped, not fatal.** If a file is missing required fields,
  the site logs a warning naming that file and skips just it; everything else
  keeps working.
- **The first/free lesson per series** is the one with `free: true`. Set the
  rest to `false`.

## Where the code lives (for reference only — you don't edit it)

- Lessons folder: `src/content/lessons/`
- Loader (auto-discovery + parsing + sorting): `src/lib/lessons.ts`
- Lessons list page: `src/pages/Lessons.tsx` · single lesson: `src/pages/Lesson.tsx`
