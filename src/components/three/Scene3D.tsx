'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'

// Import the RoomScene component as a normal import to avoid re-mounting
import { RoomScene } from './RoomScene'
import type { PageType } from './shots'
import { useProcrastinate } from './ProcrastinateContext'
import { MapTransition } from './MapTransition'
import { TravelSound } from './TravelSound'
import { useChapter } from './ChapterContext'
import { DrawingSheet, SheetHeading } from './DrawingSheet'
import { DEFAULT_CHAPTER_ID } from '@/data/chapters'

// Map paths to page types
const getPageTypeFromPath = (path: string): PageType => {
  if (path === '/') return 'home'
  if (path.startsWith('/about')) return 'about'
  if (path.startsWith('/projects')) return 'projects'
  if (path.startsWith('/cv')) return 'cv'
  if (path.startsWith('/blog')) return 'blog'
  return 'notFound'
}

export default function Scene3D() {
  const pathname = usePathname()
  // Initialize with the correct page type based on current path
  const [currentPage, setCurrentPage] = useState<PageType>(getPageTypeFromPath(pathname))
  // True while the camera is moving or a video is playing; drives the frameloop.
  const [busy, setBusy] = useState(false)
  const previousPathRef = useRef(pathname)
  const { active: procrastinating } = useProcrastinate()

  // IMPORTANT: Don't use a key on the Canvas to prevent complete re-creation
  // This ensures the camera animation works

  // Update the page based on route changes
  useEffect(() => {
    if (previousPathRef.current !== pathname) {

      // Store the new path
      previousPathRef.current = pathname

      // Get the page type for the new path
      const newPage = getPageTypeFromPath(pathname)

      setCurrentPage(newPage)
    }
  }, [pathname])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* CRITICAL: No key prop here - we want the Canvas to persist between route changes */}
      <Canvas
        shadows
        dpr={[1, 1.5]} // Reduced to save memory
        // The room is static the overwhelming majority of the time, so the loop
        // idles on "demand" and only runs while RoomScene reports something
        // moving. Driving this as a prop (rather than calling setFrameloop
        // imperatively from inside the Canvas) is deliberate: R3F re-applies
        // the prop on every re-render, so an imperative value would be silently
        // reverted the next time navigation re-rendered this component.
        frameloop={busy ? 'always' : 'demand'}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          // preserveDrawingBuffer forces a framebuffer copy every single frame
          // and is only needed to read pixels back (screenshots). Off.
        }}
      >
        {/* Same value as --plaster: the viewport and the page are one surface. */}
        <color attach="background" args={['#ede4d6']} />

        {/* Lighting lives in RoomScene: the key light's shadow frustum has to be
            sized to the room it is lighting, and rooms differ by a factor of
            three in extent. */}

        {/* Pass currentPage to RoomScene - this will trigger animation */}
        <Suspense fallback={null}>
          <RoomScene page={currentPage} onBusyChange={setBusy} />
        </Suspense>
        <SheetHeading />
      </Canvas>

      <DrawingSheet view={procrastinating ? 'procrastinate' : currentPage} />
      <RoomUnderConstruction />
      {/* The era selector now lives in the top bar. What is left here belongs
          to the room itself, clustered clear of the section rail — on a 390px
          screen the old row overflowed the viewport and pushed Procrastinate
          off-screen entirely. */}
      <div
        className="pointer-events-none absolute right-4 z-10 flex items-center gap-2"
        style={{ bottom: '1rem' }}
      >
        <TravelSound />
        <ProcrastinateControls page={currentPage} />
      </div>

      {/* Sits above the canvas and the controls: while travelling between
          chapters it is both the transition and the loading curtain. */}
      <MapTransition />

      <Loader />
    </div>
  )
}

/**
 * Stands in for the 3D view while a chapter's room is still being built.
 *
 * A chapter can exist on the timeline before its room does — the place and the
 * dates are real even if the model is not — so this says so plainly rather than
 * leaving an empty canvas that reads as a failed load.
 */
function RoomUnderConstruction() {
  const { chapter, pending } = useChapter()

  // Stay hidden mid-journey; the map is covering the canvas anyway, and this
  // appearing underneath would flash as the curtain lifts.
  if (chapter.model || pending) return null

  const [from, to] = chapter.period

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="px-6 text-center">
        <div
          className="mx-auto mb-4 h-px w-16"
          style={{ background: 'rgba(58,47,40,0.25)' }}
        />
        <p
          className="text-lg font-semibold sm:text-xl"
          style={{ color: '#3a2f28' }}
        >
          {chapter.city} is still under construction
        </p>
        <p className="mt-1 font-mono text-xs" style={{ color: '#6b5949' }}>
          {from}–{to ?? 'now'} · room not built yet
        </p>
      </div>
    </div>
  )
}

const controlClass =
  'pointer-events-auto rounded-full border border-[var(--rule-soft)] px-4 py-2 ' +
  'bg-[var(--veil-strong)] text-[0.8125rem] text-[var(--ink)] backdrop-blur-md ' +
  'transition-colors hover:bg-[var(--plaster-lift)] focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[var(--live)]'
const controlType = { fontVariationSettings: '"wdth" 100, "wght" 550' }

/**
 * The in-scene buttons, as ordinary DOM overlaying the canvas.
 *
 * There is always a way back from whatever the stage is showing, in the same
 * place: "Back to work" from a video, "Back home" from a section. Once you
 * have clicked into the CV on the table, the room itself offers no route back
 * to the overview; the rail does, but the rail is not where you are looking.
 *
 * These used to be built with document.createElement and ~150 lines of inline
 * style assignments, then attached to a parent located by matching an inline
 * style string. They are just buttons.
 */
function ProcrastinateControls({ page }: { page: PageType }) {
  const { active, start, exit, nextVideo } = useProcrastinate()
  const { chapter } = useChapter()
  const router = useRouter()

  // The video plays on a screen in the room, from this chapter's own playlist.
  // No room or no clips means there is nothing to procrastinate with.
  const canProcrastinate = Boolean(chapter.model && chapter.videos?.length)

  if (active) {
    return (
      <div className="flex gap-2">
        <button onClick={exit} className={controlClass} style={controlType}>
          Back to work
        </button>
        <button onClick={nextVideo} className={controlClass} style={controlType}>
          Next video
        </button>
      </div>
    )
  }

  const goHome = () =>
    router.push(chapter.id === DEFAULT_CHAPTER_ID ? '/' : `/?era=${chapter.id}`)

  return (
    <div className="flex gap-2">
      {page !== 'home' && (
        <button onClick={goHome} className={controlClass} style={controlType}>
          <span aria-hidden className="mr-1.5">&larr;</span>
          Back home
        </button>
      )}
      {canProcrastinate && (
        <button
          onClick={() => start('button_click', 'room_scene')}
          className={controlClass}
          style={controlType}
        >
          Procrastinate
        </button>
      )}
    </div>
  )
}
