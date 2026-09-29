'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import projects, { type Project } from '@/data/projects'
import { useChapter } from '@/components/three/ChapterContext'
import { DEFAULT_CHAPTER_ID } from '@/data/chapters'
import { ProjectDetail } from '@/components/ui/ProjectDetail'
import { whenStageSettles } from '@/components/three/stageStatus'
import { findFocus, glideTo, topFor } from '@/components/three/useStageNavigation'
import { trackProjectInteraction } from '@/utils/analytics'

/**
 * Projects as an index, the way an architect's set lists its drawings: a
 * number, a title, what it is and what it was built with, one line each.
 *
 * Replaces a grid of identical cards over a wall of 24 filter chips, most of
 * which matched a single project. Filtering is now a kind (tabs) and a tool
 * (a short select, or any tool named in an open project). A project opens in
 * place, and the URL follows (?project=slug), so an open project can be
 * linked to and the home page can travel straight to one.
 */

type Kind = 'All' | 'Software' | 'Game'
const KINDS: { value: Kind; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Software', label: 'Software' },
  { value: 'Game', label: 'Games' },
]

/**
 * Newest first by year: a span counts by its last year ('2021–2024' as 2024),
 * then by its first, then newest-added. Undated projects go last.
 */
function byYear(a: Project, b: Project) {
  const years = (p: Project) => (p.year?.match(/\d{4}/g) ?? []).map(Number)
  const [ya, yb] = [years(a), years(b)]
  if (!ya.length || !yb.length) return yb.length - ya.length || b.id - a.id
  return yb[yb.length - 1] - ya[ya.length - 1] || yb[0] - ya[0] || b.id - a.id
}

