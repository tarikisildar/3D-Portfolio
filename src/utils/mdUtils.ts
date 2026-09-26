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
};

export type BlogPost = BlogPostMeta & {
  /** Markdown body, without the header and the title line. */
  body: string;
};

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

function parse(slug: string, raw: string): BlogPost {
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

/** A post by slug, or null if there is none (or it is a draft on the live site). */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = fileFor(slug);
  if (!file) return null;
  const post = parse(slug, fs.readFileSync(file, 'utf8'));
  return post.draft && !SHOW_DRAFTS ? null : post;
}

/** Every post, newest first; undated posts after dated ones. */
export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  return allSlugs()
    .map((slug) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { body, ...meta } = parse(slug, fs.readFileSync(fileFor(slug)!, 'utf8'));
      return meta;
    })
    .filter((post) => !post.draft || SHOW_DRAFTS)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
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

/** '2024-06-10' -> 'June 10, 2024'. Leaves anything else as written. */
export function formatPostDate(date?: string) {
  if (!date) return undefined;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
