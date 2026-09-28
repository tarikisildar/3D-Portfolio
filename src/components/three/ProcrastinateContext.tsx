'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
import { trackProcrastinateAction } from '@/utils/analytics'

type ProcrastinateContextValue = {
  /** Whether procrastinate mode is on. */
  active: boolean
  /** Bumped by "Next Video"; VideoScreen steps through the playlist with it. */
  sequence: number
  /**
   * Turn it on. `actionType` and `location` are forwarded verbatim to the
   * existing procrastinate_action event, so the in-scene button and the
   * homepage card stay distinguishable in analytics as they were before.
   */
  start: (actionType: string, location: string) => void
  /** Turn it off. */
  exit: () => void
  /** Advance to the next clip. */
  nextVideo: () => void
}

const ProcrastinateContext = createContext<ProcrastinateContextValue | null>(null)

/**
 * Shares procrastinate mode between the 3D scene and ordinary page content.
 *
 * Both live under this provider, which is what lets the homepage card and the
 * in-scene button drive the same state directly.
 *
 * Previously there was no shared state at all: the buttons were built with
 * document.createElement and inline styles, then attached to a parent found by
 * matching on an inline style string. The homepage card triggered them by
 * locating the button with
 *
 *   document.querySelector('button[style*="background-color: rgb(255, 107, 107)"]')
 *
 * and clicking it — polling every 500ms indefinitely if it was not found yet.
 * Restyling the button silently broke the card.
 */
export function ProcrastinateProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false)
  const [sequence, setSequence] = useState(0)
  const pathname = usePathname()

  // Leaving the page drops you out of procrastinate mode.
  useEffect(() => {
    setActive(false)
  }, [pathname])

  const start = useCallback((actionType: string, location: string) => {
    trackProcrastinateAction(actionType, { location })
    setActive(true)
  }, [])

  const exit = useCallback(() => setActive(false), [])

  const nextVideo = useCallback(() => setSequence((n) => n + 1), [])

  const value = useMemo(
    () => ({ active, sequence, start, exit, nextVideo }),
    [active, sequence, start, exit, nextVideo]
  )

  return (
    <ProcrastinateContext.Provider value={value}>
      {children}
    </ProcrastinateContext.Provider>
  )
}

export function useProcrastinate(): ProcrastinateContextValue {
  const ctx = useContext(ProcrastinateContext)
  if (!ctx) {
    throw new Error('useProcrastinate must be used inside <ProcrastinateProvider>')
  }
  return ctx
}
