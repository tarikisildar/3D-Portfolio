import * as THREE from 'three'
import type { PageType, Shot } from './shots'

/**
 * A clickable object in the room: the monitors are the projects, the paperwork
 * is the CV, the screen is procrastination. Drawn as a marker over the 3D view
 * so the room stops being scenery and becomes the thing you navigate with.
 */
export type Hotspot = {
  /** Where the marker sits, in world space. */
  position: THREE.Vector3
  target: HotspotTarget
  label: string
}

export type HotspotTarget =
  | { kind: 'section'; section: PageType; href: string }
  | { kind: 'procrastinate' }

const SECTION_TARGETS: Partial<Record<PageType, { href: string; label: string }>> = {
  about: { href: '/about', label: 'About me' },
  projects: { href: '/projects', label: 'Projects' },
  cv: { href: '/cv', label: 'CV' },
  blog: { href: '/blog', label: 'Blog' },
}

const PROCRASTINATE_LABEL = 'Procrastinate'

type Sources = {
  /**
   * Shots that were composed by hand — authored `shot_*` cameras or a chapter's
   * own fallback table. Auto-framed shots must not be passed: they look at the
   * middle of the bounding box, not at anything in particular.
   */
  composedShots: Partial<Record<PageType, Shot>>
  /** Sections this chapter offers; markers for anything else are dropped. */
  sections: PageType[]
  /** World-space position of the procrastinate screen, if the room has one. */
  screenPosition?: THREE.Vector3
}

/**
 * Work out where each marker goes, in order of preference:
 *
 *  1. A `hotspot_<section>` empty placed in Blender. Exact, and it wins.
 *  2. For procrastinate, the screen the video already plays on.
 *  3. Otherwise, whatever the section's camera is looking at. Every section
 *     already has a shot framed on its object — `shot_cv` looks down at the
 *     clipboard, `shot_projects` at the monitors — so a ray from that camera
 *     through the centre of its frame lands on the thing the section is about.
 *     That makes every room clickable the day it gets cameras, with no extra
 *     authoring.
 *
 * `root` must already be positioned in the scene, so positions come back in
 * world space with the chapter transform applied.
 */
export function extractHotspots(root: THREE.Object3D, sources: Sources): Hotspot[] {
  root.updateMatrixWorld(true)

  const authored = new Map<string, THREE.Vector3>()
  root.traverse((obj) => {
    if (!obj.name.startsWith('hotspot_')) return
    const key = obj.name.slice('hotspot_'.length).toLowerCase()
    if (!authored.has(key)) authored.set(key, obj.getWorldPosition(new THREE.Vector3()))
  })

  const hotspots: Hotspot[] = []

  for (const section of sources.sections) {
    const meta = SECTION_TARGETS[section]
    if (!meta) continue

    const position =
      authored.get(section) ?? lookedAt(root, sources.composedShots[section])
    if (!position) continue

    hotspots.push({
      position,
      target: { kind: 'section', section, href: meta.href },
      label: meta.label,
    })
  }

  const screen =
    authored.get('procrastinate') ??
    sources.screenPosition ??
    lookedAt(root, sources.composedShots.procrastinate)
  if (screen) {
    hotspots.push({
      position: screen,
      target: { kind: 'procrastinate' },
      label: PROCRASTINATE_LABEL,
    })
  }

  return hotspots
}

const raycaster = new THREE.Raycaster()
const FORWARD = new THREE.Vector3(0, 0, -1)

/** First surface under the centre of a shot's frame, nudged back toward the lens. */
function lookedAt(root: THREE.Object3D, shot: Shot | undefined): THREE.Vector3 | null {
  if (!shot) return null

  const direction = FORWARD.clone().applyQuaternion(shot.quaternion)
  raycaster.set(shot.position, direction)
  raycaster.near = 0.05
  raycaster.far = 60

  const hit = raycaster.intersectObject(root, true)[0]
  if (!hit) return null

  // Sit just proud of the surface, so the marker is not buried in it when
  // occlusion is tested from other angles.
  return hit.point.clone().addScaledVector(direction, -Math.min(0.12, hit.distance * 0.04))
}
