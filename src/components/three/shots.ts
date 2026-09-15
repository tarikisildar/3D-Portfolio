import * as THREE from 'three'

/**
 * A camera shot: where the camera sits, which way it faces, and how tight the
 * lens is.
 *
 * Rotation is stored as a quaternion rather than a look-at point on purpose.
 * Interpolating a look-at *point* linearly — which is what this used to do —
 * produces non-uniform angular velocity: the camera whips through the middle of
 * a turn and crawls at both ends. Slerping the rotation gives a constant-rate
 * turn, which is what reads as "cinematic".
 */
export type Shot = {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  fov: number
}

export type PageType =
  | 'home'
  | 'about'
  | 'projects'
  | 'cv'
  | 'blog'
  | 'notFound'
  | 'procrastinate'

/** Objects named `shot_<section>` in a room GLB become that section's shot. */
const SHOT_PREFIX = 'shot_'

/** Used when a shot node carries no camera of its own. */
const DEFAULT_FOV = 40

const WORLD_UP = new THREE.Vector3(0, 1, 0)

/** Build a Shot from the eye/target/fov triples the room used to hardcode. */
function shotFromLookAt(
  position: [number, number, number],
  target: [number, number, number],
  fov: number
): Shot {
  const eye = new THREE.Vector3(...position)
  const at = new THREE.Vector3(...target)
  // Matrix4.lookAt builds the orientation for an object at `eye` facing `at`,
  // matching how Object3D.lookAt orients a camera (down its local -Z).
  const m = new THREE.Matrix4().lookAt(eye, at, WORLD_UP)
  return {
    position: eye,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(m),
    fov,
  }
}

/**
 * Fallback shots for rooms that have no `shot_*` cameras authored in Blender
 * yet. These are the values that were hand-tuned through the old on-screen
 * debug panel, kept so the Munich room keeps working unchanged while the
 * authoring workflow moves into the .blend file.
 */
export const FALLBACK_SHOTS: Record<PageType, Shot> = {
  home: shotFromLookAt([0.51, 0.18, -5.19], [-0.29, -2.48, 4.41], 35),
  about: shotFromLookAt([0.79, -0.7, -1.68], [8.02, -0.87, 5.63], 40),
  projects: shotFromLookAt([-1.39, -0.77, -1.27], [-5.23, -4.1, 7.34], 35),
  cv: shotFromLookAt([-0.53, -1, -0.39], [-0.54, -2, -0.38], 40),
  blog: shotFromLookAt([1.55, -1.37, 0.09], [-8.07, -2.33, -2.47], 50),
  notFound: shotFromLookAt([0, 8, 12], [0, 0, 0], 70),
  procrastinate: shotFromLookAt([-0.43, -1.06, -1.06], [-8.33, -2.71, 4.15], 70),
}

/**
 * Pull camera shots out of a loaded room.
 *
 * Shots are authored in Blender as cameras named `shot_home`, `shot_about` and
 * so on, sitting inside the room itself. That means framing is done in a real
 * viewport, looking through the actual lens, in the same file where the room is
 * built — instead of flying around the live site copying coordinates out of a
 * debug overlay and pasting them into source.
 *
 * `root` must already be positioned in the scene: we read matrixWorld, so
 * whatever transform the room group carries is baked in automatically and the
 * shots stay glued to the furniture.
 */
export function extractShots(root: THREE.Object3D): Partial<Record<PageType, Shot>> {
  root.updateMatrixWorld(true)

  const shots: Partial<Record<PageType, Shot>> = {}
  const position = new THREE.Vector3()
  const quaternion = new THREE.Quaternion()
  const scale = new THREE.Vector3()

  root.traverse((obj) => {
    if (!obj.name.startsWith(SHOT_PREFIX)) return

    const key = obj.name.slice(SHOT_PREFIX.length) as PageType
    if (!key) return

    obj.matrixWorld.decompose(position, quaternion, scale)

    // The exporter may hand us the camera directly, or a node with the camera
    // parented under it. Either way the focal length lives on the camera.
    let fov = DEFAULT_FOV
    if (obj instanceof THREE.PerspectiveCamera) {
      fov = obj.fov
    } else {
      const child = obj.children.find(
        (c): c is THREE.PerspectiveCamera => c instanceof THREE.PerspectiveCamera
      )
      if (child) fov = child.fov
    }

    shots[key] = {
      position: position.clone(),
      quaternion: quaternion.clone(),
      fov,
    }
  })

  return shots
}

/**
 * Shots authored in the room win; anything the room does not define falls back
 * to the hardcoded table, so a half-finished room is still navigable.
 */
export function resolveShots(
  authored: Partial<Record<PageType, Shot>>
): Record<PageType, Shot> {
  return { ...FALLBACK_SHOTS, ...authored }
}
