'use client'

import { Suspense } from 'react'
import { Environment } from '@react-three/drei'
import { LoadingFallback } from './TableSceneComponents'
import { RoomScene } from './RoomScene'

export default function HomeHeader() {
  return (
    <>
      {/* Environment for better lighting and reflections */}
      <Environment preset="apartment" />

      <Suspense fallback={<LoadingFallback />}>
        {/* Room scene with home camera position */}
        <RoomScene page="home" />
      </Suspense>
    </>
  )
}