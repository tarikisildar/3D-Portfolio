'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useProcrastinate } from './ProcrastinateContext'
import { useChapter } from './ChapterContext'
import { DEFAULT_CHAPTER_ID } from '@/data/chapters'
import type { Hotspot } from './hotspots'

/**
 * Markers on the objects in the room you can actually use.
 *
 * This is the piece that makes the room an interface rather than a picture of
 * one. The bottom rail says the sections exist; these say *the monitors are
 * the projects* and *that paperwork is the CV*, which is the thing people were
 * not getting.
 *
 * Deliberately not a neon game HUD: a small ring in the room's own ink with a
 * plaster tag above it. The tag is always shown, because an unlabelled dot is
 * exactly the kind of mystery control people were bouncing off.
 *
 * A marker whose tag would be cut off by the edge of the stage is hidden
 * rather than shown half-clipped. The narrow phone framing pushes some objects
 * off-frame entirely; the bottom rail still reaches those sections.
 */

const projected = new THREE.Vector3()

type HotspotsProps = {
  hotspots: Hotspot[]
  /** Section currently being viewed; its own marker is redundant. */
  currentSection: string
}

export function HotspotMarkers({ hotspots, currentSection }: HotspotsProps) {
  const router = useRouter()
  const { start } = useProcrastinate()
  const { chapter } = useChapter()
  const buttons = useRef(new Map<string, HTMLButtonElement>())

  // Runs on every rendered frame, which with frameloop="demand" means exactly
  // when the camera moves or the canvas resizes, the only times this changes.
  useFrame(({ camera, size }) => {
    for (const hotspot of hotspots) {
      const button = buttons.current.get(keyOf(hotspot))
      if (!button) continue
      projected.copy(hotspot.position).project(camera)
      const x = ((projected.x + 1) / 2) * size.width
      const y = ((1 - projected.y) / 2) * size.height
      const half = button.offsetWidth / 2
      const fits =
        x - half >= 4 &&
        x + half <= size.width - 4 &&
        y - button.offsetHeight >= 4 &&
        y <= size.height - 4
      button.style.visibility = fits ? '' : 'hidden'
    }
  })

  if (hotspots.length === 0) return null

  return (
    <>
      {hotspots.map((hotspot) => {
        if (
          hotspot.target.kind === 'section' &&
          hotspot.target.section === currentSection
        ) {
          return null
        }

        const key = keyOf(hotspot)

        const activate = () => {
          if (hotspot.target.kind === 'procrastinate') {
            start('hotspot_click', 'room_hotspot')
            return
          }
          const href =
            chapter.id === DEFAULT_CHAPTER_ID
              ? hotspot.target.href
              : `${hotspot.target.href}?era=${chapter.id}`
          router.push(href)
        }

        return (
          <Html
            key={key}
            position={hotspot.position}
            center
            // Markers belong to the UI, not the scene: constant screen size,
            // and drawn over the room rather than scaled into it.
            zIndexRange={[20, 10]}
          >
            <button
              ref={(el) => {
                if (el) buttons.current.set(key, el)
                else buttons.current.delete(key)
              }}
              onClick={activate}
              // Hover driven by the marker's own pointer events as well as
              // CSS :hover; see the note on .hotspot[data-hover].
              onPointerEnter={(e) => {
                if (e.pointerType !== 'touch') e.currentTarget.dataset.hover = ''
              }}
              onPointerLeave={(e) => {
                delete e.currentTarget.dataset.hover
              }}
              aria-label={hotspot.label}
              className="hotspot group"
              type="button"
            >
              <span className="hotspot__label">{hotspot.label}</span>
              <span aria-hidden className="hotspot__stem" />
              <span aria-hidden className="hotspot__ring" />
            </button>
          </Html>
        )
      })}
    </>
  )
}

function keyOf(hotspot: Hotspot) {
  return hotspot.target.kind === 'procrastinate'
    ? 'procrastinate'
    : hotspot.target.section
}
