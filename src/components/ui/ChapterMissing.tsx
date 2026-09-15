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
  const { chapter, all, goTo } = useChapter()

  const elsewhere = all.filter((c) => c.id !== chapter.id)

  return (
    <div className="mx-auto max-w-2xl py-24 text-center">
      <h1 className="mb-4 text-3xl font-bold">Not part of this chapter</h1>
      <p className="mb-10 text-lg text-foreground/70">
        {section} isn&apos;t part of the {chapter.city} chapter
        {chapter.period[0] ? ` (${chapter.period[0]}–${chapter.period[1] ?? 'now'})` : ''}.
      </p>

      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        {elsewhere.map((c) => (
          <button
            key={c.id}
            onClick={() => goTo(c.id)}
            className="rounded-full bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark"
          >
            Travel to {c.city}
          </button>
        ))}
        <Link
          href="/"
          className="rounded-full border border-foreground/20 px-6 py-3 font-medium transition-colors hover:border-primary hover:text-primary"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
