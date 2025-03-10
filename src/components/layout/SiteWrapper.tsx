'use client'

import { ReactNode } from 'react'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import dynamic from 'next/dynamic'
import { ModelProvider } from '@/components/three/ModelContext'

// Dynamically import the 3D scene component with no SSR
const Scene3D = dynamic(
  () => import('../three/Scene3D'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '50vh',
          position: 'relative',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}
      >
        Loading 3D scene...
      </div>
    )
  }
)

interface SiteWrapperProps {
  children: ReactNode
}

export default function SiteWrapper({ children }: SiteWrapperProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* 3D Scene as a regular part of the page flow */}
      <div style={{ height: '50vh', width: '100%' }}>
        <ModelProvider>
          <Scene3D />
        </ModelProvider>
      </div>

      <main className="flex-grow container mx-auto px-4 pt-6 pb-12">
        {children}
      </main>

      <Footer />
    </div>
  )
}