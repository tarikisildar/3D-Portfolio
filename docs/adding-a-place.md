# Adding a new place

Every place you've lived is a **chapter**. This walks through adding one, from
Blender to the live site.

Rough time: an afternoon for the room, ten minutes for the wiring.

---

## 0. Before you model: the three rules

These are the ones that cost rework if you get them wrong.

**Walls at ~1.3 units, not full height.** Munich's are 1.29, Nuremberg's 1.38.
Half-height walls are what let the camera sit outside the room and look in over
the top. Build 2.6m walls and the camera will be blocked in every shot, and
you'll end up cutting them down after the place is furnished.

**Walls single-sided, normals facing into the room.** From outside they're then
backface-culled and invisible; from inside they're solid. This is the other half
of the dollhouse trick and it's free. In Blender: `Material Properties →
Settings → Backface Culling` to preview, and `Mesh → Normals → Recalculate
Outside` (then flip) if a wall is solid from the wrong side. For a flat with
interior walls this is essential — it's what stops the near wall blocking
every shot.

**1 unit = 1 metre, metric scene, and apply transforms.** Free assets arrive at
wildly different scales. Scale on import, then `Ctrl+A → All Transforms`. Skip
this and lighting behaves oddly and shadows go wrong.

### Two things that make it look good

**Use one asset source for the bulk of the room.** Style collision is the main
failure mode when kit-bashing — a photoreal chair in a flat-shaded room reads as
broken and no lighting fixes it. [Poly Pizza](https://poly.pizza),
[Kenney](https://kenney.nl) and [Quaternius](https://quaternius.com) are all CC0
and internally consistent.

**Work from a fixed palette.** Munich's source materials are literally named by
hex code (`039BE5`, `1A1A1A`, `455A64`). That's why it reads as one place
despite being assembled from parts — and it's why the optimizer collapses 165
materials down to 16. Pull those same values across to new rooms for continuity
between chapters.

**Don't hand-optimise.** Don't join meshes, reduce polys, or worry about
material count. The pipeline collapses all of it — Munich went 454 → 16 draw
calls, Nuremberg 634 → 21. That effort is wasted; spend it on the details the
camera will actually look at.

---

## 1. Model the room

One collection per room in `models-src/rooms/rooms.blend`, named after the
chapter (`munich`, `nuremberg`).

Position doesn't matter — build it wherever is convenient next to the others.
Shots are read in world space, so the room's placement and scale come along with
them.

**A note on sparseness.** A bigger place with the same number of props reads as
empty. Keep tight, lived-in clusters (desk, shelf, kitchen counter) and let empty
floor stay empty, then frame shots close to a cluster rather than surveying the
room.

The details are what make it a memory rather than a furniture showroom. Munich
works because of the chalkboard reading *"TARIKIA — Population: 1"*, the Klimt,
the cassettes. Budget your time there — they're also the cheapest thing in the
file, usually a texture on a plane.

---

## 2. Author the camera shots

**This is the step that decides whether the room looks good.**

Without cameras, the site auto-frames from the room's bounding box. That's
correct — you'll see the whole room — but it's a distant dollhouse view. Compare
Munich (authored, sits inside the room, fills the frame) with a freshly imported
room (auto-framed, small and far away). Same pipeline, same lighting; the only
difference is the shots.

For each section the chapter offers:

1. `Add → Camera`
2. Name it **`shot_<section>`** — `shot_home`, `shot_about`, `shot_projects`,
   `shot_cv`, `shot_blog`
3. Fly the viewport to the framing you want, then **`Ctrl+Alt+Numpad0`** to snap
   the camera there
4. **`Numpad0`** to look through it — this is exactly what the site will show,
   including the focal length

That last point is the whole reason for this workflow. You're framing in a real
viewport, through the real lens, in the same file where you built the room. No
copying coordinates, no reload loop.

**Put the camera where a person would stand.** Munich's shots work because
they're at eye level among the furniture, not hovering above it.

You only need shots for the sections this chapter declares (step 5). A chapter
with three sections needs three cameras.

---

## 3. Export

Export the room's collection to `models-src/rooms/<id>.glb`:

- Format: **glTF 2.0 (.glb)**
- Include: **Selected Objects** or **Active Collection**
- Include: **Cameras** ← easy to miss, and nothing works without it
- Transform: **+Y Up**
- Apply modifiers

`models-src/` is source and is not served. `public/models/` is build output —
never edit it by hand, it gets overwritten.

---

## 4. Run the pipeline

```bash
npm run models              # all rooms
npm run models rooms/berlin # just one
```

You'll get a report like:

```
rooms/nuremberg.glb
    shots: home, projects, cv
  5.26 MB -> 1.80 MB
    draw calls          634 ->       21  (-97%)
    materials           148 ->       18  (-88%)
