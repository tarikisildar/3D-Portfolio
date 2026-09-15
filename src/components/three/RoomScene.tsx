'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSharedModel } from './ModelContext'
import { usePathname } from 'next/navigation'
import { trackProcrastinateAction } from '@/utils/analytics'
import { CameraRig } from './CameraRig'
import { extractShots, resolveShots, type PageType } from './shots'

/**
 * Where the room sits in the scene. Shots authored inside the GLB are read from
 * world space, so they inherit this automatically — which is why a room can be
 * built anywhere in the .blend at any size and still frame correctly.
 */
const ROOM_TRANSFORM = {
  position: [0, -2, 0] as [number, number, number],
  scale: 1.5,
  rotation: [0, Math.PI / 4, 0] as [number, number, number],
}

// Camera shots now live in src/components/three/shots.ts: authored as cameras
// inside the room GLB, with the old hand-tuned values kept as a fallback.
// The ~300 lines that used to sit here (a hardcoded position table, an
// on-screen debug panel for copying coordinates out of the running site, and a
// camera animator built on module-level mutable singletons) are gone.

interface RoomSceneProps {
  page: PageType;
}

/**
 * Holds the render loop open while something is actually moving.
 *
 * The Canvas runs frameloop="demand", which is right for a room that sits
 * still almost all the time. But "demand" alone cannot drive a multi-second
 * animation: calling invalidate() from inside useFrame does not reliably chain
 * frame to frame, and — worse — the delta handed to useFrame is wall-clock time
 * since the previous render, so after an idle pause the first frame of a move
 * would carry several seconds and skip straight to the end.
 *
 * Switching to "always" for the duration of a move gives normal ~16ms deltas,
 * then we drop back to "demand" and stop burning GPU on a static image.
 */
function FrameloopController({ active }: { active: boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    setFrameloop(active ? 'always' : 'demand')
    // One last frame on the way down, so we settle on the final pose.
    if (!active) invalidate()
  }, [active, setFrameloop, invalidate])

  return null
}

