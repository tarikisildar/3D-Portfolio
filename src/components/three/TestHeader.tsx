'use client'

import { Suspense, ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Box, Center, Text, OrbitControls, PerspectiveCamera } from '@react-three/drei'

function TestScene() {
  return (
    <Box position={[0, 0, 0]} args={[1, 1, 1]}>
      <meshStandardMaterial color="red" />
    </Box>
  )
}

function LoadingFallback() {
  return (
    <Center>
      <Text
        color="white"
        fontSize={0.5}
        anchorX="center"
        anchorY="middle"
      >
        Loading...
      </Text>
    </Center>
  )
}

interface TestHeaderProps {
  children?: ReactNode;
  height?: string;
  showControls?: boolean;
  cameraPosition?: [number, number, number];
}

export default function TestHeader({
  children,
  height = '400px',
  showControls = true,
  cameraPosition = [0, 0, 10]
}: TestHeaderProps) {
  return (
    <div style={{ width: '100%', height: height }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={cameraPosition} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[1, 2, 3]} intensity={1.5} />
        {showControls && <OrbitControls />}
        <Suspense fallback={<LoadingFallback />}>
          {children || <TestScene />}
        </Suspense>
      </Canvas>
    </div>
  )
}