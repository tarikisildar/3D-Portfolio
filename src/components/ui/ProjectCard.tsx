'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Project } from '@/data/projects'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { title, description, imageUrl, tags, demoUrl, codeUrl, slug } = project
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Tilt effect on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = (centerY - y) / 20
    const rotateY = (x - centerX) / 20

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    setIsHovered(false)
    cardRef.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div
      ref={cardRef}
      className="bg-background border border-foreground/10 rounded-lg overflow-hidden shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out'
      }}
    >
      <div className="relative h-48 overflow-hidden">
        {!imageError ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            className={`transition-transform duration-700 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
            onError={handleImageError}
          />
        ) : (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <div className="text-primary font-medium text-lg">{title[0]}</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-foreground/70 mb-4 line-clamp-2">{description}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex space-x-3">
          <Link
            href={`/projects/${slug}`}
            className="text-primary hover:text-primary-dark font-medium text-sm transition-colors"
          >
            Learn More
          </Link>

          {demoUrl && (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-primary font-medium text-sm transition-colors"
            >
              Live Demo
            </a>
          )}

          {codeUrl && (
            <a
              href={codeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-primary font-medium text-sm transition-colors"
            >
              View Code
            </a>
          )}
        </div>
      </div>
    </div>
  )
}