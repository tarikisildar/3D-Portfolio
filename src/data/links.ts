/**
 * Where to find me, in one place.
 *
 * These used to be written out separately in the footer, the About page and
 * the CV, and had already drifted: two different LinkedIn URLs were live at
 * once. Everything that lists contact links reads from here.
 */

export type ContactLink = {
  label: string
  href: string
  /** What the reader sees next to the label: a handle or an address. */
  detail?: string
  /** A throwaway line for the About page. */
  aside?: string
}

export const email: ContactLink = {
  label: 'Email',
  href: 'mailto:tarikisildar@gmail.com',
  detail: 'tarikisildar@gmail.com',
}

export const github: ContactLink = {
  label: 'GitHub',
  href: 'https://github.com/tarikisildar',
  detail: 'tarikisildar',
}

// TODO: two LinkedIn URLs were in use. About had /in/tariksldr, the footer
// and CV had /in/tarikisildar. Keep the one that is actually yours.
export const linkedin: ContactLink = {
  label: 'LinkedIn',
  href: 'https://linkedin.com/in/tariksldr',
  detail: 'tariksldr',
}

export const instagram: ContactLink = {
  label: 'Instagram',
  href: 'https://instagram.com/_tariqueue_',
  detail: '_tariqueue_',
  aside: 'Mostly photos.',
}

export const spotify: ContactLink = {
  label: 'Spotify',
  href: 'https://open.spotify.com/user/morvanpir',
  detail: 'morvanpir',
  aside: 'What is playing in the room.',
}

export const duolingo: ContactLink = {
  label: 'Duolingo',
  href: 'https://www.duolingo.com/profile/tarikisildar',
  detail: 'tarikisildar',
  aside: 'Why not.',
}

/** The one rickroll on the site. Tracked as such in analytics. */
export const teams: ContactLink = {
  label: 'Microsoft Teams',
  href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  detail: 'Book a call',
  aside: 'Always available.',
}

/** The short list: footer and CV. */
export const professional = [email, linkedin, github]

/** Everything, for the About page. */
export const everywhere = [email, linkedin, github, instagram, spotify, duolingo, teams]
