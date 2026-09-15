'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'

// Define interface for our model context
interface ModelContextType {
  roomModel: {
    scene: THREE.Group;
    isLoaded: boolean;
  } | null;
  reloadModel: () => void;
}

// Create context with default empty value
const ModelContext = createContext<ModelContextType>({
  roomModel: null,
  reloadModel: () => {}
})

// Path to the model we want to preload and share.
// Built from models-src/ by `npm run models` — do not hand-edit the output.
const ROOM_MODEL_PATH = '/models/rooms/munich.glb'

// Hook for components to easily access our shared model
export const useSharedModel = () => useContext(ModelContext)

// Provider component that loads and shares the models
export function ModelProvider({ children }: { children: React.ReactNode }) {
  // Track loading state
  const [isLoaded, setIsLoaded] = useState(false)
  const [scene, setScene] = useState<THREE.Group | null>(null)
  const loaderRef = useRef<object | null>(null)
  const retryCount = useRef(0)
  const maxRetries = 3
  const isLoading = useRef(false)

  // Model loading with texture optimization
  const loadModel = useCallback(async () => {
    if (typeof window === 'undefined' || isLoading.current) return

    isLoading.current = true

    try {
      // Import the GLTF loader
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      // Geometry is meshopt-compressed by the asset pipeline. This is a
      // REQUIRED glTF extension, so without the decoder the load hard-fails.
      const { MeshoptDecoder } = await import(
        'three/examples/jsm/libs/meshopt_decoder.module.js'
      )

      // Create a load manager that will help us track and optimize loading
      const manager = new THREE.LoadingManager()

      // Setup progress reporting
      manager.onProgress = (url, loaded, total) => {
        console.log(`Loading model: ${Math.round(loaded / total * 100)}%`)
      }

      // Add error handler
      manager.onError = (url) => {
        console.error(`Error loading: ${url}`)
      }

      // Create the loader with our custom manager
      const loader = new GLTFLoader(manager)
      loader.setMeshoptDecoder(MeshoptDecoder)

      // Store the loader for potential reuse
      loaderRef.current = loader

      console.log('Loading room model...')

      // Configure texture settings (not by overriding constants)
      // Instead we'll apply settings to each texture individually

      // Load the model and handle the result
      const gltf = await loader.loadAsync(ROOM_MODEL_PATH)
      console.log('Model loaded, applying optimizations...')

      const modelScene = gltf.scene

      // Mesh, material and texture de-duplication all happen at build time now
      // (see scripts/optimize-models.mjs), so nothing needs rewriting here.
      // The only runtime work left is marking the geometry static: the room
      // never moves, so we can skip per-frame matrix recomputation.
      //
      // Deliberately NOT touched any more:
      //  - texture filtering. The previous NearestFilter + generateMipmaps:false
      //    made distant surfaces alias badly while saving almost no memory.
      //    The glTF samplers already specify correct trilinear filtering.
      //  - roughness/metalness/envMapIntensity. Overwriting these flattened
      //    every surface in the room to the same plastic finish.
      modelScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.frustumCulled = true
          child.matrixAutoUpdate = false
          child.updateMatrix()
        }
      })

      // Force an update of the world matrix once
      modelScene.updateMatrixWorld(true)

      // Set state
      setScene(modelScene)
      setIsLoaded(true)
      retryCount.current = 0

      // Drop our reference to the loader; the decoded scene no longer needs it.
      // (There used to be a window.gc() call here, but that only exists behind
      // a Chrome launch flag and was a no-op for every real visitor.)
      loaderRef.current = null
    } catch (error) {
      console.error('Error loading model:', error)

      // Retry logic with backoff
      if (retryCount.current < maxRetries) {
        retryCount.current++
        const backoffTime = 1000 * retryCount.current
        console.log(`Retrying load in ${backoffTime}ms, attempt ${retryCount.current}/${maxRetries}`)
        setTimeout(loadModel, backoffTime)
      }
    } finally {
      // Clear loading flag
      isLoading.current = false
    }
  }, []);

  // Reload model function with more caution
  const reloadModel = () => {
    // Only reload if not already loading and there's a problem
    if (!isLoading.current && (scene === null || !isLoaded)) {
      console.log('Reloading model...')

      // Clean up memory first
      if (scene) {
        disposeModel(scene)
        setScene(null)
      }

      setIsLoaded(false)

      // Wait a bit before reloading to allow memory cleanup
      setTimeout(loadModel, 1000)
    }
  }

  // Helper to dispose model resources
  const disposeModel = (model: THREE.Object3D) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose()
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => {
              // Dispose textures first
              if ('map' in material && material.map) {
                material.map.dispose()
              }
              // Then dispose the material
              material.dispose()
            })
          } else {
            // Dispose textures first
            if ('map' in child.material && child.material.map) {
              child.material.map.dispose()
            }
            // Then dispose the material
            child.material.dispose()
          }
        }
      }
    })
  }

  // Initial load on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoaded && !isLoading.current) {
      // Add a small delay to allow component mount
      const timer = setTimeout(loadModel, 300)
      return () => clearTimeout(timer)
    }
  }, [isLoaded, loadModel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scene) {
        disposeModel(scene)
      }
    }
  }, [scene])

  // Create event listener for tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && scene) {
        // When tab is hidden, free some GPU memory
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.frustumCulled = true
          }
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [scene])

  // Create value to be provided by context
  const value = {
    roomModel: scene ? { scene, isLoaded } : null,
    reloadModel
  }

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  )
}