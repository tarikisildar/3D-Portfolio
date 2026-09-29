'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSharedModel } from './ModelContext'
import { CameraRig, type RigIntro } from './CameraRig'
import { extractShots, deriveShots, resolveShots, type PageType } from './shots'
import { useProcrastinate } from './ProcrastinateContext'
import { useChapter } from './ChapterContext'
import type { Chapter } from '@/data/chapters'
import { RoomLighting } from './RoomLighting'
import { extractHotspots, type Hotspot } from './hotspots'
import { HotspotMarkers } from './HotspotMarkers'
import { setStageMoving } from './stageStatus'

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

/**
 * Plays a video on the room's screen while procrastinate mode is on.
 *
 * Both the playlist and where it plays are per chapter: each era had its own
 * distractions, and the screen sits somewhere different in every room.
 *
 * Two ways to place it, in order of preference:
 *
 *  - `screen`: a mesh named `screen_procrastinate` modelled into the room. Its
 *    material is swapped for the video, so the picture lands on the real screen
 *    with the UVs it was authored with.
 *  - `overlay`: literal numbers on the chapter, used to float a quad in front of
 *    the monitor. Munich predates screen anchors and is the only room using it.
 *
 * `sequence` advances on each "Next Video" press and steps through the list
 * rather than picking at random, which used to mean Next could hand you the
 * same clip again.
 */
function VideoScreen({
  active,
  sequence,
  sources,
  screen,
  overlay,
}: {
  active: boolean
  sequence: number
  sources: string[]
  screen: THREE.Object3D | null
  overlay?: Chapter['screen']
}) {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null)
  // Random starting point, chosen once, so the first clip is not always the same.
  const [offset] = useState(() => Math.floor(Math.random() * sources.length))

  // One effect owns the whole lifecycle. The previous version had three
  // overlapping effects that each called a shared loadVideo(), and the one that
  // built the <video> element listed videoTexture in its own dependency array
  // while calling setVideoTexture inside — so every texture swap tore the
  // element down and rebuilt it, restarting playback.
  useEffect(() => {
    if (!active || sources.length === 0) return

    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.playsInline = true
    // Autoplay policies only allow muted starts; we unmute shortly after.
    video.muted = true
    video.volume = 0
    video.src = sources[(offset + sequence) % sources.length]

    const texture = new THREE.VideoTexture(video)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.colorSpace = THREE.SRGBColorSpace
    // Authored glTF UVs use a top-left image origin.
    texture.flipY = !screen

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
  }, [active, sequence, offset, screen, sources])

  useEffect(() => {
    if (!screen || !active || !videoTexture) return
    const material = new THREE.MeshBasicMaterial({ map: videoTexture, toneMapped: false })
    const originals: Array<[THREE.Mesh, THREE.Material | THREE.Material[]]> = []
    screen.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        originals.push([object, object.material])
        object.material = material
      }
    })
    return () => {
      for (const [mesh, original] of originals) mesh.material = original
      material.dispose()
    }
  }, [screen, active, videoTexture])

  // The anchored path has already swapped the material above; nothing to draw.
  if (!active || !videoTexture || screen || !overlay) return null

  // Fallback for rooms with no `screen_procrastinate` mesh: float a quad where
  // the chapter says the monitor is.
  return (
    <mesh
      position={overlay.position}
      rotation={overlay.rotation}
      scale={[overlay.size[0], overlay.size[1], 1]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={videoTexture} toneMapped={false} />
    </mesh>
  )
}

