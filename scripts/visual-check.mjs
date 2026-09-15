/**
 * Renders the same camera shots against two GLB files and writes PNGs, so an
 * asset-pipeline change can be eyeballed instead of trusted.
 *
 * Usage:
 *   node scripts/visual-check.mjs <baseline.glb> <candidate.glb> [outDir]
 *
 * Lighting, model transform and camera shots mirror RoomScene/Scene3D exactly,
 * otherwise the comparison proves nothing.
 */

import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Mirrors cameraPositions in src/components/three/RoomScene.tsx
const SHOTS = {
  home: { position: [0.51, 0.18, -5.19], target: [-0.29, -2.48, 4.41], fov: 35 },
  about: { position: [0.79, -0.7, -1.68], target: [8.02, -0.87, 5.63], fov: 40 },
  projects: { position: [-1.39, -0.77, -1.27], target: [-5.23, -4.1, 7.34], fov: 35 },
  cv: { position: [-0.53, -1, -0.39], target: [-0.54, -2, -0.38], fov: 40 },
  blog: { position: [1.55, -1.37, 0.09], target: [-8.07, -2.33, -2.47], fov: 50 },
};

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
};

const PAGE = `<!doctype html>
<html><head><style>html,body{margin:0;overflow:hidden;background:#f5e5d3}</style></head>
<body>
<script type="importmap">
{"imports":{
  "three":"/node_modules/three/build/three.module.js",
  "three/addons/":"/node_modules/three/examples/jsm/"
}}
</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const params = new URLSearchParams(location.search);
const modelUrl = params.get('model');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(1);
renderer.setSize(900, 600);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f5e5d3');

// Lighting identical to Scene3D.tsx
scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const dir = new THREE.DirectionalLight(0xffffff, 1.7);
dir.position.set(10, 10, 5);
scene.add(dir);

const camera = new THREE.PerspectiveCamera(45, 900 / 600, 0.1, 100);

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

window.__shot = (shot) => {
  camera.position.set(...shot.position);
  camera.lookAt(new THREE.Vector3(...shot.target));
  camera.fov = shot.fov;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
};

loader.load(modelUrl, (gltf) => {
  const model = gltf.scene;
  // Matches the <primitive> transform in RoomScene.tsx
  model.position.set(0, -2, 0);
  model.scale.setScalar(1.5);
  model.rotation.set(0, Math.PI / 4, 0);
  scene.add(model);

  let prims = 0;
  model.traverse((o) => { if (o.isMesh) prims++; });
  window.__stats = { meshes: prims };
  window.__ready = true;
}, undefined, (err) => {
  window.__error = String(err && err.message || err);
  window.__ready = true;
});
</script>
</body></html>`;

async function serve() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(PAGE);
    }
    try {
      const body = await readFile(join(ROOT, decodeURIComponent(url.pathname)));
      res.writeHead(200, {
        'Content-Type': MIME[extname(url.pathname)] || 'application/octet-stream',
      });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(0, r));
  return { server, port: server.address().port };
}

async function capture(browser, port, modelPath, label, outDir) {
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 600, deviceScaleFactor: 1 });

  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto(`http://localhost:${port}/?model=${encodeURIComponent(modelPath)}`, {
    waitUntil: 'networkidle0',
  });
  await page.waitForFunction('window.__ready === true', { timeout: 30000 });

  const loadError = await page.evaluate(() => window.__error);
  if (loadError) throw new Error(`${label}: model failed to load -> ${loadError}`);

  const stats = await page.evaluate(() => window.__stats);

  for (const [name, shot] of Object.entries(SHOTS)) {
    await page.evaluate((s) => window.__shot(s), shot);
    const buf = await page.screenshot({ type: 'png' });
    await writeFile(join(outDir, `${name}__${label}.png`), buf);
  }

  await page.close();
  return { stats, errors };
}

async function main() {
  const [baseline, candidate, outArg] = process.argv.slice(2);
  if (!baseline || !candidate) {
    console.error('usage: node scripts/visual-check.mjs <baseline.glb> <candidate.glb> [outDir]');
    process.exit(1);
  }
  const outDir = outArg || join(ROOT, '.visual-check');
  await mkdir(outDir, { recursive: true });

  const { server, port } = await serve();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=metal', '--enable-unsafe-swiftshader'],
  });

  try {
    const a = await capture(browser, port, baseline, 'baseline', outDir);
    const b = await capture(browser, port, candidate, 'optimized', outDir);

    console.log(`baseline  ${baseline}`);
    console.log(`  meshes rendered: ${a.stats.meshes}`);
    if (a.errors.length) console.log(`  errors: ${a.errors.join('; ')}`);
    console.log(`optimized ${candidate}`);
    console.log(`  meshes rendered: ${b.stats.meshes}`);
    if (b.errors.length) console.log(`  errors: ${b.errors.join('; ')}`);
    console.log(`\nPNGs in ${outDir}`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
