import type { Chapter } from './types'
import { shotFromLookAt } from '@/components/three/shots'
import munichAbout from './munich.about'

export const MUNICH: Chapter = {
  id: 'munich',
  label: 'Munich',
  country: 'DE',
  city: 'Munich',
  coords: [48.1351, 11.582],
  period: ['2021', '2025'],
  model: '/models/rooms/munich.glb',
  transform: {
    position: [0, -2, 0],
    scale: 1.5,
    rotation: [0, Math.PI / 4, 0],
  },
  sections: ['home', 'about', 'projects', 'cv', 'blog'],

  videos: [
    '/videos/hoffman.mp4',
    '/videos/office.mp4',
    '/videos/shorts.mp4',
    '/videos/radiohead.mp4',
  ],
  // Hand-placed over the monitor before screen anchors existed. These are the
  // numbers that used to be hardcoded in RoomScene; they are already in world
  // space, so the chapter transform is not applied on top.
  screen: {
    position: [-1.243, -1.155, -0.86],
    rotation: [0, Math.PI * 0.699, 0],
    size: [0.61, 0.365],
  },

  content: {
    home: {
      greeting: "Hi, I'm Tarik",
      roomBlurb:
        "Welcome to my virtual room! It's an exact replica of the mancave I lived in for 2 years in Munich.",
      aboutPreview: [
        "I'm a Computer Graphics and Robotics specialist with an M.Sc. from the Technical University of Munich, where I've focused on real-time rendering, autonomous systems, and AI-powered solutions.",
        "Over the years, I've worked on exciting projects ranging from autonomous vehicle systems to real-time visualization tools, blending technical expertise with creativity to solve complex challenges.",
      ],
      photo: '/images/tarik/me.jpg',
    },
    about: munichAbout,
  },

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
