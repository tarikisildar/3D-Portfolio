import Link from 'next/link'
import { getAllBlogPosts } from '@/utils/mdUtils'

// Make this server component to read files
export const dynamic = 'force-dynamic'

export default async function Blog() {
  // Get blog posts from markdown files
  const blogPosts = await getAllBlogPosts()

  return (
    <main className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Heading */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">My Blog</h1>
          <p className="text-foreground/70 max-w-3xl mx-auto">
            A personal journal of experiences, thoughts, and occasional technical insights. Posts are coming soon, or not very soon. I don&apos;t really know.
          </p>
        </div>

        {/* Blog Posts */}
        <div className="space-y-12">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="border-b border-foreground/10 pb-12 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-2 md:mb-0 inline-block">
                  {post.category}
                </span>
                <div className="text-sm text-foreground/60">
                  {post.date} • {post.readTime}
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-3">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </h2>

              <p className="text-foreground/70 mb-4">
                {post.excerpt}
              </p>

              <Link
                href={`/blog/${post.slug}`}
                className="text-primary hover:text-primary-dark font-medium inline-flex items-center transition-colors"
              >
                Read More
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}