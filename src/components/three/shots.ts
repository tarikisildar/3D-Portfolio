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

/**
 * Build a Shot from an eye/target/fov triple.
 *
 * Only needed for chapters whose rooms predate the Blender-authored camera
 * workflow; new rooms should carry `shot_*` cameras instead.
 */
export function shotFromLookAt(
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
 * Last-resort framing: a wide view of the origin. Used only when a chapter
 * supplies neither an authored nor a fallback shot for a section.
 */
const SAFE_DEFAULT_SHOT: Shot = shotFromLookAt([0, 4, 8], [0, 0, 0], 50)

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
 * Shots authored in the room win; anything it does not define falls back to the
 * chapter's own table, and anything neither supplies falls back to a safe wide
 * view — so a half-finished room is still navigable rather than throwing.
 */
export function resolveShots(
  authored: Partial<Record<PageType, Shot>>,
  chapterFallbacks: Partial<Record<PageType, Shot>> = {}
): Record<PageType, Shot> {
  const merged = { ...chapterFallbacks, ...authored }
  const safe = merged.home ?? SAFE_DEFAULT_SHOT

  return {
    home: merged.home ?? safe,
    about: merged.about ?? safe,
    projects: merged.projects ?? safe,
    cv: merged.cv ?? safe,
    blog: merged.blog ?? safe,
    notFound: merged.notFound ?? safe,
    procrastinate: merged.procrastinate ?? safe,
  }
}
