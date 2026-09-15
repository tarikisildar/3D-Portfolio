import { MUNICH } from './munich'
import { NUREMBERG } from './nuremberg'

export type { Chapter, ChapterContent } from './types'

/**
 * Chronological. The map transition animates between consecutive entries, and
 * the timeline UI renders them in this order.
 *
 * Adding a place: see docs/adding-a-place.md.
 */
export const chapters = [MUNICH, NUREMBERG]

/** The chapter shown on first load. */
export const DEFAULT_CHAPTER_ID = MUNICH.id

export function getChapter(id: string) {
  return chapters.find((c) => c.id === id) ?? MUNICH
}
