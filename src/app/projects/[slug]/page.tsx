'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import projects, { Project } from '@/data/projects'

export default function ProjectDetail() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (params.slug) {
      const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug
      const foundProject = projects.find((p) => p.slug === slug)

      if (foundProject) {
        setProject(foundProject)
      } else {
        // Project not found, redirect to projects page
        router.push('/projects')
      }

      setIsLoading(false)
    }
  }, [params.slug, router])

  const handleImageError = () => {
    setImageError(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Project Detail Content */}
      <main className="pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/projects"
              className="flex items-center text-foreground/70 hover:text-primary transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Projects
            </Link>
          </div>

          <div className="content-section overflow-hidden">
            {/* Project Header */}
            <div className="relative h-64 md:h-96 -mx-6 -mt-6 mb-8">
              {!imageError ? (
                <Image
                  src={project.imageUrl}
                  alt={project.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="brightness-75"
                  onError={handleImageError}
                />
              ) : (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <div className="text-primary font-bold text-4xl opacity-50">{project.title[0]}</div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 md:p-10">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {project.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-primary/80 text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Description */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Overview</h2>
              <p className="text-foreground/80 text-lg mb-6">{project.description}</p>

              <div className="space-y-4">
                {project.longDescription.map((paragraph, index) => (
                  <p key={index} className="text-foreground/80">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Project Links */}
            <div className="flex flex-wrap gap-4">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-medium transition-colors inline-flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Live Demo
                </a>
              )}

              {project.codeUrl && (
                <a
                  href={project.codeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-foreground/20 hover:border-primary text-foreground hover:text-primary px-6 py-3 rounded-full font-medium transition-colors inline-flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View Code
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}