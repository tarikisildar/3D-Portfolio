#!/usr/bin/env node
/**
 * Compress videos for the web: media-src/videos/* -> public/videos/*.mp4
 *
 * Same idea as the model pipeline (models-src -> public/models): originals
 * stay out of the deployed folder, and what ships is re-encoded for the job.
 * Phone and screen recordings arrive as 1080p60 at 3-7 Mbps; everything on
 * this site plays either as a texture on an in-room monitor a few hundred
 * pixels wide, or in a project page column, so that is mostly wasted bytes.
 *
 * What it does to each file:
 *   - H.264 High, yuv420p, in .mp4: plays everywhere, including Safari/iOS.
 *   - Longer side at most 1280px, shorter at most 720 (portrait stays portrait).
 *   - Frame rate capped at 30.
 *   - CRF 26: quality-targeted rather than bitrate-targeted, so a static
 *     screen recording ends up far smaller than a busy handheld clip.
 *   - AAC 96 kbps stereo, or no audio track if the source has none.
 *   - +faststart: the index goes first so playback starts before the whole
 *     file has downloaded.
 *   - A poster frame at public/videos/posters/<name>.jpg, for <video poster>.
 *
 * Skips any file whose output is newer than its source, so re-running is cheap.
 *
 * Usage:
 *   npm run videos                 # everything in media-src/videos
 *   npm run videos -- gearshift    # only files whose name contains "gearshift"
 *   npm run videos -- --force      # re-encode even if up to date
 *
 * Options, for the odd file that needs different treatment:
 *   --max=960   longer side in px (shorter side scales to match, 16:9-style).
 *               Long, busy clips like the Gearshift reel barely shrink at
 *               1280; at 960 they look the same in a project column and
 *               lose about a third.
 *   --crf=28    higher is smaller and softer; 23-30 is the sensible range.
 *
 *   npm run videos -- gearshift --force --max=960
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join } from 'node:path'

const SRC = 'media-src/videos'
const OUT = 'public/videos'
const POSTERS = join(OUT, 'posters')

const args = process.argv.slice(2)
const option = (name, fallback) => {
  const found = args.find((a) => a.startsWith(`--${name}=`))
  const value = found ? Number(found.split('=')[1]) : fallback
  if (!Number.isFinite(value) || value <= 0) {
    console.error(`--${name} needs a positive number`)
    process.exit(1)
  }
  return value
}

const MAX_LONG = option('max', 1280)
const MAX_SHORT = Math.round((MAX_LONG * 9) / 16)
const MAX_FPS = 30
const CRF = option('crf', 26)
const AUDIO_BITRATE = '96k'
/** Seconds in: far enough to be past a fade-in, early enough for short clips. */
const POSTER_AT = 1

const VIDEO_EXT = new Set(['.mov', '.mp4', '.m4v', '.webm', '.mkv', '.avi'])

const force = args.includes('--force')
const filters = args.filter((a) => !a.startsWith('--'))

function run(cmd, cmdArgs) {
  const result = spawnSync(cmd, cmdArgs, { encoding: 'utf8' })
  if (result.error) {
    if (result.error.code === 'ENOENT') {
      console.error(`${cmd} not found. Install it with: brew install ffmpeg`)
      process.exit(1)
    }
    throw result.error
  }
  return result
}

function probe(file) {
  const result = run('ffprobe', [
    '-v', 'error',
    '-show_entries', 'stream=codec_type,width,height,r_frame_rate',
    '-show_entries', 'format=duration',
    '-of', 'json',
    file,
  ])
  const data = JSON.parse(result.stdout)
  const video = data.streams.find((s) => s.codec_type === 'video')
  const hasAudio = data.streams.some((s) => s.codec_type === 'audio')
  const [num, den] = (video?.r_frame_rate ?? '30/1').split('/').map(Number)
  return {
    width: video?.width ?? 0,
    height: video?.height ?? 0,
    fps: den ? num / den : 30,
    duration: Number(data.format?.duration ?? 0),
    hasAudio,
  }
}

/** Fit inside MAX_LONG x MAX_SHORT (or the portrait equivalent), never upscale, even dims. */
function scaleFilter({ width, height }) {
  const portrait = height > width
  const boxW = portrait ? MAX_SHORT : MAX_LONG
  const boxH = portrait ? MAX_LONG : MAX_SHORT
  const ratio = Math.min(1, boxW / width, boxH / height)
  const even = (n) => Math.max(2, Math.round(n / 2) * 2)
  return `scale=${even(width * ratio)}:${even(height * ratio)}`
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

if (!existsSync(SRC)) {
  console.error(`No ${SRC}/ folder. Put the original videos there and run again.`)
  process.exit(1)
}
mkdirSync(POSTERS, { recursive: true })

const sources = readdirSync(SRC)
  .filter((f) => VIDEO_EXT.has(extname(f).toLowerCase()))
  .filter((f) => filters.length === 0 || filters.some((q) => f.includes(q)))
  .sort()

if (sources.length === 0) {
  console.log('Nothing to do.')
  process.exit(0)
}

let before = 0
let after = 0

for (const file of sources) {
  const input = join(SRC, file)
  const name = basename(file, extname(file))
  const output = join(OUT, `${name}.mp4`)
  const poster = join(POSTERS, `${name}.jpg`)

  const upToDate =
    !force &&
    existsSync(output) &&
    existsSync(poster) &&
    statSync(output).mtimeMs > statSync(input).mtimeMs
  if (upToDate) {
    console.log(`  ${file}: up to date`)
    continue
  }

  const info = probe(input)
  const vf = [scaleFilter(info)]
  if (info.fps > MAX_FPS + 0.5) vf.push(`fps=${MAX_FPS}`)

  process.stdout.write(`  ${file} (${info.width}x${info.height} @ ${Math.round(info.fps)}fps, ${Math.round(info.duration)}s) ... `)

  const encode = run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', input,
    '-map', '0:v:0', ...(info.hasAudio ? ['-map', '0:a:0'] : []),
    '-vf', vf.join(','),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF),
    '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    ...(info.hasAudio ? ['-c:a', 'aac', '-b:a', AUDIO_BITRATE, '-ac', '2'] : ['-an']),
    '-movflags', '+faststart',
    output,
  ])
  if (encode.status !== 0) {
    console.log('failed')
    console.error(encode.stderr)
    process.exitCode = 1
    continue
  }

  run('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', String(Math.min(POSTER_AT, info.duration / 2)),
    '-i', output,
    '-frames:v', '1', '-q:v', '4',
    poster,
  ])

  const inSize = statSync(input).size
  const outSize = statSync(output).size
  before += inSize
  after += outSize
  console.log(`${mb(inSize)} -> ${mb(outSize)}`)
}

if (before > 0) {
  console.log(`\nTotal: ${mb(before)} -> ${mb(after)} (${Math.round((1 - after / before) * 100)}% smaller)`)
}
