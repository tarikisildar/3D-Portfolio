/**
 * The CV, told as the same journey as the rooms: one block per city, in order.
 *
 * Shared by every chapter. Unlike the About page, which is written as who I was
 * at the time, the CV is the whole record, and the timeline is its structure
 * rather than a filter on it.
 *
 * Each place names a chapter id (see src/data/chapters/). The city, the years
 * and the travel mode between places come from the chapter, so they stay in
 * step with the map and the top bar.
 *
 * Dates are 'YYYY-MM' (or 'YYYY'). `to: null` means ongoing.
 */

export type CvLink = {
  label: string
  /** External URL, or a path on this site such as '/projects?project=thesis'. */
  href: string
}

export type CvEntry = {
  kind: 'work' | 'study'
  /** Company or school. */
  org: string
  /** Company or school website. */
  orgUrl?: string
  /** Job title or degree. Omit to show the organisation alone. */
  role?: string
  from: string
  to: string | null
  /** Only needed when it differs from the place the entry sits under. */
  location?: string
  /** One or two sentences on what the role was. */
  summary?: string
  /** What you did there, one line each. */
  highlights?: string[]
  /** Things to click: products, papers, related projects on this site. */
  links?: CvLink[]
  tags?: string[]
}

export type CvPlace = {
  /** Chapter id. */
  chapter: string
  /** Optional line on what this move was about. */
  note?: string
  year:number
  /** Newest last: the page reads top to bottom as the story went. */
  entries: CvEntry[]
}

export type Cv = {
  /** Lede under the heading. */
  intro: string
  places: CvPlace[]
  skills: { label: string; items: string[] }[]
  /** Ways to get in touch, shown at the foot of the page. */
  contact: CvLink[]
}

export const cv: Cv = {
  intro:
    'Computer graphics engineer with an M.Sc. from TUM, working on real-time rendering and autonomous systems. Games, self-driving cars, and lately shoes.',

  places: [
    {
      chapter: 'ankara',
      year: 2017,
      entries: [
        {
          kind: 'study',
          org: 'Hacettepe University',
          role: 'B.Sc. Computer Engineering',
          from: '2017-09',
          to: '2021-08',
          highlights: ['GPA 3.32 / 4.0'],
        },
        {
          kind: 'work',
          org: 'Apps Mobile Company',
          role: 'Working Student Software Engineer',
          from: '2020-02',
          to: '2021-05',
          highlights: [
            'Built interactive playable ads in WebGL with Three.js and JavaScript.',
            'Rapid-prototyped more than ten mobile games in Unity and C#.',
          ],
          links: [
            { label: 'Trivia Race playable ad', href: '/projects?project=trivia-race-ad' },
            { label: 'Hyper-casual portfolio', href: '/projects?project=hyper-casuals' },
          ],
          tags: ['Three.js', 'WebGL', 'Unity', 'C#'],
        },
      ],
    },
    {
      chapter: 'munich',
      year: 2021,
      entries: [
        {
          kind: 'study',
          org: 'Technical University of Munich',
          role: 'M.Sc. Informatics',
          from: '2021-09',
          to: '2025-03',
          summary: 'Focus on computer graphics, machine learning, compilers and computer vision.',
          links: [
            { label: "Master's thesis", href: '/projects?project=thesis' },
            { label: "Visualization Engine", href: '/projects?project=idp-interface' },
            { label: "Praktikum", href: '/projects?project=simulation-based-autonomous-driving' }
          ],
        },
        {
          kind: 'work',
          org: 'NVIDIA',
          role: 'Software Engineering Intern, Autonomous Vehicles',
          from: '2024-04',
          to: '2025-04',
          highlights: [
            'NVAssistant: an LLM work assistant pulling enterprise services into daily summaries. Pitched, designed and shipped in three months (Python, FastAPI, React, PostgreSQL).',
            'NDAS Parking: autonomous parking components in C++, from requirements through unit and integration tests.',
            'Bazel build scripts and a TypeScript visualisation tool for the wider team.',
          ],
          tags: ['C++', 'Python', 'Bazel', 'TypeScript'],
        },
        {
          kind: 'work',
          org: 'Aesir Interactive',
          role: 'Working Student Programmer',
          from: '2021-10',
          to: '2024-04',
          highlights: [
            'Police Simulator: Patrol Officers, one of the top five Early Access games of 2022 on Steam.',
            'Gameplay systems, UI and performance work in Unreal Engine 4 and C++.',
            'Part of a 30-person team: code reviews, design discussions, sprint planning.',
          ],
          links: [{ label: 'Police Simulator', href: '/projects?project=police-simulator' }],
          tags: ['Unreal Engine 4', 'C++'],
        },
      ],
    },
    {
      chapter: 'nuremberg',
      year: 2025,
      entries: [
        {
          kind: 'work',
          org: 'adidas',
          role: 'Software Engineer',
          from: '2025',
          to: null,
          summary: "Part of the adidas R&D team bringing software solutions to athletes. Working on different sets of solutions everyday with different teams and technologies. I sometimes can't believe how much I enjoy doing the stuff I get paid for doing here.",
          highlights: [
            "Implemented Research papers into the production environment to help athletes break new records with the help of adidas technology.",
            "Made a running shoe that can have a controllable stiffness with a smartwatch integration. Check Gearshift project for more details.",
            "Contributed to lines like Techfit, football cleats and other performance-oriented products.",
          ],
          links: [
            { label: 'Gearshift', href: '/projects?project=gearshift' },
            { label: 'Rhino, but can it run Doom?', href: '/projects?project=doom-rhino' },
          ],
        },
      ],
    },
  ],

  skills: [
    { label: 'Languages', items: ['C++', 'Python', 'C#', 'JavaScript', 'TypeScript', 'Java'] },
    {
      label: 'Graphics',
      items: ['Unreal Engine', 'Unity', 'OpenGL', 'Three.js', 'Shaders'],
    },
    { label: 'Systems', items: ['ROS', 'Docker', 'CMake', 'Bazel', 'Git', 'CI/CD'] },
    { label: 'ML and web', items: ['PyTorch', 'TensorFlow', 'FastAPI', 'Flask', 'React'] },
  ],

  // Same addresses as the footer.
  contact: [
    { label: 'Email', href: 'mailto:tarikisildar@gmail.com' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/tariksldr' },
    { label: 'GitHub', href: 'https://github.com/tarikisildar' },
  ],
}
