/**
 * Model optimization pipeline.
 *
 * Kit-bashed scenes (a pile of free assets merged in Blender) export with one
 * mesh + one material per object. That is fine for 55k vertices but murder for
 * draw calls. This collapses the scene down to a handful of draw calls without
 * changing how it looks.
 *
 * Usage:
 *   node scripts/optimize-models.mjs                 # all rooms
 *   node scripts/optimize-models.mjs rooms/munich    # one room
 *
 * Source models live in models-src/ and are NOT served. Optimized output goes
 * to public/models/. Re-run after re-exporting from Blender.
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  prune,
  palette,
  flatten,
  join,
  weld,
  textureCompress,
} from '@gltf-transform/functions';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import { dirname, join as pathJoin, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = pathJoin(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = pathJoin(ROOT, 'models-src');
const OUT_DIR = pathJoin(ROOT, 'public/models');

/**
 * Nodes whose names we must never lose. Camera shots are authored in Blender as
 * empties named `shot_<section>` and read back out at load time, so flatten and
 * prune have to leave them alone.
 */
const KEEP_NAME = /^(shot_|anchor_|screen_)/;

/**
 * `join` refuses to merge any node that has a name, and every node in a Blender
 * export is named ("Cube.042", "Chair_L"). Clearing the names we do not care
 * about is what actually lets the merge happen. Anchors keep theirs and so stay
 * addressable at runtime.
 */
function stripIncidentalNames() {
  return (document) => {
    let stripped = 0;
    for (const node of document.getRoot().listNodes()) {
      const name = node.getName();
      if (name && !KEEP_NAME.test(name)) {
        node.setName('');
        stripped++;
      }
    }
    for (const mesh of document.getRoot().listMeshes()) {
      if (!KEEP_NAME.test(mesh.getName() || '')) mesh.setName('');
    }
    console.log(`    stripIncidentalNames: cleared ${stripped} node names`);
  };
}

async function analyze(document) {
  const root = document.getRoot();
  let primitives = 0;
  let vertices = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      primitives++;
      const pos = prim.getAttribute('POSITION');
      if (pos) vertices += pos.getCount();
    }
  }
  return {
    primitives,
    vertices,
    materials: root.listMaterials().length,
    textures: root.listTextures().length,
    nodes: root.listNodes().length,
  };
}

function report(label, before, after) {
  const row = (name, b, a) => {
    const delta = b === a ? '' : `  (${a < b ? '-' : '+'}${Math.abs(
      Math.round(((b - a) / b) * 100)
    )}%)`;
    console.log(
      `    ${name.padEnd(14)} ${String(b).padStart(8)} -> ${String(a).padStart(8)}${delta}`
    );
  };
  console.log(`  ${label}`);
  row('draw calls', before.primitives, after.primitives);
  row('vertices', before.vertices, after.vertices);
  row('materials', before.materials, after.materials);
  row('textures', before.textures, after.textures);
  row('nodes', before.nodes, after.nodes);
}

async function optimize(srcPath, outPath) {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

  await MeshoptEncoder.ready;

  const document = await io.read(srcPath);
  const before = await analyze(document);
  const srcBytes = (await stat(srcPath)).size;

  await document.transform(
    // 1. Collapse byte-identical materials, meshes, textures, accessors. The
    //    exporter emits one material per object even when 50 objects share the
    //    exact same flat colour.
    dedup(),

    // 2. Drop anything nothing references any more.
    //    - keepLeaves protects mesh-less anchor nodes, which are leaves.
    //    - 'Camera' is deliberately absent from propertyTypes: camera shots are
    //      authored in Blender as cameras named shot_<section> and read back at
    //      load time, and prune would otherwise delete every one of them as
    //      unused.
    prune({
      propertyTypes: [
        'Node', 'Skin', 'Mesh', 'Primitive', 'PrimitiveTarget',
        'Animation', 'Material', 'Texture', 'Accessor', 'Buffer',
      ],
      keepLeaves: true,
      keepAttributes: false,
    }),

    // 3. Bake flat-colour materials into a single small palette texture, so
    //    they can all share one material and therefore be merged. This is the
    //    transform that does the heavy lifting on kit-bashed scenes.
    palette({ blockSize: 4, min: 2 }),

    // 4. Clear exporter-generated names so step 6 is allowed to merge.
    stripIncidentalNames(),

    // 5. Flatten the node hierarchy so sibling meshes become joinable.
    flatten(),

    // 6. Merge every mesh that shares a material into one draw call. Anchors
    //    kept their names in step 4 and are skipped.
    join({ keepNamed: true }),

    // 6. Merge duplicate vertices.
    weld(),

    // 7. Re-encode textures as WebP. The cap stays at 2048 and quality high
    //    because several textures (the chalkboard, the CV clipboard) carry
    //    hand-lettered text that the camera pushes right up against, and
    //    softening those is immediately visible.
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      resize: [2048, 2048],
      quality: 90,
    }),

    // 8. Geometry compression. Decodes far faster than Draco and the decoder
    //    is much smaller.
    (doc) => {
      doc
        .createExtension(EXTMeshoptCompression)
        .setRequired(true)
        .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
    }
  );

  const after = await analyze(document);

  // Surface missing camera shots. Without them the room falls back to
  // auto-framing from its bounding box, which is viewable but generic — easy
  // to forget when the room otherwise looks finished.
  const shotNodes = document
    .getRoot()
    .listNodes()
    .filter((n) => (n.getName() || '').startsWith('shot_'));

  if (shotNodes.length === 0) {
    console.log(
      '    note: no shot_* cameras found — the site will auto-frame this room.\n' +
        '          Add cameras named shot_home, shot_projects, … in Blender to\n' +
        '          control the framing.'
    );
  } else {
    console.log(
      `    shots: ${shotNodes.map((n) => n.getName().slice(5)).join(', ')}`
    );
  }

  await mkdir(dirname(outPath), { recursive: true });
  await io.write(outPath, document);
  const outBytes = (await stat(outPath)).size;

  report(
    `${(srcBytes / 1e6).toFixed(2)} MB -> ${(outBytes / 1e6).toFixed(2)} MB`,
    before,
    after
  );

  return { srcBytes, outBytes };
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = pathJoin(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.glb') || entry.name.endsWith('.gltf')) yield full;
  }
}

async function main() {
  const filter = process.argv[2];
  let count = 0;

  for await (const srcPath of walk(SRC_DIR)) {
    const rel = relative(SRC_DIR, srcPath);
    if (filter && !rel.startsWith(filter)) continue;

    const outPath = pathJoin(OUT_DIR, rel.replace(/\.gltf$/, '.glb'));
    console.log(`\n${rel}`);
    await optimize(srcPath, outPath);
    count++;
  }

  if (count === 0) {
    console.log(
      filter
        ? `No models matched "${filter}" under models-src/`
        : 'No models found under models-src/'
    );
  } else {
    console.log(`\nOptimized ${count} model${count === 1 ? '' : 's'}.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
