import type { Chapter } from './types'
import munichAbout from './munich.about'

export const NUREMBERG: Chapter = {
  id: 'nuremberg',
  label: 'Nuremberg',
  city: 'Nuremberg',
  coords: [49.4521, 11.0767],
  period: ['2025', null],
  model: '/models/rooms/nuremberg.glb',
  // The apartment is ~10.9m x 6.5m against Munich's ~3m square, and the model
  // already sits centred on its own origin. Scale matches Munich so a metre
  // means the same thing in both chapters — the new place should read as
  // genuinely bigger, not as the same room drawn larger.
  transform: {
    position: [0, -2, 0],
    scale: 1.5,
    rotation: [0, Math.PI / 4, 0],
  },
  sections: ['home', 'about', 'projects', 'cv', 'blog'],

  content: {
    home: {
      greeting: "Hi, I'm Tarik2",
      // TODO: your words. This is the one line that most obviously belongs to
      // the new place — it currently still describes the Munich room.
      roomBlurb:
        'Welcome to my virtual apartment in Nuremberg, where I moved in 2025 to start a new job.',
      // TODO: the Munich-era paragraphs, carried over so the page is not empty.
      // Rewriting these is the point of per-chapter content.
      aboutPreview: [
        "I'm a Computer Graphics and Robotics specialist with an M.Sc. from the Technical University of Munich, where I've focused on real-time rendering, autonomous systems, and AI-powered solutions.",
        "Over the years, I've worked on exciting projects ranging from autonomous vehicle systems to real-time visualization tools, blending technical expertise with creativity to solve complex challenges.",
      ],
      photo: '/images/tarik/me.jpg',
    },
    // TODO: currently the Munich-era About, shared by reference. Replace with a
    // Nuremberg-era copy — a new object, not a mutation of this one, or you will
    // edit Munich's past as well.
    about: munichAbout,
    // TODO: point at the current CV once it is updated. Sharing Munich's link
    // means the "then" and "now" CVs are identical.
    cv: {
      driveUrl:
        'https://drive.google.com/file/d/1lECifvuwI0C0rcDrEyp-JhCZPJO3Hddc/view?usp=sharing',
    },
  },

  // No fallbackShots on purpose. With no `shot_*` cameras in the GLB yet, the
  // scene auto-frames from the room's bounds. Authoring cameras in Blender will
  // override that — do not hand-tune numbers here.
}
