'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PerspectiveCamera } from '@react-three/drei'
import { useSharedModel } from './ModelContext'
import { usePathname } from 'next/navigation'

// Define camera positions for different pages
const cameraPositions = {
  home: {
    position: [0.51,0.18,-5.19] as [number, number, number],
    target: [-0.29,-2.48,4.41] as [number, number, number],
    fov: 35
  },
  about: {
    position: [0.79,-0.7,-1.68] as [number, number, number],
    target: [8.02,-0.87,5.63] as [number, number, number],
    fov: 40
  },
  projects: {
    position: [-1.39,-0.77,-1.27] as [number, number, number],
    target: [-5.23,-4.1,7.34] as [number, number, number],
    fov: 35
  },
  cv: {
    position: [-0.53,-1,-0.39] as [number, number, number],
    target: [-0.54,-2,-0.38] as [number, number, number],
    fov: 40
  },
  blog: {
    position: [1.55,-1.37,0.09] as [number, number, number],
    target: [-8.07,-2.33,-2.47] as [number, number, number],
    fov: 50
  },
  notFound: {
    position: [0, 8, 12] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 70
  },
  // Using the exact values the user manually tested
  procrastinate: {
    position: [-0.43,-1.06,-1.06] as [number, number, number],
    target: [-8.33,-2.71,4.85] as [number, number, number],
    fov: 60
  }
}

export type PageType = keyof typeof cameraPositions;

interface RoomSceneProps {
  page: PageType;
  debugMode?: boolean;
}

// Create persistent refs outside the component to preserve state between renders
const cameraInitialized = { current: false };
const currentCamera = {
  position: new THREE.Vector3(),
  target: new THREE.Vector3(),
  fov: 45
};

