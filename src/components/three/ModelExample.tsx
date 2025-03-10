'use client'

import { Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useGLTF, Environment, Text } from '@react-three/drei'
import { ModelsGroup, ModelPlaceholder } from './ModelLoader'
// Import models data from models.ts
import { blogModels, homeModels, projectsModels } from '@/data/models'
import * as THREE from 'three'

// Table component that serves as the base
function Table() {
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
    <primitive object={scene} position={[0, -1, 0]} scale={2} />
  )
}

// Section label component
function SectionLabel({ text, position }: { text: string; position: [number, number, number] }) {
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

// Custom camera that starts at a nice viewing angle
function TableCamera() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[0, 7, 9]}
      fov={35}
      near={0.1}
      far={100}
    />
  )
}

export default function ModelExample() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 100
      }}>
        <h2>Figurines on a Table</h2>
        <p>Use mouse to orbit, scroll to zoom</p>
        <p>Models are organized by category</p>
      </div>

      <Canvas shadows>
        <color attach="background" args={['#f0f0f0']} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[5, 8, 5]}
          intensity={1.5}
          shadow-mapSize={[1024, 1024]}
          shadow-normalBias={0.04}
        >
          <orthographicCamera
            attach="shadow-camera"
            args={[-10, 10, 10, -10, 0.1, 20]}
          />
        </directionalLight>

        {/* Add some rim light */}
        <spotLight
          position={[-5, 5, -5]}
          intensity={0.5}
          angle={0.5}
          penumbra={1}
        />

        {/* Custom camera with nice viewing angle */}
        <TableCamera />

        {/* Controls - limited to avoid seeing under the table */}
        <OrbitControls
          makeDefault
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.45}
          enablePan={true}
          enableZoom={true}
          minDistance={5}
          maxDistance={15}
          target={[0, 0.5, 0]}
        />

        {/* Environment for better lighting and reflections */}
        <Environment preset="apartment" />

        {/* The table base */}
        <Suspense fallback={<ModelPlaceholder position={[0, 0, 0]} scale={3} />}>
          <Table />
        </Suspense>

        {/* Section labels */}
        <SectionLabel text="Home Gadgets" position={[-2.5, 1.5, -2]} />
        <SectionLabel text="Blog Items" position={[2.5, 1.5, -2]} />
        <SectionLabel text="Projects" position={[0, 1.5, 2]} />

        {/* Models arranged as figurines on the table */}
        <Suspense fallback={<ModelPlaceholder position={[0, 0, 0]} scale={1} />}>
          {/* Home models row - left side of table */}
          <group position={[-2.5, 0, -2]}>
            <ModelsGroup models={homeModels.map(model => ({
              ...model,
              position: [
                model.position[0] * 0.5,
                0.6, // Height above table
                model.position[2] * 0.5
              ],
              scale: model.scale * 0.15 // Smaller scale for figurines
            }))} />
          </group>

          {/* Blog models row - right side of table */}
          <group position={[2.5, 0, -2]}>
            <ModelsGroup models={blogModels.map(model => ({
              ...model,
              position: [
                model.position[0] * 0.5,
                0.6, // Height above table
                model.position[2] * 0.5
              ],
              scale: model.scale * 0.15 // Smaller scale for figurines
            }))} />
          </group>

          {/* Project models row - back of table */}
          <group position={[0, 0, 2]}>
            <ModelsGroup models={projectsModels.map(model => ({
              ...model,
              position: [
                model.position[0] * 0.5,
                0.6, // Height above table
                model.position[2] * 0.5
              ],
              scale: model.scale * 0.15 // Smaller scale for figurines
            }))} />
          </group>
        </Suspense>
      </Canvas>
    </div>
  )
}