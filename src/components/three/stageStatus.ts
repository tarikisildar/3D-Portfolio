/**
 * Whether the stage camera is moving, readable from outside the Canvas.
 *
 * A plain module-level store rather than React state: the one consumer
 * (useStageNavigation) needs to *await* the camera settling from inside an
 * async sequence, which a context value re-rendering the page cannot give it.
 * RoomScene is the only writer.
 */

let moving = false
const listeners = new Set<(moving: boolean) => void>()

export function setStageMoving(next: boolean) {
  if (next === moving) return
  moving = next
  for (const listener of listeners) listener(moving)
}

/**
 * Resolves once the camera has made the move a navigation just asked for.
 *
 * If no move starts within `startWithin` ms (the shot was already in place,
 * or reduced motion skipped it) it resolves then. `maxWait` bounds the whole
 * thing, so a stalled load can never leave the page locked.
 */
export function whenStageSettles({
  startWithin = 600,
  maxWait = 5000,
}: { startWithin?: number; maxWait?: number } = {}): Promise<void> {
  return new Promise((resolve) => {
    let started = moving
    const finish = () => {
      clearTimeout(noStart)
      clearTimeout(cap)
      listeners.delete(onChange)
      resolve()
    }
    const onChange = (now: boolean) => {
      if (now) started = true
      else if (started) finish()
    }
    const noStart = setTimeout(() => {
      if (!started) finish()
    }, startWithin)
    const cap = setTimeout(finish, maxWait)
    listeners.add(onChange)
  })
}
