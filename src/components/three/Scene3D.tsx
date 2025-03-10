'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Canvas, useFrame } from '@react-three/fiber'
import { Loader } from '@react-three/drei'

// Import the RoomScene component as a normal import to avoid re-mounting
import { RoomScene } from './RoomScene'

// Map paths to page types to handle route changes
type PageType = 'home' | 'about' | 'projects' | 'cv' | 'blog' | 'notFound' | 'procrastinate'

// Map paths to page types
const getPageTypeFromPath = (path: string): PageType => {
  if (path === '/') return 'home'
  if (path.startsWith('/about')) return 'about'
  if (path.startsWith('/projects')) return 'projects'
  if (path.startsWith('/cv')) return 'cv'
  if (path.startsWith('/blog')) return 'blog'
  return 'notFound'
}

// Helper component to ensure we render frames even when "nothing" is happening
// This is important for smooth animation transitions
function ForceRender() {
  useFrame(() => {
    // This empty useFrame hook forces rendering
  })
  return null
}

export default function Scene3D() {
  const pathname = usePathname()
  // Initialize with the correct page type based on current path
  const [currentPage, setCurrentPage] = useState<PageType>(getPageTypeFromPath(pathname))
  const previousPathRef = useRef(pathname)

  // IMPORTANT: Don't use a key on the Canvas to prevent complete re-creation
  // This ensures the camera animation works

  // Update the page based on route changes
  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      console.log(`Scene3D: 🔄 Route changed from ${previousPathRef.current} to ${pathname}`)

      // Store the new path
      previousPathRef.current = pathname

      // Get the page type for the new path
      const newPage = getPageTypeFromPath(pathname)

      console.log(`Scene3D: Updating to page type: ${newPage}`)
      setCurrentPage(newPage)
    }
  }, [pathname])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* CRITICAL: No key prop here - we want the Canvas to persist between route changes */}
      <Canvas
        shadows
        dpr={[1, 1.5]} // Reduced to save memory
        frameloop="always" // Always render to ensure animations work
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'default',
          preserveDrawingBuffer: true, // More stable
        }}
      >
        <color attach="background" args={['#f5e5d3']} />

        {/* Basic lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 10, 5]}
          intensity={1}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Force render frames */}
        <ForceRender />

        {/* Pass currentPage to RoomScene - this will trigger animation */}
        <Suspense fallback={null}>
          <RoomScene page={currentPage} />
        </Suspense>
      </Canvas>

      <Loader />
    </div>
  )
}