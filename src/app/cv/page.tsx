'use client'

import { useRef } from 'react'
import Link from 'next/link'
import aboutData from '@/data/about'

export default function CV() {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <main className="py-20 px-4 print:pt-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 print:hidden flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-4xl font-bold mb-4 sm:mb-0">Curriculum Vitae</h1>
          <div className="flex space-x-4">
            <button
              onClick={handlePrint}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Print CV
            </button>
            <Link
              href="/about"
              className="border border-foreground/20 hover:border-primary text-foreground hover:text-primary px-6 py-2 rounded-full font-medium transition-colors"
            >
              Back to About
            </Link>
          </div>
        </div>

        <div ref={printRef} className="content-section print:shadow-none print:border-none print:p-0">
          {/* CV Header */}
          <div className="border-b border-foreground/10 pb-6 mb-6 print:border-foreground/30">
            <h2 className="text-3xl font-bold">{aboutData.name}</h2>
            <p className="text-xl text-primary">{aboutData.title}</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <p className="text-foreground/70">
                  <span className="font-medium">Email:</span> contact@tarikisildar.dev
                </p>
                <p className="text-foreground/70">
                  <span className="font-medium">Phone:</span> +90 555 123 4567
                </p>
              </div>
              <div>
                <p className="text-foreground/70">
                  <span className="font-medium">Website:</span> tarikisildar.dev
                </p>
                <p className="text-foreground/70">
                  <span className="font-medium">Location:</span> Istanbul, Turkey
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 print:text-primary">Professional Summary</h3>
            <p className="text-foreground/80">
              {aboutData.bio[0]} {aboutData.bio[1]}
            </p>
          </div>

          {/* Skills */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2 print:text-primary">Skills</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h4 className="font-medium mb-1">Computer Graphics</h4>
                <ul className="list-disc list-inside text-sm text-foreground/80">
                  {aboutData.skills
                    .filter(skill => skill.category === 'graphics')
                    .map(skill => (
                      <li key={skill.name}>{skill.name}</li>
                    ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-1">Robotics</h4>
                <ul className="list-disc list-inside text-sm text-foreground/80">
                  {aboutData.skills
                    .filter(skill => skill.category === 'robotics')
                    .map(skill => (
                      <li key={skill.name}>{skill.name}</li>
                    ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-1">Programming</h4>
                <ul className="list-disc list-inside text-sm text-foreground/80">
                  {aboutData.skills
                    .filter(skill => skill.category === 'programming')
                    .map(skill => (
                      <li key={skill.name}>{skill.name}</li>
                    ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-1">Other</h4>
                <ul className="list-disc list-inside text-sm text-foreground/80">
                  {aboutData.skills
                    .filter(skill => skill.category === 'other')
                    .map(skill => (
                      <li key={skill.name}>{skill.name}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 print:text-primary">Professional Experience</h3>

            <div className="space-y-6">
              {aboutData.experience.map((job, index) => (
                <div key={index}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                    <h4 className="font-medium">{job.title} - {job.company}</h4>
                    <span className="text-sm text-foreground/60">{job.startDate} - {job.endDate}</span>
                  </div>
                  <p className="text-sm text-foreground/70 mb-2">{job.location}</p>

                  <ul className="list-disc list-outside ml-5 text-sm text-foreground/80 space-y-1">
                    {job.description.map((desc, descIndex) => (
                      <li key={descIndex}>{desc}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-lg font-semibold mb-4 print:text-primary">Education</h3>

            <div className="space-y-6">
              {aboutData.education.map((edu, index) => (
                <div key={index}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                    <h4 className="font-medium">{edu.degree}</h4>
                    <span className="text-sm text-foreground/60">{edu.startDate} - {edu.endDate}</span>
                  </div>
                  <p className="text-sm text-foreground/70 mb-2">{edu.institution}, {edu.location}</p>

                  {edu.description && (
                    <p className="text-sm text-foreground/80">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}