function ProjectsIndex() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { chapter } = useChapter()

  const [kind, setKind] = useState<Kind>('All')
  const [tool, setTool] = useState<string | null>(null)
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  const inKind = useMemo(
    () => projects.filter((p) => kind === 'All' || p.category === kind).sort(byYear),
    [kind]
  )
  const visible = useMemo(() => (tool ? inKind.filter((p) => p.tags.includes(tool)) : inKind), [inKind, tool])

  // Tools that narrow the current kind to something, with how many each has.
  const tools = useMemo(() => {
    const count = new Map<string, number>()
    for (const p of inKind) for (const t of p.tags) count.set(t, (count.get(t) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [inKind])

  const urlFor = (slug: string | null) => {
    const params = new URLSearchParams()
    if (slug) params.set('project', slug)
    if (chapter.id !== DEFAULT_CHAPTER_ID) params.set('era', chapter.id)
    const query = params.toString()
    return `/projects${query ? `?${query}` : ''}`
  }

  // The URL is the source of truth for which project is open.
  const requested = searchParams.get('project')
  useEffect(() => {
    const project = projects.find((p) => p.slug === requested)
    setOpenSlug(project?.slug ?? null)
    // Never open something the filters are hiding.
    if (project) {
      setKind((k) => (k === 'All' || k === project.category ? k : 'All'))
      setTool((t) => (t && !project.tags.includes(t) ? null : t))
    }
  }, [requested])

  // Arriving on a link to a project (from the CV, or shared) rather than via
  // the home page's choreographed trip: let the room land, then bring the
  // project into view. The home page's trip does its own scrolling, and marks
  // the document while it does.
  const arrived = useRef(false)
  useEffect(() => {
    if (arrived.current || !requested) return
    arrived.current = true
    if (document.documentElement.dataset.travelling === 'true') return
    let cancelled = false
    ;(async () => {
      await whenStageSettles({ startWithin: 2500, maxWait: 6000 })
      const el = await findFocus(`project-${requested}`)
      if (!cancelled && el) await glideTo(topFor(el))
    })()
    return () => {
      cancelled = true
    }
  }, [requested])

  const toggle = (project: Project) => {
    const next = openSlug === project.slug ? null : project.slug
    if (next) {
      trackProjectInteraction(project.title, 'expand', { project_id: project.id, category: project.category })
    }
    setOpenSlug(next)
    router.replace(urlFor(next), { scroll: false })
    // Opening one project closes another above it, which would shift the row
    // just clicked out from under the pointer; keep it in place at the top.
    if (next) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`project-${next}`)
        if (el && el.getBoundingClientRect().top < 0) glideTo(topFor(el))
      })
    }
  }

  const filterByTool = (next: string | null) => {
    setTool(next)
    if (next) {
      setKind('All')
      setOpenSlug(null)
      router.replace(urlFor(null), { scroll: false })
      requestAnimationFrame(() => {
        const list = document.getElementById('project-index')
        if (list) glideTo(topFor(list) - 80)
      })
    }
  }

  return (
    <>
      <section className="border-b border-[var(--rule-soft)]">
        <div className="mx-auto max-w-6xl px-6 pb-12 pt-10 sm:pb-16">
          <h1 className="u-display text-[clamp(2.25rem,6vw,4rem)]">Projects</h1>
          <p className="u-lede mt-4 text-[1.0625rem] text-[var(--ink-soft)]">
            Graphics, robotics and the occasional game. Open one to read how it
            was made.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        {/* Filters: a kind, and optionally one tool. */}
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-4 pt-8">
          <div role="tablist" aria-label="Kind of project" className="flex gap-6">
            {KINDS.map(({ value, label }) => {
              const count = projects.filter((p) => value === 'All' || p.category === value).length
              const active = kind === value
              return (
                <button
                  key={value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setKind(value)
                    setTool(null)
                  }}
                  className={`border-b-2 pb-1.5 text-[1.0625rem] transition-colors focus:outline-none focus-visible:text-[var(--live)] ${
                    active
                      ? 'border-[var(--live)] text-[var(--ink)]'
                      : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
                  }`}
                  style={{ fontVariationSettings: active ? '"wdth" 104, "wght" 600' : '"wdth" 100, "wght" 450' }}
                >
                  {label}
                  <span className="u-figures ml-1.5 text-[0.75rem] text-[var(--ink-soft)]">{count}</span>
                </button>
              )
            })}
          </div>

          <label className="flex items-baseline gap-3 text-[0.875rem]">
            <span className="text-[var(--ink-soft)]">Built with</span>
            <select
              value={tool ?? ''}
              onChange={(e) => filterByTool(e.target.value || null)}
              className="border-b border-[var(--ink)] bg-transparent py-1 pr-1 text-[var(--ink)] focus:outline-none focus-visible:border-[var(--live)]"
            >
              <option value="">Anything</option>
              {tools.map(([name, n]) => (
                <option key={name} value={name}>
                  {name} ({n})
                </option>
              ))}
            </select>
          </label>
        </div>

        {tool && (
          <p className="pb-4 text-[0.875rem] text-[var(--ink-soft)]">
            Showing {visible.length} built with{' '}
            <span className="text-[var(--ink)]">{tool}</span>.{' '}
            <button
              type="button"
              onClick={() => setTool(null)}
              className="border-b border-[var(--live)] text-[var(--ink)] transition-colors hover:text-[var(--live)]"
            >
              Show all
            </button>
          </p>
        )}

        <ol id="project-index" className="border-t border-[var(--ink)]">
          {visible.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              open={openSlug === project.slug}
              onToggle={() => toggle(project)}
              onTool={filterByTool}
            />
          ))}
        </ol>

        {visible.length === 0 && (
          <p className="py-12 text-[var(--ink-soft)]">Nothing here with that combination.</p>
        )}
      </section>

      <HoverPreview />
    </>
  )
}

