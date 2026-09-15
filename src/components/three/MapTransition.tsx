'use client'

import { useEffect, useRef, useState } from 'react'
import { useChapter } from './ChapterContext'
import { useSharedModel } from './ModelContext'
import { chapters, type Chapter } from '@/data/chapters'

/**
 * The map flight between two chapters.
 *
 * This is deliberately both the transition *and* the loading curtain. Covering
 * the canvas is what lets ModelProvider unload one room before fetching the
 * next, instead of holding two furnished rooms in GPU memory — which is the
 * difference between working and a lost context on a phone. Getting the
 * transition and the loading strategy out of one piece of work is the whole
 * reason for doing it in 2D rather than flying a camera over real terrain.
 */

// Map-space dimensions. The viewBox zooms around inside this.
const MAP_W = 1000
const MAP_H = 700

/** How far in the city close-ups sit, as a fraction of the full extent. */
const CLOSE_ZOOM = 0.28

/**
 * Progress is held here until the incoming room has finished loading. It sits
 * in the middle of the flight, where a pause reads as travel rather than as a
 * stall.
 */
const HOLD_AT = 0.68

const PHASE = {
  /** Curtain fully covers the canvas; safe to swap the room behind it. */
  covered: 0.12,
  /** Pulled back far enough to see both cities. */
  wide: 0.34,
  /** Arrived over the destination. */
  arrived: 0.74,
  /** Curtain starts lifting. */
  lift: 0.86,
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Remap a sub-range of overall progress to 0..1. */
const phase = (t: number, from: number, to: number) => clamp01((t - from) / (to - from))

/**
 * Equirectangular projection across a bounding box covering every chapter, with
 * longitude scaled by cos(latitude) so the aspect is not stretched. At these
 * latitudes and over a couple of degrees, a fuller projection buys nothing.
 */
function buildProjection(all: Chapter[]) {
  const lats = all.map((c) => c.coords[0])
  const lngs = all.map((c) => c.coords[1])

  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const kx = Math.cos((midLat * Math.PI) / 180)

  // Pad generously so a two-city map does not look cramped.
  const padLat = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.9, 0.9)
  const padLng = Math.max((Math.max(...lngs) - Math.min(...lngs)) * 0.9, 0.9)

  const minLat = Math.min(...lats) - padLat
  const maxLat = Math.max(...lats) + padLat
  const minLng = Math.min(...lngs) - padLng
  const maxLng = Math.max(...lngs) + padLng

  const spanLng = (maxLng - minLng) * kx
  const spanLat = maxLat - minLat

  return (coords: [number, number]) => {
    const [lat, lng] = coords
    return {
      x: (((lng - minLng) * kx) / spanLng) * MAP_W,
      // Latitude increases northward; SVG y increases downward.
      y: ((maxLat - lat) / spanLat) * MAP_H,
    }
  }
}

type Point = { x: number; y: number }

/** Quadratic Bezier, bowed perpendicular to the route like a flight path. */
function arcPoint(a: Point, b: Point, t: number): Point {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  // Perpendicular offset, scaled to the distance travelled.
  const bow = len * 0.22
  const cx = mx - (dy / len) * bow
  const cy = my + (dx / len) * bow

  const inv = 1 - t
  return {
    x: inv * inv * a.x + 2 * inv * t * cx + t * t * b.x,
    y: inv * inv * a.y + 2 * inv * t * cy + t * t * b.y,
  }
}

function arcPath(a: Point, b: Point) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const bow = len * 0.22
  const cx = mx - (dy / len) * bow
  const cy = my + (dx / len) * bow
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

