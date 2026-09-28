'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { chapters, getChapter, DEFAULT_CHAPTER_ID, type Chapter } from '@/data/chapters'

type ChapterContextValue = {
  /** The chapter currently rendered in the scene. */
  chapter: Chapter
  /** Every chapter, chronological — for the timeline UI. */
  all: Chapter[]
  /**
   * The chapter being travelled to, or null when settled.
   *
   * Requesting a switch deliberately does not change `chapter` straight away.
   * If it did, the outgoing room would unload while still on screen and the
   * viewer would watch it blink out. Instead the map transition covers the
   * canvas first and then calls commit(), so the swap happens behind a curtain.
   */
  pending: Chapter | null
  /** Request a switch. No-op if already there, or if a trip is under way. */
  goTo: (id: string) => void
  /** Called by the transition once the canvas is covered: performs the swap. */
  commit: () => void
  /** Called by the transition once the new room is visible: clears `pending`. */
  finish: () => void
}

const ChapterContext = createContext<ChapterContextValue | null>(null)

/** Query parameter carrying the chapter, e.g. /about?era=munich */
const ERA_PARAM = 'era'

function eraFromLocation(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(ERA_PARAM)
}

/**
 * Write the chapter into the URL without a Next navigation.
 *
 * Deliberately uses the History API rather than useSearchParams/router: a real
 * navigation here would tear down and remount the Canvas mid-transition, and
 * useSearchParams would drag a Suspense requirement across every page that
 * renders SiteWrapper.
 */
function writeEra(id: string, mode: 'push' | 'replace') {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (id === DEFAULT_CHAPTER_ID) url.searchParams.delete(ERA_PARAM)
  else url.searchParams.set(ERA_PARAM, id)
  const next = url.pathname + url.search + url.hash
  if (mode === 'push') window.history.pushState({ era: id }, '', next)
  else window.history.replaceState({ era: id }, '', next)
}

export function ChapterProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState(DEFAULT_CHAPTER_ID)
  const [pendingId, setPendingId] = useState<string | null>(null)
  // Set while responding to Back/Forward, so committing does not push a new
  // entry on top of the one the browser just moved to.
  const fromHistory = useRef(false)

  const goTo = useCallback(
    (next: string) => {
      const target = getChapter(next)
      if (target.id === id) return
      // Ignore a second request while one is already in flight.
      setPendingId((current) => current ?? target.id)
    },
    [id]
  )

  // Deep link on first load: /about?era=nuremberg lands you there directly,
  // with no transition, because there is nothing to transition from.
  useEffect(() => {
    const era = eraFromLocation()
    if (era && era !== DEFAULT_CHAPTER_ID) {
      const target = getChapter(era)
      if (target.id !== DEFAULT_CHAPTER_ID) setId(target.id)
    }
  }, [])

  // Back/Forward should replay the journey, not jump.
  useEffect(() => {
    const onPop = () => {
      const era = eraFromLocation() ?? DEFAULT_CHAPTER_ID
      const target = getChapter(era)
      setId((current) => {
        if (current === target.id) return current
        fromHistory.current = true
        setPendingId(target.id)
        return current
      })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const commit = useCallback(() => {
    setPendingId((current) => {
      if (current) {
        setId(current)
        writeEra(current, fromHistory.current ? 'replace' : 'push')
        fromHistory.current = false
      }
      return current
    })
  }, [])

  const finish = useCallback(() => setPendingId(null), [])

  const chapter = useMemo(() => getChapter(id), [id])
  const pending = useMemo(() => (pendingId ? getChapter(pendingId) : null), [pendingId])

  const value = useMemo(
    () => ({ chapter, all: chapters, pending, goTo, commit, finish }),
    [chapter, pending, goTo, commit, finish]
  )

  return <ChapterContext.Provider value={value}>{children}</ChapterContext.Provider>
}

export function useChapter(): ChapterContextValue {
  const ctx = useContext(ChapterContext)
  if (!ctx) throw new Error('useChapter must be used inside <ChapterProvider>')
  return ctx
}
