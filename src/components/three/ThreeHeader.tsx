'use client'

import { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { ModelProvider } from './ModelContext'

interface ThreeHeaderProps {
  children: ReactNode;
  showControls?: boolean;
  height?: string;
}

export default function ThreeHeader({
  children,
  showControls = true,
  height = '40vh'
}: ThreeHeaderProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ModelProvider>
        <Canvas className="w-full h-full" dpr={[1, 2]} shadows>
          <color attach="background" args={['#f0f0f0']} />

          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          {/* Scene content passed as children */}
          {children}

          {showControls && <OrbitControls enableZoom={true} enablePan={false} />}
          {process.env.NODE_ENV === 'development' && <Stats />}
        </Canvas>
      </ModelProvider>
    </div>
  )
}