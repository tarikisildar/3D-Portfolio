'use client'

import { useRef, useEffect } from 'react'
import { Text, Center, useGLTF, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

// Simple loading fallback
export function LoadingFallback() {
  return (
    <Center>
      <Text
        color="white"
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
      >
        Loading 3D models...
      </Text>
    </Center>
  )
}

// Table component that serves as the base
export function Table() {
  const { scene } = useGLTF('/models/room_4.glb')

  // Ensure the table casts and receives shadows
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

  return (
    <primitive object={scene} position={[0, -2, 0]} scale={2} rotation={[0, -Math.PI*4/10, 0]}/>
  )
}

// Camera setup
export function TableCamera() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[4, 3.5, 2.5]}
      fov={30}
      near={0.1}
      far={100}
    />
  )
}

// Section label
export function SectionLabel({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Text
      position={position}
      fontSize={0.2}
      color="black"
      anchorX="center"
      anchorY="middle"
      renderOrder={1}
    >
      {text}
    </Text>
  )
}

// Preload the table model
useGLTF.preload('/models/room_4.glb')