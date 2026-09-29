'use client'

import Image from 'next/image'
import type { Project } from '@/data/projects'
import { trackProjectInteraction } from '@/utils/analytics'
import { ProjectContent } from './ProjectContent'

/**
 * An opened project on the projects list: the write-up on the left, and a
 * side column with the cover, what it was built with and where to see it.
 *
 * The side column is the project's title block, in the same terms as the
 * stage's and the CV's: labelled fields, ruled.
 */
export function ProjectDetail({
  project,
  onTool,
}: {
  project: Project
  /** Filter the list by one of this project's tools. */
  onTool: (tool: string) => void
}) {
  const content = project.detailedContent ?? []

  return (
    <div className="grid gap-10 pb-14 pt-2 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-12">
      <div className="min-w-0 space-y-8">
        <p className="u-lede text-[1.0625rem] text-[var(--ink)]">{project.description}</p>
        {content.map((block, i) => (
          <ProjectContent key={i} content={block} />
        ))}
      </div>

      <aside className="md:sticky md:top-[calc(var(--bar-h)+1.5rem)] md:self-start">
        <div className="relative aspect-[4/3] overflow-hidden border border-[var(--rule-soft)] bg-[var(--plaster-deep)]">
          <Image src={project.imageUrl} alt="" fill sizes="16rem" className="object-cover" />
        </div>

        <dl className="mt-5 border-t border-[var(--ink)] text-[0.875rem]">
          <div className="border-b border-[var(--rule-soft)] py-3">
            <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Kind</dt>
            <dd className="mt-1">{project.category}</dd>
          </div>
          {project.year && (
            <div className="border-b border-[var(--rule-soft)] py-3">
              <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-[var(--ink-soft)]">Year</dt>
              <dd className="u-figures mt-1">{project.year}</dd>
            </div>
          )}
          <div className="border-b border-[var(--rule-soft)] py-3">
            <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
              Built with
            </dt>
            <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {project.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTool(tag)}
                  title={`Show everything built with ${tag}`}
                  className="border-b border-transparent transition-colors hover:border-[var(--live)] hover:text-[var(--live)] focus:outline-none focus-visible:border-[var(--live)]"
                >
                  {tag}
                </button>
              ))}
            </dd>
          </div>
          {project.links && project.links.length > 0 && (
            <div className="border-b border-[var(--rule-soft)] py-3">
              <dt className="text-[0.625rem] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
                See it
              </dt>
              <dd className="mt-1">
                <ul className="space-y-1.5">
                  {project.links.map((link, i) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackProjectInteraction(project.title, 'external_link_click', {
                            project_id: project.id,
                            link_text: link.text,
                            link_url: link.url,
                            link_index: i,
                          })
                        }
                        className="group inline-flex items-baseline gap-1.5 transition-colors hover:text-[var(--live)]"
                      >
                        <span className="border-b border-[var(--live)] pb-px">{link.text}</span>
                        <span aria-hidden className="text-[var(--ink-soft)] group-hover:text-[var(--live)]">
                          ↗
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </aside>
    </div>
  )
}
