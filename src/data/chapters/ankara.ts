import type { Chapter } from './types'

/**
 * Where the story starts. The room is not built yet, so this chapter has no
 * `model` — the scene shows an under-construction panel in its place.
 *
 * TODO: the period below is a placeholder. Set the real years.
 */
export const ANKARA: Chapter = {
  id: 'ankara',
  label: 'Ankara',
  country: 'TR',
  city: 'Ankara',
  coords: [39.9334, 32.8597],
  period: ['1999', '2021'],

  // No `model` yet — the room is still being built.

  // Kept for when the room lands, so it drops in without further edits.
  transform: {
    position: [0, -2, 0],
    scale: 1.5,
    rotation: [0, Math.PI / 4, 0],
  },

  // Projects, the CV and the blog are shared across every chapter, so they
  // stay reachable. About is per-chapter writing that does not exist for this
  // era yet, so it is left out rather than showing Munich's.
  sections: ['home', 'projects', 'cv', 'blog'],

  content: {
    home: {
      greeting: "Hi, I'm Tarik",
      roomBlurb:
        "This chapter is still under construction — I haven't built my Ankara room yet. Come back later, or travel forward to Munich or Nuremberg.",
      aboutPreview: [
        'The beginning of the story: Ankara, before the move to Germany.',
        'This chapter is a work in progress.',
      ],
      photo: '/images/tarik/me.jpg',
    },
    // No about: not written for this era yet.
  },
}
