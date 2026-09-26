import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { getBlogPostBySlug, getAllBlogPosts, formatPostDate, resolvePostUrl } from '@/utils/mdUtils'

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
            {[date, post.category, post.readTime].filter(Boolean).join(' · ')}
          </p>
        </div>
      </header>

      {/* Typography plugin, recoloured to the room's palette in globals.css
          (.u-prose) rather than overriding every element here. */}
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <div className="u-prose prose prose-lg max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            remarkPlugins={[remarkGfm]}
            // Images and links written as ./photo.jpg belong to this post's
            // folder; see resolvePostUrl.
            urlTransform={(url) => resolvePostUrl(slug, url)}
            components={{
              // eslint-disable-next-line @next/next/no-img-element
              img: ({ src, alt }) => <img src={src as string} alt={alt ?? ''} loading="lazy" />,
            }}
          >
            {post.body}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  )
}
