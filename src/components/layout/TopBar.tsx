'use client'

import Link from 'next/link'
import { useChapter } from '@/components/three/ChapterContext'

/**
 * Name on the left, era on the right.
 *
 * The site has two navigation axes and the old design gave no hint they were
 * different things: sections sat top-right, places sat bottom-left, both as
 * anonymous pills. Here they are separated by both position and form — *when*
 * lives up here as a row of years, *where in the room* lives on the bottom rail
 * — so neither is mistaken for the other.
 *
 * The years are the label. "Nuremberg 2025" tells you less than the three dates
 * in sequence do: seeing 1999 / 2021 / 2025 side by side is what makes it
 * obvious this is a timeline you can move along.
 */
export function TopBar() {
  const { chapter, all, pending, goTo } = useChapter()
  const travelling = pending !== null

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-[var(--rule-soft)]
                 bg-[var(--veil)] backdrop-blur-md"
    >
      <div className="mx-auto flex h-[var(--bar-h)] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-[0.9375rem] tracking-tight text-[var(--ink)] focus:outline-none
                     focus-visible:underline"
          style={{ fontVariationSettings: '"wdth" 112, "wght" 650' }}
        >
          Tarik Isildar
        </Link>

        {all.length > 1 && (
          <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
            <span className="sr-only">Travel to another place and time</span>
            {all.map((c) => {
              const current = c.id === chapter.id && !travelling
              const target = pending?.id === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => goTo(c.id)}
                  disabled={travelling}
                  aria-current={current ? 'true' : undefined}
                  title={`${c.city}, ${c.period[0]}–${c.period[1] ?? 'now'}`}
                  className="group relative shrink-0 px-1.5 py-1 transition-opacity
                             disabled:cursor-not-allowed disabled:opacity-60
                             focus:outline-none focus-visible:underline sm:px-2"
                >
                  <span
                    className="u-figures block text-[0.8125rem] leading-none"
                    style={{
                      color: current || target ? 'var(--ink)' : 'var(--ink-soft)',
                      fontVariationSettings:
                        current || target
                          ? '"wdth" 100, "wght" 650'
                          : '"wdth" 94, "wght" 450',
                    }}
                  >
                    {c.period[0]}
                  </span>
                  {/* City name only for the place you are in: three names at
                      once is noise, one is context. */}
                  <span
                    className="mt-0.5 block text-[0.625rem] leading-none transition-opacity"
                    style={{
                      color: 'var(--ink-soft)',
                      opacity: current || target ? 1 : 0,
                      fontVariationSettings: '"wdth" 96, "wght" 500',
                    }}
                  >
                    {c.city}
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-[1px] h-[2px]"
                    style={{
                      background: 'var(--live)',
                      opacity: current || target ? 1 : 0,
                    }}
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}
