'use client'

import Link from 'next/link'
import { useChapter } from '@/components/three/ChapterContext'

/**
 * Shown when a section exists as a route but this chapter has no content for it.
 *
 * Chapters declare their own sections, so an early chapter might have no CV and
 * a short one no blog. The nav hides those links, but a deep link or the Back
 * button can still land here — better to explain and offer a way across than to
 * render an empty page.
 */
export function ChapterMissing({ section }: { section: string }) {
  const { chapter, all, pending, goTo } = useChapter()
  const [from, to] = chapter.period

  const elsewhere = all.filter((c) => c.id !== chapter.id)

  const travel = (id: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    goTo(id)
  }

  return (
    <section>
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <h1 className="u-display text-[clamp(2rem,5vw,3.25rem)]">Not written yet</h1>
        <p className="u-lede mt-4 text-[1.0625rem] text-[var(--ink-soft)]">
          {section} isn&apos;t part of the {chapter.city} chapter ({from}&ndash;{to ?? 'now'})
          yet. It is in these:
        </p>

        {/* The same city blocks the CV uses: a place you can travel to. */}
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {elsewhere.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => travel(c.id)}
                disabled={pending !== null}
                className="cv-city w-full text-left disabled:cursor-wait"
              >
                <span className="cv-city__name">{c.city}</span>
                <span className="cv-city__years u-figures">
                  {c.period[0]}&ndash;{c.period[1] ?? 'now'}
                </span>
                <span className="cv-city__action">
                  Go to {c.city}
                  <span aria-hidden className="cv-city__arrow">&rarr;</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-[0.9375rem]">
          <Link
            href="/"
            className="border-b border-[var(--live)] pb-px transition-colors hover:text-[var(--live)]"
          >
            Back home
          </Link>
        </p>
      </div>
    </section>
  )
}
