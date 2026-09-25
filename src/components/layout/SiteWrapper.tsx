'use client'

import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Footer from '@/components/ui/Footer'
import { TopBar } from '@/components/layout/TopBar'
import { SectionRail } from '@/components/layout/SectionRail'
import { ModelProvider } from '@/components/three/ModelContext'
import { ProcrastinateProvider } from '@/components/three/ProcrastinateContext'
import { ChapterProvider } from '@/components/three/ChapterContext'

// Dynamically import the 3D scene component with no SSR
const Scene3D = dynamic(() => import('../three/Scene3D'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[var(--plaster)]" />,
})

interface SiteWrapperProps {
  children: ReactNode
}

/**
 * The room is the page, not a banner on it.
 *
 * The 3D viewport is fixed behind everything and fills the screen; the content
 * scrolls over it, starting one screen down so the room is what you land on.
 * Previously it was a 50vh strip pinned above a near-black page, which made the
 * most distinctive thing on the site look like a decorative header — and left
 * the join between warm room and dark page reading as a rendering fault.
 *
 * Chrome is two thin bars with the viewport between them: when you are in, up
 * top; where in the room you are looking, along the bottom.
 */
export default function SiteWrapper({ children }: SiteWrapperProps) {
  return (
    <ProcrastinateProvider>
      {/* ChapterProvider is outside ModelProvider because which room gets
          loaded is a function of which chapter is active. */}
      <ChapterProvider>
        <ModelProvider>
          {/* The viewport. Fixed, full-bleed, and behind the content. */}
          <div
            className="fixed inset-x-0 top-0 z-0 overflow-hidden bg-[var(--plaster)]"
            style={{ height: 'var(--stage-h)' }}
          >
            <Scene3D />
          </div>

          <TopBar />

          {/* Reserves the stage, so the content begins exactly where the room
              ends. The intro then sits on screen from the moment the page
              opens rather than waiting behind a scroll. */}
          <div
            className="pointer-events-none relative z-10"
            aria-hidden
            style={{ height: 'var(--stage-h)' }}
          />

          {/* Everything below scrolls up over the room. */}
          <main
            id="content"
            className="relative z-10 bg-[var(--plaster)]"
            style={{ paddingBottom: 'calc(var(--rail-h) + env(safe-area-inset-bottom))' }}
          >
            {children}
            <Footer />
          </main>

          <SectionRail />
        </ModelProvider>
      </ChapterProvider>
    </ProcrastinateProvider>
  )
}
