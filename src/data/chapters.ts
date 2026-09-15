import type { PageType, Shot } from '@/components/three/shots'
import { shotFromLookAt } from '@/components/three/shots'

/**
 * A chapter is a place, at a time in my life.
 *
 * The site is meant to grow into a story told through the rooms I've lived in,
 * so "place" is the primary axis and the section (home / about / projects / …)
 * is secondary. A chapter therefore declares which sections it actually has:
 * requiring every chapter to answer every section would mean hand-authoring
 * shots and writing content for sections that do not apply to that period.
 */
export type Chapter = {
  /** Stable id; also the model filename under public/models/rooms/. */
  id: string
  /** Shown in the timeline UI. */
  label: string
  /** City, for the map transition between chapters. */
  city: string
  /** [latitude, longitude] — drives the flight path on the map. */
  coords: [number, number]
  /** Inclusive start, and end (null while it is the current chapter). */
  period: [string, string | null]
  /** URL of the optimized room model. */
  model: string
  /**
   * Where the room sits in the scene. Shots authored inside the GLB are read
   * in world space, so they inherit this automatically — which is why a room
   * can be built anywhere in the .blend, at any size, and still frame right.
   */
  transform: {
    position: [number, number, number]
    scale: number
    rotation: [number, number, number]
  }
  /** Sections this chapter offers. Order is the order they appear in nav. */
  sections: PageType[]
  /**
   * Shots for rooms that do not yet have `shot_*` cameras authored in Blender.
   * New chapters should author cameras in the .blend instead of adding entries
   * here; this exists so Munich keeps working untouched.
   */
  fallbackShots?: Partial<Record<PageType, Shot>>
}

const MUNICH: Chapter = {
  id: 'munich',
  label: 'Munich',
  city: 'Munich',
  coords: [48.1351, 11.582],
  period: ['2022', '2025'],
  model: '/models/rooms/munich.glb',
  transform: {
    position: [0, -2, 0],
    scale: 1.5,
    rotation: [0, Math.PI / 4, 0],
  },
  sections: ['home', 'about', 'projects', 'cv', 'blog'],
  // Hand-tuned through the old on-screen debug panel, before shots moved into
  // the model. Kept verbatim so this room's framing is unchanged.
  fallbackShots: {
    home: shotFromLookAt([0.51, 0.18, -5.19], [-0.29, -2.48, 4.41], 35),
    about: shotFromLookAt([0.79, -0.7, -1.68], [8.02, -0.87, 5.63], 40),
    projects: shotFromLookAt([-1.39, -0.77, -1.27], [-5.23, -4.1, 7.34], 35),
    cv: shotFromLookAt([-0.53, -1, -0.39], [-0.54, -2, -0.38], 40),
    blog: shotFromLookAt([1.55, -1.37, 0.09], [-8.07, -2.33, -2.47], 50),
    notFound: shotFromLookAt([0, 8, 12], [0, 0, 0], 70),
    procrastinate: shotFromLookAt([-0.43, -1.06, -1.06], [-8.33, -2.71, 4.15], 70),
  },
}

/**
 * Chronological. The map transition animates between consecutive entries, and
 * the timeline UI renders them in this order.
 *
 * Adding Nuremberg means appending a chapter here and dropping its GLB into
 * models-src/rooms/ — no changes to the scene code.
 */
export const chapters: Chapter[] = [MUNICH]

/** The chapter shown on first load. */
export const DEFAULT_CHAPTER_ID = MUNICH.id

export function getChapter(id: string): Chapter {
  return chapters.find((c) => c.id === id) ?? MUNICH
}
