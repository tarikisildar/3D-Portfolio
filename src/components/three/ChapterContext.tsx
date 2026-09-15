'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { chapters, getChapter, DEFAULT_CHAPTER_ID, type Chapter } from '@/data/chapters'

type ChapterContextValue = {
  /** The chapter currently on screen. */
  chapter: Chapter
  /** Every chapter, chronological — for the timeline UI. */
  all: Chapter[]
  /** Switch chapters. Unknown ids fall back to the default rather than throwing. */
  goTo: (id: string) => void
  /**
   * True from the moment a switch is requested until the new room is on screen.
   * The map transition will hang off this: it doubles as the loading curtain,
   * which is what lets us unload one room before fetching the next instead of
   * holding two in GPU memory at once.
   */
  switching: boolean
  setSwitching: (v: boolean) => void
}

const ChapterContext = createContext<ChapterContextValue | null>(null)

export function ChapterProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState(DEFAULT_CHAPTER_ID)
  const [switching, setSwitching] = useState(false)

  const goTo = useCallback((next: string) => {
    setId((current) => (current === next ? current : getChapter(next).id))
  }, [])

  const chapter = useMemo(() => getChapter(id), [id])

  const value = useMemo(
    () => ({ chapter, all: chapters, goTo, switching, setSwitching }),
    [chapter, goTo, switching]
  )

  return <ChapterContext.Provider value={value}>{children}</ChapterContext.Provider>
}

export function useChapter(): ChapterContextValue {
  const ctx = useContext(ChapterContext)
  if (!ctx) throw new Error('useChapter must be used inside <ChapterProvider>')
  return ctx
}
