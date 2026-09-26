import fs from 'fs'
import path from 'path'
import { getAllBlogPosts, getPostMedia, MEDIA_TYPES, POSTS_DIR } from '@/utils/mdUtils'

/**
 * Serves the images that sit in a post's folder, at /blog/<slug>/<file>.
 *
 * Pre-rendered at build like the posts themselves, so on the live site these
 * are plain static files; while developing, a newly added image works
 * without a restart.
 */

// Unknown files 404 in GET below; see the note in ../page.tsx on dynamicParams.

export async function generateStaticParams() {
  const posts = await getAllBlogPosts()
  return posts.flatMap((post) => getPostMedia(post.slug).map((file) => ({ slug: post.slug, file })))
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; file: string }> }) {
  const { slug, file } = await params
  // Only names that are actually in the folder; nothing like ../ can reach here.
  if (!getPostMedia(slug).includes(file)) return new Response('Not found', { status: 404 })

  const body = fs.readFileSync(path.join(POSTS_DIR, slug, file))
  return new Response(body, {
    headers: {
      'Content-Type': MEDIA_TYPES[path.extname(file).toLowerCase()],
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
