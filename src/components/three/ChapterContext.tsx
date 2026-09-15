'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
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

export function ChapterProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState(DEFAULT_CHAPTER_ID)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const goTo = useCallback(
    (next: string) => {
      const target = getChapter(next)
      if (target.id === id) return
      // Ignore a second request while one is already in flight.
      setPendingId((current) => current ?? target.id)
    },
    [id]
  )

  const commit = useCallback(() => {
    setPendingId((current) => {
      if (current) setId(current)
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
