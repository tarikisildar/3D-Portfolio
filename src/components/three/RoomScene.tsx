'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSharedModel } from './ModelContext'
import { CameraRig } from './CameraRig'
import { extractShots, deriveShots, resolveShots, type PageType } from './shots'
import { useProcrastinate } from './ProcrastinateContext'
import { useChapter } from './ChapterContext'

// Where the room sits, which model to load and any pre-Blender fallback shots
// all come from the active chapter now — see src/data/chapters.ts. Camera shots
// themselves are authored as `shot_*` cameras inside the room GLB.
//
// The ~300 lines that used to sit here (a hardcoded position table, an
// on-screen debug panel for copying coordinates out of the running site, and a
// camera animator built on module-level mutable singletons) are gone.

interface RoomSceneProps {
  page: PageType;
  /**
   * Reports whether anything in the scene needs continuous frames: a camera
   * move in flight, or a video playing. Scene3D turns this into the Canvas
   * `frameloop` prop.
   *
   * This has to travel up to the Canvas as a prop rather than being applied
   * here with an imperative setFrameloop(). `frameloop` is a Canvas prop, so
   * R3F re-applies it on every re-render — and navigating re-renders Scene3D.
   * An imperative "always" therefore got stomped back to "demand" the moment
   * you changed page mid-move, freezing the camera partway through with no way
   * to recover: the effect that had set "always" never re-ran, because from its
   * point of view nothing had changed.
   */
  onBusyChange?: (busy: boolean) => void;
}

const VIDEO_SOURCES = [
  '/videos/hoffman.mp4',
  '/videos/office.mp4',
  '/videos/shorts.mp4',
  '/videos/radiohead.mp4',
]

/**
 * Plays a video on the monitor while procrastinate mode is on.
 *
 * `sequence` advances on each "Next Video" press and steps through the list
 * rather than picking at random, which used to mean Next could hand you the
 * same clip again.
 */
function VideoScreen({ active, sequence }: { active: boolean; sequence: number }) {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null)
  // Random starting point, chosen once, so the first clip is not always the same.
  const [offset] = useState(() => Math.floor(Math.random() * VIDEO_SOURCES.length))

  // One effect owns the whole lifecycle. The previous version had three
  // overlapping effects that each called a shared loadVideo(), and the one that
  // built the <video> element listed videoTexture in its own dependency array
  // while calling setVideoTexture inside — so every texture swap tore the
  // element down and rebuilt it, restarting playback.
  useEffect(() => {
    if (!active) return

    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.playsInline = true
    // Autoplay policies only allow muted starts; we unmute shortly after.
    video.muted = true
    video.volume = 0
    video.src = VIDEO_SOURCES[(offset + sequence) % VIDEO_SOURCES.length]

    const texture = new THREE.VideoTexture(video)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter

    setVideoTexture(texture)
    video.play().catch((err) => console.error('Error playing video:', err))

    const unmute = setTimeout(() => {
      video.muted = false
      video.volume = 0.5
    }, 1000)

    return () => {
      clearTimeout(unmute)
      video.pause()
      video.removeAttribute('src')
      video.load()
      texture.dispose()
      setVideoTexture(null)
    }
    // While procrastinate mode is on, RoomScene reports "busy" upward and the
    // Canvas runs frameloop="always" — that is what pushes new video frames
    // into the texture.
  }, [active, sequence, offset])

  if (!active || !videoTexture) return null

  // Position matched to the monitor face in the room model.
  return (
    <mesh
      position={[-1.243, -1.155, -0.86]}
      rotation={[0, Math.PI * 0.699, 0]}
      scale={[0.61, 0.365, 0.01]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={videoTexture} toneMapped={false} />
    </mesh>
  )
}

export function RoomScene({ page, onBusyChange }: RoomSceneProps) {
  const { roomModel } = useSharedModel()
  const { chapter } = useChapter()
  const roomRef = useRef<THREE.Group>(null)
  // Procrastinate mode is shared with the page content outside the Canvas, so
  // it lives in a context rather than in this component.
  const { active: procrastinateMode, sequence } = useProcrastinate()
  // Shots authored inside the room, once we have been able to read them out.
  const [authoredShots, setAuthoredShots] = useState({})
  const [derivedShots, setDerivedShots] = useState({})
  const [cameraMoving, setCameraMoving] = useState(false)
  // Auto-framing needs the real viewport shape: the scene is a wide letterbox.
  const aspect = useThree((s) => s.size.width / s.size.height)

  // Read `shot_*` cameras out of the room once it is in the scene graph. This
  // runs against the positioned group, not the raw GLB, so the shots come back
  // in world space with ROOM_TRANSFORM already applied.
  useEffect(() => {
    if (!roomModel?.scene || !roomRef.current) return
    setAuthoredShots(extractShots(roomRef.current))
    // Auto-framing from the room's own bounds, so a room with no authored
    // cameras is still viewable rather than inheriting another room's framing.
    setDerivedShots(deriveShots(roomRef.current, aspect))
  }, [roomModel, aspect])

  const shots = useMemo(
    () => resolveShots(authoredShots, chapter.fallbackShots, derivedShots),
    [authoredShots, chapter.fallbackShots, derivedShots]
  )
  const activeShot = shots[procrastinateMode ? 'procrastinate' : page]

  // A playing video needs frames just as much as a moving camera does.
  const busy = cameraMoving || procrastinateMode
  useEffect(() => {
    onBusyChange?.(busy)
  }, [busy, onBusyChange])

  if (!roomModel) return null;

  return (
    <>
      <CameraRig shot={activeShot} onMovingChange={setCameraMoving} />

      <group
        ref={roomRef}
        position={chapter.transform.position}
        scale={chapter.transform.scale}
        rotation={chapter.transform.rotation}
      >
        <primitive object={roomModel.scene} />
      </group>

      {/* Lighting lives in Scene3D. There used to be a second ambientLight
          here, which stacked with that one to 1.5 total and washed out the
          directional light, leaving every surface in the room shadeless. */}

      <VideoScreen active={procrastinateMode} sequence={sequence} />
    </>
  );
}