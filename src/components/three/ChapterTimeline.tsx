'use client'

import { useChapter } from './ChapterContext'

/**
 * Chapter picker overlaying the scene.
 *
 * Renders nothing while there is only one chapter, so the control appears by
 * itself the moment a second room lands in src/data/chapters.ts.
 */
export function ChapterTimeline() {
  const { chapter, all, pending, goTo } = useChapter()

  if (all.length < 2) return null

  const travelling = pending !== null

  return (
    <nav
      aria-label="Places"
      className="flex items-center gap-1 rounded-full bg-black/35 p-1 backdrop-blur-sm"
    >
      {all.map((c) => {
        const current = c.id === chapter.id && !travelling
        const target = pending?.id === c.id
        const [from, to] = c.period

        return (
          <button
            key={c.id}
            onClick={() => goTo(c.id)}
            disabled={travelling}
            aria-current={current ? 'true' : undefined}
            title={`${c.city} · ${from}–${to ?? 'now'}`}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
              'disabled:cursor-not-allowed',
              current || target
                ? 'bg-white text-neutral-900'
                : 'text-white/80 hover:bg-white/15 hover:text-white',
            ].join(' ')}
          >
            {c.label}
            <span className="ml-1.5 font-mono text-[10px] opacity-60">{from}</span>
          </button>
        )
      })}
    </nav>
  )
}
