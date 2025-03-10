'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

// Define interface for our model context
interface ModelContextType {
  roomModel: {
    scene: THREE.Group;
    isLoaded: boolean;
  } | null;
  reloadModel: () => void;
}

// Interface for Window with optional gc method
interface WindowWithGC extends Window {
  gc?: () => void;
}

// Create context with default empty value
const ModelContext = createContext<ModelContextType>({
  roomModel: null,
  reloadModel: () => {}
})

// Path to the model we want to preload and share
const ROOM_MODEL_PATH = '/models/room_4.glb'

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
  const loadModel = async () => {
    if (typeof window === 'undefined' || isLoading.current) return

    isLoading.current = true

    try {
      // Import the GLTF loader
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')

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

      // Store the loader for potential reuse
      loaderRef.current = loader

      console.log('Loading room model...')

      // Configure texture settings (not by overriding constants)
      // Instead we'll apply settings to each texture individually

      // Load the model and handle the result
      const gltf = await loader.loadAsync(ROOM_MODEL_PATH)
      console.log('Model loaded, applying optimizations...')

      // Clone the scene to avoid reference issues
      const modelScene = gltf.scene

      // Quickly find and optimize all textures
      const textureCache = new Map<string, THREE.Texture>()

      modelScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.frustumCulled = true
          child.matrixAutoUpdate = false
          child.updateMatrix()

          // Try to merge child geometries if possible to reduce draw calls
          if (child.geometry) {
            // Set geometry to static usage to reduce GPU updates
            if (child.geometry.attributes.position) {
              child.geometry.attributes.position.usage = THREE.StaticDrawUsage
              child.geometry.attributes.position.needsUpdate = false
            }
            if (child.geometry.attributes.normal) {
              child.geometry.attributes.normal.usage = THREE.StaticDrawUsage
              child.geometry.attributes.normal.needsUpdate = false
            }
            if (child.geometry.attributes.uv) {
              child.geometry.attributes.uv.usage = THREE.StaticDrawUsage
              child.geometry.attributes.uv.needsUpdate = false
            }
          }

          // Optimize materials and textures
          if (child.material) {
            // Handle both single materials and material arrays
            const materials = Array.isArray(child.material) ? child.material : [child.material]

            materials.forEach(material => {
              // Disable material updates after initial optimization
              material.needsUpdate = true

              // Check if this material has a map texture
              if ('map' in material && material.map) {
                const texture = material.map

                // Optimize texture settings
                texture.minFilter = THREE.NearestFilter
                texture.magFilter = THREE.NearestFilter
                texture.anisotropy = 1
                texture.generateMipmaps = false
                texture.needsUpdate = true

                // Use a single texture instance for identical textures
                const texturePath = texture.image?.src || ''
                if (texturePath && textureCache.has(texturePath)) {
                  material.map = textureCache.get(texturePath)
                } else if (texturePath) {
                  textureCache.set(texturePath, texture)
                }
              }

              // Adjust material parameters to reduce GPU load
              if (material instanceof THREE.MeshStandardMaterial) {
                material.envMapIntensity = 0.5
                material.roughness = 0.5
                material.metalness = 0.3
              }
            })
          }
        }
      })

      // Force an update of the world matrix once
      modelScene.updateMatrixWorld(true)

      // Set state
      setScene(modelScene)
      setIsLoaded(true)
      retryCount.current = 0
      console.log('Model successfully loaded and optimized')

      // Force a garbage collection hint 1 second after loading
      // to help clear any temporary objects created during loading
      setTimeout(() => {
        if (typeof window !== 'undefined' && 'gc' in window) {
          try {
            // Try to call garbage collection if available
            const win = window as WindowWithGC;
            if (win.gc) {
              win.gc();
            }
          } catch {
            // Ignore errors if gc is not available
          }
        }

        // Release references to loader resources
        loaderRef.current = null

        // Clear texture cache
        textureCache.clear()
      }, 1000)
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
  }

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
  }, [isLoaded])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scene) {
        disposeModel(scene)
      }
    }
  }, [])

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