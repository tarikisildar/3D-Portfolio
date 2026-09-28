import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import type { Element, ElementContent } from 'hast'
import { resolvePostUrl } from '@/utils/mdUtils'

/**
 * Markdown for a blog post or a travel-log day, in the room's palette.
 *
 * Two things beyond plain Markdown:
 *  - ./photo.jpg resolves to the post's own folder (see resolvePostUrl).
 *  - A paragraph made only of images becomes a photo grid, so a day's
 *    pictures can simply be listed one per line:
 *
 *      ![Fushimi Inari at 6am](./inari.jpg)
 *      ![The long way down](./steps.jpg)
 *      ![Lunch](./udon.jpg)
 */

const isBlank = (n: ElementContent) => n.type === 'text' && !n.value.trim()
const isImage = (n: ElementContent) => n.type === 'element' && n.tagName === 'img'
const isBreak = (n: ElementContent) => n.type === 'element' && n.tagName === 'br'

/** How many images a paragraph holds, if it holds nothing else; otherwise 0. */
function imageOnlyCount(node?: Element) {
  const kids = node?.children ?? []
  return kids.every((n) => isImage(n) || isBlank(n) || isBreak(n)) ? kids.filter(isImage).length : 0
}

export function PostMarkdown({ slug, children }: { slug: string; children: string }) {
  return (
    <div className="u-prose prose prose-lg max-w-none">
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => resolvePostUrl(slug, url)}
        components={{
          p: ({ node, children }) => {
            const images = imageOnlyCount(node)
            // One picture stands alone (a <figure> can't sit inside a <p>);
            // several become a grid.
            if (images === 1) return <>{children}</>
            if (images > 1) return <div className="u-gallery not-prose">{children}</div>
            return <p>{children}</p>
          },
          img: ({ src, alt }) => (
            <figure>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src as string} alt={alt ?? ''} loading="lazy" />
              {alt && <figcaption>{alt}</figcaption>}
            </figure>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