```

**Check the `shots:` line.** If it says *"no shot_* cameras found"*, the Cameras
checkbox was unticked on export, or the cameras aren't named `shot_*`.

To compare before and after visually:

```bash
npm run models:check /models/rooms/old.glb /models/rooms/nuremberg.glb
```

That renders both at the real camera shots with the real lighting and writes
PNGs to `.visual-check/`.

---

## 5. Register the chapter

Add an entry to `src/data/chapters.ts`:

```ts
const BERLIN: Chapter = {
  id: 'berlin',                       // must match the .glb filename
  label: 'Berlin',
  city: 'Berlin',
  coords: [52.52, 13.405],            // [lat, lng] — drives the map flight
  period: ['2026', null],             // null = current
  model: '/models/rooms/berlin.glb',
  transform: {
    position: [0, -2, 0],
    scale: 1.5,                       // keep 1.5 so a metre means the same
    rotation: [0, Math.PI / 4, 0],    // everywhere
  },
  sections: ['home', 'projects', 'cv'],
}

export const chapters: Chapter[] = [MUNICH, NUREMBERG, BERLIN]
```

Keep the array chronological — the timeline and the map flight both use that
order. The **last** entry is the default chapter: a visitor arriving cold meets
where you are now and travels back.

### Adding a place before its room exists

Omit `model`. The chapter appears on the timeline with its real city and dates,
the map still flies there, and the 3D panel shows an under-construction note
instead of a room. Ankara is set up this way.

```ts
export const ANKARA: Chapter = {
  id: 'ankara',
  // ...
  // no `model` yet
  sections: ['home', 'projects', 'blog'],   // shared sections still work
  content: { home: { /* ... */ } },         // no about/cv until written
}
```

Two things it handles for you: no model is fetched, and the transition treats
the chapter as ready immediately rather than waiting for a load that will never
arrive.

**If the new place is in a country the map doesn't cover yet**, add it to
`COUNTRIES` in `scripts/build-map-data.mjs` (and widen `KEEP_BOUNDS` if needed),
then re-run `node scripts/build-map-data.mjs`. Otherwise the flight lands on
blank sea.

**`sections`** is the list of sections this chapter offers. Not every chapter
needs all five: a student flat might have no CV corner, an early chapter might
just be a room with a story. Requiring every chapter to answer every section
means authoring shots and writing content for sections that don't apply.

**Don't add `fallbackShots`.** That field exists only for Munich, whose shots
predate the Blender workflow. New rooms author cameras instead.

---

## 6. Check it

```bash
rm -rf .next && npm run dev
```

(The `rm -rf .next` matters if you've run `npm run build` — a stale production
build breaks turbopack dev with a confusing module-not-found 500.)

The timeline appears bottom-left of the 3D view automatically. Click through to
the new chapter and you should see the map flight, then the room.

Worth checking:

- **Each section's framing.** This is where you find out whether the shots
  needed more thought.
- **The transition both ways.** It holds mid-flight until the room has loaded,
  so a heavy room means a longer flight, not a blank canvas.
- **Changing page mid-camera-move** — click one section then immediately
  another.

---

## How the pieces fit

```
models-src/rooms/rooms.blend       you work here
   │  export (with Cameras ticked)
   ▼
models-src/rooms/<id>.glb          source export, committed, not served
   │  npm run models
   ▼
public/models/<id>.glb             optimised build output, served
   │
   ▼
src/data/chapters.ts               registers it as a chapter
```

**Camera shot precedence**, highest first:

1. `shot_*` cameras in the GLB
2. the chapter's own `fallbackShots` (Munich only)
3. auto-framing from the room's bounding box
4. a fixed wide view

So a half-finished room is always navigable — it just won't be framed well until
you author cameras.

---

## Troubleshooting

**Everything is grey in Blender.** You're in Solid viewport shading, which
ignores materials. Press `Z` → Material Preview. Nothing is wrong with the file.

**Which `.glb` do I open?** `models-src/rooms/<id>.glb` is the source.
`public/models/rooms/<id>.glb` is build output — 16-odd merged meshes named
`Mesh_0`, with palette-baked UVs. You can't kit-bash that, and any edit gets
overwritten on the next `npm run models`.

**The room is in the wrong place or wrong size.** Adjust `transform` in the
chapter, not the .blend. Shots are read in world space, so they follow it.

**The camera is inside a wall.** Almost always a missing or badly placed
`shot_*` camera, so it's falling back to auto-framing or another chapter's
table.

**The room is tiny in frame.** No authored cameras — auto-framing backs off far
enough to fit the whole bounding box. Author shots.

**A wall blocks the view.** That wall is double-sided, or its normals face
outward. See step 0.
