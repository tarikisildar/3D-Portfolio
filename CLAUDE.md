# 3D Portfolio

Next.js 15 + React Three Fiber portfolio. Each place I lived is a chapter with
its own 3D room (`src/data/chapters/`); projects, the CV and the blog are
shared across chapters.

## Writing a blog post

Follow `docs/writing-a-post.md`, section "Posting from Claude on your phone".
In short: branch `post/<slug>` off `master`, `npm run post -- "Title"`, write
in the owner's words without inventing anything, `npm run posts:check -- --fix`
until it passes, keep `draft: true` unless told to publish, then commit
(`Add post: <title>`), push, and open a pull request. Merging publishes.

## Other guides

- Adding a new place and room: `docs/adding-a-place.md`
- Videos: originals in `media-src/videos/`, `npm run videos` compresses them
  into `public/videos/`
- Room models: `npm run models`
