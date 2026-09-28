'use client'

import React from 'react'
import Image from 'next/image'
import type { DetailedContent } from '@/data/projects'

/**
 * One block of a project's write-up: text, an image, a video, a PDF or an
 * embedded page. Pulled out of ProjectCard, which used to carry all of this
 * for its expanded state, so the projects list can open a project in place.
 *
 * `scalePercent` narrows a block on wide screens only; on a phone every
 * block is full width.
 */

const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be')
const isGoogleDrive = (url: string) => url.includes('drive.google.com')
const isVideoFile = (url: string) => /\.(mp4|webm|m4v|mov)(\?.*)?$/i.test(url)
const isInstagram = (url: string) => /(^|\.)instagram\.com\//i.test(url.replace(/^https?:\/\//, ''))

const driveId = (url: string) =>
  url.match(/(?:drive\.google\.com\/file\/d\/|id=|open\?id=)([a-zA-Z0-9_-]+)/)?.[1] ?? null

/** `npm run videos` writes a poster frame for every video it compresses. */
const posterFor = (url: string) => {
  const match = url.match(/^\/videos\/([^/]+)\.[a-z0-9]+$/i)
  return match ? `/videos/posters/${match[1]}.jpg` : undefined
}

/** '1h2m3s', '90s' or '90' -> seconds. */
function toSeconds(value: string) {
  if (/^\d+$/.test(value)) return value
  const part = (unit: string) => Number(value.match(new RegExp(`(\\d+)${unit}`))?.[1] ?? 0)
  return String(part('h') * 3600 + part('m') * 60 + part('s'))
}

function youTubeEmbed(url: string) {
  try {
    const u = new URL(url)
    const id = url.includes('youtu.be') ? u.pathname.split('/').pop() : u.searchParams.get('v')
    const start = u.searchParams.get('t') ?? u.searchParams.get('start')
    return `https://www.youtube.com/embed/${id}${start ? `?start=${toSeconds(start)}` : ''}`
  } catch {
    return url
  }
}

const frame = 'overflow-hidden bg-[var(--plaster-deep)]'

function Figure({
  content,
  children,
  className = '',
}: {
  content: DetailedContent
  children: React.ReactNode
  className?: string
}) {
  return (
    <figure
      className={`mx-auto max-md:!w-full ${className}`}
      style={content.scalePercent ? { width: `${content.scalePercent}%` } : undefined}
    >
      {children}
      {content.caption && (
        <figcaption className="mt-2 text-[0.8125rem] leading-snug text-[var(--ink-soft)]">
          {content.caption}
        </figcaption>
      )}
    </figure>
  )
}

function Embed({ src, title, tall = false }: { src: string; title: string; tall?: boolean }) {
  return (
    <div className={`${frame} ${tall ? 'h-[500px]' : 'aspect-video'}`}>
      <iframe
        src={src}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

export function ProjectContent({ content }: { content: DetailedContent }) {
  const src = content.content

  switch (content.type) {
    case 'text':
      return (
        <div className="u-prose prose max-w-none">
          {src.split('\n\n').map((paragraph, i) => (
            <p key={i}>
              {paragraph.split('\n').map((line, j, lines) => (
                <React.Fragment key={j}>
                  {line}
                  {j < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          ))}
        </div>
      )

    case 'image':
      return (
        <Figure content={content}>
          <div className={`relative ${frame}`} style={{ aspectRatio: content.aspectRatio || '16/9' }}>
            <Image
              src={src}
              alt={content.caption || ''}
              fill
              sizes="(max-width: 768px) 100vw, 48rem"
              className="object-contain"
            />
          </div>
        </Figure>
      )

    case 'video': {
      if (isYouTube(src)) {
        return (
          <Figure content={content}>
            <Embed src={youTubeEmbed(src)} title={content.caption || 'YouTube video'} />
          </Figure>
        )
      }
      if (isGoogleDrive(src) && driveId(src)) {
        return (
          <Figure content={content}>
            <Embed src={`https://drive.google.com/file/d/${driveId(src)}/preview`} title={content.caption || 'Video'} />
          </Figure>
        )
      }
      if (isVideoFile(src)) {
        // A shipped file, in its own shape: a portrait reel gets a portrait
        // frame capped in height, not a letterbox the width of the page.
        const ratio = content.aspectRatio || '16/9'
        const [w, h] = ratio.split('/').map(Number)
        const portrait = h > w
        return (
          <Figure content={content} className={portrait ? 'w-fit' : ''}>
            <div
              className={`mx-auto ${frame} bg-[var(--ink)]`}
              style={{
                aspectRatio: ratio,
                ...(portrait ? { height: 'min(75vh, 640px)', maxWidth: '100%' } : {}),
              }}
            >
              <video
                src={src}
                poster={content.poster ?? posterFor(src)}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-contain"
              />
            </div>
          </Figure>
        )
      }
      if (isInstagram(src)) {
        // Instagram refuses plain iframe embeds; link out instead.
        return (
          <p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-[var(--live)] pb-px transition-colors hover:text-[var(--live)]"
            >
              {content.caption || 'Watch on Instagram'} &rarr;
            </a>
          </p>
        )
      }
      return (
        <Figure content={content}>
          <Embed src={src} title={content.caption || 'Video'} />
        </Figure>
      )
    }

    case 'pdf':
      return (
        <Figure content={content}>
          {isGoogleDrive(src) && driveId(src) ? (
            <Embed src={`https://drive.google.com/file/d/${driveId(src)}/preview`} title={content.caption || 'PDF'} tall />
          ) : (
            <div className={`${frame} h-[500px]`}>
              <embed src={src} type="application/pdf" className="h-full w-full" />
            </div>
          )}
        </Figure>
      )

    case 'web':
      return (
        <Figure content={content}>
          <div className={`${frame} h-[500px] border border-[var(--rule-soft)]`}>
            <iframe
              src={src}
              title={content.caption || 'Embedded page'}
              className="h-full w-full"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </Figure>
      )

    default:
      return null
  }
}
