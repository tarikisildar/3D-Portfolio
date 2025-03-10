'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, Loader, Environment } from '@react-three/drei'
import dynamic from 'next/dynamic'
import type { PageType } from '../three/DynamicRoomScene'

// Dynamically import the RoomScene component
const RoomScene = dynamic(
  () => import('../three/DynamicRoomScene').then(mod => mod.RoomScene),
  { ssr: false }
)

// Map routes to page types for the RoomScene component
const routeToPageType: Record<string, PageType> = {
  '/': 'home',
  '/about': 'about',
  '/projects': 'projects',
  '/cv': 'cv',
  '/blog': 'blog',
  '/404': 'notFound',
}

export default function Scene3D() {
  const pathname = usePathname()
  const [currentPage, setCurrentPage] = useState<PageType>('home')

  // Update the current page based on the pathname
  useEffect(() => {
    const pageType = routeToPageType[pathname] || 'home'
    setCurrentPage(pageType)
  }, [pathname])

  return (
    <>
      <div style={{ height: '50vh', position: 'relative' }}>
        <Canvas shadows dpr={[1, 2]}>
          <color attach="background" args={['#f0f0f0']} />

          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          <Environment preset="apartment" />
          <RoomScene page={currentPage} />

          <OrbitControls enableZoom={true} enablePan={false} />
          {process.env.NODE_ENV === 'development' && <Stats />}
        </Canvas>

        <Loader />
      </div>
    </>
  )
}