export function RoomScene({ page, onBusyChange }: RoomSceneProps) {
  const { roomModel } = useSharedModel()
  const { chapter, pending } = useChapter()
  const roomRef = useRef<THREE.Group>(null)
  // Procrastinate mode is shared with the page content outside the Canvas, so
  // it lives in a context rather than in this component.
  const { active: procrastinateMode, sequence } = useProcrastinate()
  // Shots authored inside the room, once we have been able to read them out.
  const [authoredShots, setAuthoredShots] = useState({})
  const [derivedShots, setDerivedShots] = useState({})
  // World-space extent of the room, so the key light's shadow frustum can be
  // sized to it rather than to a guess.
  const [bounds, setBounds] = useState<{
    centre: THREE.Vector3
    radius: number
    /** Half the diagonal of the floor plan; sizes the arrival shot. */
    footprint: number
  } | null>(null)
  // Clickable objects in the room, authored as `hotspot_*` empties.
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [cameraMoving, setCameraMoving] = useState(false)
  // Which room the camera has taken its starting pose for; the room is only
  // drawn once that matches, so the first frames never show it from the
  // default camera. Keyed like the intro, by the loaded scene.
  const [placedKey, setPlacedKey] = useState<string | null>(null)
  // Auto-framing needs the real viewport shape: the scene is a wide letterbox.
  const aspect = useThree((s) => s.size.width / s.size.height)

  // Read `shot_*` cameras out of the room once it is in the scene graph. This
  // runs against the positioned group, not the raw GLB, so the shots come back
  // in world space with ROOM_TRANSFORM already applied.
  useEffect(() => {
    if (!roomModel?.scene || !roomRef.current) return
    const authored = extractShots(roomRef.current)
    setAuthoredShots(authored)
    // Auto-framing from the room's own bounds, so a room with no authored
    // cameras is still viewable rather than inheriting another room's framing.
    setDerivedShots(deriveShots(roomRef.current, aspect))

    const screenMesh = roomRef.current.getObjectByName('screen_procrastinate')
    const screenPosition = screenMesh
      ? screenMesh.getWorldPosition(new THREE.Vector3())
      : chapter.screen
        ? new THREE.Vector3(...chapter.screen.position)
        : undefined

    setHotspots(
      extractHotspots(roomRef.current, {
        // Only hand-composed shots: auto-framed ones stare at the middle of the
        // bounding box, which is not an object anyone would click.
        composedShots: { ...chapter.fallbackShots, ...authored },
        sections: chapter.sections,
        // No screen to play on means no procrastinate marker either.
        screenPosition: chapter.videos?.length ? screenPosition : undefined,
      })
    )

    const box = new THREE.Box3().setFromObject(roomRef.current)
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const size = box.getSize(new THREE.Vector3())
    setBounds({
      centre: sphere.center.clone(),
      radius: sphere.radius,
      footprint: Math.hypot(size.x, size.z) / 2,
    })
  }, [roomModel, aspect, chapter])

  const shots = useMemo(
    () => resolveShots(authoredShots, chapter.fallbackShots, derivedShots),
    [authoredShots, chapter.fallbackShots, derivedShots]
  )
  const videoScreen = useMemo(
    () => roomModel?.scene.getObjectByName('screen_procrastinate') ?? null,
    [roomModel]
  )
  const activeShot = shots[procrastinateMode ? 'procrastinate' : page]

  // One arrival per room model: keyed on the loaded scene, not the chapter,
  // because the chapter switches a beat before its model has finished loading
  // and the bounds measured in between belong to the room being left.
  const intro = useMemo<RigIntro | null>(
    () =>
      bounds && roomModel
        ? { key: roomModel.scene.uuid, centre: bounds.centre, footprint: bounds.footprint }
        : null,
    [bounds, roomModel]
  )

  // A playing video needs frames just as much as a moving camera does.
  const busy = cameraMoving || procrastinateMode
  useEffect(() => {
    onBusyChange?.(busy)
  }, [busy, onBusyChange])

  // Published for page-level choreography (useStageNavigation), which waits
  // for the camera to land before scrolling the content.
  useEffect(() => {
    setStageMoving(cameraMoving)
  }, [cameraMoving])

  if (!roomModel) return null;

  return (
    <>
      <CameraRig
        shot={activeShot}
        onMovingChange={setCameraMoving}
        intro={intro}
        holdIntro={pending !== null}
        onPlaced={setPlacedKey}
      />

      {bounds && <RoomLighting centre={bounds.centre} radius={bounds.radius} />}

      <group
        ref={roomRef}
        // Bounds, shots and hotspots are still read from it while hidden:
        // Box3 and raycasting ignore visibility.
        visible={placedKey === roomModel.scene.uuid}
        position={chapter.transform.position}
        scale={chapter.transform.scale}
        rotation={chapter.transform.rotation}
      >
        <primitive object={roomModel.scene} />
      </group>

      {/* Hidden while procrastinating, where they would sit on top of the
          video you just asked to watch; while the camera is moving, where
          they would slide around the screen; and while travelling, where they
          would dot the overhead plan waiting under the map. They fade back in
          on arrival. */}
      {!procrastinateMode && !cameraMoving && !pending && (
        <HotspotMarkers hotspots={hotspots} currentSection={page} />
      )}

      <VideoScreen
        active={procrastinateMode}
        sequence={sequence}
        sources={chapter.videos ?? []}
        screen={videoScreen}
        overlay={chapter.screen}
      />
    </>
  );
}