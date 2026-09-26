import Link from 'next/link'
import { getBlogPostBySlug, getAllBlogPosts, formatPostDate } from '@/utils/mdUtils'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

export async function generateStaticParams() {
  const posts = await getAllBlogPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

// Always read the latest Markdown.
export const dynamic = 'force-dynamic'

// In the Next 15 App Router, params is always a Promise.
type Props = {
  params: Promise<{ slug: string }>
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
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
          <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
            {post.body}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  )
}
