'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { Shot } from './shots'

/** Seconds of travel, before the distance term. */
const BASE_DURATION = 1.1
/** Extra seconds per world-unit travelled, so big moves are not rushed. */
const SECONDS_PER_UNIT = 0.16
const MAX_DURATION = 3.4

/**
 * Below this, a move is a small reframe within one area and should go straight
 * there. Above it, the camera is crossing the space and gets lifted into an arc.
 */
const ARC_MIN_DISTANCE = 2.5
const ARC_RATIO = 0.22
const MAX_ARC_HEIGHT = 2.2

/** Smootherstep: zero velocity *and* zero acceleration at both ends. */
function ease(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * Aspect the shots were framed at. Blender renders 16:9 by default and the
 * cameras were composed looking through Numpad0, so that is what the framing
 * was judged against.
 */
const AUTHORED_ASPECT = 16 / 9

/**
 * Vertical field of view is the wrong thing to hold constant.
 *
 * three's `fov` is vertical, so on a tall phone a shot authored for a wide
 * viewport keeps its vertical extent and loses width — you end up looking at
 * carpet with the furniture cropped off either side. Holding the *horizontal*
 * field instead preserves the composition the room was actually framed with.
 *
 * Clamped, because a strict horizontal lock on a tall viewport solves to well
 * over 100 degrees, which is both a fisheye and — with these dollhouse rooms —
 * mostly empty background above the half-height walls. Past the clamp the shot
 * is allowed to crop rather than distort.
 */
const MAX_ADAPTED_FOV = 62

function fovForAspect(authoredFov: number, aspect: number): number {
  if (!aspect || !Number.isFinite(aspect)) return authoredFov
  const halfWidth = Math.tan((authoredFov * Math.PI) / 360) * AUTHORED_ASPECT
  const adapted = (Math.atan(halfWidth / aspect) * 360) / Math.PI
  // Never *narrower* than authored: on wide screens the shot stays as framed.
  return Math.min(Math.max(adapted, authoredFov), MAX_ADAPTED_FOV)
}

/**
 * Frames can be far apart when the render loop is idling on demand, so a raw
 * delta after a long pause would consume an entire move in one step. Clamp to
 * roughly two frames at 30fps.
 */
const MAX_DELTA = 1 / 15

type CameraRigProps = {
  /** Where the camera should end up. Changing this starts a new move. */
  shot: Shot
  /**
   * Jump straight to the shot instead of animating. Used for the very first
   * frame, so visitors do not watch the camera fly in from nowhere.
   */
  immediate?: boolean
  /**
   * Reports whether a move is in flight, so the parent can hold the render
   * loop open for the duration.
   */
  onMovingChange?: (moving: boolean) => void
}

/**
 * Drives the scene camera between shots.
 *
 * Two things this does that the previous implementation did not:
 *
 *  - Slerps rotation instead of lerping a look-at point, so turns happen at a
 *    constant angular rate rather than whipping through the middle.
 *  - Lifts long moves into a vertical arc. Rooms are modelled dollhouse-style
 *    with half-height walls, so a straight line between two shots on opposite
 *    sides of an apartment would plough through the furniture and the dividing
 *    walls. Rising over the top reads as intentional, and is the same move the
 *    map transition will use between cities.
 *
 * All animation state is in refs. The old version kept it in module-level
 * mutable singletons, which survived hot reloads incorrectly and double-applied
 * under StrictMode's double mount.
 */
export function CameraRig({ shot, immediate = false, onMovingChange }: CameraRigProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const invalidate = useThree((s) => s.invalidate)
  // Shots are adapted to the viewport's real shape; see fovForAspect.
  const aspect = useThree((s) => s.size.width / s.size.height)

  // Keep the latest callback in a ref so starting a move does not depend on the
  // parent memoising it.
  const notify = useRef(onMovingChange)
  notify.current = onMovingChange

  // Animation state.
  const elapsed = useRef(0)
  const duration = useRef(0)
  const animating = useRef(false)
  /** World-space height the arc should peak at, or null for a straight move. */
  const apexY = useRef<number | null>(null)

  const from = useRef({
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    fov: 45,
  })
  const to = useRef<Shot | null>(null)

  // Scratch objects, reused every frame so the loop allocates nothing.
  const scratchPos = useRef(new THREE.Vector3())
  const scratchMid = useRef(new THREE.Vector3())

  useEffect(() => {
    const camera = cameraRef.current
    if (!camera) return

    const isFirstPlacement = immediate || to.current === null

    if (isFirstPlacement) {
      camera.position.copy(shot.position)
      camera.quaternion.copy(shot.quaternion)
      camera.fov = fovForAspect(shot.fov, aspect)
      camera.updateProjectionMatrix()
      to.current = shot
      animating.current = false
      invalidate()
      return
    }

    // Start from wherever the camera actually is, so interrupting a move
    // mid-flight continues smoothly instead of snapping.
    from.current.position.copy(camera.position)
    from.current.quaternion.copy(camera.quaternion)
    from.current.fov = camera.fov

    const distance = from.current.position.distanceTo(shot.position)

    // Arc on ground-plane travel only: a purely vertical reframe needs no lift.
    const horizontal = Math.hypot(
      shot.position.x - from.current.position.x,
      shot.position.z - from.current.position.z
    )

    // An absolute apex, not an offset from the midpoint. Interrupting a move
    // leaves the camera high up mid-arc, and measuring from the midpoint would
    // make the next arc peak higher still — so repeatedly changing page during
    // a transition used to walk the camera up and away from the room.
    apexY.current =
      horizontal > ARC_MIN_DISTANCE
        ? Math.max(from.current.position.y, shot.position.y) +
          Math.min(horizontal * ARC_RATIO, MAX_ARC_HEIGHT)
        : null

    duration.current = Math.min(
      BASE_DURATION + distance * SECONDS_PER_UNIT,
      MAX_DURATION
    )
    elapsed.current = 0
    to.current = shot
    animating.current = true
    notify.current?.(true)
    invalidate()
  }, [shot, immediate, invalidate, aspect])

  // Make sure the render loop is not left pinned open if we unmount mid-move.
  useEffect(() => () => notify.current?.(false), [])

  useFrame((_, delta) => {
    const camera = cameraRef.current
    const target = to.current
    if (!camera || !target || !animating.current) return

    elapsed.current += Math.min(delta, MAX_DELTA)
    const raw = Math.min(elapsed.current / duration.current, 1)
    const t = ease(raw)

    if (apexY.current !== null) {
      const p0 = from.current.position
      const p1 = target.position
      // A quadratic Bezier peaks at (P0 + 2C + P1) / 4, so solve for the
      // control point that makes the curve actually reach apexY.
      const control = scratchMid.current.set(
        (p0.x + p1.x) / 2,
        (4 * apexY.current - p0.y - p1.y) / 2,
        (p0.z + p1.z) / 2
      )

      const inv = 1 - t
      scratchPos.current
        .copy(p0)
        .multiplyScalar(inv * inv)
        .addScaledVector(control, 2 * inv * t)
        .addScaledVector(p1, t * t)
      camera.position.copy(scratchPos.current)
    } else {
      camera.position.lerpVectors(from.current.position, target.position, t)
    }

    camera.quaternion.slerpQuaternions(from.current.quaternion, target.quaternion, t)
    const targetFov = fovForAspect(target.fov, aspect)
    camera.fov = from.current.fov + (targetFov - from.current.fov) * t
    camera.updateProjectionMatrix()

    if (raw >= 1) {
      // Land exactly on the shot rather than wherever easing left us.
      camera.position.copy(target.position)
      camera.quaternion.copy(target.quaternion)
      camera.fov = fovForAspect(target.fov, aspect)
      camera.updateProjectionMatrix()
      animating.current = false
      notify.current?.(false)
    }
  })

  return (
    <PerspectiveCamera ref={cameraRef} makeDefault fov={45} near={0.1} far={100} />
  )
}
