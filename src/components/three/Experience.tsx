'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'

interface CubeProps {
  position?: [number, number, number];
  scale?: number | [number, number, number];
  [key: string]: unknown;
}

// A simple animated cube that responds to user interaction
function InteractiveCube(props: CubeProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3

      // Scale up/down based on hover state
      meshRef.current.scale.x = THREE.MathUtils.lerp(
        meshRef.current.scale.x,
        hovered ? 1.2 : 1,
        0.1
      )
      meshRef.current.scale.y = THREE.MathUtils.lerp(
        meshRef.current.scale.y,
        hovered ? 1.2 : 1,
        0.1
      )
      meshRef.current.scale.z = THREE.MathUtils.lerp(
        meshRef.current.scale.z,
        hovered ? 1.2 : 1,
        0.1
      )
    }
  })

  return (
    <mesh
      {...props}
      ref={meshRef}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={active ? 'hotpink' : hovered ? '#60a5fa' : '#3b82f6'} />
    </mesh>
  )
}

// A grid of floating objects
function FloatingObjects() {
  const objects = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    if (objects.current) {
      objects.current.children.forEach((child, i) => {
        // Make each object float up and down slightly
        const offset = i * 0.2
        child.position.y = Math.sin(clock.elapsedTime * 0.5 + offset) * 0.2
        child.rotation.x = Math.sin(clock.elapsedTime * 0.3 + offset) * 0.2
        child.rotation.z = Math.cos(clock.elapsedTime * 0.2 + offset) * 0.2
      })
    }
  })

  return (
    <group ref={objects}>
      {[...Array(10)].map((_, i) => (
        <InteractiveCube
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
          ]}
          scale={0.5 + Math.random() * 0.5}
        />
      ))}
    </group>
  )
}

// Scene setup
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <FloatingObjects />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <OrbitControls enableZoom={false} enablePan={false} />
    </>
  )
}

export default function Experience() {
  return (
    <div className="experience-container">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <Scene />
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}