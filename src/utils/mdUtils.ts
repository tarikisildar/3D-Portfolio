import { findPostFolder, listPostFiles, listPostFolders, readPostText, type PostFile } from './blogSource';

/**
 * Blog posts: one folder per post, from Google Drive or src/content/blog
 * (see blogSource.ts). A post folder holds:
 *
 *   index            the post (for a travel log, the trip's intro)
 *   2026-09-26       travel-log days, one per date ("2026-09-26 evening" for
 *                    a second one that day)
 *   race.jpg …       photos
 *
 * Each text starts with optional header lines, then the title for `index`:
 *
 *   date: 2026-09-26          index only; orders the blog
 *   category: Running         index only
 *   place: Berlin             days only
 *   title: …                  days only
 *   draft: true               hides it on the live site
 *   # Berlin to Istanbul      (or just the first line)
 *
 * A `---` block around the header lines works too (the older .md format).
 *
 * Photos: a line `photo: race.jpg | Somewhere on the course` (easy to type in
 * a Google Doc on a phone), or Markdown `![Somewhere on the course](./race.jpg)`.
 * Several photo lines in a row become a grid.
 *
 * The full guide, including Drive setup, is docs/writing-a-post.md.
 */

/** Drafts are visible while developing, so they can be previewed. */
const SHOW_DRAFTS = process.env.NODE_ENV === 'development';

export type BlogPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date from the header, if any. */
  date?: string;
  category?: string;
  draft: boolean;
  readTime: string;
  /** Travel logs only: how many days have entries, and the date of the latest. */
  entryCount: number;
  updated?: string;
};

export type LogEntry = {
  /** From the file name ("2026-09-26", "2026-09-26 evening"), slugified: the entry's anchor. */
  id: string;
  date: string;
  /** Day of the trip, counting the log's start date (or first entry) as 1. */
  day: number;
  place?: string;
  title?: string;
  draft: boolean;
  body: string;
};

export type BlogPost = BlogPostMeta & {
  /** Markdown body, without the header and the title line. */
  body: string;
  /** Day entries, oldest first. Empty for an ordinary post. */
  entries: LogEntry[];
};

/** "2026-10-02", "2026-10-02-2", "2026-10-02 evening". */
const ENTRY_NAME = /^(\d{4}-\d{2}-\d{2})(?:[\s_-]+(.*))?$/;
const HEADER_KEYS = /^(date|category|draft|place|title)\s*:\s*(.*)$/i;
const MEDIA_NAME = /^(.+?\.(?:jpe?g|png|webp|gif|avif|heic|heif|svg|mp4))\s*(?:[|—–-]\s*)?(.*)$/i;

