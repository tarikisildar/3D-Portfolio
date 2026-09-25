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

/**
 * Arrival: each time a room is put in place, the camera starts high over it,
 * looking straight down the way the map does, and lands in the shot. It is the
 * last leg of the journey the map transition begins, and on a cold load it is
 * the first thing the site does.
 */
const INTRO_DURATION = 2.8
/**
 * How much of the frame's narrow side the floor plan's diagonal spans at the
 * start. Over 1 lets the corners run off the frame: the plan is turned to the
 * shot's heading, so fitting the whole diagonal leaves it small in a wide
 * frame. A tall phone frame fits the plan's width, which needs less.
 */
const INTRO_FILL_WIDE = 1.4
const INTRO_FILL_TALL = 1.05
/** How far behind the centre the descent starts, in footprint radii. */
const INTRO_SETBACK = 0.3

export type RigIntro = {
  /** Changes once per room; a new key plays the arrival again. */
  key: string
  /** Centre of the room's floor plan, in world space. */
  centre: THREE.Vector3
  /** Half the diagonal of the room's floor plan. */
  footprint: number
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Overhead pose above the room, turned so the top of the screen points the way
 * the destination shot faces. The descent then only has to tip forward rather
 * than also spin around to find its heading.
 */
function introPose(shot: Shot, intro: RigIntro, fov: number, aspect: number) {
  const facing = new THREE.Vector3(0, 0, -1).applyQuaternion(shot.quaternion)
  facing.y = 0
  if (facing.lengthSq() < 1e-6) facing.set(0, 0, -1)
  facing.normalize()

  // Height at which the plan's diagonal spans the frame's narrower side.
  // Sizing from the plan rather than a bounding sphere matters: a sphere
  // counts wall height and anything poking out of the room, so it left one
  // room tiny and cropped another.
  const halfView = Math.tan(THREE.MathUtils.degToRad(fov) / 2) * Math.min(1, aspect)
  const fill = aspect >= 1 ? INTRO_FILL_WIDE : INTRO_FILL_TALL
  const height = intro.footprint / (halfView * fill)

  const eye = intro.centre
    .clone()
    .addScaledVector(facing, -intro.footprint * INTRO_SETBACK)
    .addScaledVector(WORLD_UP, height)
  // Matrix4.lookAt uses the camera convention (looking down -Z), so this is
  // the orientation a camera at `eye` needs to face the centre.
  const look = new THREE.Matrix4().lookAt(eye, intro.centre, facing)
  return {
    position: eye,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(look),
    facing,
  }
}

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
  /** Room to arrive into from overhead; see INTRO_DURATION. */
  intro?: RigIntro | null
  /**
   * Wait at the overhead start instead of descending. Set while the map
   * transition still covers the stage, so the arrival is seen rather than
   * played behind the curtain, and the map lifts onto a view of the plan.
   */
  holdIntro?: boolean
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
export function CameraRig({
  shot,
  immediate = false,
  onMovingChange,
  intro,
  holdIntro = false,
}: CameraRigProps) {
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
  /** True while playing the arrival, which follows its own landing curve. */
  const landing = useRef(false)
  /** Key of the last room the arrival played for. */
  const introKey = useRef<string | null>(null)
  /**
   * What the arrival looks at: from the middle of the plan to the thing the
   * destination shot is framed on. Aiming at a moving point, rather than
   * slerping between the two orientations, keeps the room in frame all the
   * way down; the slerp let a large flat slide out of view mid-descent.
   */
  const introLook = useRef({
    from: new THREE.Vector3(),
    to: new THREE.Vector3(),
    facing: new THREE.Vector3(),
  })

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
  const scratchUp = useRef(new THREE.Vector3())
  const scratchLook = useRef(new THREE.Matrix4())

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

    // A new room has just been put in place: descend into it from above.
    if (intro && intro.key !== introKey.current) {
      if (immediate || prefersReducedMotion()) {
        introKey.current = intro.key
      } else {
        const fov = fovForAspect(shot.fov, aspect)
        const start = introPose(shot, intro, fov, aspect)
        base.current.position.copy(start.position)
        base.current.quaternion.copy(start.quaternion)
        camera.position.copy(start.position)
        camera.quaternion.copy(start.quaternion)
        camera.fov = fov
        camera.updateProjectionMatrix()
        to.current = shot

        if (holdIntro) {
          // Park overhead; the key stays unplayed so releasing the hold
          // re-enters here and starts the descent.
          if (animating.current) notify.current?.(false)
          animating.current = false
          landing.current = false
          invalidate()
          return
        }

        introKey.current = intro.key
        introLook.current.from.copy(intro.centre)
        // The point on the shot's line of sight level with the room's
        // centre in depth. Deliberately not a raycast: a ray can stop on
        // something right by the lens (a window, a light fitting), which put
        // the target in mid-air and let the room sink out of frame.
        const sight = new THREE.Vector3(0, 0, -1).applyQuaternion(shot.quaternion)
        const depth = Math.max(
          intro.centre.clone().sub(shot.position).dot(sight),
          1
        )
        introLook.current.to.copy(shot.position).addScaledVector(sight, depth)
        introLook.current.facing.copy(start.facing)
        from.current.position.copy(start.position)
        from.current.quaternion.copy(start.quaternion)
        from.current.fov = fov
        apexY.current = null
        landing.current = true
        duration.current = INTRO_DURATION
        elapsed.current = 0
        animating.current = true
        notify.current?.(true)
        invalidate()
        return
      }
    }

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
    landing.current = false

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
  }, [shot, immediate, invalidate, aspect, intro, holdIntro])

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

      if (landing.current) {
        // Travel across while still high, then come straight down into the
        // shot: the control point sits directly above the destination.
        const p0 = from.current.position
        const p1 = target.position
        const control = scratchMid.current.set(
          p1.x,
          p1.y + (p0.y - p1.y) * 0.6,
          p1.z
        )
        const inv = 1 - t
        pose.position
          .copy(p0)
          .multiplyScalar(inv * inv)
          .addScaledVector(control, 2 * inv * t)
          .addScaledVector(p1, t * t)
      } else if (apexY.current !== null) {
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

      if (landing.current) {
        const look = introLook.current
        const focus = scratchMid.current.lerpVectors(look.from, look.to, t)
        // Screen-up turns from the shot's heading (top-down, like the map)
        // to the sky as the camera levels out.
        const up = scratchUp.current.lerpVectors(look.facing, WORLD_UP, t).normalize()
        pose.quaternion.setFromRotationMatrix(
          scratchLook.current.lookAt(pose.position, focus, up)
        )
        // Hand over to the authored orientation for the last stretch, so any
        // roll or off-centre framing in the shot is landed exactly.
        const settle = THREE.MathUtils.smoothstep(raw, 0.7, 1)
        pose.quaternion.slerp(target.quaternion, settle)
      } else {
        pose.quaternion.slerpQuaternions(from.current.quaternion, target.quaternion, t)
      }
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
        landing.current = false
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
