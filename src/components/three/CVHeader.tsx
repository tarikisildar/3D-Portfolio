'use client'

import { Suspense } from 'react'
import { Environment } from '@react-three/drei'
import { ModelsGroup } from './ModelLoader'
import { LoadingFallback, Table, TableCamera, SectionLabel } from './TableSceneComponents'
import { cvModels } from '@/data/models'

export default function CVHeader() {
  return (
    <>
      {/* Custom camera with nice viewing angle */}
      <TableCamera />

      {/* Environment for better lighting and reflections */}
      <Environment preset="apartment" />

      <Suspense fallback={<LoadingFallback />}>
        {/* The table base */}
        <Table />

        {/* Section labels */}
        <SectionLabel text="CV" position={[0, 1.5, 0]} />

        {/* CV models on the table */}
        <group position={[0, 0, 0]}>
          <ModelsGroup models={cvModels.map(model => ({
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
    </>
  )
}