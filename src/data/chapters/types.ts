import type { AboutData } from '@/data/about'
import type { PageType, Shot } from '@/components/three/shots'

/**
 * The parts of the site that are specific to a time and place.
 *
 * Projects and the blog are deliberately *not* here: they are shared across
 * every chapter. Only the writing that dates — how you introduce yourself, your
 * bio, your CV — is versioned, so moving through the timeline is a look back at
 * who you were then.
 */
export type ChapterContent = {
  home: {
    /** Headline on the landing page. */
    greeting: string
    /** Body of the "My Virtual Room" card — describes *this* place. */
    roomBlurb: string
    /** Paragraphs in the "About Me" teaser near the foot of the landing page. */
    aboutPreview: string[]
    /** Portrait shown beside that teaser. */
    photo: string
  }
  /** Omit if this chapter has no About section. */
  about?: AboutData
  /** Omit if this chapter has no CV section. */
  cv?: {
    /** Standard Google Drive share URL; converted to an embed at render time. */
    driveUrl: string
  }
}

/**
 * A chapter is a place, at a time in my life.
 *
 * Place is the primary axis and the section is secondary, so a chapter declares
 * which sections it offers — requiring every chapter to answer every section
 * would mean authoring shots and writing content for sections that do not apply
 * to that period.
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
  /**
   * URL of the optimized room model. Omit while the room is still being built:
   * the scene shows a "under construction" panel instead, and the transition
   * treats the chapter as ready immediately rather than waiting for a load that
   * will never arrive.
   */
  model?: string
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
  /** The writing for this era. */
  content: ChapterContent
  /**
   * Shots for rooms that do not yet have `shot_*` cameras authored in Blender.
   * New chapters should author cameras in the .blend instead of adding entries
   * here; this exists so Munich keeps working untouched.
   */
  fallbackShots?: Partial<Record<PageType, Shot>>
}
