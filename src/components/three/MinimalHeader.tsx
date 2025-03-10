'use client'

import { useEffect, useRef, ReactNode } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface MinimalHeaderProps {
  children?: ReactNode;
  height?: string;
  showControls?: boolean;
  cameraPosition?: [number, number, number];
  customSetup?: (scene: THREE.Scene) => void | (() => void);
}

export default function MinimalHeader({
  height = '400px',
  showControls = true,
  cameraPosition = [0, 0, 10],
  customSetup,
  children
}: MinimalHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Save a reference to the container that will be stable for the cleanup function
    const container = containerRef.current

    // Setup scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.set(...cameraPosition)

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
    directionalLight.position.set(1, 2, 3)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Add custom content or default cube
    let cleanupCustomContent: (() => void) | void
    let cube: THREE.Mesh | null = null

    if (customSetup) {
      // Use custom setup function
      cleanupCustomContent = customSetup(scene)
    } else {
      // Default content - a simple cube
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
      cube = new THREE.Mesh(geometry, material)
      cube.castShadow = true
      cube.receiveShadow = true
      scene.add(cube)

      // Cleanup function for default content
      cleanupCustomContent = () => {
        if (cube) {
          scene.remove(cube)
          geometry.dispose()
          material.dispose()
        }
      }
    }

    // Add controls if requested
    let controls: OrbitControls | null = null
    if (showControls) {
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
    }

    // Animation loop
    let animationFrameId: number

    const renderScene = () => {
      // Update cube rotation if it exists
      if (cube) {
        cube.rotation.x += 0.01
        cube.rotation.y += 0.01
      }

      // Update controls
      controls?.update()

      // Render
      renderer.render(scene, camera)

      // Continue animation loop
      animationFrameId = requestAnimationFrame(renderScene)
    }

    // Start animation
    renderScene()

    // Handle resize
    const handleResize = () => {
      if (!container) return

      const width = container.clientWidth
      const height = container.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)

      // Run custom cleanup if provided
      if (typeof cleanupCustomContent === 'function') {
        cleanupCustomContent()
      }

      // Dispose of Three.js resources
      renderer.dispose()

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [cameraPosition, showControls, customSetup])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        position: 'relative'
      }}
    >
      {/* We'll render the children here as React nodes outside the canvas,
          but they can also interact with the Three.js scene via refs or context */}
      {children}
    </div>
  )
}