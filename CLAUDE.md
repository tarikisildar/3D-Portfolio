# 3D Portfolio

Next.js 15 + React Three Fiber portfolio. Each place I lived is a chapter with
its own 3D room (`src/data/chapters/`); projects, the CV and the blog are
shared across chapters.

## Writing a blog post

Blog posts live in the owner's Google Drive (`Blog/<post folder>/`), not in
this repo, and go live within about five minutes without a deploy. Follow
`docs/writing-a-post.md`, section "Posting from Claude on your phone": create
or edit Google Docs through the Drive connector (`index` for a post, a Doc
named `YYYY-MM-DD` for a travel-log day), write in the owner's words without
inventing anything, header lines (`date:`, `category:`, `place:`, `title:`,
`draft: true`) at the top, and `photo: <exact file name> | <caption>` lines
for photos the owner uploaded to that folder. Photos can't be uploaded by
Claude; ask the owner to add them with the Drive app.

## Other guides

- Adding a new place and room: `docs/adding-a-place.md`
- Videos: originals in `media-src/videos/`, `npm run videos` compresses them
  into `public/videos/`
- Room models: `npm run models`
