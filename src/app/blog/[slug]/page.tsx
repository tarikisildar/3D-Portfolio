import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PostMarkdown } from '@/components/ui/PostMarkdown'
import { getBlogPostBySlug, getAllBlogPosts, formatPostDate, formatEntryDate } from '@/utils/mdUtils'

// Built once per deploy: a new post goes live with the deploy that adds it.
export async function generateStaticParams() {
  const posts = await getAllBlogPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

// Anything not generated above is not a post.
export const dynamicParams = false

// In the Next 15 App Router, params is always a Promise.
type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const post = await getBlogPostBySlug((await params).slug)
  return post ? { title: `${post.title} · Tarik Isildar`, description: post.excerpt } : {}
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  const date = formatPostDate(post.date)
  const isLog = post.entries.length > 0
  const meta = isLog
    ? [
        `${post.entryCount} ${post.entryCount === 1 ? 'day' : 'days'}`,
        post.updated && `updated ${formatPostDate(post.updated)}`,
        post.category,
      ]
    : [date, post.category, post.readTime]

  return (
    <article>
      <header className="border-b border-[var(--rule-soft)]">
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-10">
          <Link
            href="/blog"
            className="text-[0.875rem] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
          >
            <span aria-hidden>&larr; </span>Blog
          </Link>
          {post.draft && (
            <p className="mt-6 inline-block border border-[var(--live)] px-2 py-0.5 text-[0.75rem] uppercase tracking-[0.08em] text-[var(--live)]">
              Draft: not on the live site
            </p>
          )}
          <h1 className="u-display mt-6 text-[clamp(2rem,5vw,3.25rem)]">{post.title}</h1>
          <p className="u-figures mt-4 text-[0.875rem] text-[var(--ink-soft)]">
            {meta.filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>

      {post.body && (
        <div className="mx-auto max-w-3xl px-6 pt-12 sm:pt-16">
          <PostMarkdown slug={slug}>{post.body}</PostMarkdown>
        </div>
      )}

      {/* A travel log: one section per day, oldest first, the date and place
          in the margin like a logbook. Each day has an anchor
          (#2026-10-02) so a single day can be linked. */}
      {isLog && (
        <ol className="mx-auto max-w-3xl px-6 pt-8">
          {post.entries.map((entry) => (
            <li
              key={entry.id}
              id={entry.id}
              className="scroll-mt-[calc(var(--bar-h)+1rem)] border-t border-[var(--rule-soft)] py-10 first:border-t-[var(--ink)]"
            >
              <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <a
                  href={`#${entry.id}`}
                  className="u-figures text-[0.75rem] uppercase tracking-[0.08em] text-[var(--live)]"
                >
                  Day {entry.day}
                </a>
                <p className="u-figures text-[0.875rem] text-[var(--ink-soft)]">
                  {formatEntryDate(entry.date)}
                  {entry.place && <> &middot; {entry.place}</>}
                </p>
                {entry.draft && (
                  <span className="text-[0.75rem] uppercase tracking-[0.08em] text-[var(--live)]">Draft</span>
                )}
              </header>
              {entry.title && (
                <h2
                  className="mt-2 text-[clamp(1.375rem,2.6vw,1.75rem)] leading-tight"
                  style={{ fontVariationSettings: '"wdth" 110, "wght" 620' }}
                >
                  {entry.title}
                </h2>
              )}
              <div className="mt-4">
                <PostMarkdown slug={slug}>{entry.body}</PostMarkdown>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="pb-16" />
    </article>
  )
}
