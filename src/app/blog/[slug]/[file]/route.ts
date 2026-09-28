import sharp from 'sharp'
import { readPostBytes } from '@/utils/blogSource'
import { getBlogPostBySlug, getPostMediaFile } from '@/utils/mdUtils'

/**
 * A photo from a post's folder, at /blog/<slug>/<file name>.
 *
 * Photos arrive straight from a phone (via Drive) at full size with their
 * metadata, so they are shrunk to at most 2000px, turned upright and
 * stripped of metadata (which can include where they were taken) on the way
 * out. The result is cached at the edge, so that happens once per photo.
 */

// Rendered on first request and cached, not listed at build: a photo added
// to Drive later works without a deploy.
export const revalidate = 86400

const MAX_SIDE = 2000
const RESIZABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'])

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; file: string }> }) {
  const { slug, file } = await params
  // Only for posts the site shows: a draft's photos stay hidden with it.
  if (!(await getBlogPostBySlug(slug))) return new Response('Not found', { status: 404 })
  const media = await getPostMediaFile(slug, decodeURIComponent(file))
  if (!media) return new Response('Not found', { status: 404 })

  let body: Buffer = await readPostBytes(media)
  let type = media.mime

  if (RESIZABLE.has(type)) {
    try {
      let img = sharp(body).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      // PNGs are usually screenshots: keep them sharp. Everything else,
      // including an iPhone's HEIC, becomes a JPEG every browser shows.
      if (type === 'image/png') {
        img = img.png({ compressionLevel: 9 })
      } else {
        img = img.jpeg({ quality: 80, mozjpeg: true })
        type = 'image/jpeg'
      }
      body = await img.toBuffer()
    } catch (error) {
      // A format this server's image library can't read: serve the original.
      console.error(`Could not process ${slug}/${media.name}:`, error)
      type = media.mime
    }
  }

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
