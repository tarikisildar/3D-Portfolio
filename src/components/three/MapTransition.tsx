'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChapter } from './ChapterContext'
import { useSharedModel } from './ModelContext'
import { countries } from '@/data/map-geometry'
import type { Chapter } from '@/data/chapters'

/**
 * The flight between two chapters, over a real map.
 *
 * This is deliberately both the transition *and* the loading curtain. Covering
 * the canvas is what lets ModelProvider unload one room before fetching the
 * next, instead of holding two furnished rooms in GPU memory — the difference
 * between working and a lost context on a phone. Getting the transition and the
 * loading strategy out of one piece of work is the reason for doing it in 2D
 * rather than flying a camera over real terrain.
 *
 * North stays up. An earlier version rotated each trip so the route ran
 * left-to-right, which suited the letterbox but is indefensible once actual
 * coastlines are on screen — a recognisable map read sideways is worse than a
 * tighter one read properly.
 */

/** Mercator radius. Arbitrary, but sets the units everything else works in. */
const R = 3000

/** Web Mercator. Standard, and what a viewer expects a map to look like. */
function project([lat, lng]: [number, number]) {
  const latRad = (lat * Math.PI) / 180
  return {
    x: (lng * Math.PI * R) / 180,
    // SVG y grows downward, so north is negative.
    y: -R * Math.log(Math.tan(Math.PI / 4 + latRad / 2)),
  }
}

/**
 * Progress is held here until the incoming room has finished loading. It sits
 * in the middle of the flight, where a pause reads as travel rather than a stall.
 */
const HOLD_AT = 0.68

const PHASE = {
  /** Curtain fully covers the canvas; safe to swap the room behind it. */
  covered: 0.12,
  /** Pulled back far enough to show the route in context. */
  wide: 0.34,
  /** Arrived over the destination. */
  arrived: 0.74,
  /** Curtain starts lifting. */
  lift: 0.86,
}

/** Half-height of the view when hugging a single city, in Mercator units. */
const CLOSE_SPAN = 26
/**
 * Padding around the route when pulled back, in Mercator units.
 *
 * Generous on purpose. Munich to Nuremberg is a 1.3° hop, and framed tightly
 * you see a nondescript patch of southern Germany — real borders, but nothing
 * you could name. Pulling back until most of the country is in shot is what
 * makes it read as a map rather than as texture.
 */
const ROUTE_PADDING = 155

/**
 * Vertical room a city label needs beyond its pin, in k-units (the same scale
 * the labels themselves are drawn at). Covers the city name above and the year
 * range below, with a little air.
 */
const LABEL_CLEARANCE = 46

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const phase = (t: number, from: number, to: number) => clamp01((t - from) / (to - from))

type Point = { x: number; y: number }

/**
 * How a journey is drawn.
 *
 * Crossing a border is a flight; staying inside one is a train. Munich to
 * Nuremberg really is an hour on the ICE, and Ankara really is a plane — the
 * mode is decided by the chapters' countries rather than a lookup table, so new
 * places get the right treatment automatically.
 */
type Mode = 'plane' | 'train'

const MODE: Record<Mode, { bow: number; label: string }> = {
  // Flight paths bow; rail follows the ground, give or take.
  plane: { bow: 0.2, label: 'plane' },
  train: { bow: 0.035, label: 'train' },
}

function journeyMode(from: Chapter, to: Chapter): Mode {
  return from.country === to.country ? 'train' : 'plane'
}

/** Quadratic Bezier control point, bowed perpendicular to the route. */
function control(a: Point, b: Point, bow: number): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const off = len * bow
  return {
    x: (a.x + b.x) / 2 - (dy / len) * off,
    y: (a.y + b.y) / 2 + (dx / len) * off,
  }
}

function bezier(a: Point, c: Point, b: Point, t: number): Point {
  const inv = 1 - t
  return {
    x: inv * inv * a.x + 2 * inv * t * c.x + t * t * b.x,
    y: inv * inv * a.y + 2 * inv * t * c.y + t * t * b.y,
  }
}

/**
 * The travelled portion of the route, as an explicit polyline.
 *
 * Progressive reveal via stroke-dasharray would be simpler, but the rail
 * styling already needs a dash pattern of its own for the sleepers — one path
 * cannot do both. Emitting only the part that has been travelled leaves the
 * dash array free.
 */
function partialPath(a: Point, c: Point, b: Point, t: number, steps = 64): string {
  if (t <= 0) return ''
  const n = Math.max(2, Math.ceil(steps * t))
  let d = ''
  for (let i = 0; i <= n; i++) {
    const p = bezier(a, c, b, (i / n) * t)
    d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }
  return d
}