// Debug UI component to display camera information
function DebugInfo({ camera }: { camera: THREE.PerspectiveCamera | null }) {
  const [cameraInfo, setCameraInfo] = useState({
    position: [0, 0, 0],
    target: [0, 0, 0],
    fov: 0
  });

  useFrame(() => {
    if (camera) {
      // Get camera target (just use the direction the camera is facing + position)
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const target = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(10));

      setCameraInfo({
        position: [
          parseFloat(camera.position.x.toFixed(2)),
          parseFloat(camera.position.y.toFixed(2)),
          parseFloat(camera.position.z.toFixed(2))
        ],
        target: [
          parseFloat(target.x.toFixed(2)),
          parseFloat(target.y.toFixed(2)),
          parseFloat(target.z.toFixed(2))
        ],
        fov: parseFloat(camera.fov.toFixed(1))
      });

      // Log to console only when significant changes occur (every 30 frames)
      if (Math.random() < 0.03) {
        console.log(`Camera Debug Position: [${cameraInfo.position}] Target: [${cameraInfo.target}] FOV: ${cameraInfo.fov}`);
        console.log(`Camera Debug Copy-Paste Format:
position: [${cameraInfo.position}] as [number, number, number],
target: [${cameraInfo.target}] as [number, number, number],
fov: ${cameraInfo.fov}`);
      }
    }
  });

  // Create a DOM element overlay for debugging
  useEffect(() => {
    // Create debug panel
    const debugPanel = document.createElement('div');
    debugPanel.id = 'camera-debug-panel';
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.left = '10px';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.zIndex = '10000';
    debugPanel.style.width = '300px';
    debugPanel.style.pointerEvents = 'none';

    // Add copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Camera Config';
    copyButton.style.display = 'block';
    copyButton.style.marginTop = '10px';
    copyButton.style.padding = '5px';
    copyButton.style.backgroundColor = '#4CAF50';
    copyButton.style.border = 'none';
    copyButton.style.borderRadius = '3px';
    copyButton.style.color = 'white';
    copyButton.style.cursor = 'pointer';
    copyButton.style.pointerEvents = 'auto';

    copyButton.addEventListener('click', () => {
      const configText = `position: [${cameraInfo.position}] as [number, number, number],
target: [${cameraInfo.target}] as [number, number, number],
fov: ${cameraInfo.fov}`;

      navigator.clipboard.writeText(configText)
        .then(() => {
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = 'Copy Camera Config';
          }, 2000);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    });

    // Add to document
    document.body.appendChild(debugPanel);
    debugPanel.appendChild(copyButton);

    // Update function
    const updateDebugInfo = () => {
      debugPanel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold;">CAMERA DEBUG</div>
        <div>Position: [${cameraInfo.position}]</div>
        <div>Target: [${cameraInfo.target}]</div>
        <div>FOV: ${cameraInfo.fov}</div>
        <div style="margin-top: 8px; font-size: 10px; color: #aaa;">
          Move camera with mouse. Copy values for your cameraPositions object.
        </div>
      `;
      debugPanel.appendChild(copyButton);
    };

    // Set up interval to update
    const interval = setInterval(updateDebugInfo, 100);

    // Cleanup
    return () => {
      clearInterval(interval);
      document.body.removeChild(debugPanel);
    };
  }, []);

  return null;
}

// Super simple camera animation
function AnimatedCamera({ page, debugMode = false }: { page: PageType, debugMode?: boolean }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const [lastPage, setLastPage] = useState<PageType | null>(null)
  const [animating, setAnimating] = useState(false)
  const { camera } = useThree()

  // Animation configuration
  const startTimeRef = useRef(0)
  const startPosRef = useRef(new THREE.Vector3())
  const endPosRef = useRef(new THREE.Vector3())
  const startTargetRef = useRef(new THREE.Vector3())
  const endTargetRef = useRef(new THREE.Vector3())
  const startFovRef = useRef(45)
  const endFovRef = useRef(45)

  // Animation duration in seconds
  const DURATION = 2.5

  // Don't run camera animations if in debug mode
  useEffect(() => {
    if (debugMode) {
      console.log("Debug mode active - camera animations disabled");
      return;
    }

    if (!cameraRef.current) return;

    // Only run this once - subsequent mounts will use the previous camera state
    if (!cameraInitialized.current) {
      console.log(`Camera: FIRST TIME setup for page: ${page}`);

      // Set initial camera position
      const pos = cameraPositions[page].position;
      const target = cameraPositions[page].target;
      const fov = cameraPositions[page].fov;

      // Update camera
      cameraRef.current.position.set(pos[0], pos[1], pos[2]);
      cameraRef.current.lookAt(new THREE.Vector3(target[0], target[1], target[2]));
      cameraRef.current.fov = fov;
      cameraRef.current.updateProjectionMatrix();

      // Store in our persistent state
      currentCamera.position.copy(cameraRef.current.position);
      currentCamera.target.set(target[0], target[1], target[2]);
      currentCamera.fov = fov;

      cameraInitialized.current = true;
      setLastPage(page);
    } else {
      // On subsequent mounts, restore from our saved state
      console.log(`Camera: Restoring camera from previous state for page: ${page}`);
      cameraRef.current.position.copy(currentCamera.position);
      cameraRef.current.lookAt(currentCamera.target);
      cameraRef.current.fov = currentCamera.fov;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [page, debugMode]);

  // Handle page changes for animation
  useEffect(() => {
    if (debugMode) return; // Skip animations in debug mode

    if (!cameraRef.current) return;
    if (!lastPage) {
      setLastPage(page);
      return;
    }

    if (lastPage !== page) {
      console.log(`Camera: STARTING ANIMATION from ${lastPage} to ${page}`);

      // Start animation
      setAnimating(true);
      startTimeRef.current = Date.now() / 1000; // Current time in seconds

      // Get starting position (current camera position)
      startPosRef.current.copy(cameraRef.current.position);
      cameraRef.current.getWorldDirection(startTargetRef.current);
      startTargetRef.current.multiplyScalar(10).add(cameraRef.current.position);
      startFovRef.current = cameraRef.current.fov;

      // Get ending position
      const targetPos = cameraPositions[page].position;
      endPosRef.current.set(targetPos[0], targetPos[1], targetPos[2]);

      const targetLook = cameraPositions[page].target;
      endTargetRef.current.set(targetLook[0], targetLook[1], targetLook[2]);

      endFovRef.current = cameraPositions[page].fov;

      setLastPage(page);
    }
  }, [page, lastPage, debugMode]);

  // Debug overlay
  // Update camera position display and log position when significant changes happen
  useEffect(() => {
    if (debugMode && cameraRef.current) {
      console.log("Debug mode active - move the camera with OrbitControls and check the console for position data");
    }
  }, [debugMode]);

  // Animation loop
  useFrame(() => {
    if (!cameraRef.current) return;

    // Skip animations in debug mode
    if (debugMode) {
      // In debug mode, sync with OrbitControls camera
      if (camera && camera !== cameraRef.current) {
        cameraRef.current.position.copy(camera.position);
        cameraRef.current.rotation.copy(camera.rotation);

        // Add a type check for the camera
        if ('fov' in camera) {
          cameraRef.current.fov = camera.fov;
          cameraRef.current.updateProjectionMatrix();
        }
      }
      return;
    }

    if (animating) {
      const currentTime = Date.now() / 1000;
      const elapsed = currentTime - startTimeRef.current;

      if (elapsed < DURATION) {
        // Use cubic easing for smoother motion
        const t = Math.min(1, elapsed / DURATION);
        const smoothT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        // Every 5% of progress, log a message
        const progress = Math.floor(smoothT * 100);
        if (progress % 5 === 0 && Math.random() < 0.2) {
          console.log(`Camera animation progress: ${progress}%`);
        }

        // Interpolate position
        cameraRef.current.position.lerpVectors(
          startPosRef.current,
          endPosRef.current,
          smoothT
        );

        // Save in persistent state
        currentCamera.position.copy(cameraRef.current.position);

        // Interpolate target - we have to look at the interpolated target
        const currentTarget = new THREE.Vector3().lerpVectors(
          startTargetRef.current,
          endTargetRef.current,
          smoothT
        );

        cameraRef.current.lookAt(currentTarget);
        currentCamera.target.copy(currentTarget);

        // Interpolate fov
        cameraRef.current.fov = startFovRef.current + (endFovRef.current - startFovRef.current) * smoothT;
        cameraRef.current.updateProjectionMatrix();
        currentCamera.fov = cameraRef.current.fov;
      } else {
        // Ensure we end exactly at the target values
        cameraRef.current.position.copy(endPosRef.current);
        cameraRef.current.lookAt(endTargetRef.current);
        cameraRef.current.fov = endFovRef.current;
        cameraRef.current.updateProjectionMatrix();

        // Save final state
        currentCamera.position.copy(endPosRef.current);
        currentCamera.target.copy(endTargetRef.current);
        currentCamera.fov = endFovRef.current;

        setAnimating(false);
        console.log('Camera animation complete');
      }
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 1, 5]}
        fov={45}
        near={0.1}
        far={100}
      />
      {debugMode && <DebugInfo camera={cameraRef.current} />}
    </>
  );
}

// Simple fallback model
function SimpleRoomReplacement() {
  return (
    <group position={[0, -1, 0]}>
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 0.2, 2]} />
        <meshBasicMaterial color="#964B00" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshBasicMaterial color="#4287f5" />
      </mesh>
    </group>
  )
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
      procrastinateButton.addEventListener('click', onToggle);

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

// Video Screen component that renders content on the computer screen when in procrastinate mode
function VideoScreen({ active, onChangeVideo }: { active: boolean, onChangeVideo: () => void }) {
  const [videoTexture, setVideoTexture] = useState<THREE.Texture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Create a video element that will be reused
  useEffect(() => {
    // Create the video element once
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.loop = true;
    // Start muted to avoid autoplay restrictions
    video.muted = true;
    video.volume = 0;
    // Store reference for cleanup
    videoRef.current = video;

    // Load a video
    if (active) {
      loadVideo(video);
    }

    // Cleanup on unmount
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
        videoRef.current = null;
      }
      if (videoTexture) {
        videoTexture.dispose();
        setVideoTexture(null);
      }
    };
  }, []); // Only run once on mount

  // Function to load a video into the video element
  const loadVideo = useCallback((videoElement: HTMLVideoElement) => {
    // Choose a random video
    const videoSources = [
      '/videos/hoffman.mp4',
      '/videos/office.mp4',
      '/videos/shorts.mp4',
      '/videos/radiohead.mp4',
    ];
    const randomIndex = Math.floor(Math.random() * videoSources.length);

    // Set source and play
    videoElement.src = videoSources[randomIndex];

    // Create and set texture
    const texture = new THREE.VideoTexture(videoElement);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;

    setVideoTexture(texture);

    // Play the video (with muted for autoplay policy)
    videoElement.play().catch(err => {
      console.error('Error playing video:', err);
    });

    // After a short delay, try unmuting
    setTimeout(() => {
      try {
        videoElement.muted = false;
        videoElement.volume = 0.5;
      } catch (error) {
        console.log('Could not unmute video:', error);
      }
    }, 1000);
  }, []);

  // Handle active state changes
  useEffect(() => {
    if (videoRef.current) {
      if (active) {
        loadVideo(videoRef.current);
      } else {
        // Pause and reset when not active
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        videoRef.current.volume = 0;
      }
    }
  }, [active, loadVideo]);

  // Handle video change
  useEffect(() => {
    const handleChange = () => {
      if (active && videoRef.current) {
        // Pause current video
        videoRef.current.pause();
        // Load a new one
        loadVideo(videoRef.current);
      }
    };

    // This is a hack to access the latest onChangeVideo function
    // We create an object that will be stable across renders
    const ref = { current: handleChange };

    // Call the handler whenever onChangeVideo changes
    ref.current();

  }, [active, onChangeVideo, loadVideo]);

  // If not active or no texture, don't render
  if (!active || !videoTexture) return null;

  // Using the exact position values the user manually tested
  return (
    <mesh
      position={[-1.243,-1.155,-0.86]}
      rotation={[0, Math.PI*0.699, 0]}
      scale={[0.61, 0.365, 0.01]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={videoTexture} toneMapped={false} />
    </mesh>
  );
}

// Main RoomScene component with super simplified texture handling
export function RoomScene({ page, debugMode = false }: RoomSceneProps) {
  const { roomModel } = useSharedModel()
  const modelRef = useRef<THREE.Group>(null)
  const [useSimpleModel, setUseSimpleModel] = useState(false)
  const [texturesOptimized, setTexturesOptimized] = useState(false)
  const [procrastinateMode, setProcrastinateMode] = useState(false);
  const [videoChangeCounter, setVideoChangeCounter] = useState(0);
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

  // Minimal texture optimization to prevent WebGL context loss
  useEffect(() => {
    if (roomModel?.scene && modelRef.current && !texturesOptimized) {
      try {
        console.log("Applying minimal texture optimizations...");

        // Very basic optimizations
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            child.matrixAutoUpdate = false;
            child.frustumCulled = true;
          }
        });

        setTexturesOptimized(true);
      } catch (error) {
        console.error('Error optimizing model:', error);
        setUseSimpleModel(true);
      }
    }
  }, [roomModel]);

  // Skip rendering if model isn't loaded
  if (!roomModel) return null;

  return (
    <>
      <AnimatedCamera page={procrastinateMode ? 'procrastinate' : page} debugMode={debugMode} />

      {!useSimpleModel ? (
        // Room model with optimized textures
        <primitive
          ref={modelRef}
          object={roomModel.scene}
          position={[0, -2, 0]}
          scale={1.5}
          rotation={[0, Math.PI/4, 0]}
        />
      ) : (
        <SimpleRoomReplacement />
      )}

      <ambientLight intensity={0.7} />

      <VideoScreen
        active={procrastinateMode}
        onChangeVideo={changeVideo}
        key={videoChangeCounter}
      />

      {!debugMode && (
        <ProcrastinateButtons
          isActive={procrastinateMode}
          onToggle={toggleProcrastinate}
          onNextVideo={changeVideo}
        />
      )}
    </>
  );
}