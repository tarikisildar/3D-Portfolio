import fs from 'fs';
import path from 'path';

/**
 * Blog posts live in src/content/blog, one folder per post:
 *
 *   src/content/blog/best-coffee-in-munich/
 *     index.md       the post
 *     bla.jpg        its images, referenced from the post as ./bla.jpg
 *
 * The folder name is the URL slug. The post starts with a small header:
 *
 *   ---
 *   date: 2024-06-10
 *   category: Travel & Food
 *   draft: true        optional; drafts show in `npm run dev`, never live
 *   ---
 *   # The title
 *
 *   The first paragraph doubles as the excerpt on the blog index.
 *
 * A post can also be a travel log: the same folder, plus one file per day
 * named by its date, each with an optional header of its own:
 *
 *   src/content/blog/japan-2026/
 *     index.md          the trip: title, intro, start date
 *     2026-10-02.md     ---\nplace: Kyoto\n---\n what happened, photos
 *     2026-10-03.md
 *
 * A second entry on the same day is 2026-10-03-evening.md. The log sorts on
 * the blog by its latest entry.
 *
 * `npm run post "Title"` creates one; `npm run posts:check` validates them.
 * The full procedure is in docs/writing-a-post.md.
 */

export const POSTS_DIR = path.join(process.cwd(), 'src/content/blog');

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
  /** File name without .md; also the entry's anchor on the page. */
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

/** 2026-10-02.md, or 2026-10-02-evening.md for a second entry that day. */
const ENTRY_FILE = /^(\d{4}-\d{2}-\d{2})(?:-[a-z0-9-]+)?\.md$/;

/** Split a `---` header off the top of a file. Deliberately tiny: `key: value` lines only. */
export function splitHeader(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { fields: {} as Record<string, string>, rest: raw, hasHeader: false };
  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { fields, rest: raw.slice(match[0].length), hasHeader: true };
}

function parse(slug: string, raw: string): Omit<BlogPost, 'entries' | 'entryCount' | 'updated'> {
  const { fields, rest } = splitHeader(raw);
  const lines = rest.replace(/^\s+/, '').split('\n');
  const title = lines[0].replace(/^#\s+/, '').trim();
  const body = lines.slice(1).join('\n').trim();
  const excerpt =
    body
      .split(/\n\s*\n/)
      .find((para) => para.trim() && !/^(#|!\[|<)/.test(para.trim()))
      ?.trim() ?? '';
  // About 230 words a minute.
  const words = body.split(/\s+/).filter(Boolean).length;

  return {
    slug,
    title,
    excerpt,
    date: fields.date || undefined,
    category: fields.category || undefined,
    draft: fields.draft === 'true',
    readTime: `${Math.max(1, Math.round(words / 230))} min read`,
    body,
  };
}

/** The Markdown file for a slug: a folder's index.md, or a plain <slug>.md. */
function fileFor(slug: string) {
  const folder = path.join(POSTS_DIR, slug, 'index.md');
  if (fs.existsSync(folder)) return folder;
  const flat = path.join(POSTS_DIR, `${slug}.md`);
  if (fs.existsSync(flat)) return flat;
  return null;
}

function allSlugs() {
  return fs
    .readdirSync(POSTS_DIR, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.isDirectory() && fs.existsSync(path.join(POSTS_DIR, entry.name, 'index.md'))) return [entry.name];
      if (entry.isFile() && entry.name.endsWith('.md')) return [entry.name.replace(/\.md$/, '')];
      return [];
    });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** A travel log's day entries, oldest first, drafts left out on the live site. */
function readEntries(slug: string, startDate?: string): LogEntry[] {
  const dir = path.join(POSTS_DIR, slug);
  if (!fs.existsSync(path.join(dir, 'index.md'))) return [];
  const entries = fs
    .readdirSync(dir)
    .filter((name) => ENTRY_FILE.test(name))
    // By file name without .md: plain string order would put
    // 2026-10-04-2.md before 2026-10-04.md ('-' sorts before '.').
    .sort((a, b) => a.replace(/\.md$/, '').localeCompare(b.replace(/\.md$/, ''), 'en', { numeric: true }))
    .map((name) => {
      const { fields, rest } = splitHeader(fs.readFileSync(path.join(dir, name), 'utf8'));
      return {
        id: name.replace(/\.md$/, ''),
        date: name.match(ENTRY_FILE)![1],
        day: 0,
        place: fields.place || undefined,
        title: fields.title || undefined,
        draft: fields.draft === 'true',
        body: rest.trim(),
      };
    })
    .filter((entry) => !entry.draft || SHOW_DRAFTS);

  const start = Date.parse(startDate ?? entries[0]?.date ?? '');
  for (const entry of entries) {
    entry.day = Number.isNaN(start) ? 1 : Math.round((Date.parse(entry.date) - start) / DAY_MS) + 1;
  }
  return entries;
}

function load(slug: string): BlogPost | null {
  const file = fileFor(slug);
  if (!file) return null;
  const post = parse(slug, fs.readFileSync(file, 'utf8'));
  const entries = readEntries(slug, post.date);
  const words = [post.body, ...entries.map((e) => e.body)].join(' ').split(/\s+/).filter(Boolean).length;
  // A log with no intro yet is described by its latest day.
  const excerpt =
    post.excerpt ||
    (entries.at(-1)?.body.split(/\n\s*\n/).find((para) => para.trim() && !/^(#|!\[|<)/.test(para.trim()))?.trim() ?? '');
  return {
    ...post,
    excerpt,
    entries,
    entryCount: new Set(entries.map((e) => e.date)).size,
    updated: entries.at(-1)?.date,
    readTime: `${Math.max(1, Math.round(words / 230))} min read`,
  };
}

/** A post by slug, or null if there is none (or it is a draft on the live site). */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const post = load(slug);
  if (!post) return null;
  return post.draft && !SHOW_DRAFTS ? null : post;
}

/** Every post, newest first; a log counts from its latest entry; undated posts last. */
export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  const latest = (p: BlogPostMeta) => p.updated ?? p.date ?? '';
  return allSlugs()
    .map((slug) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { body, entries, ...meta } = load(slug)!;
      return meta;
    })
    .filter((post) => !post.draft || SHOW_DRAFTS)
    .sort((a, b) => latest(b).localeCompare(latest(a)));
}

/** Files that sit next to a post's index.md: its images. */
export function getPostMedia(slug: string): string[] {
  const dir = path.join(POSTS_DIR, slug);
  if (!fs.existsSync(path.join(dir, 'index.md'))) return [];
  return fs.readdirSync(dir).filter((name) => MEDIA_TYPES[path.extname(name).toLowerCase()]);
}

export const MEDIA_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

/**
 * `./photo.jpg` in a post -> `/blog/<slug>/photo.jpg`, where the media route
 * serves it. A relative link cannot be left to the browser: the post's URL
 * has no trailing slash, so it would resolve against /blog/ instead.
 */
export function resolvePostUrl(slug: string, url: string) {
  if (/^(?:[a-z]+:|\/|#)/i.test(url)) return url;
  return `/blog/${slug}/${url.replace(/^\.\//, '')}`;
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
