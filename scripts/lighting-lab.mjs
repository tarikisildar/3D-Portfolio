/**
 * Renders one room shot under several lighting setups, side by side.
 *
 * Lighting is the one thing in this project that cannot be settled by
 * measurement — so rather than arguing about it, this renders the candidates
 * at the room's own authored camera and writes PNGs to compare.
 *
 * Usage:
 *   node scripts/lighting-lab.mjs [roomId] [shotName]
 *   node scripts/lighting-lab.mjs nuremberg home
 */

import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const room = process.argv[2] || 'nuremberg'
const shot = process.argv[3] || 'home'
const OUT = join(ROOT, '.lighting-lab')

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
}

const PAGE = `<!doctype html>
<html><head><style>html,body{margin:0;overflow:hidden;background:#f5e5d3}</style></head><body>
<script type="importmap">
{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const params = new URLSearchParams(location.search);
const W = 1100, H = 420;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f5e5d3');
const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);

// Matches the chapter transform used by the site.
const ROOM = { position: [0, -2, 0], scale: 1.5, rotation: [0, Math.PI / 4, 0] };

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

function applyLighting(name) {
  // Clear previous rig.
  for (const o of [...scene.children]) {
    if (o.isLight || o.userData.rig) scene.remove(o);
  }
  scene.environment = null;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = () => pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  if (name === 'current') {
    // R3F applies ACESFilmicToneMapping unless <Canvas flat>, so the live site
    // is already tone-mapped. Matching it here keeps the comparison honest.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const d = new THREE.DirectionalLight(0xffffff, 1.7);
    d.position.set(10, 10, 5);
    scene.add(d);
  }
  if (name === 'env') {
    scene.environment = env();
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const d = new THREE.DirectionalLight(0xffffff, 1.2);
    d.position.set(10, 10, 5);
    scene.add(d);
  }
  if (name === 'env-shadow') {
    scene.environment = env();
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const d = new THREE.DirectionalLight(0xfff0dd, 1.5);
    d.position.set(9, 12, 6);
    d.castShadow = true;
    d.shadow.mapSize.set(2048, 2048);
    const c = d.shadow.camera;
    c.left = -16; c.right = 16; c.top = 16; c.bottom = -16; c.near = 0.5; c.far = 60;
    d.shadow.bias = -0.0009;
    d.shadow.normalBias = 0.02;
    scene.add(d);
  }
  if (name === 'balanced') {
    scene.environment = env();
    scene.environmentIntensity = 0.45;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    const d = new THREE.DirectionalLight(0xfff1de, 1.6);
    d.position.set(9, 12, 6);
    d.castShadow = true;
    d.shadow.mapSize.set(2048, 2048);
    const c = d.shadow.camera;
    c.left = -16; c.right = 16; c.top = 16; c.bottom = -16; c.near = 0.5; c.far = 60;
    d.shadow.bias = -0.0009; d.shadow.normalBias = 0.02;
    scene.add(d);
    const fill = new THREE.DirectionalLight(0xc3d6ea, 0.35);
    fill.position.set(-8, 3, -6);
    scene.add(fill);
  }
  if (name === 'contrast') {
    scene.environment = env();
    scene.environmentIntensity = 0.3;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    scene.add(new THREE.AmbientLight(0xffffff, 0.06));
    const d = new THREE.DirectionalLight(0xffeccf, 2.2);
    d.position.set(9, 12, 6);
    d.castShadow = true;
    d.shadow.mapSize.set(2048, 2048);
    const c = d.shadow.camera;
    c.left = -16; c.right = 16; c.top = 16; c.bottom = -16; c.near = 0.5; c.far = 60;
    d.shadow.bias = -0.0009; d.shadow.normalBias = 0.02;
    scene.add(d);
    const fill = new THREE.DirectionalLight(0xb6cce4, 0.45);
    fill.position.set(-8, 3, -6);
    scene.add(fill);
  }
  if (name === 'env-shadow-tone') {
    scene.environment = env();
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const d = new THREE.DirectionalLight(0xfff0dd, 2.1);
    d.position.set(9, 12, 6);
    d.castShadow = true;
    d.shadow.mapSize.set(2048, 2048);
    const c = d.shadow.camera;
    c.left = -16; c.right = 16; c.top = 16; c.bottom = -16; c.near = 0.5; c.far = 60;
    d.shadow.bias = -0.0009;
    d.shadow.normalBias = 0.02;
    scene.add(d);
    // Cool bounce from the opposite side, so shadowed faces are not dead grey.
    const fill = new THREE.DirectionalLight(0xbfd4e8, 0.5);
    fill.position.set(-8, 4, -6);
    scene.add(fill);
  }
}

loader.load(params.get('model'), (gltf) => {
  const group = new THREE.Group();
  group.position.set(...ROOM.position);
  group.scale.setScalar(ROOM.scale);
  group.rotation.set(...ROOM.rotation);
  group.add(gltf.scene);
  scene.add(group);

  group.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });

  // Pull the authored shot out of the positioned group, as the site does.
  group.updateMatrixWorld(true);
  const want = 'shot_' + params.get('shot');
  let found = null;
  group.traverse((o) => { if (o.name === want) found = o; });
  if (found) {
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    found.matrixWorld.decompose(p, q, s);
    camera.position.copy(p);
    camera.quaternion.copy(q);
    const cam = found.isCamera ? found : found.children.find((c) => c.isCamera);
    if (cam) camera.fov = cam.fov;
    camera.updateProjectionMatrix();
  }
  window.__shotFound = Boolean(found);

  window.__render = (name) => { applyLighting(name); renderer.render(scene, camera); };
  window.__ready = true;
}, undefined, (e) => { window.__error = String(e); window.__ready = true; });
</script></body></html>`

async function serve() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      return res.end(PAGE)
    }
    try {
      const body = await readFile(join(ROOT, decodeURIComponent(url.pathname)))
      res.writeHead(200, {
        'Content-Type': MIME[extname(url.pathname)] || 'application/octet-stream',
      })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  await new Promise((r) => server.listen(0, r))
  return { server, port: server.address().port }
}

const SETUPS = ['current', 'balanced', 'contrast']

async function main() {
  await mkdir(OUT, { recursive: true })
  const { server, port } = await serve()
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=metal', '--enable-unsafe-swiftshader'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1100, height: 420, deviceScaleFactor: 1 })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))

    const model = `/public/models/rooms/${room}.glb`
    await page.goto(`http://localhost:${port}/?model=${model}&shot=${shot}`, {
      waitUntil: 'networkidle0',
    })
    await page.waitForFunction('window.__ready === true', { timeout: 30000 })

    const err = await page.evaluate(() => window.__error)
    if (err) throw new Error(err)
    const found = await page.evaluate(() => window.__shotFound)
    console.log(`room: ${room}  shot: shot_${shot}  ${found ? '(authored camera)' : '(NOT FOUND — default view)'}\n`)

    for (const setup of SETUPS) {
      await page.evaluate((s) => window.__render(s), setup)
      const buf = await page.screenshot({ type: 'png' })
      await writeFile(join(OUT, `${room}-${shot}-${setup}.png`), buf)
      console.log(`  rendered ${setup}`)
    }
    if (errors.length) console.log('\nerrors:', errors.slice(0, 5))
    console.log(`\nPNGs in .lighting-lab/`)
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
