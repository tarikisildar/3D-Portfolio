import fs from 'fs'
import sharp from 'sharp'
import { readPostBytes, type PostFile } from '@/utils/blogSource'
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

/**
 * Processed photos, keyed by the file's identity and modification time so a
 * replaced photo is reprocessed. Resizing takes a few hundred ms; the edge
 * cache hides that on the live site, this hides it in `next dev`.
 */
const processed = new Map<string, Promise<{ body: Buffer; type: string }>>()
const MAX_PROCESSED = 40

function versionOf(media: PostFile) {
  return typeof media.ref === 'string'
    ? `${media.ref}:${fs.statSync(media.ref).mtimeMs}`
    : `${media.ref.id}:${media.ref.modifiedTime}`
}

async function processPhoto(slug: string, media: PostFile): Promise<{ body: Buffer; type: string }> {
  const body: Buffer = await readPostBytes(media)
  if (!RESIZABLE.has(media.mime)) return { body, type: media.mime }
  try {
    let img = sharp(body).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    // PNGs are usually screenshots: keep them sharp. Everything else,
    // including an iPhone's HEIC, becomes a JPEG every browser shows.
    if (media.mime === 'image/png') return { body: await img.png({ compressionLevel: 9 }).toBuffer(), type: 'image/png' }
    img = img.jpeg({ quality: 80, mozjpeg: true })
    return { body: await img.toBuffer(), type: 'image/jpeg' }
  } catch (error) {
    // A format this server's image library can't read: serve the original.
    console.error(`Could not process ${slug}/${media.name}:`, error)
    return { body, type: media.mime }
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; file: string }> }) {
  const { slug, file } = await params
  // Only for posts the site shows: a draft's photos stay hidden with it.
  if (!(await getBlogPostBySlug(slug))) return new Response('Not found', { status: 404 })
  const media = await getPostMediaFile(slug, decodeURIComponent(file))
  if (!media) return new Response('Not found', { status: 404 })

  const key = versionOf(media)
  let result = processed.get(key)
  if (!result) {
    result = processPhoto(slug, media)
    processed.set(key, result)
    result.catch(() => processed.delete(key))
    if (processed.size > MAX_PROCESSED) processed.delete(processed.keys().next().value!)
  }
  const { body, type } = await result

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
