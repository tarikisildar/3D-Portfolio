export interface Skill {
  name: string;
  level: number; // 1-10
  category: 'graphics' | 'robotics' | 'programming' | 'other';
}

export interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | 'Present';
  description: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface AboutData {
  name: string;
  title: string;
  bio: string[];
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  profilePic: string;
  /**
   * The "off the clock" strip on the About page. Optional: leave it out and
   * the chapter shows DEFAULT_PHOTOS.
   */
  photos?: AboutPhoto[];
}

export interface AboutPhoto {
  src: string;
  caption: string;
  /** Makes the photo a link, e.g. to Instagram. */
  href?: string;
}

/** Portrait photos, shown at 4:5. */
export const DEFAULT_PHOTOS: AboutPhoto[] = [
  { src: '/images/tarik/hike.jpg', caption: 'Enjoying the mountains' },
  { src: '/images/tarik/weird.png', caption: 'Stay messy, stay weird' },
  {
    src: '/images/tarik/maximilen.jpg',
    caption: 'I love taking photos. More on Instagram',
    href: 'https://instagram.com/_tariqueue_',
  },
  { src: '/images/tarik/cassette.jpg', caption: 'My cassette collection' },
];

// The data itself is per-chapter now: see src/data/chapters/<id>.ts.
// This file keeps only the shape, so every era's About page agrees on it.
