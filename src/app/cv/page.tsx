'use client'

import Link from 'next/link'
import { useChapter } from '@/components/three/ChapterContext'
import { DEFAULT_CHAPTER_ID, type Chapter } from '@/data/chapters'
import { cv, type CvEntry, type CvLink } from '@/data/cv'

/**
 * The CV as the journey the rooms already tell: one sheet per city, in order.
 *
 * Shared across chapters, so it reads the same from any year. What the chapter
 * changes is which city is marked as "here", and each city's heading is a way
 * to travel there: the page scrolls up to the stage and the map flies you over.
 *
 * Replaces an embedded Google Drive PDF, which showed the browser's own viewer
 * chrome in the middle of the page and could not link anywhere.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(value: string) {
  const [year, month] = value.split('-')
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function CV() {
  const { chapter, all, pending, goTo } = useChapter()
  const here = pending?.id ?? chapter.id

  const places = cv.places
    .map((place) => ({ place, chapter: all.find((c) => c.id === place.chapter) }))
    .filter((p): p is { place: (typeof cv.places)[number]; chapter: Chapter } =>
      Boolean(p.chapter)
    )

  // Internal links carry the era, like the rest of the navigation, so a reload
  // lands in the same place.
  const withEra = (href: string) => {
    if (!href.startsWith('/') || chapter.id === DEFAULT_CHAPTER_ID) return href
    return href + (href.includes('?') ? '&' : '?') + `era=${chapter.id}`
  }

  const travel = (id: string) => {
    // The trip plays on the stage, which the page has scrolled over.
    window.scrollTo({ top: 0, behavior: 'smooth' })
    goTo(id)
  }

  return (
    <>
      <section className="border-b border-[var(--rule-soft)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 pb-12 pt-10 sm:pb-16 md:grid-cols-[1fr_minmax(0,18rem)] md:items-end">
          <div>
            <h1 className="u-display text-[clamp(2.25rem,6vw,4rem)]">CV</h1>
            <p className="u-lede mt-4 text-[1.0625rem] text-[var(--ink-soft)]">{cv.intro}</p>
          </div>
          <p className="text-[0.9375rem] leading-relaxed">
            Told as it happened, one city at a time. Click a city to go and
            stand in the room I lived in then.
          </p>
        </div>
      </section>

      <ol className="mx-auto max-w-6xl px-6">
        {places.map(({ place, chapter: c }, i) => {
          const previous = places[i - 1]?.chapter
          const current = c.id === here
          const [from, to] = c.period

          return (
            <li key={c.id}>
              {previous && <Journey from={previous} to={c} />}

              <section
                id={`cv-${c.id}`}
                aria-labelledby={`cv-${c.id}-city`}
                className="grid gap-6 border-t border-[var(--rule-soft)] py-10 sm:py-14 md:grid-cols-[17rem_1fr] md:gap-12"
              >
                {/* The city is the heading and the button. Sticky, so the
                    place stays named while its entries scroll past. */}
                <div className="md:sticky md:top-[calc(var(--bar-h)+1.5rem)] md:self-start">
                  <button
                    type="button"
                    onClick={() => travel(c.id)}
                    disabled={pending !== null}
                    aria-current={current ? 'location' : undefined}
                    className="cv-city group w-full text-left disabled:cursor-wait"
                  >
                    <span className="cv-city__sheet u-figures">
                      Sheet {pad(i + 1)}
                    </span>
                    <span id={`cv-${c.id}-city`} className="cv-city__name">
                      {c.city}
                    </span>
                    <span className="cv-city__years u-figures">
                      {from}&ndash;{to ?? 'now'}
                    </span>
                    <span className="cv-city__action">
                      {current ? (
                        <>
                          <span aria-hidden className="cv-city__dot" />
                          You are here
                        </>
                      ) : (
                        <>
                          Go to {c.city}
                          <span aria-hidden className="cv-city__arrow">
                            &rarr;
                          </span>
                        </>
                      )}
                    </span>
                  </button>
                  {place.note && (
                    <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--ink-soft)]">
                      {place.note}
                    </p>
                  )}
                </div>

                <ol className="divide-y divide-[var(--rule-soft)]">
                  {place.entries.map((entry) => (
                    <Entry
                      key={`${entry.org}-${entry.from}`}
                      entry={entry}
                      withEra={withEra}
                    />
                  ))}
                </ol>
              </section>
            </li>
          )
        })}
      </ol>

      <section className="border-t border-[var(--rule-soft)]">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <h2
            className="text-[clamp(1.5rem,3vw,2rem)]"
            style={{ fontVariationSettings: '"wdth" 112, "wght" 600' }}
          >
            Tools
          </h2>
          <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {cv.skills.map((group) => (
              <div key={group.label}>
                <dt className="text-[0.8125rem] text-[var(--ink-soft)]">{group.label}</dt>
                <dd className="mt-2 text-[0.9375rem] leading-relaxed">
                  {group.items.join(', ')}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-14 text-[0.9375rem]">
            <span className="text-[var(--ink-soft)]">Get in touch: </span>
            {cv.contact.map((link, i) => (
              <span key={link.href}>
                {i > 0 && <span className="text-[var(--ink-soft)]"> · </span>}
                <ExternalOrInternal link={link} withEra={withEra} />
              </span>
            ))}
          </p>
        </div>
      </section>
    </>
  )
}

/**
 * The move between two cities, in the same terms the map uses for it: a train
 * within a country, a flight across a border.
 */
function Journey({ from, to }: { from: Chapter; to: Chapter }) {
  const mode = from.country === to.country ? 'Train' : 'Flight'
  return (
    <div className="flex items-center gap-4 py-5 text-[0.8125rem] text-[var(--ink-soft)]">
      <span aria-hidden className="h-px flex-1 border-t border-dashed border-[var(--rule)]" />
      <span className="u-figures">
        {mode} from {from.city} to {to.city}, {to.period[0]}
      </span>
      <span aria-hidden className="h-px flex-1 border-t border-dashed border-[var(--rule)]" />
    </div>
  )
}

function Entry({ entry, withEra }: { entry: CvEntry; withEra: (href: string) => string }) {
  return (
    <li className="grid gap-2 py-7 first:pt-0 last:pb-0 sm:grid-cols-[8.5rem_1fr] sm:gap-6">
      <p className="u-figures text-[0.875rem] text-[var(--ink-soft)] sm:pt-1">
        {formatDate(entry.from)} &ndash; {entry.to ? formatDate(entry.to) : 'now'}
      </p>

      <div>
        <p className="text-[0.75rem] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
          {entry.kind === 'work' ? 'Work' : 'Study'}
          {entry.location && <> &middot; {entry.location}</>}
        </p>
        <h3
          className="mt-1 text-[1.25rem] leading-tight"
          style={{ fontVariationSettings: '"wdth" 108, "wght" 620' }}
        >
          {entry.orgUrl ? (
            <a
              href={entry.orgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {entry.org}
            </a>
          ) : (
            entry.org
          )}
        </h3>
        {entry.role && <p className="mt-0.5 text-[1rem]">{entry.role}</p>}

        {entry.summary && (
          <p className="u-lede mt-3 text-[0.9375rem] text-[var(--ink-soft)]">{entry.summary}</p>
        )}

        {entry.highlights && entry.highlights.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-[0.9375rem] leading-relaxed text-[var(--ink-soft)]">
            {entry.highlights.map((h) => (
              <li key={h} className="relative max-w-[62ch] pl-4">
                <span aria-hidden className="absolute left-0 top-[0.7em] h-px w-2 bg-[var(--rule)]" />
                {h}
              </li>
            ))}
          </ul>
        )}

        {entry.links && entry.links.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.875rem]">
            {entry.links.map((link) => (
              <li key={link.href}>
                <ExternalOrInternal link={link} withEra={withEra} arrow />
              </li>
            ))}
          </ul>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <p className="mt-4 text-[0.8125rem] text-[var(--ink-soft)]">{entry.tags.join(' · ')}</p>
        )}
      </div>
    </li>
  )
}

function ExternalOrInternal({
  link,
  withEra,
  arrow = false,
}: {
  link: CvLink
  withEra: (href: string) => string
  arrow?: boolean
}) {
  const className =
    'border-b border-[var(--live)] pb-px transition-colors hover:text-[var(--live)]'
  const label = (
    <>
      {link.label}
      {arrow && <span aria-hidden> &rarr;</span>}
    </>
  )

  if (link.href.startsWith('/')) {
    return (
      <Link href={withEra(link.href)} className={className}>
        {label}
      </Link>
    )
  }
  return (
    <a
      href={link.href}
      className={className}
      {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {label}
    </a>
  )
}
