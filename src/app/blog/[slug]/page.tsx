import Link from 'next/link'
import { getBlogPostBySlug, getAllBlogPosts } from '@/utils/mdUtils'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

// Generate dynamic params for blog posts
export async function generateStaticParams() {
  const posts = await getAllBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

// Set dynamic rendering to ensure we always get the latest content
export const dynamic = 'force-dynamic'

// Fix the component props type to work with both local and Vercel builds
type PageProps = {
  params: {
    slug: string;
  };
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = params

  const post = await getBlogPostBySlug(slug)

  // Hardcoded metadata for now - you can enhance this by adding frontmatter to your markdown
  const category = "Travel & Food"
  const date = "June 10, 2024"

  // Extract title from content (first heading)
  const title = post.content.split('\n')[0].replace(/^# /, '')

  return (
    <main className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Blog Post Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Link href="/blog" className="text-primary hover:text-primary-dark transition-colors inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Blog
            </Link>
            <span className="text-foreground/30">•</span>
            <span className="text-sm text-foreground/60">{date}</span>
            <span className="text-foreground/30">•</span>
            <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
              {category}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
        </div>

        {/* Blog Post Content */}
        <article className="prose dark:prose-invert prose-lg max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            remarkPlugins={[remarkGfm]}
            components={{
              // Customize the rendering of elements if needed
              h2: (props) => <h2 className="text-2xl font-bold mt-8 mb-4" {...props} />,
              h3: (props) => <h3 className="text-xl font-bold mt-6 mb-3" {...props} />,
              ul: (props) => <ul className="list-disc pl-6 my-4" {...props} />,
              ol: (props) => <ol className="list-decimal pl-6 my-4" {...props} />,
              li: (props) => <li className="mb-2" {...props} />,
              p: (props) => <p className="mb-4" {...props} />,
              a: (props) => <a className="text-primary hover:text-primary-dark underline" {...props} />,
              strong: (props) => <strong className="font-bold" {...props} />,
              em: (props) => <em className="italic" {...props} />,
              blockquote: (props) => <blockquote className="border-l-4 border-primary/30 pl-4 italic" {...props} />,
              code: (props) => <code className="bg-foreground/10 px-1 py-0.5 rounded" {...props} />,
              pre: (props) => <pre className="bg-foreground/10 p-4 rounded overflow-auto" {...props} />,
            }}
          >
            {/* Skip the title which is already rendered */}
            {post.content.split('\n').slice(1).join('\n')}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  )
}