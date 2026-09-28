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
 * Frame a box from a given direction, backing off just far enough that all of
 * it fits the viewport.
 *
 * Fitting the bounding *sphere* is the tempting shortcut, but it fails badly
 * for rooms that are wide and flat: an 11m apartment with 1.4m walls has a
 * sphere dominated by its width, so fitting that sphere against the vertical
 * field of view parks the camera ~37 units away and the room ends up a speck.
 *
 * Instead, project the eight corners into camera space and solve for the
 * distance at which every one of them is inside the frustum, horizontally and
 * vertically. `aspect` matters: the scene is a wide letterbox, so the
 * horizontal field of view is far more generous than the vertical one.
 */
function frameBox(
  box: THREE.Box3,
  direction: [number, number, number],
  fov: number,
  aspect: number,
  padding = 1.06
): Shot {
  const centre = box.getCenter(new THREE.Vector3())
  const dir = new THREE.Vector3(...direction).normalize()

  // Camera basis: it sits along +dir and looks back at the centre.
  const forward = dir.clone().negate()
  const right = new THREE.Vector3().crossVectors(forward, WORLD_UP).normalize()
  const up = new THREE.Vector3().crossVectors(right, forward).normalize()

  const tanV = Math.tan((fov * Math.PI) / 360)
  const tanH = tanV * aspect

  const corner = new THREE.Vector3()
  let distance = 0

  for (let i = 0; i < 8; i++) {
    corner.set(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z
    )
    corner.sub(centre)

    // Depth toward the camera, and offsets across the view plane.
    const depth = corner.dot(dir)
    const x = Math.abs(corner.dot(right))
    const y = Math.abs(corner.dot(up))

    distance = Math.max(distance, depth + x / tanH, depth + y / tanV)
  }

  const eye = centre.clone().addScaledVector(dir, distance * padding)
  const m = new THREE.Matrix4().lookAt(eye, centre, WORLD_UP)

  return {
    position: eye,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(m),
    fov,
  }
}

/**
 * Auto-framed shots derived from wherever the room actually is.
 *
 * A new room with no `shot_*` cameras would otherwise inherit framing tuned for
 * a different room entirely — and since rooms vary hugely in size (a 3m study
 * versus an 11m apartment), that means the camera ends up inside a wall or out
 * in space. These are not good shots, but they are *correct* ones: every angle
 * sees the whole room. Authoring cameras in Blender replaces them.
 */
export function deriveShots(
  root: THREE.Object3D,
  aspect: number
): Record<PageType, Shot> {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)

  return {
    home: frameBox(box, [1, 0.8, 1], 35, aspect),
    about: frameBox(box, [-1, 0.65, 1], 40, aspect),
    projects: frameBox(box, [1, 0.65, -1], 40, aspect),
    cv: frameBox(box, [0.2, 1.4, 0.5], 45, aspect),
    blog: frameBox(box, [-1, 0.55, -1], 45, aspect),
    notFound: frameBox(box, [0.6, 1.1, 1], 55, aspect, 1.5),
    procrastinate: frameBox(box, [1, 0.8, 1], 35, aspect),
  }
}

/**
 * Precedence: cameras authored in the room, then the chapter's own table, then
 * auto-framing from the room's bounds, then a fixed wide view.
 *
 * A half-authored room therefore stays navigable instead of pointing the camera
 * at nothing.
 */
export function resolveShots(
  authored: Partial<Record<PageType, Shot>>,
  chapterFallbacks: Partial<Record<PageType, Shot>> = {},
  derived: Partial<Record<PageType, Shot>> = {}
): Record<PageType, Shot> {
  const merged = { ...derived, ...chapterFallbacks, ...authored }
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