function ProjectRow({
  project,
  open,
  onToggle,
  onTool,
}: {
  project: Project
  open: boolean
  onToggle: () => void
  onTool: (tool: string) => void
}) {
  const panelId = `project-${project.slug}-panel`
  return (
    <li
      // Anchor for arriving from elsewhere; see useStageNavigation.
      id={`project-${project.slug}`}
      data-expanded={open ? 'true' : undefined}
      className="border-b border-[var(--rule-soft)]"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        data-preview={open ? undefined : project.imageUrl}
        className="group grid w-full grid-cols-[4rem_minmax(0,1fr)_1.25rem] items-center gap-x-4 py-5 text-left focus:outline-none md:grid-cols-[4.5rem_5.5rem_minmax(0,1fr)_13rem_5.5rem_1.25rem] md:gap-x-6"
      >
        {/* The year leads on wide screens, like the date column of a
            drawing register; phones start with the picture. */}
        <span className="u-figures hidden text-[0.8125rem] leading-tight text-[var(--ink-soft)] md:block">
          {project.year}
        </span>
        <span className="relative aspect-square w-16 overflow-hidden bg-[var(--plaster-deep)] md:w-[5.5rem]">
          <Image
            src={project.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 4rem, 5.5rem"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </span>

        <span className="min-w-0">
          {project.year && (
            <span className="u-figures mb-0.5 block text-[0.75rem] text-[var(--ink-soft)] md:hidden">
              {project.year}
            </span>
          )}
          <span
            className="block text-[clamp(1.125rem,2vw,1.375rem)] leading-tight transition-colors group-hover:text-[var(--live)] group-focus-visible:text-[var(--live)]"
            style={{ fontVariationSettings: '"wdth" 108, "wght" 620' }}
          >
            {project.title}
          </span>
          {!open && (
            // No `block` here: line-clamp sets its own display.
            <span className="mt-1 line-clamp-1 text-[0.9375rem] text-[var(--ink-soft)]">
              {project.description}
            </span>
          )}
        </span>

        <span className="hidden truncate text-[0.8125rem] text-[var(--ink-soft)] md:block">
          {project.tags.join(' · ')}
        </span>
        <span className="hidden text-[0.8125rem] text-[var(--ink-soft)] md:block">{project.category}</span>

        <span
          aria-hidden
          className={`justify-self-end text-[1.25rem] leading-none text-[var(--ink-soft)] transition-transform duration-200 group-hover:text-[var(--live)] ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>

      {open && (
        // Indented to the title column on wide screens: year and thumbnail
        // columns (4.5rem + 5.5rem) plus their gaps (2 × 1.5rem).
        <div id={panelId} role="region" aria-label={project.title} className="md:pl-[13rem]">
          <ProjectDetail project={project} onTool={onTool} />
        </div>
      )}
    </li>
  )
}

/**
 * A larger view of the row's picture under the pointer, floating beside the
 * cursor; the row itself only has room for a thumbnail.
 *
 * One element for the whole list, driven by delegated pointer events and a
 * transform, so nothing re-renders as the mouse moves. Only with a real
 * hovering pointer: on touch there is no hover, and the thumbnail is it.
 */
function HoverPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!canHover.matches) return
    const el = ref.current
    if (!el) return

    let x = 0
    let y = 0
    let raf = 0
    const place = () => {
      raf = 0
      // Right of the cursor, flipped left near the right edge.
      const w = el.offsetWidth
      const left = x + 28 + w > window.innerWidth ? x - 28 - w : x + 28
      el.style.transform = `translate3d(${left}px, ${y - el.offsetHeight / 2}px, 0)`
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x = e.clientX
      y = e.clientY
      const row = (e.target as Element | null)?.closest?.('[data-preview]')
      setSrc(row?.getAttribute('data-preview') ?? null)
      if (!raf) raf = requestAnimationFrame(place)
    }
    const onLeave = () => setSrc(null)
    // Clicking opens the row, which has no preview; hide it straight away
    // rather than on the next mouse move.
    const onDown = () => setSrc(null)
    // Scrolling moves rows under a still cursor; drop the picture rather
    // than show the wrong one.
    const onScroll = () => setSrc(null)

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-30 hidden w-72 transition-opacity duration-150 md:block"
      style={{ opacity: src ? 1 : 0 }}
    >
      <div className="relative aspect-[4/3] overflow-hidden border border-[var(--ink)] bg-[var(--plaster-deep)] shadow-[0_12px_30px_rgba(46,51,56,0.25)]">
        {src && <Image src={src} alt="" fill sizes="18rem" className="object-cover" />}
      </div>
    </div>
  )
}

function ProjectsLoading() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
      <h1 className="u-display text-[clamp(2.25rem,6vw,4rem)]">Projects</h1>
    </section>
  )
}

// useSearchParams needs a Suspense boundary above it.
export default function Projects() {
  return (
    <Suspense fallback={<ProjectsLoading />}>
      <ProjectsIndex />
    </Suspense>
  )
}
