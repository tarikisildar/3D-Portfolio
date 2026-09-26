#!/usr/bin/env node
/**
 * Blog helpers. See docs/writing-a-post.md.
 *
 *   npm run post -- "Best running routes" [--category "Running"]
 *       Creates src/content/blog/best-running-routes/index.md with today's
 *       date, marked as a draft.
 *
 *   npm run posts:check [-- --fix]
 *       Checks every post: header, date, title, a first paragraph for the
 *       excerpt, and that every ./image it uses exists. Warns about images too
 *       big for the web; --fix shrinks them in place (longest side 2000px,
 *       JPEG/WebP quality 80) and strips location data from photos.
 *
 * Exits non-zero if anything is wrong, so it can gate a commit or CI.
 */

import fs from 'node:fs'
import path from 'node:path'

const POSTS_DIR = 'src/content/blog'
const MAX_SIDE = 2000
const MAX_BYTES = 800 * 1024
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg', '.mp4'])
const KNOWN_FIELDS = new Set(['date', 'category', 'draft'])

const [command, ...rest] = process.argv.slice(2)

const flag = (name) => {
  const i = rest.indexOf(`--${name}`)
  if (i === -1) return undefined
  const value = rest[i + 1]
  rest.splice(i, value && !value.startsWith('--') ? 2 : 1)
  return value && !value.startsWith('--') ? value : true
}

const slugify = (title) =>
  title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const today = () => new Date().toISOString().slice(0, 10)

function newPost() {
  const category = flag('category')
  const title = rest.join(' ').trim()
  if (!title) {
    console.error('Usage: npm run post -- "Post title" [--category "Category"]')
    process.exit(1)
  }
  const slug = slugify(title)
  const dir = path.join(POSTS_DIR, slug)
  if (fs.existsSync(dir) || fs.existsSync(`${dir}.md`)) {
    console.error(`A post called "${slug}" already exists.`)
    process.exit(1)
  }
  fs.mkdirSync(dir, { recursive: true })
  const header = ['---', `date: ${today()}`, ...(category ? [`category: ${category}`] : []), 'draft: true', '---']
  fs.writeFileSync(
    path.join(dir, 'index.md'),
    `${header.join('\n')}\n# ${title}\n\nThe first paragraph is the excerpt on the blog index. Write it last.\n`
  )
  console.log(`Created ${dir}/index.md`)
  console.log(`Images go in ${dir}/ and are written as ![what it shows](./photo.jpg).`)
  console.log('Remove "draft: true" when it is ready to go live.')
}

function readPosts() {
  return fs
    .readdirSync(POSTS_DIR, { withFileTypes: true })
    .flatMap((e) => {
      if (e.isDirectory()) {
        const file = path.join(POSTS_DIR, e.name, 'index.md')
        return fs.existsSync(file) ? [{ slug: e.name, file, dir: path.join(POSTS_DIR, e.name) }] : []
      }
      if (e.isFile() && e.name.endsWith('.md')) {
        return [{ slug: e.name.replace(/\.md$/, ''), file: path.join(POSTS_DIR, e.name), dir: null }]
      }
      return []
    })
}

