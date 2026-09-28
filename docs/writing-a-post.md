# Writing a blog post

Posts live in a **Google Drive folder**, not in this repo. The site reads the
folder directly and refreshes every five minutes, so writing or editing a
post needs no commit and no deploy.

(Without the Drive settings, e.g. running locally with nothing configured,
the site reads `src/content/blog/` in the repo instead, in the same format.)

```
Blog/                              the folder the site reads
  Best Coffee in Munich/           one folder per post; its name is the URL
    index                          Google Doc: the post
  Berlin to Istanbul/              a travel log
    index                          Google Doc: the trip's intro
    2026-09-26                     Google Doc: a day
    2026-09-27                     Google Doc: a day
    2026-09-27 evening             a second entry that day
    race.jpg, medal.jpg            photos, straight from the phone
```

The folder name becomes the URL: "Berlin to Istanbul" is
`/blog/berlin-to-istanbul`. Renaming a folder changes its URL.

## Writing a post

A Google Doc named **index** inside the post's folder:

```
date: 2026-10-12
category: Running
draft: true

Best running routes              ← the title: the first line after the header
                                   (Heading 1 or plain text, either works)
The first paragraph is the excerpt shown on the blog list.

More text, **bold**, lists, links: normal Doc formatting.

photo: pegnitz.jpg | The loop along the Pegnitz at 7am
```

- The header lines at the top are all optional. `date` is `YYYY-MM-DD` and
  orders the blog. `draft: true` keeps the post off the live site; delete
  the line to publish.
- **Photos:** upload them into the post's folder (on the phone: *Share →
  Drive*, pick the folder), then add a line `photo: <file name> | <caption>`
  where it should appear. Several `photo:` lines in a row become a grid.
  Photos can come straight off the phone: the site shrinks them and removes
  their metadata (including location) when it serves them.
- iPhone photos in HEIC format may not display; if one doesn't, set the
  camera to *Most Compatible* or export it as JPEG.

## A travel log

A post folder with day Docs beside its `index`. Each day is a Doc **named by
its date**, `2026-09-27` (a second one that day: `2026-09-27 evening`):

```
place: Berlin
title: Race day                  (optional)

It was difficult. But I finished in 4 hours 41 minutes…

photo: race.jpg | Somewhere on the course
photo: medal.jpg | The medal
```

Days are numbered from the log's `date`. The blog lists the trip by its
latest day, so adding a day brings it back to the top. Each day has a link of
its own: `/blog/berlin-to-istanbul#2026-09-27`. A single day can be held back
with `draft: true`.

## When it shows up

Within about five minutes of saving. Nothing to commit or deploy.

## Posting from Claude on your phone

Claude can create and edit the Docs through the Google Drive connector. It
cannot upload photos, so photos go in through the Drive app.

Ask for something like:

> Add today to the Berlin to Istanbul log in my Blog folder. Place: Berlin.
> Here's what happened: … I uploaded race.jpg and medal.jpg.

What Claude should do:

1. Find `Blog/<post>/` in Drive (for a new post, create the folder and an
   `index` Doc).
2. For a log day, create a Doc named with the date (ask if it isn't clear
   which day, or which time zone).
3. Write in your words: tidy, don't invent facts, places or opinions.
4. Put `place:` (and `title:` if given) at the top, then the text, then a
   `photo: <file> | <caption>` line for each photo you uploaded, using the
   exact file names in the folder.
5. Leave `draft: true` in a new post's `index` unless you said to publish.

---

## One-time setup

The site reads Drive as a **service account**: a robot Google account that
can only see what you share with it.

1. In the [Google Cloud console](https://console.cloud.google.com/), create
   a project (or pick one) and enable the **Google Drive API** for it.
2. *IAM & Admin → Service accounts → Create*, e.g. `portfolio-blog`. No roles
   needed. Open it, *Keys → Add key → JSON*: a key file downloads.
3. In Google Drive, create the **Blog** folder and *Share* it with the service
   account's email (`portfolio-blog@<project>.iam.gserviceaccount.com`) as
   **Viewer**.
4. Open the folder; its id is the last part of the URL
   (`drive.google.com/drive/folders/<this>`).
5. In Vercel, *Project → Settings → Environment Variables*, add:
   - `BLOG_DRIVE_FOLDER_ID`: the folder id
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: the whole JSON key file's contents (or the
     same, base64-encoded)

   Then redeploy once. To see Drive posts in `npm run dev` too, put the same
   two lines in `.env.local` (git ignores it).

Treat the key file like a password: it only reads what you shared with it,
but don't commit it or post it anywhere.

## Local posts

`src/content/blog/` uses the same layout, with `.md` files instead of Docs
(`index.md`, `2026-09-27.md`). `npm run post` / `npm run post:day` scaffold
them and `npm run posts:check -- --fix` validates them and shrinks photos.
They're only used when Drive isn't configured.
