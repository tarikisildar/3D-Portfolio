'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useChapter } from './ChapterContext'

interface ModelContextType {
  roomModel: {
    scene: THREE.Group
    isLoaded: boolean
  } | null
  /** Set if the room could not be loaded after all retries. */
  error: string | null
}

const ModelContext = createContext<ModelContextType>({
  roomModel: null,
  error: null,
})

export const useSharedModel = () => useContext(ModelContext)

const MAX_RETRIES = 3

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Release every GPU resource a room holds. */
function disposeModel(model: THREE.Object3D) {
  const textures = new Set<THREE.Texture>()

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return

    child.geometry?.dispose()

    const materials: THREE.Material[] = Array.isArray(child.material)
      ? child.material
      : child.material
        ? [child.material]
        : []

    for (const material of materials) {
      // Collect every texture slot, not just `map` — the palette pipeline also
      // produces emissive and metallic-roughness maps, and leaking those would
      // defeat the point of unloading a chapter before loading the next.
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value)
      }
      material.dispose()
    }
  })

  for (const texture of textures) texture.dispose()
}

/** Runtime prep. All the heavy lifting already happened at build time. */
function prepareScene(scene: THREE.Group) {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.frustumCulled = true
      // Opting in is required: the Canvas enables the shadow map and the key
      // light casts, but three ignores both unless the meshes say so.
      child.castShadow = true
      child.receiveShadow = true
      // The room never moves, so per-frame matrix recomputation is wasted work.
      child.matrixAutoUpdate = false
      child.updateMatrix()
    }
  })
  scene.updateMatrixWorld(true)
}

async function loadRoom(url: string): Promise<THREE.Group> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  // Geometry is meshopt-compressed by the asset pipeline. This is a REQUIRED
  // glTF extension, so without the decoder the load hard-fails.
  const { MeshoptDecoder } = await import(
    'three/examples/jsm/libs/meshopt_decoder.module.js'
  )

  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)

  const gltf = await loader.loadAsync(url)
  return gltf.scene
}

/**
 * Loads the active chapter's room, and swaps it when the chapter changes.
 *
 * The old room is dropped from state and disposed *before* the next one is
 * fetched, so two rooms are never resident at once. That matters on mobile,
 * where holding two furnished rooms in GPU memory is the difference between
 * working and a lost context — and it is why the map transition is worth
 * having as a curtain: it covers exactly this gap.
 */
export function ModelProvider({ children }: { children: React.ReactNode }) {
  const { chapter } = useChapter()
  const url = chapter.model

  const [scene, setScene] = useState<THREE.Group | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let loaded: THREE.Group | null = null

    // Unload the outgoing room first.
    setScene(null)
    setError(null)

    // A chapter whose room has not been built yet. Nothing to fetch, and not an
    // error — Scene3D shows an under-construction panel instead.
    if (!url) return

    void (async () => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const next = await loadRoom(url)

          // The chapter changed (or we unmounted) while this was in flight.
          if (cancelled) {
            disposeModel(next)
            return
          }

          prepareScene(next)
          loaded = next
          setScene(next)
          return
        } catch (err) {
          if (cancelled) return

          if (attempt === MAX_RETRIES) {
            console.error(`Failed to load room "${url}" after ${MAX_RETRIES} retries`, err)
            setError(`Could not load ${chapter.label}.`)
            return
          }
          await delay(1000 * (attempt + 1))
        }
      }
    })()

    return () => {
      cancelled = true
      if (loaded) disposeModel(loaded)
    }
  }, [url, chapter.label])

  const value = {
    roomModel: scene ? { scene, isLoaded: true } : null,
    error,
  }

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
}
