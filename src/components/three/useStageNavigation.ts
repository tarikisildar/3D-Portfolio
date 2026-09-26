'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { whenStageSettles } from './stageStatus'

/**
 * Navigate in a way that shows the room doing it.
 *
 * Clicking something far down the page used to swap the content underneath
 * you while the camera moved on a stage you had scrolled away from, so the
 * one piece of the site that explains where you are going happened off
 * screen. This plays it as a sequence instead:
 *
 *   1. lock scrolling, so a stray wheel does not fight the choreography
 *   2. glide up to the stage
 *   3. navigate, and watch the camera fly to the new section's shot
 *   4. once it lands, glide down to what was clicked
 *
 * `focus` is an element id, or a function returning the element to settle on
 * (it is polled for, since the destination page renders after navigating).
 * With reduced motion it navigates and jumps straight to the target.
 */

type Focus = string | (() => Element | null)

const SCROLL_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar',
])

function lockScroll() {
  const block = (e: Event) => e.preventDefault()
  const blockKeys = (e: KeyboardEvent) => {
    if (SCROLL_KEYS.has(e.key)) e.preventDefault()
  }
  const options = { passive: false, capture: true } as const
  window.addEventListener('wheel', block, options)
  window.addEventListener('touchmove', block, options)
  window.addEventListener('keydown', blockKeys, options)
  document.documentElement.dataset.travelling = 'true'
  return () => {
    window.removeEventListener('wheel', block, options)
    window.removeEventListener('touchmove', block, options)
    window.removeEventListener('keydown', blockKeys, options)
    delete document.documentElement.dataset.travelling
  }
}

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Smooth-scroll and resolve when it arrives (or gives up after `max` ms). */
async function glideTo(top: number, max = 1500) {
  const target = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight))
  window.scrollTo({ top: target, behavior: 'smooth' })
  const start = performance.now()
  let last = -1
  let still = 0
  while (performance.now() - start < max) {
    await frame()
    const y = window.scrollY
    if (Math.abs(y - target) < 2) return
    // Some browsers stop short when layout shifts mid-scroll; treat a scroll
    // that has stopped moving as arrived rather than waiting out `max`.
    still = y === last ? still + 1 : 0
    if (still > 8) return
    last = y
  }
}

async function findFocus(focus: Focus, within = 2500) {
  const get = typeof focus === 'string' ? () => document.getElementById(focus) : focus
  const start = performance.now()
  while (performance.now() - start < within) {
    const el = get()
    if (el) return el
    await frame()
  }
  return null
}

/** Where to scroll so `el` sits just under the top bar (--bar-h, in rem). */
function topFor(el: Element) {
  const root = getComputedStyle(document.documentElement)
  const bar = parseFloat(root.getPropertyValue('--bar-h')) * parseFloat(root.fontSize) || 52
  return el.getBoundingClientRect().top + window.scrollY - bar - 16
}

let inFlight = false

export function useStageNavigation() {
  const router = useRouter()

  return useCallback(
    async (href: string, focus?: Focus) => {
      if (inFlight) return
      inFlight = true

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const unlock = lockScroll()
      try {
        if (reduced) {
          router.push(href)
          if (focus) {
            const el = await findFocus(focus)
            if (el) window.scrollTo({ top: topFor(el) })
          }
          return
        }

        await glideTo(0)
        router.push(href, { scroll: false })
        await whenStageSettles()
        // A beat on the arrival before leaving it, or the landing reads as
        // a bounce.
        await sleep(250)

        if (focus) {
          const el = await findFocus(focus)
          if (el) await glideTo(topFor(el))
        }
      } finally {
        unlock()
        inFlight = false
      }
    },
    [router]
  )
}
