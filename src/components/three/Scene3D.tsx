'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Canvas, useFrame } from '@react-three/fiber'
import { Loader, OrbitControls } from '@react-three/drei'

// Import the RoomScene component as a normal import to avoid re-mounting
const RoomScene = dynamic(
  () => import('./RoomScene').then(mod => ({ default: mod.RoomScene })),
  { ssr: false }
)

// Define page types that match RoomScene's expected types
type PageType = 'home' | 'about' | 'projects' | 'cv' | 'blog' | 'notFound'

// Map routes to page types
const routeToPage: Record<string, PageType> = {
  '/': 'home',
  '/about': 'about',
  '/projects': 'projects',
  '/cv': 'cv',
  '/blog': 'blog'
}

// Helper function to determine page type from pathname
const getPageTypeFromPath = (path: string): PageType => {
  // Exact route match
  if (routeToPage[path]) {
    return routeToPage[path];
  }
  // Check if path starts with /blog/ (for blog posts)
  else if (path.startsWith('/blog/')) {
    return 'blog';
  }
  // Fallback
  else {
    return 'notFound';
  }
};

// Keep rendering for a few seconds to ensure animations complete
function ForceRender() {
  const frameCount = useRef(0)
  const maxFrames = 180 // About 3 seconds at 60fps

  useFrame(() => {
    if (frameCount.current < maxFrames) {
      frameCount.current++

      // Log progress periodically
      if (frameCount.current === 1 ||
          frameCount.current === 60 ||
          frameCount.current === 120 ||
          frameCount.current === maxFrames) {
        console.log(`ForceRender: Frame ${frameCount.current}/${maxFrames}`)
      }
    }
  })

  return null
}

export default function Scene3D() {
  const pathname = usePathname()
  // Initialize with the correct page type based on current path
  const [currentPage, setCurrentPage] = useState<PageType>(getPageTypeFromPath(pathname))
  const previousPathRef = useRef(pathname)
  // Add debug mode state
  const [debugMode, setDebugMode] = useState(false)

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
      {/* Debug mode toggle button */}
      <button
        onClick={() => setDebugMode(!debugMode)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '8px 12px',
          backgroundColor: debugMode ? '#ff5555' : '#555555',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {debugMode ? 'Exit Debug Mode' : 'Debug Mode'}
      </button>

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
        <color attach="background" args={['#f0f0f0']} />

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
          <RoomScene page={currentPage} debugMode={debugMode} />
          {/* Add OrbitControls when in debug mode */}
          {debugMode && <OrbitControls />}
        </Suspense>
      </Canvas>

      <Loader />
    </div>
  )
}