import { ANKARA } from './ankara'
import { MUNICH } from './munich'
import { NUREMBERG } from './nuremberg'

export type { Chapter, ChapterContent } from './types'

/**
 * Chronological. The map transition animates between consecutive entries, and
 * the timeline UI renders them in this order.
 *
 * Adding a place: see docs/adding-a-place.md.
 */
export const chapters = [ANKARA, MUNICH, NUREMBERG]

/**
 * The chapter shown on first load: always the most recent one.
 *
 * A visitor arriving cold should meet where I am now, and travel *back* through
 * the timeline — the older chapters are the look back, not the front door.
 * Derived from the array rather than named, so adding a newer chapter moves the
 * entrance automatically.
 */
export const DEFAULT_CHAPTER_ID = chapters[chapters.length - 1].id

/** Unknown ids fall back to the default chapter rather than throwing. */
export function getChapter(id: string) {
  return (
    chapters.find((c) => c.id === id) ??
    chapters.find((c) => c.id === DEFAULT_CHAPTER_ID) ??
    MUNICH
  )
}
