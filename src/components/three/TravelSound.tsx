'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useChapter } from './ChapterContext'

/**
 * Plays a short travel cue while moving between chapters, plus the mute toggle.
 *
 * Only ever triggered by an explicit "travel to another city" click, so it is
 * never the unprompted audio that makes people hunt for the close button — but
 * the toggle is right next to the timeline anyway, and the preference sticks.
 *
 * Swap the file by changing TRACK. Set it to null to remove the feature
 * entirely; the toggle disappears with it.
 */
const TRACK = '/sfx/indiana-jones-theme-song.mp3'

const STORAGE_KEY = 'travel-sound-muted'
const VOLUME = 0.45
const FADE_OUT_MS = 700

export function TravelSound() {
  const { pending, all } = useChapter()

  const [muted, setMuted] = useState(false)
  const [ready, setReady] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeRef = useRef<number | null>(null)

  // Restore the preference before anything can play. Read in an effect rather
  // than a useState initialiser so server and client render the same markup.
  useEffect(() => {
    setMuted(window.localStorage.getItem(STORAGE_KEY) === '1')
    setReady(true)
  }, [])

  const stopFade = useCallback(() => {
    if (fadeRef.current !== null) {
      window.clearInterval(fadeRef.current)
      fadeRef.current = null
    }
  }, [])

  const halt = useCallback(() => {
    stopFade()
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }, [stopFade])

  // Start on departure, fade out on arrival.
  useEffect(() => {
    if (!ready || muted) return

    if (!pending) {
      // Not travelling: ease the cue out rather than cutting it dead.
      const audio = audioRef.current
      if (!audio || audio.paused) return

      stopFade()
      const step = VOLUME / (FADE_OUT_MS / 50)
      fadeRef.current = window.setInterval(() => {
        const next = audio.volume - step
        if (next <= 0.01) {
          halt()
        } else {
          audio.volume = next
        }
      }, 50)
      return
    }

    // Built on first use, so visitors who never travel never fetch it.
    if (!audioRef.current) {
      const audio = new Audio(TRACK)
      audio.preload = 'auto'
      audioRef.current = audio
    }

    const audio = audioRef.current
    stopFade()
    audio.currentTime = 0
    audio.volume = VOLUME
    // Rejected when the browser has not seen a user gesture. Travelling is
    // always click-driven, so this is rare — and silence is a fine outcome.
    audio.play().catch(() => {})
  }, [pending, muted, ready, stopFade, halt])

  // Never leave the cue playing behind us.
  useEffect(() => () => halt(), [halt])

  const toggle = () => {
    setMuted((wasMuted) => {
      const next = !wasMuted
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      if (next) halt()
      return next
    })
  }

  // The cue only exists to accompany travel; with one chapter there is none.
  if (all.length < 2) return null

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute travel sound' : 'Mute travel sound'}
      title={muted ? 'Travel sound off' : 'Travel sound on'}
      className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center
                 rounded-full border border-[var(--rule-soft)] bg-[var(--veil-strong)]
                 text-[var(--ink-soft)] backdrop-blur-md transition-colors
                 hover:text-[var(--ink)] focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-[var(--live)]"
    >
      {muted ? <MutedIcon /> : <SoundIcon />}
    </button>
  )
}

function SoundIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 8.5a5 5 0 010 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MutedIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M17 9.5l4 5M21 9.5l-4 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
