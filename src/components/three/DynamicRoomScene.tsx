'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { useGLTF } from '@react-three/drei'

// Define camera positions for different pages
const cameraPositions = {
  home: {
    position: [4, 3.5, 2.5], // Top-down overview of the scene
    target: [0, 0, 0],
    fov: 30
  },
  about: {
    position: [-2, 1.5, 0], // Looking at the left wall with pictures
    target: [-3, 1, 0],
    fov: 25
  },
  projects: {
    position: [0, 1.5, 3], // Front view of the desk
    target: [0, 0.5, 0],
    fov: 28
  },
  cv: {
    position: [1, 1.2, 0.8], // Zoomed in on the notebook
    target: [0, 0.4, 0],
    fov: 20
  },
  blog: {
    position: [2, 1.5, -2], // Looking at the bookshelf
    target: [1, 1, -3],
    fov: 25
  },
  notFound: {
    position: [0, 1, -3], // Looking at an empty area or something unusual
    target: [0, 0, -4],
    fov: 35
  }
}

// Type for page names
export type PageType = keyof typeof cameraPositions;

interface RoomSceneProps {
  page: PageType;
}

// Room scene component
export function RoomScene({ page }: RoomSceneProps) {
  // Model loading
  const { scene } = useGLTF('/models/room_4.glb')

  // Camera references
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const targetRef = useRef(new THREE.Vector3())
  const { camera } = useThree()

  // Setup camera animation springs
  const { position, fov } = useSpring({
    position: cameraPositions[page].position,
    fov: cameraPositions[page].fov,
    config: { mass: 1, tension: 80, friction: 30 }
  })

  // Create a target vector for the camera to look at
  const target = useSpring({
    to: {
      x: cameraPositions[page].target[0],
      y: cameraPositions[page].target[1],
      z: cameraPositions[page].target[2]
    },
    config: { mass: 1, tension: 80, friction: 30 }
  })

  // Apply shadows to the model
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [scene])

  // Update camera target and position on frame updates
  useFrame(() => {
    if (cameraRef.current) {
      // Update the target position
      targetRef.current.set(target.x.get(), target.y.get(), target.z.get())

      // Make the camera look at the target
      cameraRef.current.lookAt(targetRef.current)

      // Sync the drei camera with the R3F default camera
      camera.position.copy(cameraRef.current.position)
      camera.quaternion.copy(cameraRef.current.quaternion)

      // Update FOV if the camera is a PerspectiveCamera
      if (camera instanceof THREE.PerspectiveCamera && cameraRef.current) {
        camera.fov = cameraRef.current.fov
        camera.updateProjectionMatrix()
      }
    }
  })

  return (
    <>
      {/* Animated camera */}
      <animated.perspectiveCamera
        ref={cameraRef}
        makeDefault
        position={position}
        fov={fov}
        near={0.1}
        far={100}
      />

      {/* Room scene */}
      <primitive
        object={scene}
        position={[0, -2, 0]}
        scale={2}
        rotation={[0, -Math.PI*4/10, 0]}
      />
    </>
  )
}

// Preload model
useGLTF.preload('/models/room_4.glb')