import Link from 'next/link'
import { getAllBlogPosts, formatPostDate } from '@/utils/mdUtils'

// Built once per deploy, like the posts: a new post goes live with the
// deploy that adds it.

export default async function Blog() {
  const posts = await getAllBlogPosts()

  return (
    <>
      <section className="border-b border-[var(--rule-soft)]">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-10 sm:pb-16">
          <h1 className="u-display text-[clamp(2.25rem,6vw,4rem)]">Blog</h1>
          <p className="u-lede mt-4 text-[1.0625rem] text-[var(--ink-soft)]">
            A personal journal of experiences, thoughts and the occasional
            technical note. Posts are coming soon, or not very soon. I don&apos;t
            really know.
          </p>
        </div>
      </section>

      {/* An index, not a stack of cards: date on the left like a logbook,
          the post on the right. */}
      <section>
        <ol className="mx-auto max-w-6xl px-6 pb-20">
          {posts.map((post) => (
            <li key={post.slug} className="border-b border-[var(--rule-soft)]">
              <Link
                href={`/blog/${post.slug}`}
                className="group grid gap-2 py-10 focus:outline-none sm:grid-cols-[10rem_1fr] sm:gap-8"
              >
                <p className="u-figures text-[0.875rem] text-[var(--ink-soft)] sm:pt-2">
                  {formatPostDate(post.date) ?? 'Undated'}
                </p>
                <div>
                  <p className="text-[0.75rem] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                    {post.draft && <span className="text-[var(--live)]">Draft · </span>}
                    {[post.category, post.readTime].filter(Boolean).join(' · ')}
                  </p>
                  <h2
                    className="mt-1 text-[clamp(1.375rem,2.6vw,1.75rem)] leading-tight transition-colors group-hover:text-[var(--live)] group-focus-visible:text-[var(--live)]"
                    style={{ fontVariationSettings: '"wdth" 110, "wght" 620' }}
                  >
                    {post.title}
                  </h2>
                  <p className="u-lede mt-3 text-[1rem] text-[var(--ink-soft)]">{post.excerpt}</p>
                  <p className="mt-4 text-[0.9375rem]">
                    <span className="border-b border-[var(--live)] pb-px">Read the post</span>
                    <span aria-hidden className="ml-1 inline-block transition-transform group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