/** Heading of the route at t, in degrees, for pointing the vehicle. */
function heading(a: Point, c: Point, b: Point, t: number): number {
  const p0 = bezier(a, c, b, Math.max(0, t - 0.01))
  const p1 = bezier(a, c, b, Math.min(1, t + 0.01))
  return (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI
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

  // The scene is a wide, short letterbox. Zoom has to account for its real
  // shape or the cities end up outside the visible strip.
  const containerRef = useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = useState(3)
  /**
   * Fraction of the scene hidden behind the site header.
   *
   * The header is fixed and the scene starts underneath it, so the top ~64px of
   * the canvas is covered. Geometry placed there is drawn correctly and simply
   * cannot be seen — which is what was eating the departure city's name on the
   * long haul to Ankara. Measured rather than hardcoded so it survives the
   * header changing height.
   */
  const [topInset, setTopInset] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return
      setAspect(r.width / r.height)
      const header = document.querySelector('header')?.getBoundingClientRect()
      const covered = header ? Math.max(0, header.bottom - r.top) : 0
      setTopInset(Math.min(0.45, covered / r.height))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  // Land is static; project it once.
  const land = useMemo(
    () =>
      countries.map((c) => ({
        code: c.code,
        home: c.home,
        d: c.rings
          .map(
            (ring) =>
              'M' +
              ring
                .map(([lng, lat]) => {
                  const p = project([lat, lng])
                  return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`
                })
                .join('L') +
              'Z'
          )
          .join(' '),
      })),
    []
  )

  const originRef = useRef<Chapter | null>(null)
  const committedRef = useRef(false)

  const active = pending !== null

  // A chapter whose room is not built yet never produces a model, so waiting on
  // one would stall the flight at HOLD_AT forever. Treat it as ready.
  const roomReadyRef = useRef(false)
  roomReadyRef.current = roomModel !== null || !pending?.model

  useEffect(() => {
    if (!active) return

    originRef.current = chapter
    committedRef.current = false
    setProgress(0)

    const reduced = prefersReducedMotion()
    const duration = reduced ? 900 : 3800
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      let t = clamp01((now - start) / duration)

      if (!committedRef.current && t >= PHASE.covered) {
        committedRef.current = true
        commit()
      }

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
  const a = project(origin.coords)
  const b = project(destination.coords)

  const opacity =
    progress < PHASE.covered
      ? easeInOut(progress / PHASE.covered)
      : progress > PHASE.lift
        ? 1 - easeInOut(phase(progress, PHASE.lift, 1))
        : 1

  // Vertical half-span when pulled back far enough to hold the whole route —
  // including the city labels, which sit above and below the pins.
  //
  // Label offsets are expressed in k, which is itself derived from the view
  // height, so asking for clearance scales the view, which scales the
  // clearance. Solving that directly: the labels need LABEL_CLEARANCE k-units,
  // k is halfH/200, so they occupy a fixed *fraction* of the half-span and the
  // rest has to fit in what remains. Without this the departure city's label
  // was sliced off the top edge on the long haul to Ankara.
  const labelFraction = LABEL_CLEARANCE / 200
  const routeHalfH = (Math.abs(b.y - a.y) / 2 + ROUTE_PADDING) / (1 - labelFraction)
  const routeHalfW = Math.abs(b.x - a.x) / 2 + ROUTE_PADDING
  // Everything has to fit in the band *below* the header, not the whole canvas.
  const wideHalfH = Math.max(routeHalfH, routeHalfW / aspect) / (1 - topInset)

  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }

  let focus: Point
  let halfH: number
  if (progress < PHASE.wide) {
    // Pull back off the departure city.
    const p = easeInOut(phase(progress, 0, PHASE.wide))
    focus = { x: lerp(a.x, mid.x, p), y: lerp(a.y, mid.y, p) }
    halfH = lerp(CLOSE_SPAN, wideHalfH, p)
  } else if (progress < PHASE.arrived) {
    // Hold still while the route draws. The map panning *and* the line
    // advancing at once gives the eye nothing to hold onto — keeping the frame
    // fixed is what lets you actually read where you are going.
    focus = mid
    halfH = wideHalfH
  } else {
    // Descend onto the destination.
    const p = easeInOut(phase(progress, PHASE.arrived, 1))
    focus = { x: lerp(mid.x, b.x, p), y: lerp(mid.y, b.y, p) }
    halfH = lerp(wideHalfH, CLOSE_SPAN, p)
  }

  const viewH = halfH * 2
  const viewW = viewH * aspect

  // Bias the view upward so the content centres in the *visible* band rather
  // than the full canvas, pushing it clear of the header.
  const focusY = focus.y - halfH * topInset

  const viewBox = `${focus.x - viewW / 2} ${focusY - viewH / 2} ${viewW} ${viewH}`

  const travel = easeInOut(phase(progress, PHASE.wide, PHASE.arrived))
  const mode = journeyMode(origin, destination)
  const ctrl = control(a, b, MODE[mode].bow)
  const travelled = partialPath(a, ctrl, b, travel)
  const marker = bezier(a, ctrl, b, travel)
  const markerAngle = heading(a, ctrl, b, travel)

  // Keep strokes and labels a constant on-screen size as the map zooms.
  const k = viewH / 400

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
        {/* Sea */}
        <rect
          x={focus.x - viewW}
          y={focusY - viewH}
          width={viewW * 2}
          height={viewH * 2}
          fill="#dbe4e0"
        />

        {/* Land. Germany reads warmer than its neighbours so the eye lands on
            the country the story happens in. */}
        <g stroke="#b9a68c" strokeWidth={1.1 * k} strokeLinejoin="round">
          {land.map((c) => (
            <path key={c.code} d={c.d} fill={c.home ? '#f2e3cb' : '#e7dac4'} />
          ))}
        </g>

        {/* The travelled route. Rail gets the classic two-tone hatching; a
            flight path gets a dashed line. */}
        {travelled && mode === 'train' ? (
          <>
            <path
              d={travelled}
              fill="none"
              stroke="#5c4632"
              strokeWidth={4.5 * k}
              strokeLinecap="round"
            />
            <path
              d={travelled}
              fill="none"
              stroke="#f2e3cb"
              strokeWidth={2.2 * k}
              strokeDasharray={`${5 * k} ${5 * k}`}
            />
          </>
        ) : (
          travelled && (
            <path
              d={travelled}
              fill="none"
              stroke="#8c6a4f"
              strokeWidth={3 * k}
              strokeLinecap="round"
              strokeDasharray={`${7 * k} ${6 * k}`}
            />
          )
        )}

        <CityPin p={a} chapter={origin} k={k} dimmed={travel > 0.5} />
        <CityPin p={b} chapter={destination} k={k} dimmed={travel < 0.5} />

        {travel > 0 && travel < 1 && (
          <g transform={`translate(${marker.x} ${marker.y}) rotate(${markerAngle})`}>
            {mode === 'plane' ? <PlaneGlyph k={k} /> : <TrainGlyph k={k} />}
          </g>
        )}
      </svg>
    </div>
  )
}

/**
 * Vehicle glyphs, drawn as paths rather than emoji.
 *
 * Both point along +x and are rotated to the route's heading by the caller.
 * Emoji would be one character each, but they render differently on every
 * platform and cannot be recoloured to match the map.
 */
function PlaneGlyph({ k }: { k: number }) {
  return (
    <g transform={`scale(${k})`}>
      <path
        d="M13 0 L-3 6 L-6 5 L-2.5 0 L-6 -5 L-3 -6 Z"
        fill="#ff6b6b"
        stroke="#fff"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </g>
  )
}

function TrainGlyph({ k }: { k: number }) {
  return (
    <g transform={`scale(${k})`}>
      <rect
        x={-7}
        y={-4.2}
        width={14}
        height={8.4}
        rx={2.6}
        fill="#ff6b6b"
        stroke="#fff"
        strokeWidth={1.4}
      />
      {/* Windscreen, so it reads as facing forwards. */}
      <rect x={2.4} y={-2.2} width={2.6} height={4.4} rx={0.8} fill="#fff" opacity={0.9} />
    </g>
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
    <g opacity={dimmed ? 0.5 : 1} style={{ transition: 'opacity 300ms' }}>
      <circle cx={p.x} cy={p.y} r={13 * k} fill="#8c6a4f" opacity={0.16} />
      <circle
        cx={p.x}
        cy={p.y}
        r={5 * k}
        fill="#3a2f28"
        stroke="#f8f2e8"
        strokeWidth={2 * k}
      />
      <text
        x={p.x}
        y={p.y - 19 * k}
        textAnchor="middle"
        fill="#3a2f28"
        fontSize={19 * k}
        fontWeight={700}
        style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
      >
        {chapter.city}
      </text>
      <text
        x={p.x}
        y={p.y + 28 * k}
        textAnchor="middle"
        fill="#6b5949"
        fontSize={13 * k}
        style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
      >
        {from}–{to ?? 'now'}
      </text>
    </g>
  )
}
