'use client'

import Image from 'next/image'
import { trackButtonClick } from '@/utils/analytics'
import { useChapter } from '@/components/three/ChapterContext'
import { ChapterMissing } from '@/components/ui/ChapterMissing'
import { DEFAULT_PHOTOS } from '@/data/about'
import { everywhere, teams } from '@/data/links'

const heading = { fontVariationSettings: '"wdth" 112, "wght" 600' }

export default function About() {
  // The About page is versioned per chapter: each era has its own bio, so
  // moving through the timeline is a look back at who I was then.
  const { chapter } = useChapter()
  const aboutData = chapter.content.about

  if (!aboutData) return <ChapterMissing section="An About page" />

  const photos = aboutData.photos ?? DEFAULT_PHOTOS

  return (
    <>
      <section className="border-b border-[var(--rule-soft)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-14 pt-10 sm:pb-20 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-14">
          <div className="relative aspect-[4/5] overflow-hidden bg-[var(--plaster-deep)]">
            <Image
              src={aboutData.profilePic}
              alt={aboutData.name}
              fill
              sizes="(max-width: 768px) 100vw, 20rem"
              className="object-cover"
              priority
            />
          </div>

          <div>
            <h1 className="u-display text-[clamp(2.25rem,6vw,4rem)]">{aboutData.name}</h1>
            <p
              className="mt-3 text-[1.125rem]"
              style={{ fontVariationSettings: '"wdth" 106, "wght" 520' }}
            >
              {aboutData.title}
            </p>
            <div className="mt-8 space-y-5">
              {aboutData.bio.map((paragraph, i) => (
                <p key={i} className="u-lede text-[1.0625rem] text-[var(--ink-soft)]">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Photos with their captions underneath, where they can be read,
          rather than white text on a black gradient across the picture. */}
      <section className="border-b border-[var(--rule-soft)]">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <h2 className="text-[clamp(1.5rem,3vw,2rem)]" style={heading}>
            Off the clock
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
            {photos.map((photo) => {
              const figure = (
                <figure>
                  <div className="relative aspect-[4/5] overflow-hidden bg-[var(--plaster-deep)]">
                    <Image
                      src={photo.src}
                      alt={photo.caption}
                      fill
                      sizes="(max-width: 1024px) 50vw, 18rem"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <figcaption className="mt-3 text-[0.875rem] leading-snug text-[var(--ink-soft)]">
                    {photo.caption}
                    {photo.href && <span aria-hidden> &rarr;</span>}
                  </figcaption>
                </figure>
              )
              return (
                <li key={photo.src}>
                  {photo.href ? (
                    <a
                      href={photo.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--live)]"
                    >
                      {figure}
                    </a>
                  ) : (
                    figure
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* A ruled list, like a directory board, instead of a row of
          brand-coloured app icons: this page's palette is the room's. */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <h2 className="text-[clamp(1.5rem,3vw,2rem)]" style={heading}>
            Elsewhere
          </h2>
          <ul className="mt-8 border-t border-[var(--rule-soft)]">
            {everywhere.map((link) => {
              const external = link.href.startsWith('http')
              return (
                <li key={link.href} className="border-b border-[var(--rule-soft)]">
                  <a
                    href={link.href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    onClick={
                      link === teams
                        ? () => trackButtonClick('teams_button', 'about_page', { type: 'rickroll' })
                        : undefined
                    }
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-4 transition-colors hover:bg-[var(--plaster-lift)] focus:outline-none focus-visible:bg-[var(--plaster-lift)] sm:grid-cols-[12rem_1fr_auto] sm:px-3"
                  >
                    <span
                      className="text-[1.0625rem]"
                      style={{ fontVariationSettings: '"wdth" 106, "wght" 600' }}
                    >
                      {link.label}
                    </span>
                    <span className="col-span-2 row-start-2 text-[0.9375rem] text-[var(--ink-soft)] sm:col-span-1 sm:row-start-1 sm:col-start-2">
                      {link.detail}
                      {link.aside && (
                        <span className="text-[var(--rule)]"> &middot; {link.aside}</span>
                      )}
                    </span>
                    <span
                      aria-hidden
                      className="text-[var(--ink-soft)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--live)] sm:col-start-3"
                    >
                      {external ? '↗' : '→'}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
