'use client'

import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Group, Vector3, Euler, Color } from 'three'

// Define the model data interface to match the structure in models.ts
export interface ModelData {
  id: string
  path: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale: number
  color?: string
  animate?: boolean
  floatOptions?: {
    speed: number
    rotationIntensity: number
    floatIntensity: number
  }
}

// Component to load and display an individual model
function Model({ model }: { model: ModelData }) {
  const {
    path,
    position,
    rotation = [0, 0, 0],
    scale,
    color,
    animate = false,
    floatOptions = {
      speed: 1,
      rotationIntensity: 0.5,
      floatIntensity: 0.5
    }
  } = model

  // Load the model using useGLTF
  const { scene } = useGLTF(path)
  const modelRef = useRef<Group>(null)

  // Apply color to the model if specified
  useEffect(() => {
    if (color && scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.color = new Color(color)
              }
            })
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.color = new Color(color)
          }
        }
      })
    }
  }, [color, scene])

  // Handle rotation animation
  useFrame(({ clock }) => {
    if (modelRef.current && animate) {
      // Gentle rotation
      modelRef.current.rotation.y = clock.getElapsedTime() * 0.2
    }
  })

  // Apply shadows to all meshes
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }

    // Preload the model to ensure it's ready when needed
    useGLTF.preload(path)
  }, [path, scene])

  return (
    <Float
      speed={floatOptions.speed}
      rotationIntensity={floatOptions.rotationIntensity}
      floatIntensity={floatOptions.floatIntensity}
      position={position}
    >
      <group
        ref={modelRef}
        rotation={new Euler(...rotation)}
        scale={scale}
      >
        <primitive object={scene} />
      </group>
    </Float>
  )
}

// Component to display a group of models
export function ModelsGroup({ models }: { models: ModelData[] }) {
  return (
    <>
      {models.map((model) => (
        <Model key={model.id} model={model} />
      ))}
    </>
  )
}

// Simple placeholder for loading states
export function ModelPlaceholder({ position = [0, 0, 0], scale = 1 }: { position?: [number, number, number], scale?: number | [number, number, number] }) {
  return (
    <mesh position={new Vector3(...position)} scale={scale}>
      <boxGeometry args={[1, 1, 1, 2, 2, 2]} />
      <meshBasicMaterial wireframe color="red" />
    </mesh>
  )
}