// UI buttons for procrastination feature
function ProcrastinateButtons({
  isActive,
  onToggle,
  onNextVideo
}: {
  isActive: boolean,
  onToggle: () => void,
  onNextVideo: () => void
}) {
  // Create DOM buttons
  useEffect(() => {
    // Create container for the buttons
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1000';
    container.style.display = 'flex';
    container.style.gap = '10px';

    if (isActive) {
      // Create exit button
      const exitButton = document.createElement('button');
      exitButton.textContent = 'Exit';
      exitButton.style.padding = '8px 16px';
      exitButton.style.backgroundColor = '#f44336';
      exitButton.style.color = 'white';
      exitButton.style.border = 'none';
      exitButton.style.borderRadius = '4px';
      exitButton.style.fontFamily = 'sans-serif';
      exitButton.style.fontWeight = 'bold';
      exitButton.style.cursor = 'pointer';
      exitButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      exitButton.style.transition = 'all 0.2s ease';

      // Hover effect
      exitButton.addEventListener('mouseenter', () => {
        exitButton.style.backgroundColor = '#f77066';
        exitButton.style.transform = 'translateY(-2px)';
        exitButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      });

      exitButton.addEventListener('mouseleave', () => {
        exitButton.style.backgroundColor = '#f44336';
        exitButton.style.transform = 'translateY(0)';
        exitButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      });

      // Click handler
      exitButton.addEventListener('click', onToggle);

      // Create next video button
      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next Video';
      nextButton.style.padding = '8px 16px';
      nextButton.style.backgroundColor = '#4CAF50';
      nextButton.style.color = 'white';
      nextButton.style.border = 'none';
      nextButton.style.borderRadius = '4px';
      nextButton.style.fontFamily = 'sans-serif';
      nextButton.style.fontWeight = 'bold';
      nextButton.style.cursor = 'pointer';
      nextButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      nextButton.style.transition = 'all 0.2s ease';

      // Hover effect
      nextButton.addEventListener('mouseenter', () => {
        nextButton.style.backgroundColor = '#6abf6e';
        nextButton.style.transform = 'translateY(-2px)';
        nextButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      });

      nextButton.addEventListener('mouseleave', () => {
        nextButton.style.backgroundColor = '#4CAF50';
        nextButton.style.transform = 'translateY(0)';
        nextButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      });

      // Click handler
      nextButton.addEventListener('click', onNextVideo);

      // Add buttons to container
      container.appendChild(exitButton);
      container.appendChild(nextButton);
    } else {
      // Create procrastinate button
      const procrastinateButton = document.createElement('button');
      procrastinateButton.textContent = 'Procrastinate';
      procrastinateButton.style.padding = '8px 16px';
      procrastinateButton.style.backgroundColor = '#ff6b6b';
      procrastinateButton.style.color = 'white';
      procrastinateButton.style.border = 'none';
      procrastinateButton.style.borderRadius = '4px';
      procrastinateButton.style.fontFamily = 'sans-serif';
      procrastinateButton.style.fontWeight = 'bold';
      procrastinateButton.style.cursor = 'pointer';
      procrastinateButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      procrastinateButton.style.transition = 'all 0.2s ease';

      // Hover effect
      procrastinateButton.addEventListener('mouseenter', () => {
        procrastinateButton.style.backgroundColor = '#ff8787';
        procrastinateButton.style.transform = 'translateY(-2px)';
        procrastinateButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      });

      procrastinateButton.addEventListener('mouseleave', () => {
        procrastinateButton.style.backgroundColor = '#ff6b6b';
        procrastinateButton.style.transform = 'translateY(0)';
        procrastinateButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      });

      // Click handler
      procrastinateButton.addEventListener('click', () => {
        // Track procrastinate button click
        trackProcrastinateAction('button_click', {
          location: 'room_scene'
        });

        // Call the original toggle function
        onToggle();
      });

      // Add button to container
      container.appendChild(procrastinateButton);
    }

    // Add container to correct parent - in the Scene3D component's div
    const canvasParent = document.querySelector('div[style*="width: 100%; height: 100%"]');
    if (canvasParent) {
      canvasParent.appendChild(container);
    } else {
      // Fallback to document.body if we can't find the canvas parent
      document.body.appendChild(container);
    }

    // Clean up on unmount
    return () => {
      if (canvasParent && canvasParent.contains(container)) {
        canvasParent.removeChild(container);
      } else if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
  }, [isActive, onToggle, onNextVideo]);

  return null;
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
    // FrameloopController keeps the loop running while procrastinate mode is
    // on, which is what actually pushes new video frames to the texture.
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

export function RoomScene({ page }: RoomSceneProps) {
  const { roomModel } = useSharedModel()
  const roomRef = useRef<THREE.Group>(null)
  const [procrastinateMode, setProcrastinateMode] = useState(false);
  const [videoChangeCounter, setVideoChangeCounter] = useState(0);
  // Shots authored inside the room, once we have been able to read them out.
  const [authoredShots, setAuthoredShots] = useState({})
  const [cameraMoving, setCameraMoving] = useState(false)
  const pathname = usePathname();

  // Function to toggle procrastinate mode
  const toggleProcrastinate = useCallback(() => {
    setProcrastinateMode(prev => !prev);
  }, []);

  // Function to change to next video
  const changeVideo = useCallback(() => {
    setVideoChangeCounter(prev => prev + 1);
  }, []);

  // Turn off procrastinate mode when navigating between pages
  useEffect(() => {
    setProcrastinateMode(false);
  }, [pathname]);

  // Read `shot_*` cameras out of the room once it is in the scene graph. This
  // runs against the positioned group, not the raw GLB, so the shots come back
  // in world space with ROOM_TRANSFORM already applied.
  useEffect(() => {
    if (!roomModel?.scene || !roomRef.current) return
    setAuthoredShots(extractShots(roomRef.current))
  }, [roomModel])

  const shots = useMemo(() => resolveShots(authoredShots), [authoredShots])
  const activeShot = shots[procrastinateMode ? 'procrastinate' : page]

  if (!roomModel) return null;

  return (
    <>
      {/* A playing video needs frames too, not just a moving camera. */}
      <FrameloopController active={cameraMoving || procrastinateMode} />

      <CameraRig shot={activeShot} onMovingChange={setCameraMoving} />

      <group
        ref={roomRef}
        position={ROOM_TRANSFORM.position}
        scale={ROOM_TRANSFORM.scale}
        rotation={ROOM_TRANSFORM.rotation}
      >
        <primitive object={roomModel.scene} />
      </group>

      {/* Lighting lives in Scene3D. There used to be a second ambientLight
          here, which stacked with that one to 1.5 total and washed out the
          directional light, leaving every surface in the room shadeless. */}

      <VideoScreen active={procrastinateMode} sequence={videoChangeCounter} />

      <ProcrastinateButtons
        isActive={procrastinateMode}
        onToggle={toggleProcrastinate}
        onNextVideo={changeVideo}
      />
    </>
  );
}