/** Google Docs' Markdown export escapes punctuation (race\_1.jpg); undo it where it matters. */
const unescape = (s: string) => s.replace(/\\([\\`*_{}[\]()#+\-.!|>~])/g, '$1');

/**
 * Split the header off a text: a `---` block, or leading `key: value` lines
 * (blank lines between them allowed, as a Doc exports one paragraph each).
 */
export function splitHeader(raw: string) {
  const text = raw.replace(/\r\n?/g, '\n');
  const fields: Record<string, string> = {};
  const block = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (block) {
    for (const line of block[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) fields[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
    return { fields, rest: text.slice(block[0].length) };
  }
  const lines = text.split('\n');
  let i = 0;
  for (; i < lines.length; i++) {
    const line = unescape(lines[i].trim());
    if (!line) continue;
    const m = line.match(HEADER_KEYS);
    if (!m) break;
    fields[m[1].toLowerCase()] = m[2].trim();
  }
  return { fields, rest: lines.slice(i).join('\n') };
}

/**
 * `photo: race.jpg | caption` lines -> Markdown images, with a run of them
 * (blank lines between allowed) merged into one paragraph so it renders as a
 * grid. Also repairs Markdown images whose brackets a Doc export escaped.
 */
function normaliseBody(body: string) {
  const out: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length) out.push(run.join('\n'), '');
    run = [];
  };
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    const photo = unescape(line).match(/^photo\s*:\s*(.+)$/i)?.[1].match(MEDIA_NAME);
    if (photo) {
      run.push(`![${photo[2].replace(/[[\]]/g, '')}](<./${photo[1]}>)`);
      continue;
    }
    if (!line && run.length) continue;
    flush();
    out.push(raw.replace(/!\\\[(.*?)\\\]\\?\((.*?)\\?\)/g, (_, alt, url) => `![${alt}](${unescape(url)})`));
  }
  flush();
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function firstParagraph(body: string) {
  return (
    body
      .split(/\n\s*\n/)
      .find((para) => para.trim() && !/^(#|!\[|<)/.test(para.trim()))
      ?.trim() ?? ''
  );
}

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

function parseIndex(slug: string, raw: string) {
  const { fields, rest } = splitHeader(raw);
  const lines = rest.replace(/^\s+/, '').split('\n');
  const title = unescape(lines[0].replace(/^#+\s*/, '').trim());
  const body = normaliseBody(lines.slice(1).join('\n'));
  return {
    slug,
    title,
    body,
    excerpt: firstParagraph(body),
    date: fields.date || undefined,
    category: fields.category || undefined,
    draft: fields.draft === 'true',
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function readEntries(files: PostFile[], startDate?: string): Promise<LogEntry[]> {
  const days = files
    .filter((f) => f.kind === 'text' && ENTRY_NAME.test(f.base))
    // Numeric-aware, and the plain date before "2026-10-04 evening" or -2.
    .sort((a, b) => a.base.localeCompare(b.base, 'en', { numeric: true }));

  const entries = await Promise.all(
    days.map(async (file) => {
      const { fields, rest } = splitHeader(await readPostText(file));
      return {
        id: file.base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        date: file.base.match(ENTRY_NAME)![1],
        day: 0,
        place: fields.place || undefined,
        title: fields.title || undefined,
        draft: fields.draft === 'true',
        body: normaliseBody(rest),
      };
    })
  );
  const visible = entries.filter((e) => e.body && (!e.draft || SHOW_DRAFTS));

  const start = Date.parse(startDate ?? visible[0]?.date ?? '');
  for (const e of visible) {
    e.day = Number.isNaN(start) ? 1 : Math.round((Date.parse(e.date) - start) / DAY_MS) + 1;
  }
  return visible;
}

async function load(slug: string): Promise<BlogPost | null> {
  const folder = await findPostFolder(slug);
  if (!folder) return null;
  const files = await listPostFiles(folder);
  const index = files.find((f) => f.kind === 'text' && f.base.toLowerCase() === 'index');
  if (!index) return null;

  const post = parseIndex(slug, await readPostText(index));
  const entries = await readEntries(files, post.date);
  return {
    ...post,
    // A log with no intro yet is described by its latest day.
    excerpt: post.excerpt || firstParagraph(entries.at(-1)?.body ?? ''),
    entries,
    entryCount: new Set(entries.map((e) => e.date)).size,
    updated: entries.at(-1)?.date,
    readTime: `${Math.max(1, Math.round(words([post.body, ...entries.map((e) => e.body)].join(' ')) / 230))} min read`,
  };
}

/** A post by slug, or null if there is none (or it is a draft on the live site). */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const post = await load(slug);
  return post && (!post.draft || SHOW_DRAFTS) ? post : null;
}

/** Every post, newest first; a log counts from its latest entry; undated posts last. */
export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  const latest = (p: BlogPostMeta) => p.updated ?? p.date ?? '';
  const posts = await Promise.all(
    (await listPostFolders()).map(async ({ slug }) => {
      try {
        const post = await load(slug);
        if (!post) return null;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { body, entries, ...meta } = post;
        return meta;
      } catch (error) {
        // One broken post (a Doc mid-edit, a Drive hiccup) must not take the
        // whole blog down.
        console.error(`Skipping blog post "${slug}":`, error);
        return null;
      }
    })
  );
  return posts
    .filter((p): p is BlogPostMeta => p !== null && (!p.draft || SHOW_DRAFTS))
    .sort((a, b) => latest(b).localeCompare(latest(a)));
}

/** A photo in a post's folder, by file name. */
export async function getPostMediaFile(slug: string, name: string) {
  const folder = await findPostFolder(slug);
  if (!folder) return null;
  return (await listPostFiles(folder)).find((f) => f.kind === 'media' && f.name === name) ?? null;
}

/** Names of every photo in a post's folder. */
export async function getPostMedia(slug: string) {
  const folder = await findPostFolder(slug);
  if (!folder) return [];
  return (await listPostFiles(folder)).filter((f) => f.kind === 'media').map((f) => f.name);
}

/**
 * `./photo.jpg` in a post -> `/blog/<slug>/photo.jpg`, where the media route
 * serves it. A relative link cannot be left to the browser: the post's URL
 * has no trailing slash, so it would resolve against /blog/ instead.
 */
export function resolvePostUrl(slug: string, url: string) {
  if (/^(?:[a-z]+:|\/|#)/i.test(url)) return url;
  let name = url.replace(/^\.\//, '');
  try {
    name = decodeURIComponent(name);
  } catch {
    // Not percent-encoded; use as written.
  }
  return `/blog/${slug}/${encodeURIComponent(name)}`;
}

/** '2026-10-02' -> 'Fri, 2 Oct'. For log entries, where the year is the trip's. */
export function formatEntryDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** '2024-06-10' -> 'June 10, 2024'. Leaves anything else as written. */
export function formatPostDate(date?: string) {
  if (!date) return undefined;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
