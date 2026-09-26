import fs from 'fs';
import path from 'path';

/**
 * Blog posts are Markdown files in src/content/blog, one per post. The file
 * name is the URL slug. An optional header at the top carries the metadata:
 *
 *   ---
 *   date: 2024-06-10
 *   category: Travel & Food
 *   ---
 *   # The title
 *
 *   The first paragraph doubles as the excerpt on the blog index.
 *
 * Both fields are optional; a post without a date simply shows none.
 */

const POSTS_DIR = path.join(process.cwd(), 'src/content/blog');

export type BlogPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date from the header, if any. */
  date?: string;
  category?: string;
  readTime: string;
};

export type BlogPost = BlogPostMeta & {
  /** Markdown body, without the header and the title line. */
  body: string;
};

/** Split a `---` header off the top of a file. Deliberately tiny: `key: value` lines only. */
function splitHeader(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { fields: {} as Record<string, string>, rest: raw };
  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { fields, rest: raw.slice(match[0].length) };
}

function parse(slug: string, raw: string): BlogPost {
  const { fields, rest } = splitHeader(raw);
  const lines = rest.replace(/^\s+/, '').split('\n');
  const title = lines[0].replace(/^#\s+/, '').trim();
  const body = lines.slice(1).join('\n').trim();
  const excerpt = body.split(/\n\s*\n/).find((para) => para.trim() && !para.startsWith('#'))?.trim() ?? '';
  // About 230 words a minute.
  const words = body.split(/\s+/).filter(Boolean).length;

  return {
    slug,
    title,
    excerpt,
    date: fields.date || undefined,
    category: fields.category || undefined,
    readTime: `${Math.max(1, Math.round(words / 230))} min read`,
    body,
  };
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost> {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.md`), 'utf8');
  return parse(slug, raw);
}

/** Every post, newest first; undated posts after dated ones. */
export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { body, ...meta } = parse(name.replace(/\.md$/, ''), fs.readFileSync(path.join(POSTS_DIR, name), 'utf8'));
      return meta;
    })
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

/** '2024-06-10' -> 'June 10, 2024'. Leaves anything else as written. */
export function formatPostDate(date?: string) {
  if (!date) return undefined;
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
