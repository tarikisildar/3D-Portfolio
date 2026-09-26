'use client'

import Image from 'next/image'
import type { Project } from '@/data/projects'
import { trackProjectInteraction } from '@/utils/analytics'

/**
 * A project as a card, for the featured row on the home page.
 *
 * It no longer expands in place: opening a project is the projects page's
 * job (see ProjectRow), and clicking a card travels there through the room.
 * The write-up itself renders with ProjectContent.
 */

type ProjectCardProps = {
  project: Project
  onOpen: (projectId: number) => void
}

export default function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const open = () => {
    trackProjectInteraction(project.title, 'expand', {
      project_id: project.id,
      category: project.category,
    })
    onOpen(project.id)
  }

  return (
    <article className="group relative flex h-full flex-col border border-[var(--rule-soft)] bg-[var(--plaster-lift)] transition-colors hover:border-[var(--ink)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--plaster-deep)]">
        <Image
          src={project.imageUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 24rem"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.75rem] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
          {project.category}
        </p>
        <h3
          className="mt-1 text-[1.25rem] leading-tight"
          style={{ fontVariationSettings: '"wdth" 108, "wght" 620' }}
        >
          {/* The whole card is clickable: this button stretches over it. */}
          <button
            type="button"
            onClick={open}
            className="text-left after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--live)]"
          >
            {project.title}
          </button>
        </h3>
        <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-relaxed text-[var(--ink-soft)]">
          {project.description}
        </p>
        <p className="mt-auto pt-5 text-[0.8125rem] text-[var(--ink-soft)]">
          {project.tags.slice(0, 3).join(' · ')}
        </p>
        <p className="mt-3 text-[0.9375rem]">
          <span className="border-b border-[var(--live)] pb-px transition-colors group-hover:text-[var(--live)]">
            View project
          </span>
          <span aria-hidden className="ml-1 inline-block transition-transform group-hover:translate-x-1">
            &rarr;
          </span>
        </p>
      </div>
    </article>
  )
}
