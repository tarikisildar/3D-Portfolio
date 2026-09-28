'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Lighting for a room.
 *
 * The rooms are lit almost entirely by an image-based environment rather than
 * by lamps. The optimizer bakes flat colours into a palette whose
 * metallic-roughness works out around 0.5 — those surfaces expect something to
 * reflect, and with only an ambient and a single directional light there was
 * nothing there, so everything read as flat and dead. RoomEnvironment is
 * generated procedurally by three, so this costs no download.
 *
 * Shadows needed fixing at both ends: the Canvas had `shadows` and the light
 * had `castShadow`, but no mesh ever set castShadow/receiveShadow, so the
 * shadow map was being rendered and then ignored. Meshes opt in at load time
 * (see ModelContext), and the key light's shadow frustum is sized to the actual
 * room here — the default orthographic box is roughly ±5 units, which would cut
 * shadows off partway across an 11 metre apartment.
 */

/** Image-based light level. Low enough that the key light still shapes things. */
const ENVIRONMENT_INTENSITY = 0.35

type RoomLightingProps = {
  /** World-space centre of the room. */
  centre: THREE.Vector3
  /** World-space bounding radius, used to size the shadow frustum. */
  radius: number
}

export function RoomLighting({ centre, radius }: RoomLightingProps) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04)

    scene.environment = target.texture
    scene.environmentIntensity = ENVIRONMENT_INTENSITY

    return () => {
      scene.environment = null
      target.texture.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  // Comfortably clear of the room, so nothing is clipped out of the shadow map.
  const extent = Math.max(radius * 1.35, 6)
  const distance = Math.max(radius * 2.5, 12)

  return (
    <>
      {/* No ambient light at all. The environment already fills every surface
          from every direction, and adding a uniform term on top of it is what
          flattened the older room: measured, it lifted mean brightness from 125
          to 163 while dropping contrast from 87 to 64. */}

      {/* Key. Slightly warm, and the only shadow caster. */}
      <directionalLight
        castShadow
        color="#fff1de"
        intensity={2.05}
        position={[
          centre.x + distance * 0.5,
          centre.y + distance,
          centre.z + distance * 0.35,
        ]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={0.5}
        shadow-camera-far={distance * 4}
        shadow-bias={-0.0009}
        shadow-normalBias={0.02}
      />

      {/* Cool bounce from the opposite side, so faces turned away from the key
          are shaded rather than simply dark. */}
      <directionalLight
        color="#c3d6ea"
        intensity={0.28}
        position={[centre.x - distance * 0.45, centre.y + distance * 0.3, centre.z - distance * 0.4]}
      />
    </>
  )
}
