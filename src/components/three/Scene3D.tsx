'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'

// Import the RoomScene component as a normal import to avoid re-mounting
import { RoomScene } from './RoomScene'
import type { PageType } from './shots'
import { useProcrastinate } from './ProcrastinateContext'
import { ChapterTimeline } from './ChapterTimeline'
import { MapTransition } from './MapTransition'

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
        <color attach="background" args={['#f5e5d3']} />

        {/* The only lighting in the scene. Ambient is kept low enough that the
            directional light still does the shading work and the room reads as
            having form. */}
        <ambientLight intensity={0.75} />
        <directionalLight
          castShadow
          position={[10, 10, 5]}
          intensity={1.7}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Pass currentPage to RoomScene - this will trigger animation */}
        <Suspense fallback={null}>
          <RoomScene page={currentPage} onBusyChange={setBusy} />
        </Suspense>
      </Canvas>

      <ProcrastinateControls />
      <ChapterTimeline />

      {/* Sits above the canvas and the controls: while travelling between
          chapters it is both the transition and the loading curtain. */}
      <MapTransition />

      <Loader />
    </div>
  )
}

/**
 * The in-scene buttons, as ordinary DOM overlaying the canvas.
 *
 * These used to be built with document.createElement and ~150 lines of inline
 * style assignments, then attached to a parent located by matching an inline
 * style string. They are just buttons.
 */
function ProcrastinateControls() {
  const { active, start, exit, nextVideo } = useProcrastinate()

  const base =
    'px-4 py-2 rounded-md text-white text-sm font-semibold shadow-md transition-all ' +
    'hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-white/70'

  return (
    <div className="absolute bottom-5 right-5 z-10 flex gap-2.5">
      {active ? (
        <>
          <button onClick={exit} className={`${base} bg-red-500 hover:bg-red-400`}>
            Exit
          </button>
          <button
            onClick={nextVideo}
            className={`${base} bg-green-600 hover:bg-green-500`}
          >
            Next Video
          </button>
        </>
      ) : (
        <button
          onClick={() => start('button_click', 'room_scene')}
          className={`${base} bg-[#ff6b6b] hover:bg-[#ff8787]`}
        >
          Procrastinate
        </button>
      )}
    </div>
  )
}