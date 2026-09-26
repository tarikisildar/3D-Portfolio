# Writing a blog post

Each post is a folder in `src/content/blog/`. The folder name is the URL.

```
src/content/blog/best-running-routes/
  index.md        the post
  pegnitz.jpg     its images, next to it
```

## 1. Start it

```bash
npm run post -- "Best running routes" --category "Running"
```

This creates the folder and an `index.md` with today's date, marked as a
draft:

```markdown
---
date: 2026-09-26
category: Running
draft: true
---
# Best running routes

The first paragraph is the excerpt on the blog index. Write it last.
```

`category` is optional. `date` is `YYYY-MM-DD` and orders the blog, newest
first.

## 2. Write it

Plain Markdown. The first paragraph after the title is what the blog index
shows under the title, so make it a sentence that makes someone want to
click.

**Images** go in the post's folder and are referenced relative to it:

```markdown
![The loop along the Pegnitz at 7am](./pegnitz.jpg)
```

Use short names without spaces. Phone photos are fine as they come; the
check below shrinks them.

## 3. Check it

```bash
npm run posts:check -- --fix
```

Fails if a header is malformed, a date is wrong, the title line is missing,
or the post uses an image that isn't in its folder. Warns about images that
aren't used. `--fix` shrinks big images to at most 2000px (JPEG quality 80)
and strips their location data; without `--fix` it only reports them.

## 4. Preview it

`npm run dev` and open `/blog`. Drafts show up locally with a red **Draft**
label; they never appear on the live site.

## 5. Publish it

Delete the `draft: true` line, commit, and push. The post goes live with the
next deploy.

---

## Travel logs

A trip you add to as it happens: one post, with a short entry per day.

```bash
npm run post -- "Japan 2026" --log --category Travel
npm run post:day -- japan-2026 --place "Tokyo"
npm run post:day -- japan-2026 --place "Kyoto" --title "Up the mountain before breakfast"
```

That gives:

```
src/content/blog/japan-2026/
  index.md          the trip: title, a line or two of intro, start date
  2026-10-02.md     Day 1
  2026-10-04.md     Day 3 (days are counted from the start date)
  2026-10-04-2.md   a second entry the same day
  inari.jpg …       photos for any day, all in the one folder
```

A day file is just Markdown, with an optional header:

```markdown
---
place: Kyoto
title: Up the mountain before breakfast
---
Fushimi Inari at 6am, before the crowds.

![The gates](./inari-gates.jpg)
![Halfway up](./inari-steps.jpg)
![The view](./inari-top.jpg)
```

Images on consecutive lines become a photo grid; one on its own shows full
width. `post:day` uses today's date unless you pass `--date 2026-10-02`.

On the blog the trip is listed as a travel log, dated by its latest day, so
adding a day moves it back to the top. Each day has its own link:
`/blog/japan-2026#2026-10-04`. Publish the trip once (remove `draft: true`
from `index.md`) and every day you add after that goes live with the next
deploy. A single day can be held back with `draft: true` in its own header.

---

## Posting from Claude on your phone

The steps above are what Claude follows too; `CLAUDE.md` points at this
section. The short version of what to ask for:

> Write a blog post called "…", category "…". Here is what I want to say: …
> Publish it. / Leave it as a draft.

or, for a trip:

> Add today to the Japan log. We're in Kyoto. Here's what happened: …
> (photos attached, or: I uploaded inari-1.jpg and inari-2.jpg)

What Claude does:

1. Branches off `master` as `post/<slug>` (for a log day,
   `post/<log>-<date>`).
2. Runs `npm ci` if dependencies are missing, then `npm run post`.
3. Writes the post from what you said, in your words. It tidies, it does not
   invent: no facts, places or opinions you didn't give it.
   For a travel log day it runs `npm run post:day -- <log> --place "…"`
   instead (with `--date` if you're writing about another day; the cloud
   machine's clock may not be in your time zone, so it asks when unsure).
4. Adds images, if any (see below).
5. Runs `npm run posts:check -- --fix` and fixes anything it reports.
6. Removes `draft: true` only if you said to publish.
7. Commits as `Add post: <title>`, pushes the branch and opens a pull request.
   Vercel comments on the pull request with a **preview link**. Open it on
   your phone, and merge the pull request to publish.

**Photos.** Claude can see photos you attach in the chat, but may not be able
to save them into the repo as files. If it can't, the dependable route is to
upload them yourself: on github.com (or the GitHub app), open the
`post/<slug>` branch, go to the post's folder, *Add file → Upload files*.
Then tell Claude the file names, and it will place them in the post and run
the check, which shrinks them.
