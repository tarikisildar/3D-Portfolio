'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useChapter } from './ChapterContext'
import type { PageType } from './shots'

/**
 * The stage drawn as a sheet from an architect's set.
 *
 * The rooms are models of real flats, and the chrome around them borrows from
 * the drawings those flats would have been built from: crop marks at the
 * corners, a title block naming the sheet, and a north point. It turns the
 * hard bottom edge of the viewport into the edge of a sheet rather than the
 * edge of a widget.
 *
 * The north point is live. It turns as the camera does, so it keeps pointing
 * at the room's north while the view swings between shots.
 */

const VIEW_NAMES: Record<PageType, string> = {
  home: 'Overview',
  about: 'About',
  projects: 'Projects',
  cv: 'CV',
  blog: 'Blog',
  notFound: 'Nowhere',
  procrastinate: 'Screen',
}

/** CSS variable the north point reads its rotation from. */
const HEADING_VAR = '--sheet-heading'

export function DrawingSheet({ view }: { view: PageType }) {
  const { chapter, all } = useChapter()
  const [from, to] = chapter.period
  const sheet = all.findIndex((c) => c.id === chapter.id) + 1
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    // z-[5]: over the room, under the object markers (z 10–20), which have to
    // stay readable where they cross the title block.
    <div aria-hidden className="sheet pointer-events-none absolute inset-0 z-[5]">
      <span className="sheet__crop sheet__crop--tl" />
      <span className="sheet__crop sheet__crop--tr" />
      <span className="sheet__crop sheet__crop--bl" />
      <span className="sheet__crop sheet__crop--br" />

      <div className="sheet__north">
        <svg viewBox="0 0 40 40" width="40" height="40">
          <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
          <g className="sheet__needle">
            <path d="M20 7 L25 24 L20 21 L15 24 Z" fill="currentColor" />
            <text x="20" y="4.5" textAnchor="middle" fontSize="6.5" fill="currentColor">
              N
            </text>
          </g>
        </svg>
      </div>

      <dl className="sheet__block">
        <div className="sheet__cell sheet__cell--sheet">
          <dt>Sheet</dt>
          <dd className="u-figures">
            {pad(sheet)}
            <span className="sheet__of">/{pad(all.length)}</span>
          </dd>
        </div>
        <div className="sheet__cell">
          <dt>Place</dt>
          <dd className="sheet__place">{chapter.city}</dd>
        </div>
        <div className="sheet__cell sheet__cell--wide">
          <dt>Years</dt>
          <dd className="u-figures">
            {from}&ndash;{to ?? 'now'}
          </dd>
        </div>
        <div className="sheet__cell sheet__cell--wide">
          <dt>View</dt>
          <dd>{VIEW_NAMES[view]}</dd>
        </div>
      </dl>
    </div>
  )
}

const forward = new THREE.Vector3()

/**
 * Lives inside the Canvas and publishes the camera's compass heading as a CSS
 * variable, which the north point outside the Canvas rotates by.
 *
 * World -Z is taken as north. Writes only when the heading actually changes,
 * and only runs on rendered frames, so an idle room costs nothing.
 */
export function SheetHeading() {
  const last = useRef<number | null>(null)

  useFrame(({ camera }) => {
    camera.getWorldDirection(forward)
    // Looking straight down there is no meaningful horizontal heading; keep
    // the previous one rather than letting the needle spin.
    if (Math.hypot(forward.x, forward.z) < 1e-3) return
    const heading = THREE.MathUtils.radToDeg(Math.atan2(forward.x, -forward.z))
    if (last.current !== null && Math.abs(heading - last.current) < 0.1) return
    last.current = heading
    // Facing east puts north on your left, so the needle turns the opposite
    // way to the camera.
    document.documentElement.style.setProperty(HEADING_VAR, `${-heading}deg`)
  })

  return null
}