async function check() {
  const fix = Boolean(flag('fix'))
  let sharp = null
  try {
    sharp = (await import('sharp')).default
  } catch {
    // Image dimensions are only checked when sharp is available.
  }

  let errors = 0
  let warnings = 0
  const error = (slug, msg) => { errors++; console.log(`  ✗ ${slug}: ${msg}`) }
  const warn = (slug, msg) => { warnings++; console.log(`  ! ${slug}: ${msg}`) }

  const posts = readPosts()
  for (const { slug, file, dir } of posts) {
    if (!/^[a-z0-9-]+$/.test(slug)) error(slug, 'folder name must be lowercase letters, digits and dashes (it is the URL)')
    if (!dir) warn(slug, 'is a single file; move it to its own folder as index.md so it can have images')

    const raw = fs.readFileSync(file, 'utf8')
    const header = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
    const fields = {}
    if (!header) {
      error(slug, 'has no --- header with a date')
    } else {
      for (const line of header[1].split(/\r?\n/).filter(Boolean)) {
        const i = line.indexOf(':')
        if (i <= 0) { error(slug, `header line "${line}" is not "key: value"`); continue }
        fields[line.slice(0, i).trim()] = line.slice(i + 1).trim()
      }
      for (const key of Object.keys(fields)) if (!KNOWN_FIELDS.has(key)) warn(slug, `unknown header field "${key}"`)
      if (!fields.date) error(slug, 'header has no date')
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || Number.isNaN(Date.parse(fields.date))) {
        error(slug, `date "${fields.date}" is not YYYY-MM-DD`)
      }
      if (fields.draft && !['true', 'false'].includes(fields.draft)) error(slug, 'draft must be true or false')
    }

    const bodyStart = header ? header[0].length : 0
    const lines = raw.slice(bodyStart).replace(/^\s+/, '').split('\n')
    if (!/^#\s+\S/.test(lines[0] ?? '')) error(slug, 'first line after the header must be "# Title"')
    const body = lines.slice(1).join('\n')
    const firstPara = body.split(/\n\s*\n/).find((p) => p.trim() && !/^(#|!\[|<)/.test(p.trim()))
    if (!firstPara) error(slug, 'needs a paragraph of text after the title (used as the excerpt)')

    // Local media the post refers to.
    const refs = [...body.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?[^)]*\)|<img[^>]*\ssrc=["']([^"']+)["']/g)]
      .map((m) => m[1] ?? m[2])
      .filter((u) => !/^(?:[a-z]+:|\/|#)/i.test(u))
    for (const ref of new Set(refs)) {
      if (!dir) { error(slug, `uses ${ref} but a single-file post cannot have images`); continue }
      const target = path.join(dir, decodeURIComponent(ref.replace(/^\.\//, '')))
      if (!fs.existsSync(target)) error(slug, `uses ${ref}, which is not in ${dir}/`)
    }

    if (!dir) continue
    for (const name of fs.readdirSync(dir)) {
      if (name === 'index.md') continue
      const ext = path.extname(name).toLowerCase()
      const full = path.join(dir, name)
      if (!IMAGE_EXT.has(ext)) { warn(slug, `${name} is not an image or video the site will serve`); continue }
      if (/[^a-z0-9._-]/i.test(name)) warn(slug, `${name}: prefer a name without spaces or special characters`)
      if (!refs.some((r) => r.replace(/^\.\//, '') === name)) warn(slug, `${name} is not used in the post`)
      if (!sharp || ['.svg', '.gif', '.mp4'].includes(ext)) continue

      const size = fs.statSync(full).size
      const meta = await sharp(full).metadata()
      const side = Math.max(meta.width ?? 0, meta.height ?? 0)
      if (side <= MAX_SIDE && size <= MAX_BYTES) continue
      if (!fix) {
        warn(slug, `${name} is ${Math.round(size / 1024)} KB, ${meta.width}x${meta.height}; run with --fix to shrink it`)
        continue
      }
      // rotate() applies the phone's orientation flag before it is dropped
      // along with the rest of the metadata (including GPS position).
      let img = sharp(full).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      img = ext === '.png' ? img.png({ compressionLevel: 9, palette: true }) : ext === '.webp' ? img.webp({ quality: 80 }) : img.jpeg({ quality: 80, mozjpeg: true })
      const out = await img.toBuffer()
      fs.writeFileSync(full, out)
      console.log(`  ↓ ${slug}: ${name} ${Math.round(size / 1024)} KB -> ${Math.round(out.length / 1024)} KB`)
    }
  }

  const drafts = posts.filter(({ file }) => /^---[\s\S]*?\ndraft:\s*true/m.test(fs.readFileSync(file, 'utf8')))
  console.log(
    `\n${posts.length} post${posts.length === 1 ? '' : 's'}` +
      (drafts.length ? ` (${drafts.length} draft: ${drafts.map((d) => d.slug).join(', ')})` : '') +
      `, ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}.`
  )
  if (errors) process.exit(1)
}

if (command === 'new') newPost()
else if (command === 'check') await check()
else {
  console.error('Usage: node scripts/blog.mjs new "Title" | check [--fix]')
  process.exit(1)
}
