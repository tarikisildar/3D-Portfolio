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

/**
 * Scroll drift: while the page scrolls up over the stage, the camera orbits a
 * few degrees around what it is looking at and eases in a touch. Small enough
 * that the shot still reads as the same shot; enough that the furniture shifts
 * against the walls behind it, which is what tells you this is a space and
 * not a picture of one.
 */
const DRIFT_YAW = THREE.MathUtils.degToRad(6)
/** Fraction of the distance to the subject closed at full drift. */
const DRIFT_DOLLY = 0.08
/** Used when the centre ray hits nothing, e.g. a shot looking out a window. */
const DRIFT_FALLBACK_DISTANCE = 5
/** How quickly the camera catches up with the scroll position, per second. */
const DRIFT_DAMPING = 6

const WORLD_UP = new THREE.Vector3(0, 1, 0)

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
  const scene = useThree((s) => s.scene)
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

  // The pose the shot animation produces, before scroll drift is layered on
  // top. Kept apart from the camera so a move interrupted while scrolled
  // starts from the shot path, not from the drifted view.
  const base = useRef({
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
  })
  /** Scroll progress through the stage, 0..1: where it is and where it is headed. */
  const drift = useRef(0)
  const driftTarget = useRef(0)
  /** Distance from the shot's camera to the thing at the centre of frame. */
  const pivotDistance = useRef(DRIFT_FALLBACK_DISTANCE)

  // Scratch objects, reused every frame so the loop allocates nothing.
  const scratchPos = useRef(new THREE.Vector3())
  const scratchMid = useRef(new THREE.Vector3())
  const scratchPivot = useRef(new THREE.Vector3())
  const scratchYaw = useRef(new THREE.Quaternion())

  // Scroll only sets a target; the frame loop eases towards it, so a flick of
  // the wheel reads as a glide rather than a jolt.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      if (reduced.matches) {
        driftTarget.current = 0
      } else {
        // The stage is fixed and the content scrolls over it, so it is fully
        // covered after one stage height; drift across exactly that span.
        const stage = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--stage-h')
        )
        const stagePx = ((Number.isFinite(stage) ? stage : 60) / 100) * window.innerHeight
        driftTarget.current = THREE.MathUtils.clamp(window.scrollY / stagePx, 0, 1)
      }
      invalidate()
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    reduced.addEventListener('change', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      reduced.removeEventListener('change', update)
    }
  }, [invalidate])

  // Orbit around what the shot is framed on, found by looking down the centre
  // of the lens. Rooms differ threefold in size, so a fixed pivot distance
  // would swing a small room wildly and barely move a large one.
  useEffect(() => {
    const raycaster = new THREE.Raycaster(
      shot.position,
      new THREE.Vector3(0, 0, -1).applyQuaternion(shot.quaternion),
      0.05,
      60
    )
    const hit = raycaster
      .intersectObjects(scene.children, true)
      .find((h) => (h.object as THREE.Mesh).isMesh)
    pivotDistance.current = hit
      ? THREE.MathUtils.clamp(hit.distance, 1, 30)
      : DRIFT_FALLBACK_DISTANCE
  }, [shot, scene])

  useEffect(() => {
    const camera = cameraRef.current
    if (!camera) return

    const isFirstPlacement = immediate || to.current === null

    if (isFirstPlacement) {
      base.current.position.copy(shot.position)
      base.current.quaternion.copy(shot.quaternion)
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
    from.current.position.copy(base.current.position)
    from.current.quaternion.copy(base.current.quaternion)
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
    if (!camera || !target) return

    const step = Math.min(delta, MAX_DELTA)
    const pose = base.current

    if (animating.current) {
      elapsed.current += step
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
        pose.position.copy(scratchPos.current)
      } else {
        pose.position.lerpVectors(from.current.position, target.position, t)
      }

      pose.quaternion.slerpQuaternions(from.current.quaternion, target.quaternion, t)
      const targetFov = fovForAspect(target.fov, aspect)
      camera.fov = from.current.fov + (targetFov - from.current.fov) * t
      camera.updateProjectionMatrix()

      if (raw >= 1) {
        // Land exactly on the shot rather than wherever easing left us.
        pose.position.copy(target.position)
        pose.quaternion.copy(target.quaternion)
        camera.fov = fovForAspect(target.fov, aspect)
        camera.updateProjectionMatrix()
        animating.current = false
        notify.current?.(false)
      }
    }

    // Ease the drift towards the scroll position. Keep asking for frames
    // until it arrives: the loop idles on demand otherwise.
    drift.current = THREE.MathUtils.damp(drift.current, driftTarget.current, DRIFT_DAMPING, step)
    if (Math.abs(drift.current - driftTarget.current) < 1e-4) {
      drift.current = driftTarget.current
    } else {
      invalidate()
    }

    // Apply the drift: orbit about the world up axis through the point the
    // camera is looking at, closing in slightly as it goes.
    const amount = drift.current
    const distance = pivotDistance.current
    const pivot = scratchPivot.current
      .set(0, 0, -distance)
      .applyQuaternion(pose.quaternion)
      .add(pose.position)
    const yaw = scratchYaw.current.setFromAxisAngle(WORLD_UP, amount * DRIFT_YAW)
    camera.position
      .copy(pose.position)
      .sub(pivot)
      .multiplyScalar(1 - amount * DRIFT_DOLLY)
      .applyQuaternion(yaw)
      .add(pivot)
    camera.quaternion.copy(yaw).multiply(pose.quaternion)
  })

  return (
    <PerspectiveCamera ref={cameraRef} makeDefault fov={45} near={0.1} far={100} />
  )
}
