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
}

// The data itself is per-chapter now: see src/data/chapters/<id>.ts.
// This file keeps only the shape, so every era's About page agrees on it.
