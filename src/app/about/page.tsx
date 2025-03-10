'use client'

import aboutData from '@/data/about'
import { useEffect, useRef } from 'react'

// Skill bar component
const SkillBar = ({ name, level, category }: { name: string; level: number; category: string }) => {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (barRef.current) {
      setTimeout(() => {
        if (barRef.current) {
          barRef.current.style.width = `${level * 10}%`
        }
      }, 300)
    }
  }, [level])

  // Different colors for different categories
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'graphics':
        return 'from-blue-500 to-purple-500'
      case 'robotics':
        return 'from-green-500 to-teal-500'
      case 'programming':
        return 'from-orange-500 to-red-500'
      default:
        return 'from-pink-500 to-purple-500'
    }
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-foreground/60">{level}/10</span>
      </div>
      <div className="w-full bg-foreground/10 rounded-full h-2.5">
        <div
          ref={barRef}
          className={`h-2.5 rounded-full bg-gradient-to-r ${getCategoryColor(category)} transition-all duration-1000 ease-out`}
          style={{ width: '0%' }}
        ></div>
      </div>
    </div>
  )
}

export default function About() {
  return (
    <>
      {/* About Content */}
      <main className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Bio Section */}
          <section className="mb-20">
            <div className="content-section">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1">
                  <div className="aspect-square rounded-lg overflow-hidden relative bg-foreground/10">
                    {/* Replace with your actual image */}
                    <div className="absolute inset-0 flex items-center justify-center text-foreground/20 text-2xl">
                      [Your Photo Here]
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h1 className="text-4xl font-bold mb-2">{aboutData.name}</h1>
                  <h2 className="text-xl text-primary mb-6">{aboutData.title}</h2>

                  <div className="space-y-4">
                    {aboutData.bio.map((paragraph, index) => (
                      <p key={index} className="text-foreground/80">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Skills Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-10 text-center">Skills</h2>

            <div className="content-section">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">Computer Graphics</h3>
                  {aboutData.skills
                    .filter(skill => skill.category === 'graphics')
                    .map(skill => (
                      <SkillBar
                        key={skill.name}
                        name={skill.name}
                        level={skill.level}
                        category={skill.category}
                      />
                    ))}
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">Robotics</h3>
                  {aboutData.skills
                    .filter(skill => skill.category === 'robotics')
                    .map(skill => (
                      <SkillBar
                        key={skill.name}
                        name={skill.name}
                        level={skill.level}
                        category={skill.category}
                      />
                    ))}
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">Programming</h3>
                  {aboutData.skills
                    .filter(skill => skill.category === 'programming')
                    .map(skill => (
                      <SkillBar
                        key={skill.name}
                        name={skill.name}
                        level={skill.level}
                        category={skill.category}
                      />
                    ))}
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-primary">Other</h3>
                  {aboutData.skills
                    .filter(skill => skill.category === 'other')
                    .map(skill => (
                      <SkillBar
                        key={skill.name}
                        name={skill.name}
                        level={skill.level}
                        category={skill.category}
                      />
                    ))}
                </div>
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold mb-10 text-center">Work Experience</h2>

            <div className="content-section">
              <div className="space-y-12">
                {aboutData.experience.map((job, index) => (
                  <div key={index} className="relative pl-10 border-l-2 border-primary/30">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary"></div>

                    <div>
                      <h3 className="text-xl font-semibold">{job.title}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center text-foreground/70 mb-2">
                        <span className="font-medium">{job.company}</span>
                        <span className="hidden sm:inline mx-2">•</span>
                        <span>{job.location}</span>
                      </div>
                      <p className="text-sm text-foreground/60 mb-4">{job.startDate} - {job.endDate}</p>

                      <ul className="list-disc list-inside space-y-2 text-foreground/80">
                        {job.description.map((desc, descIndex) => (
                          <li key={descIndex}>{desc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Education Section */}
          <section>
            <h2 className="text-3xl font-bold mb-10 text-center">Education</h2>

            <div className="content-section">
              <div className="space-y-12">
                {aboutData.education.map((edu, index) => (
                  <div key={index} className="relative pl-10 border-l-2 border-secondary/30">
                    <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-secondary"></div>

                    <div>
                      <h3 className="text-xl font-semibold">{edu.degree}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center text-foreground/70 mb-2">
                        <span className="font-medium">{edu.institution}</span>
                        <span className="hidden sm:inline mx-2">•</span>
                        <span>{edu.location}</span>
                      </div>
                      <p className="text-sm text-foreground/60 mb-4">{edu.startDate} - {edu.endDate}</p>

                      {edu.description && (
                        <p className="text-foreground/80">{edu.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}