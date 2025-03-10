'use client'

import { Suspense } from 'react'
import { Environment } from '@react-three/drei'
import { LoadingFallback } from './TableSceneComponents'
import { RoomScene } from './RoomScene'

export default function NotFoundHeader() {
  return (
    <>
      {/* Environment for better lighting and reflections */}
      <Environment preset="apartment" />

      <Suspense fallback={<LoadingFallback />}>
        {/* Room scene with notFound camera position */}
        <RoomScene page="notFound" />
      </Suspense>
    </>
  )
}