export function MapTransition() {
  const { chapter, pending, commit, finish } = useChapter()
  const { roomModel } = useSharedModel()

  const [progress, setProgress] = useState(0)

  // The scene is a wide, short letterbox (roughly 3:1), while Munich to
  // Nuremberg is an almost purely north-south route — so the viewport crops
  // exactly the axis the journey runs along. Zooming has to account for the
  // real aspect ratio or the city labels fall outside the visible strip.
  const containerRef = useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = useState(3)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) setAspect(r.width / r.height)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The chapter we departed from, captured when the trip starts — `chapter`
  // itself changes underneath us at commit().
  const originRef = useRef<Chapter | null>(null)
  const committedRef = useRef(false)
  const roomReadyRef = useRef(false)
  roomReadyRef.current = roomModel !== null

  const active = pending !== null

  useEffect(() => {
    if (!active) return

    originRef.current = chapter
    committedRef.current = false
    setProgress(0)

    const reduced = prefersReducedMotion()
    const duration = reduced ? 900 : 3600
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const elapsed = now - start
      let t = clamp01(elapsed / duration)

      // Swap the room once the curtain is opaque.
      if (!committedRef.current && t >= PHASE.covered) {
        committedRef.current = true
        commit()
      }

      // Hold mid-flight until the incoming room has decoded.
      if (!roomReadyRef.current && t > HOLD_AT) t = HOLD_AT

      setProgress(t)

      if (t >= 1) {
        finish()
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // `chapter` is read once at trip start on purpose; adding it as a dep would
    // restart the flight when commit() swaps it mid-animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, commit, finish])

  const origin = originRef.current ?? chapter
  const destination = pending ?? chapter
  const project = buildProjection(chapters.length > 1 ? chapters : [origin, destination])

  // Orient the map to the journey, so the route always runs left to right.
  //
  // The scene is a wide letterbox, but Munich to Nuremberg is almost due
  // north: held north-up, the two pins end up stacked in a thin band with
  // their labels colliding with the path. Rotating each trip onto the
  // horizontal uses the shape of the frame instead of fighting it. North-up
  // is worth giving up here — this is a stylised journey card, shown for three
  // seconds, not a map anyone navigates by.
  const rawA = project(origin.coords)
  const rawB = project(destination.coords)
  const pivot = { x: (rawA.x + rawB.x) / 2, y: (rawA.y + rawB.y) / 2 }
  const routeAngle = Math.atan2(rawB.y - rawA.y, rawB.x - rawA.x)
  const rotate = (p: Point): Point => {
    const cos = Math.cos(-routeAngle)
    const sin = Math.sin(-routeAngle)
    const dx = p.x - pivot.x
    const dy = p.y - pivot.y
    return { x: pivot.x + dx * cos - dy * sin, y: pivot.y + dx * sin + dy * cos }
  }
  const a = rotate(rawA)
  const b = rotate(rawB)

  // Curtain opacity: fade in, hold, fade out.
  const opacity =
    progress < PHASE.covered
      ? easeInOut(progress / PHASE.covered)
      : progress > PHASE.lift
        ? 1 - easeInOut(phase(progress, PHASE.lift, 1))
        : 1

  // Camera over the map: close on origin -> wide enough to hold both -> close
  // on destination. The wide width is derived from the actual route and the
  // container's aspect, so both pins and their labels stay on screen whatever
  // shape the viewport is.
  const routeW = Math.abs(b.x - a.x)
  const routeH = Math.abs(b.y - a.y)
  const LABEL_PAD = 150 // room for the city name above and the years below
  const wideW = Math.max(
    routeW + LABEL_PAD * 2,
    (routeH + LABEL_PAD * 2) * aspect,
    MAP_W * 0.5
  )
  const closeW = wideW * CLOSE_ZOOM

  let focus: Point
  let viewW: number
  if (progress < PHASE.wide) {
    const p = easeInOut(phase(progress, 0, PHASE.wide))
    focus = { x: lerp(a.x, (a.x + b.x) / 2, p), y: lerp(a.y, (a.y + b.y) / 2, p) }
    viewW = lerp(closeW, wideW, p)
  } else if (progress < PHASE.arrived) {
    const p = easeInOut(phase(progress, PHASE.wide, PHASE.arrived))
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    focus = { x: lerp(mid.x, b.x, p), y: lerp(mid.y, b.y, p) }
    viewW = lerp(wideW, wideW, p)
  } else {
    const p = easeInOut(phase(progress, PHASE.arrived, 1))
    focus = b
    viewW = lerp(wideW, closeW, p)
  }

  // Match the viewBox to the container so nothing is cropped away.
  const viewH = viewW / aspect
  const viewBox = `${focus.x - viewW / 2} ${focus.y - viewH / 2} ${viewW} ${viewH}`

  // How much of the route has been flown.
  const travel = easeInOut(phase(progress, PHASE.wide, PHASE.arrived))
  const marker = arcPoint(a, b, travel)
  const route = arcPath(a, b)

  // Stroke widths scale with zoom so lines keep a constant on-screen weight.
  const k = viewW / MAP_W

  return (
    // Always mounted so the ResizeObserver has something to measure; only
    // painted while a trip is under way.
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      style={{ opacity: active ? opacity : 0, visibility: active ? 'visible' : 'hidden' }}
    >
      <svg viewBox={viewBox} preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <radialGradient id="mt-vignette" cx="50%" cy="50%" r="75%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#3a2f28" stopOpacity="0.35" />
          </radialGradient>
        </defs>

        {/* Paper. Matches the scene background so the cut in and out is soft. */}
        <rect
          x={-MAP_W}
          y={-MAP_H}
          width={MAP_W * 3}
          height={MAP_H * 3}
          fill="#f5e5d3"
        />

        {/* Graticule */}
        <g stroke="#c9b49c" strokeWidth={1.2 * k} opacity={0.5}>
          {Array.from({ length: 21 }, (_, i) => (i - 5) * 100).map((x) => (
            <line key={`v${x}`} x1={x} y1={-MAP_H} x2={x} y2={MAP_H * 2} />
          ))}
          {Array.from({ length: 21 }, (_, i) => (i - 5) * 100).map((y) => (
            <line key={`h${y}`} x1={-MAP_W} y1={y} x2={MAP_W * 2} y2={y} />
          ))}
        </g>

        {/* A soft region blob behind the route, suggesting land without
            pretending to be cartography. */}
        <ellipse
          cx={(a.x + b.x) / 2}
          cy={(a.y + b.y) / 2}
          rx={Math.max(Math.hypot(b.x - a.x, b.y - a.y) * 1.5, 260)}
          ry={Math.max(Math.hypot(b.x - a.x, b.y - a.y) * 1.15, 200)}
          fill="#e3d2b8"
          opacity={0.75}
        />

        {/* Route: drawn progressively via dash offset. */}
        <path
          d={route}
          fill="none"
          stroke="#8c6a4f"
          strokeWidth={3.5 * k}
          strokeLinecap="round"
          strokeDasharray={`${10 * k} ${10 * k}`}
          pathLength={1}
          style={{ strokeDasharray: `${travel} 1`, strokeDashoffset: 0 }}
        />

        <CityPin p={a} chapter={origin} k={k} dimmed={travel > 0.5} />
        <CityPin p={b} chapter={destination} k={k} dimmed={travel < 0.5} />

        {/* Traveller */}
        {travel > 0 && travel < 1 && (
          <circle
            cx={marker.x}
            cy={marker.y}
            r={7 * k}
            fill="#ff6b6b"
            stroke="#fff"
            strokeWidth={2.5 * k}
          />
        )}

        <rect
          x={focus.x - viewW / 2}
          y={focus.y - viewH / 2}
          width={viewW}
          height={viewH}
          fill="url(#mt-vignette)"
        />
      </svg>
    </div>
  )
}

function CityPin({
  p,
  chapter,
  k,
  dimmed,
}: {
  p: Point
  chapter: Chapter
  k: number
  dimmed: boolean
}) {
  const [from, to] = chapter.period
  return (
    <g opacity={dimmed ? 0.45 : 1} style={{ transition: 'opacity 300ms' }}>
      <circle cx={p.x} cy={p.y} r={16 * k} fill="#8c6a4f" opacity={0.18} />
      <circle
        cx={p.x}
        cy={p.y}
        r={6 * k}
        fill="#3a2f28"
        stroke="#f5e5d3"
        strokeWidth={2.5 * k}
      />
      <text
        x={p.x}
        y={p.y - 24 * k}
        textAnchor="middle"
        fill="#3a2f28"
        fontSize={22 * k}
        fontWeight={700}
        style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
      >
        {chapter.city}
      </text>
      <text
        x={p.x}
        y={p.y + 34 * k}
        textAnchor="middle"
        fill="#6b5949"
        fontSize={15 * k}
        style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
      >
        {from}–{to ?? 'now'}
      </text>
    </g>
  )
}
