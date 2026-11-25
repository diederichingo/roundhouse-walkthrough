/**
 * Els's roundhouse, Penamacor — Option B walkthrough v1f. Rev 2026-11-25f.
 * Static three.js site. Dimensions from the B-sheets / geometry.json.
 * Not for construction.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('c');
const loading = document.getElementById('loading');

const TAN7 = Math.tan((7 * Math.PI) / 180);
const DEG = Math.PI / 180;
const mm = (v) => v * 0.001;
/** Roof structure / roof-post raise (m). Cob walls, head plate, openings, plinth,
 *  foundations and the utility top plate are not raised. Final figure from the
 *  Roundhouse bot, 25 Nov 2026, synced to geometry_report_B.txt. */
const ROOF_RAISE = 0.200;
const LAT = 40.17;
const LON = -7.17;
const EYE = 1.70;
const RADIUS = 0.22;
const WALK_SPEED = 2.4;

let G; // geometry.json
let scene, camera, renderer, orbit, sunLight, hemi, fill, sunHelper;
let houseGroup, clashGroup, labelGroup, measureGroup;
let doors = [];
let posts = [];
let colliders = []; // {type:'circle'|'aabb'|'arc'|'post', ...}
let mode = 'orbit';
let clashesOn = false;
let heightsOn = false;
let measureOn = false;
let measurePts = [];
let keys = Object.create(null);
const WALK_START = { x: -2.20, z: -0.35, yaw: 0.55, pitch: -0.08 };
const START_CAM = { x: 15.4, y: 7.6, z: 16.6, tx: 3.6, ty: 1.35, tz: 0.8 };
let yaw = WALK_START.yaw;
let pitch = WALK_START.pitch;
let player = new THREE.Vector3(WALK_START.x, EYE, WALK_START.z);
let fly = null; // {fromPos,toPos,fromTarget,toTarget,t,dur}
let activeClash = null;
let hudLabels = [];
let computedClashes = [];
let headroomOutdoor = null;
let amb;
let headroomPlane = null;
let clashPresets = [];
let joy = {x: 0, y: 0, active: false};
let pointerLocked = false;
let clock = new THREE.Clock();
let textures = {};
let materials = {};
let roofMesh, labels = [];
let raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoverDoor = null;

/**
 * Axis mapping (chosen so a camera looking north has east on the right,
 * matching a person standing in the house):
 *   drawing (x east, y north, z up)  →  world (x, y_up, z = −y)
 *   +X east, +Y up, −Z north, +Z south.
 * coverFFL / soffitFFL take drawing northing in metres.
 */
function wz(yNorth) { return -yNorth; }
function coverFFL(yNorth) { return 3.523923 + ROOF_RAISE + yNorth * TAN7; }
function soffitFFL(yNorth) { return coverFFL(yNorth) - 0.200 - 0.240; }
function beamTopFFL(yNorth) { return coverFFL(yNorth) - 0.200; }
function polar(thetaDeg, r) {
  const t = thetaDeg * DEG;
  // theta 0 = south = +Z, 90 = east = +X. .x east, .y world z.
  return new THREE.Vector2(r * Math.sin(t), r * Math.cos(t));
}
function lerp(a, b, t) { return a + (b - a) * t; }

function noiseTexture(size, c0, c1, grain) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const [r0,g0,b0] = c0, [r1,g1,b1] = c1;
  for (let i = 0; i < size * size; i++) {
    const n = Math.random();
    const k = (n * grain + (1 - grain) * 0.5);
    img.data[i*4]   = r0 + (r1-r0)*k;
    img.data[i*4+1] = g0 + (g1-g0)*k;
    img.data[i*4+2] = b0 + (b1-b0)*k;
    img.data[i*4+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2f6b3c';
  ctx.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#2a6237' : '#347a44';
    ctx.fillRect(i * 32, 0, 30, 64);
    ctx.fillStyle = 'rgba(20,40,20,0.25)';
    ctx.fillRect(i * 32 + 29, 0, 2, 64);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(16, 8);
  return tex;
}

function makeMaterials() {
  textures.cob = noiseTexture(128, [180, 150, 112], [150, 120, 86], 0.85);
  textures.cob.repeat.set(8, 4);
  textures.timber = noiseTexture(64, [176, 126, 82], [130, 88, 54], 0.55);
  textures.stone = noiseTexture(128, [150, 146, 138], [112, 108, 100], 0.75);
  textures.stone.repeat.set(6, 2);
  textures.earth = noiseTexture(128, [164, 130, 90], [130, 100, 68], 0.7);
  textures.earth.repeat.set(10, 10);
  textures.ground = noiseTexture(128, [120, 130, 88], [90, 108, 70], 0.8);
  textures.ground.repeat.set(20, 20);
  textures.roof = stripeTexture();

  materials.cob = new THREE.MeshStandardMaterial({
    map: textures.cob, color: 0xd8c09a, roughness: 0.95, metalness: 0.0
  });
  materials.cobInner = new THREE.MeshStandardMaterial({
    map: textures.cob, color: 0xe8d3b0, roughness: 0.95, metalness: 0.0
  });
  materials.timber = new THREE.MeshStandardMaterial({
    map: textures.timber, color: 0xd2a878, roughness: 0.68, metalness: 0.0
  });
  materials.stone = new THREE.MeshStandardMaterial({
    map: textures.stone, color: 0xb7b3ab, roughness: 0.9, metalness: 0.0
  });
  materials.earth = new THREE.MeshStandardMaterial({
    map: textures.earth, color: 0xc4a882, roughness: 1, metalness: 0
  });
  materials.ground = new THREE.MeshStandardMaterial({
    map: textures.ground, color: 0x8fa06a, roughness: 1, metalness: 0
  });
  materials.roof = new THREE.MeshStandardMaterial({
    map: textures.roof, color: 0x4a9a58, roughness: 0.45, metalness: 0.15
  });
  materials.roofUnder = new THREE.MeshStandardMaterial({
    color: 0xd4b48a, roughness: 0.9, metalness: 0.0,
    emissive: 0x3a3228, emissiveIntensity: 0.35, side: THREE.DoubleSide
  });
  materials.glass = new THREE.MeshStandardMaterial({
    color: 0x6aaec4, roughness: 0.08, metalness: 0.08,
    transparent: true, opacity: 0.48, side: THREE.DoubleSide,
    depthWrite: false, emissive: 0x1a3a4a, emissiveIntensity: 0.22
  });
  materials.headroom = new THREE.MeshBasicMaterial({
    color: 0x3aa0d8, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false
  });
  materials.door = new THREE.MeshStandardMaterial({
    map: textures.timber, color: 0x8e5e36, roughness: 0.65, metalness: 0
  });
  materials.white = new THREE.MeshStandardMaterial({ color: 0xeeeae4, roughness: 0.6 });
  materials.metal = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });
  materials.clash = new THREE.MeshBasicMaterial({
    color: 0xe24b3b, transparent: true, opacity: 0.55, depthTest: true, side: THREE.DoubleSide
  });
  materials.clashAmber = new THREE.MeshBasicMaterial({
    color: 0xe3a02a, transparent: true, opacity: 0.55, depthTest: true, side: THREE.DoubleSide
  });
  materials.clashLine = new THREE.MeshBasicMaterial({ color: 0xff6b5a });
  materials.measure = new THREE.MeshBasicMaterial({ color: 0xffd56a });
}

/* ---------- primitives ---------- */
function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  // We use y-up? NO — we use Z-up to match the drawings (z up from FFL).
  // three.js default is Y-up. I'll use Y-up in three: x east, z south? 
  // Better: x east, z north, y up. Then drawing y maps to world z, drawing z (up) maps to world y.
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// World mapping: (x, y, z) = (east, up, −north).
function W(x, zUp, yNorth) { return new THREE.Vector3(x, zUp, wz(yNorth)); }

function addBox(parent, sx, sy, sz, mat, x, yUp, z, rx=0, ry=0, rz=0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  m.position.set(x, yUp, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** Solid annular wall sector: inner, outer, top, bottom and end-cap reveals.
 *  Unique vertices per face so normals stay correct (no averaged shared verts).
 *  Angles in degrees from south, CCW. y is up from FFL. */
function ringBand(rIn, rOut, th0, th1, y0, y1, mat, segs = 8, innerMat = null) {
  if (th1 < th0) th1 += 360;
  const n = Math.max(2, Math.ceil(Math.max(2, segs) * (th1 - th0) / 20));
  function polarY(th, r, y) {
    const t = th * DEG;
    return new THREE.Vector3(r * Math.sin(t), y, r * Math.cos(t));
  }
  function buildFaces(which) {
    // which: 'inner' | 'shell' (outer + top + bottom + ends)
    const pos = [], nrm = [], uv = [];
    function addTri(a, b, c, normal) {
      const nn = normal.clone().normalize();
      const pts = [a, b, c];
      for (let i = 0; i < 3; i++) {
        pos.push(pts[i].x, pts[i].y, pts[i].z);
        nrm.push(nn.x, nn.y, nn.z);
        uv.push(i === 1 ? 1 : 0, i === 2 ? 1 : 0);
      }
    }
    function addQuad(a, b, c, d, normal) {
      addTri(a, b, c, normal);
      addTri(a, c, d, normal);
    }
    for (let i = 0; i < n; i++) {
      const ta = th0 + (th1 - th0) * (i / n);
      const tb = th0 + (th1 - th0) * ((i + 1) / n);
      const mid = (ta + tb) / 2 * DEG;
      const outN = new THREE.Vector3(Math.sin(mid), 0, Math.cos(mid));
      const inN = outN.clone().negate();
      const i0 = polarY(ta, rIn, y0), o0 = polarY(ta, rOut, y0);
      const o1 = polarY(ta, rOut, y1), i1 = polarY(ta, rIn, y1);
      const i0b = polarY(tb, rIn, y0), o0b = polarY(tb, rOut, y0);
      const o1b = polarY(tb, rOut, y1), i1b = polarY(tb, rIn, y1);
      if (which === 'inner') {
        // Looking from the centre: after −Z = north, increasing theta (CCW) goes right on the south wall.
        addQuad(i0, i0b, i1b, i1, inN);
      } else {
        addQuad(o0b, o0, o1, o1b, outN);
        addQuad(i1, o1, o1b, i1b, new THREE.Vector3(0, 1, 0));
        addQuad(i0b, i0, o0, o0b, new THREE.Vector3(0, -1, 0));
      }
    }
    if (which === 'shell') {
      const t0 = th0 * DEG, t1 = th1 * DEG;
      // pos = (r sin θ, y, r cos θ); CCW tangent (cos, 0, −sin)
      const n0 = new THREE.Vector3(-Math.cos(t0), 0, Math.sin(t0));
      const n1 = new THREE.Vector3(Math.cos(t1), 0, -Math.sin(t1));
      const a = polarY(th0, rIn, y0), b = polarY(th0, rOut, y0);
      const c = polarY(th0, rOut, y1), d = polarY(th0, rIn, y1);
      addQuad(a, d, c, b, n0);
      const e = polarY(th1, rIn, y0), f = polarY(th1, rOut, y0);
      const g = polarY(th1, rOut, y1), h = polarY(th1, rIn, y1);
      addQuad(e, f, g, h, n1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return geo;
  }
  const group = new THREE.Group();
  const shell = new THREE.Mesh(buildFaces('shell'), mat);
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);
  const inner = new THREE.Mesh(buildFaces('inner'), innerMat || (mat === materials.cob ? materials.cobInner : mat));
  inner.castShadow = true;
  inner.receiveShadow = true;
  group.add(inner);
  return group;
}

function taperedMullion(theta, wIn, wOut, depth, y0, y1, mat) {
  // radial trapezoid, 30 in / ~72 out, depth 150 centred on CL (or flush to taper)
  const t = theta * DEG;
  const dirx = Math.sin(t), dirz = Math.cos(t); // outward
  const tx = -dirz, tz = dirx; // tangent CCW
  const rIn = 5.0 - depth / 2;
  const rOut = 5.0 + depth / 2;
  const hwI = wIn / 2, hwO = wOut / 2;
  const corners = [];
  // bottom then top, order: in-ccw, in-cw, out-cw, out-ccw
  function at(r, hw, y) {
    return [dirx * r - tx * hw, y, dirz * r - tz * hw];
  }
  const v = [
    ...at(rIn,  hwI, y0), ...at(rIn, -hwI, y0), ...at(rOut, -hwO, y0), ...at(rOut,  hwO, y0),
    ...at(rIn,  hwI, y1), ...at(rIn, -hwI, y1), ...at(rOut, -hwO, y1), ...at(rOut,  hwO, y1)
  ];
  const idx = [
    0,1,2, 0,2,3, // bottom
    4,7,6, 4,6,5, // top
    0,3,7, 0,7,4, // ccw
    1,5,6, 1,6,2, // cw
    0,4,5, 0,5,1, // inner
    3,2,6, 3,6,7  // outer
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* ---------- model ---------- */

function addCompassRose(parent, grade) {
  const g = new THREE.Group();
  g.name = 'northArrow';
  // South of the 12 m roof (drawing y = −6 m → world z = +6), in the SE view foreground.
  g.position.set(0, grade + 0.02, 8.2);

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 48),
    new THREE.MeshStandardMaterial({ color: 0x3a362e, roughness: 0.9, metalness: 0 })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.receiveShadow = true;
  disc.castShadow = false;
  g.add(disc);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.36, 1.5, 48),
    new THREE.MeshBasicMaterial({ color: 0xe8dcc8, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.008;
  g.add(ring);

  const red = new THREE.MeshBasicMaterial({ color: 0xc4452a });
  const cream = new THREE.MeshBasicMaterial({ color: 0xede3d0 });
  // Shaft: red half points north (−Z), cream half points south (+Z)
  const northShaft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.85), red);
  northShaft.position.set(0, 0.04, -0.42);
  const southShaft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.7), cream);
  southShaft.position.set(0, 0.04, 0.35);
  g.add(northShaft, southShaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 16), red);
  head.rotation.x = -Math.PI / 2; // point toward −Z (north)
  head.position.set(0, 0.05, -1.05);
  g.add(head);

  function letter(text, x, z, color) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.font = 'bold 100px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 70);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.55),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.04, z);
    m.castShadow = false;
    m.receiveShadow = false;
    g.add(m);
  }
  letter('N', 0, -1.22, '#c4452a');
  letter('E', 1.22, 0, '#f3eee6');
  letter('S', 0, 1.22, '#f3eee6');
  letter('W', -1.22, 0, '#f3eee6');
  parent.add(g);
  return g;
}

const _compassDir = new THREE.Vector3();
function updateCompass() {
  const rose = document.getElementById('compassRose');
  if (!rose || !camera) return;
  camera.getWorldDirection(_compassDir);
  // heading 0 = looking north (−Z), clockwise toward east (+X)
  const heading = Math.atan2(_compassDir.x, -_compassDir.z);
  rose.style.transform = `rotate(${-heading}rad)`;
}

function buildModel() {
  houseGroup = new THREE.Group();
  clashGroup = new THREE.Group();
  clashGroup.visible = false;
  labelGroup = new THREE.Group();
  labelGroup.visible = false;
  measureGroup = new THREE.Group();
  scene.add(houseGroup, clashGroup, labelGroup, measureGroup);

  const WALL_T = 0.350;
  const R = 5.0;
  const rIn = R - WALL_T / 2;
  const rOut = R + WALL_T / 2;
  const rPlIn = R - 0.200;
  const rPlOut = R + 0.200;
  const FFL = 0;
  const GRADE = -0.180;
  const PL_TOP = 0.220;
  const SOLE_TOP = 0.370;
  const SILL = 0.400;
  const WIN_HEAD = 2.300;
  const HEAD_SOF = 2.375;
  const HEAD_TOP = 2.475;
  const K_SILL = 1.200;
  const CURVE_T = 0.250;

  // Ground
  const ground = addBox(houseGroup, 40, 0.08, 40, materials.ground, 2, GRADE - 0.04, 0);
  ground.receiveShadow = true;
  ground.castShadow = false;

  // Earth floor inside the house
  const floorGeo = new THREE.CircleGeometry(rPlIn - 0.005, 64);
  floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeo, materials.earth);
  floor.position.y = 0.002;
  floor.receiveShadow = true;
  houseGroup.add(floor);

  // House plinth (full ring) then cut door notches by overlaying darker? 
  // Build as many segments, skip door angular ranges at the upper notch.
  const segs = G.segments;
  const verts = G.vertices;
  const vByTh = new Map(verts.map((v) => [v.theta.toFixed(4), v]));

  function memberHalfDeg(v, r = R) {
    // w_cl in geometry.json is millimetres
    return (mm(v.w_cl) / 2) / r * 180 / Math.PI;
  }

  // Plinth continuous with notches at doors
  segs.forEach((s) => {
    const isDoor = s.kind === 'backdoor' || s.kind === 'gardendoor';
    const v0 = verts.find((v) => Math.abs(v.theta - s.th0) < 1e-4);
    const v1 = verts.find((v) => Math.abs(v.theta - s.th1) < 1e-4) || (s.th1 >= 359.9 ? verts[0] : null);
    const half0 = v0 ? memberHalfDeg(v0) : 0;
    const half1 = v1 ? memberHalfDeg(v1) : 0;
    const a0 = s.th0 + half0;
    const a1 = s.th1 - half1;
    if (a1 <= a0 + 0.05) {
      // still draw under members as solid plinth at this span via member pads later
    } else if (isDoor) {
      // lower plinth up to threshold underside (FFL - 0.040)
      houseGroup.add(ringBand(rPlIn, rPlOut, a0, a1, GRADE, -0.040, materials.stone, 10));
    } else {
      houseGroup.add(ringBand(rPlIn, rPlOut, a0, a1, GRADE, PL_TOP, materials.stone, 10));
    }
    // plinth under the bounding members
    if (v0 && v0.member !== 'post') {
      const h = memberHalfDeg(v0);
      houseGroup.add(ringBand(rPlIn, rPlOut, s.th0 - h, s.th0 + h, GRADE, PL_TOP, materials.stone, 3));
    }
  });
  // close last vertex member (S post has its own pad)
  // Ring-post and cob under posts: small plinth sectors already from adjacent segs.

  // Sole plate (not at doors)
  segs.forEach((s) => {
    const isDoor = s.kind === 'backdoor' || s.kind === 'gardendoor';
    if (isDoor) return;
    const v0 = verts.find((v) => Math.abs(v.theta - s.th0) < 1e-4);
    const v1 = verts.find((v) => Math.abs(v.theta - s.th1) < 1e-4) || (s.th1 >= 359.9 ? verts[0] : null);
    const a0 = s.th0 + (v0 ? memberHalfDeg(v0) : 0);
    const a1 = s.th1 - (v1 ? memberHalfDeg(v1) : 0);
    if (a1 > a0 + 0.05) {
      houseGroup.add(ringBand(R - 0.075, R + 0.075, a0, a1, PL_TOP, SOLE_TOP, materials.timber, 8));
    }
  });

  // Head plate continuous-ish
  segs.forEach((s) => {
    const v0 = verts.find((v) => Math.abs(v.theta - s.th0) < 1e-4);
    const v1 = verts.find((v) => Math.abs(v.theta - s.th1) < 1e-4) || (s.th1 >= 359.9 ? verts[0] : null);
    const a0 = s.th0 + (v0 && v0.member === 'post' ? memberHalfDeg(v0) : 0);
    const a1 = s.th1 - (v1 && v1.member === 'post' ? memberHalfDeg(v1) : 0);
    if (a1 > a0 + 0.05) {
      houseGroup.add(ringBand(R - 0.075, R + 0.075, a0, a1, HEAD_SOF, HEAD_TOP, materials.timber, 8));
    }
  });

  // Upper closing — follow roof underside minus 20 mm slip
  segs.forEach((s) => {
    const v0 = verts.find((v) => Math.abs(v.theta - s.th0) < 1e-4);
    const v1 = verts.find((v) => Math.abs(v.theta - s.th1) < 1e-4) || (s.th1 >= 359.9 ? verts[0] : null);
    const a0 = s.th0;
    const a1 = s.th1;
    const n = Math.max(3, Math.ceil((a1 - a0) / 8));
    for (let i = 0; i < n; i++) {
      const t0 = a0 + (a1 - a0) * (i / n);
      const t1 = a0 + (a1 - a0) * ((i + 1) / n);
      const mid = polar((t0 + t1) / 2, R);
      const top = coverFFL(-mid.y) - 0.020;
      if (top > HEAD_TOP + 0.02) {
        houseGroup.add(ringBand(rIn, rOut, t0, t1, HEAD_TOP, top, materials.cob, 3));
      }
    }
  });

  // Wall fills, windows, doors, members
  const doorDefs = [];

  segs.forEach((s) => {
    const v0 = verts.find((v) => Math.abs(v.theta - s.th0) < 1e-4);
    const v1 = verts.find((v) => Math.abs(v.theta - s.th1) < 1e-4) || (s.th1 >= 359.9 ? verts[0] : null);
    const a0 = s.th0 + (v0 ? memberHalfDeg(v0) : 0);
    const a1 = s.th1 - (v1 ? memberHalfDeg(v1) : 0);
    if (a1 <= a0) return;

    const kind = s.kind;
    if (kind === 'cob') {
      houseGroup.add(ringBand(rIn, rOut, a0, a1, PL_TOP, HEAD_SOF, materials.cob, 8));
    } else if (kind === 'big' || kind === 'small') {
      houseGroup.add(ringBand(rIn, rOut, a0, a1, PL_TOP, SILL, materials.cob, 6));
      houseGroup.add(ringBand(rIn, rOut, a0, a1, WIN_HEAD, HEAD_SOF, materials.cob, 4));
      // frame + glass
      addWindow(a0, a1, SILL, WIN_HEAD, kind === 'big' ? 1.27 : 0.72, 1.90);
    } else if (kind === 'kitchen') {
      houseGroup.add(ringBand(rIn, rOut, a0, a1, PL_TOP, K_SILL, materials.cob, 6));
      houseGroup.add(ringBand(rIn, rOut, a0, a1, WIN_HEAD, HEAD_SOF, materials.cob, 4));
      addWindow(a0, a1, K_SILL, WIN_HEAD, 0.90, 1.10);
    } else if (kind === 'gardendoor' || kind === 'backdoor') {
      addDoorOpening(s, a0, a1, kind);
    }
  });

  function addWindow(a0, a1, z0, z1, unitW, unitH) {
    const mid = (a0 + a1) / 2;
    const p = polar(mid, R);
    const t = mid * DEG;
    const nx = Math.sin(t), nz = Math.cos(t);
    const frameD = 0.070;
    const frameT = 0.055;
    const clearW = (a1 - a0) * DEG * R;
    const w = Math.max(0.2, clearW - 0.02);
    const h = z1 - z0;
    const group = new THREE.Group();
    // frame as four slim boxes in local space: x along tangent, y up, z radial
    const jambL = addBox(group, frameT, h, frameD, materials.timber, -w/2 + frameT/2, 0, 0);
    const jambR = addBox(group, frameT, h, frameD, materials.timber,  w/2 - frameT/2, 0, 0);
    addBox(group, w, frameT, frameD, materials.timber, 0, -h/2 + frameT/2, 0);
    addBox(group, w, frameT, frameD, materials.timber, 0,  h/2 - frameT/2, 0);
    const glass = addBox(group, w - frameT*2, h - frameT*2, 0.012, materials.glass, 0, 0, 0);
    glass.castShadow = false;
    group.position.set(p.x, (z0 + z1) / 2, p.y);
    group.rotation.y = -t; // local +z toward outward? rotation.y turns around up.
    // We want local +Z to point outward (nx, nz). Default +Z is world +Z (north).
    // angle from +Z (north) to outward: outward is (nx, nz) in x-z plane.
    // Default look: rotation.y = atan2(nx, nz)
    group.rotation.y = Math.atan2(nx, nz);
    houseGroup.add(group);
  }

  function addDoorOpening(s, a0, a1, kind) {
    const mid = (a0 + a1) / 2;
    const p = polar(mid, R);
    const t = mid * DEG;
    const nx = Math.sin(t), nz = Math.cos(t);
    const clearW = (a1 - a0) * DEG * R;
    const openingH = 2.375;
    const unitH = kind === 'gardendoor' ? 2.330 : 2.360;
    const frameD = 0.070;
    const group = new THREE.Group();
    group.position.set(p.x, 0, p.y);
    group.rotation.y = Math.atan2(nx, nz);
    // threshold, jambs and head so the opening reads as a door
    addBox(group, clearW, 0.040, 0.350, materials.timber, 0, 0.020, 0);
    addBox(group, 0.070, openingH, 0.070, materials.timber, -clearW / 2 + 0.035, openingH / 2, 0);
    addBox(group, 0.070, openingH, 0.070, materials.timber,  clearW / 2 - 0.035, openingH / 2, 0);
    addBox(group, clearW, 0.070, 0.070, materials.timber, 0, openingH - 0.035, 0);
    if (kind === 'gardendoor') {
      const w1 = clearW * 0.56;
      const w2 = clearW - w1;
      const leafH = unitH;
      // Wider leaf on local −X, narrower on +X. Each leaf extends from its jamb into the opening.
      const d1 = makeDoorLeaf(w1, leafH, frameD, 'in', +1);
      const d2 = makeDoorLeaf(w2, leafH, frameD, 'in', -1);
      d1.pivot.position.set(-clearW / 2, 0, 0);
      d2.pivot.position.set( clearW / 2, 0, 0);
      group.add(d1.pivot, d2.pivot);
      doors.push({
        name: 'Garden doors', kind, group, leaves: [d1, d2], open: false,
        a0, a1, p, nx, nz, inward: true, clearW, openingH
      });
    } else {
      // back door: 70% leaf, side light south, hinge north, opens out
      const leafW = clearW * 0.70;
      const sideW = clearW - leafW;
      // Side light on the south part of the unit. East door, theta 90-107, E post at 90 (south jamb).
      // South is lower theta = a0 side. Side light at a0 (local side).
      // Put side light at local -x if that corresponds to south.
      const side = addWindowPane(sideW, 2.300 - 0.400, 0.400, 2.300);
      // We'll position after we know local axes — put side at -clearW/2 + sideW/2
      side.position.set(-clearW / 2 + sideW / 2, (0.400 + 2.300) / 2, 0);
      group.add(side);
      // cob/sill under side light
      addBox(group, sideW, 0.400, WALL_T, materials.cob, -clearW / 2 + sideW / 2, 0.200, 0);
      // Hinge on the north jamb (local +X); leaf extends into the opening (−X) and opens out.
      const leaf = makeDoorLeaf(leafW, unitH, frameD, 'out', -1);
      leaf.pivot.position.set(clearW / 2, 0, 0);
      group.add(leaf.pivot);
      doors.push({
        name: 'Back door', kind, group, leaves: [leaf], open: false,
        a0, a1, p, nx, nz, inward: false, clearW, openingH, sideW
      });
    }
    houseGroup.add(group);
    // collision opening stored
  }

  function addWindowPane(w, h) {
    const g = new THREE.Group();
    addBox(g, w, h, 0.070, materials.timber, 0, 0, 0).scale.set(1,1,1);
    const gl = addBox(g, w - 0.06, h - 0.06, 0.012, materials.glass, 0, 0, 0);
    gl.castShadow = false;
    return g;
  }

  function makeDoorLeaf(w, h, depth, swing, dir = 1) {
    const pivot = new THREE.Group();
    const leaf = new THREE.Group();
    // dir +1: leaf occupies +X from the hinge; dir −1: occupies −X (the other jamb).
    const inset = 0.008;
    const leafW = Math.max(0.05, w - inset);
    addBox(leaf, leafW, h, depth, materials.door, dir * leafW / 2, h / 2, 0);
    // Meeting stile so a pair of leaves reads as two doors, not one slab.
    addBox(leaf, 0.018, h, depth + 0.012, materials.timber, dir * (leafW - 0.009), h / 2, 0);
    const gl = addBox(leaf, leafW * 0.55, h * 0.4, 0.018, materials.glass, dir * leafW / 2, h * 0.55, 0.01 * dir);
    gl.castShadow = false;
    pivot.add(leaf);
    // Inward leaves rotate the opposite way to outward leaves.
    const sign = (swing === 'in' ? -dir : dir);
    return { pivot, leaf, w: leafW, h, sign, angle: 0, target: 0, swing, dir };
  }

  // Timber members (jambs, mullions, cob studs) — skip posts (drawn as roof posts)
  verts.forEach((v) => {
    if (v.member === 'post') return;
    if (v.member === 'mullion') {
      houseGroup.add(taperedMullion(v.theta, mm(v.w_in), mm(v.w_out), 0.150, PL_TOP, HEAD_SOF, materials.timber));
    } else {
      const w = v.member === 'cobstud' ? mm(v.w_cl) : 0.150;
      const d = 0.150;
      const p = polar(v.theta, R);
      const t = v.theta * DEG;
      const m = addBox(houseGroup, w, HEAD_SOF - PL_TOP, d, materials.timber, p.x, (HEAD_SOF + PL_TOP) / 2, p.y);
      m.rotation.y = Math.atan2(Math.sin(t), Math.cos(t));
    }
  });

  // Posts
  function addPost(p, kind) {
    // p.base, p.top are relative to plinth top (except we convert)
    const y0 = PL_TOP + mm(p.base);
    const y1 = PL_TOP + mm(p.top) + ROOF_RAISE; // beam soffit (body); 120 mm tenon goes up into the beam
    const m = addBox(houseGroup, 0.200, y1 - y0, 0.200, materials.timber, mm(p.x), (y0 + y1) / 2, wz(mm(p.y)));
    m.userData.post = p;
    posts.push({ name: p.name, x: mm(p.x), z: wz(mm(p.y)), y0, y1, kind: p.kind });
    // 60×100×120 tenon into the beam; no steel cap
    const tenon = addBox(houseGroup, 0.060, 0.120, 0.100, materials.timber, mm(p.x), y1 + 0.060, wz(mm(p.y)));
    tenon.castShadow = false;
    // base metal
    addBox(houseGroup, 0.22, 0.08, 0.22, materials.metal, mm(p.x), y0 - 0.02, wz(mm(p.y))).castShadow = false;
    // footing hint
    if (p.kind === 'corner') {
      addBox(houseGroup, 0.60, 0.05, 0.60, materials.stone, mm(p.x), GRADE + 0.025, wz(mm(p.y)));
    } else if (p.kind === 'central') {
      addBox(houseGroup, 0.80, 0.08, 0.80, materials.stone, mm(p.x), -0.04, wz(mm(p.y)));
    } else if (p.kind === 'extension') {
      addBox(houseGroup, 0.40, 0.400, 0.40, materials.stone, mm(p.x), GRADE + 0.200, wz(mm(p.y)));
    }
    colliders.push({ type: 'post', x: mm(p.x), z: wz(mm(p.y)), r: 0.12 });
    return m;
  }
  G.posts.forEach((p) => addPost(p));
  G.extPosts.forEach((p) => addPost(p));

  // Main beams (sloped, depth perpendicular to 7°). Plan length = roof N–S, ends flush at y = ±6.2 m.
  const roofX0 = mm(G.roof.x0), roofX1 = mm(G.roof.x1);
  const roofY0 = mm(G.roof.y0), roofY1 = mm(G.roof.y1);
  const roofW = roofX1 - roofX0;
  const roofMidX = (roofX0 + roofX1) / 2;
  const beamPlan = roofY1 - roofY0;
  const beamLen = beamPlan / Math.cos(7 * DEG);
  G.beamXs.forEach((xmm) => {
    const x = mm(xmm);
    const midZ = soffitFFL(0) + 0.120; // centre of 240 mm depth along vertical almost
    // Use a box in local space: length along local Z (we'll rotate around X)
    const g = new THREE.BoxGeometry(0.200, 0.240, beamLen);
    const m = new THREE.Mesh(g, materials.timber);
    m.rotation.x = 7 * DEG; // overwritten below
    // We want the beam to follow z_world (north) with height increasing north.
    // Rotate around X (east): positive Rx sends +Z toward -Y? R_x(θ): (x, y cos - z sin, y sin + z cos).
    // A point at local (0,0,6) (north in local if Z is north): world (0, -6sinθ, 6cosθ). That's Y down if θ>0. Wrong.
    // Use Rx(-7°): (0, 6sin7, 6cos7) — Y up as Z increases. But then plan length is 6cos7 not 6.
    // So length should be 12.090 along local Z, Rx(-7°), position at mid.
    m.rotation.x = 7 * DEG;
    // Centre of beam at x, y = beamTop mid, z=0.
    // Mid-plane of beam (between soffit and top) at y=0 is (soffit+top)/2 = soffit + 0.120 along vertical?
    // Thickness 0.240 is along local Y (up when unrotated). After Rx(-7), local +Y is almost world +Y tilted north.
    // Place so soffit at y=0 equals soffitFFL(0).
    // Centre is 0.120 along the normal (local Y). World Y of centre ≈ soffit(0) + 0.120*cos7.
    m.position.set(x, soffitFFL(0) + 0.120 * Math.cos(7 * DEG), 0);
    m.castShadow = true;
    m.receiveShadow = true;
    houseGroup.add(m);
    // scarf mark at mid post
    const scarf = addBox(houseGroup, 0.22, 0.05, 0.60, materials.door, x, beamTopFFL(0) + 0.01, 0);
    scarf.rotation.x = 7 * DEG;
  });

  // Purlins (level). Eave pieces have their outer face at y = ±6 200 (CL ±6 125).
  G.purlin.ys.forEach((ymm) => {
    const z = wz(mm(ymm));
    const yTop = coverFFL(mm(ymm));
    const m = addBox(houseGroup, roofW, 0.200, 0.150, materials.timber, roofMidX, yTop - 0.100, z);
  });

  // Roof sandwich panels — 16.5 × 12.4 m plan, edges flush with beams and eave purlins.
  const slopeLen = beamPlan / Math.cos(7 * DEG);
  const roofMats = [
    materials.roof, materials.roof,
    materials.roof, materials.roofUnder,
    materials.roof, materials.roof
  ];
  const roof = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.060, slopeLen), roofMats);
  roof.rotation.x = 7 * DEG;
  roof.position.set(roofMidX, coverFFL(0) + 0.030 * Math.cos(7 * DEG), 0);
  roof.castShadow = true;
  roof.receiveShadow = false;
  houseGroup.add(roof);
  roofMesh = roof;
  // Dedicated timber underside, offset below the panel so it never self-shadows.
  const roofUnder = new THREE.Mesh(new THREE.PlaneGeometry(roofW, slopeLen), materials.roofUnder);
  roofUnder.rotation.set(Math.PI / 2 + 7 * DEG, 0, 0);
  roofUnder.position.set(roofMidX, coverFFL(0) - 0.035, 0);
  roofUnder.receiveShadow = false;
  roofUnder.castShadow = false;
  houseGroup.add(roofUnder);

  // Knee braces
  const braceMeshes = [];
  function addBrace(b) {
    const px = mm(b.x), pz = wz(mm(b.y));
    const postSoffit = soffitFFL(mm(b.y)); // main beam soffit at this northing
    const purlinSof = coverFFL(mm(b.y)) - 0.200;
    const alongBeam = b.dir === 'N-S';
    const topSof = alongBeam ? postSoffit : purlinSof;
    const foot = topSof - 0.600;
    const s = b.side; // +1 north or east
    let tHoriz;
    if (alongBeam) {
      tHoriz = 0.600 / (1 - s * TAN7);
    } else {
      tHoriz = 0.600;
    }
    const length = Math.hypot(tHoriz, 0.600);
    const m = addBox(houseGroup, 0.100, 0.100, length, materials.timber, 0, 0, 0);
    // Place centre of brace, then rotate
    if (alongBeam) {
      // in Y-Z plane (up-north)
      const midZ = pz - s * tHoriz / 2;
      const midY = foot + 0.600 / 2;
      m.position.set(px, midY, midZ);
      // rotate around X so local +Z aligns with (0, 0.6, s*tHoriz)
      const ang = Math.atan2(0.600, s * tHoriz) - Math.PI / 2;
      // default +Z is north. We want direction (0, 0.6, s*tHoriz) from south foot to north/south end.
      // Direction vector from foot to beam: (0, 0.6, s*tHoriz). Angle from +Z toward +Y: 
      m.rotation.set(0, 0, 0);
      const dir = new THREE.Vector3(0, 0.600, -s * tHoriz).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      m.quaternion.copy(quat);
    } else {
      const midX = px + s * tHoriz / 2;
      const midY = foot + 0.300;
      m.position.set(midX, midY, pz);
      const dir = new THREE.Vector3(s * tHoriz, 0.600, 0).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      m.quaternion.copy(quat);
    }
    m.userData.brace = b;
    m.userData.underside = foot - (0.100 / Math.SQRT2);
    m.userData.foot = foot;
    braceMeshes.push(m);
    return m;
  }
  G.braces.forEach(addBrace);

  // Utility building
  const U = G.utility;
  const ux0 = mm(U.x_w), ux1 = mm(U.x_e), uz0 = wz(mm(U.y_s)), uz1 = wz(mm(U.y_n));
  const uclW = ux1 - ux0, uclD = uz1 - uz0; // 3 x 2
  const uInX0 = ux0 + 0.175, uInX1 = ux1 - 0.175, uInZ0 = uz0 + 0.175, uInZ1 = uz1 - 0.175;
  const uPlX0 = ux0 - 0.200, uPlX1 = ux1 + 0.200, uPlZ0 = uz0 - 0.200, uPlZ1 = uz1 + 0.200;
  const plateTop = 2.650;
  const doorH = 2.100;
  const doorW = 0.800;
  const doorX0 = mm(U.door_x0), doorX1 = mm(U.door_x1); // 6.070-6.870

  // utility floor
  addBox(houseGroup, uclW - 0.35, 0.02, uclD - 0.35, materials.earth, (ux0+ux1)/2, 0.01, (uz0+uz1)/2).castShadow = false;
  // plinth U-shape (east sits on strip). Simple full rectangle plinth with door notch on south.
  addBox(houseGroup, uPlX1-uPlX0, 0.400, uPlZ1-uPlZ0, materials.stone, (uPlX0+uPlX1)/2, GRADE+0.200, (uPlZ0+uPlZ1)/2);
  // cut visual door notch: a grade-coloured block? skip — threshold will cover
  // walls: N, E, W full; S with door
  function wallRect(x0, z0, x1, z1, y0, y1) {
    addBox(houseGroup, Math.abs(x1-x0), y1-y0, Math.abs(z1-z0), materials.cob,
      (x0+x1)/2, (y0+y1)/2, (z0+z1)/2);
  }
  // West wall
  wallRect(ux0 - 0.175, uz0 - 0.175, ux0 + 0.175, uz1 + 0.175, PL_TOP, plateTop);
  // East wall
  wallRect(ux1 - 0.175, uz0 - 0.175, ux1 + 0.175, uz1 + 0.175, PL_TOP, plateTop);
  // North wall
  wallRect(ux0 + 0.175, uz1 - 0.175, ux1 - 0.175, uz1 + 0.175, PL_TOP, plateTop);
  // South wall either side of door
  wallRect(ux0 + 0.175, uz0 - 0.175, doorX0, uz0 + 0.175, PL_TOP, plateTop);
  wallRect(doorX1, uz0 - 0.175, ux1 - 0.175, uz0 + 0.175, PL_TOP, plateTop);
  // over door
  if (doorH < plateTop) {
    wallRect(doorX0, uz0 - 0.175, doorX1, uz0 + 0.175, doorH, plateTop);
  }
  // top plate
  addBox(houseGroup, (ux1-ux0)+0.15, 0.100, (uz1-uz0)+0.15, materials.timber,
    (ux0+ux1)/2, plateTop - 0.050, (uz0+uz1)/2);
  // utility posts: body to the plate underside, 100 mm flush through-tenon with 2 oak wedges
  G.utilPosts.forEach((p) => {
    const y0 = PL_TOP + mm(p.base);
    const bodyTop = plateTop - 0.100;
    addBox(houseGroup, 0.200, bodyTop - y0, 0.200, materials.timber, mm(p.x), (y0 + bodyTop) / 2, wz(mm(p.y)));
    const tenon = addBox(houseGroup, 0.060, 0.100, 0.100, materials.timber, mm(p.x), plateTop - 0.050, wz(mm(p.y)));
    tenon.castShadow = false;
    // two wedges, trimmed flush with the plate top
    const wedgeMat = materials.door;
    addBox(houseGroup, 0.012, 0.008, 0.040, wedgeMat, mm(p.x) - 0.014, plateTop - 0.004, wz(mm(p.y))).castShadow = false;
    addBox(houseGroup, 0.012, 0.008, 0.040, wedgeMat, mm(p.x) + 0.014, plateTop - 0.004, wz(mm(p.y))).castShadow = false;
    colliders.push({ type: 'post', x: mm(p.x), z: wz(mm(p.y)), r: 0.12 });
  });
  // utility door (south, hinge west, opens out)
  const uDoor = makeDoorLeaf(doorW, doorH, 0.070, 'out');
  const uPivot = uDoor.pivot;
  uPivot.position.set(doorX0, 0, uz0);
  // south wall faces -Z (south is -Z? drawing y is north = world Z, south is -Z).
  // Outward is -Z. Hinge on west (doorX0). Leaf should extend toward +X (east) in the opening.
  // Default leaf extends +X from pivot. Opening out means rotating toward -Z, i.e. +90° around Y? 
  // rotation.y positive is CCW from above (from +X toward +Z).
  // From closed (leaf along +X, in the wall, z=uz0) to open out (leaf along -Z).
  // From +X to -Z is rotation.y = +90°? +X to +Z is +90°? 
  // rotation.y: a point (w,0,0) goes to (w cos y, 0, -w sin y) in Three.js (Y-up).
  // Three.js rotation.y positive: x' = x cos - z sin, z' = x sin + z cos.
  // Point (w,0,0) -> (w cos, 0, w sin). To -Z, we need sin = -1, y = -90°.
  uDoor.outward = true;
  houseGroup.add(uPivot);
  doors.push({
    name: 'Utility door', kind: 'utility', group: uPivot, leaves: [uDoor],
    open: false, inward: false, clearW: doorW, openingH: doorH,
    x0: doorX0, x1: doorX1, z: uz0
  });

  // East strip (at grade)
  const st = G.extStrip;
  addBox(houseGroup, mm(st.w), 0.08, mm(st.y1-st.y0), materials.stone, mm(st.x), GRADE + 0.02, 0);

  // Curved inner wall
  const iw = G.innerWall;
  const arcPts = iw.wallPoly.map(([x, y]) => new THREE.Vector3(mm(x), 0.020, wz(mm(y))));
  buildRibbon(arcPts, CURVE_T, 2.200 - 0.020, materials.cobInner);
  // plinth 200x200, top 20mm above FFL
  buildRibbon(arcPts, 0.200, 0.020 - GRADE, materials.stone, GRADE);
  // end stud
  const es = iw.endStud.map(([x,y]) => [mm(x), wz(mm(y))]);
  if (es.length === 4) {
    const cx = es.reduce((s,p)=>s+p[0],0)/4, cz = es.reduce((s,p)=>s+p[1],0)/4;
    addBox(houseGroup, 0.10, 2.200, 0.10, materials.timber, cx, 1.10, cz);
  }

  // Interior partitions (assumed 100 thick, 2.2 high) and furniture
  const F = G.furniture;
  const PART_H = 2.200, PART_T = 0.100;
  F.partitions.forEach((p) => {
    const ax = mm(p.a[0]), az = wz(mm(p.a[1])), bx = mm(p.b[0]), bz = wz(mm(p.b[1]));
    const len = Math.hypot(bx-ax, bz-az);
    const m = addBox(houseGroup, len, PART_H, PART_T, materials.cobInner, (ax+bx)/2, PART_H/2, (az+bz)/2);
    m.rotation.y = -Math.atan2(bz-az, bx-ax);
    colliders.push({ type: 'aabb', x0: Math.min(ax,bx)-0.05, x1: Math.max(ax,bx)+0.05,
      z0: Math.min(az,bz)-0.05, z1: Math.max(az,bz)+0.05 });
  });
  function polyBlock(poly, h, y0, mat, inflate=0) {
    // axis-aligned bounding box block from poly
    const xs = poly.map(p => mm(p[0])), zs = poly.map(p => wz(mm(p[1])));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const m = addBox(houseGroup, x1-x0, h, z1-z0, mat, (x0+x1)/2, y0 + h/2, (z0+z1)/2);
    colliders.push({ type: 'aabb', x0: x0-inflate, x1: x1+inflate, z0: z0-inflate, z1: z1+inflate });
    return m;
  }
  polyBlock(F.closetShower, PART_H, 0, materials.timber);
  polyBlock(F.closetBed, PART_H, 0, materials.timber);
  polyBlock(F.bed, 0.450, 0, materials.door);
  polyBlock(F.shower, 0.050, 0, materials.white);
  polyBlock(F.counter, 0.850, 0, materials.timber);
  // worktop
  (function () {
    const xs = F.counter.map(p => mm(p[0])), zs = F.counter.map(p => wz(mm(p[1])));
    addBox(houseGroup, Math.max(...xs)-Math.min(...xs)+0.02, 0.050,
      Math.max(...zs)-Math.min(...zs)+0.02, materials.white,
      (Math.min(...xs)+Math.max(...xs))/2, 0.875, (Math.min(...zs)+Math.max(...zs))/2);
  })();
  polyBlock(F.stove, 0.900, 0, materials.metal);
  function fixture(pt, name) {
    const x = mm(pt[0]), z = wz(mm(pt[1]));
    addBox(houseGroup, 0.40, 0.40, 0.40, materials.white, x, 0.20, z);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.12, 16), materials.white);
    bowl.position.set(x, 0.42, z);
    houseGroup.add(bowl);
  }
  fixture(F.wc, 'WC');
  fixture(F.bidet, 'bidet');
  fixture(F.basin, 'basin');

  // Kitchen work surfaces (all counters confirmed at 900 mm above FFL)
  const COUNTER_H = 0.900;
  function aabbOf(poly) {
    const xs = poly.map(p => mm(p[0])), zs = poly.map(p => wz(mm(p[1])));
    return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
  }
  const counterBox = aabbOf(F.counter);
  const worktops = [
    { name: 'counter', ...counterBox, top: COUNTER_H },
    { name: 'stove', ...aabbOf(F.stove), top: COUNTER_H }
  ];

  // Collision: house wall circle, openings
  const openings = [];
  segs.forEach((s) => {
    if (s.kind === 'backdoor' || s.kind === 'gardendoor') {
      const v0 = verts.find((v) => Math.abs(v.theta - s.th0) < 1e-4);
      const v1 = verts.find((v) => Math.abs(v.theta - s.th1) < 1e-4) || (s.th1 >= 359.9 ? verts[0] : null);
      openings.push({
        kind: s.kind, a0: s.th0 + (v0 ? memberHalfDeg(v0) : 0),
        a1: s.th1 - (v1 ? memberHalfDeg(v1) : 0)
      });
    }
  });
  colliders.push({ type: 'ring', rIn, rOut, openings });
  colliders.push({ type: 'utility', x0: ux0 - 0.175, x1: ux1 + 0.175, z0: uz0 - 0.175, z1: uz1 + 0.175,
    ix0: ux0 + 0.175, ix1: ux1 - 0.175, iz0: uz0 + 0.175, iz1: uz1 - 0.175,
    doorX0, doorX1, doorZ: uz0 });
  colliders.push({ type: 'arc', cx: mm(iw.cx), cz: wz(mm(iw.cy)), r: mm(iw.r), half: CURVE_T/2,
    pts: arcPts });

  // Clash overlays
  buildClashes(braceMeshes, worktops, segs, verts, U, plateTop, rIn);

  addCompassRose(houseGroup, GRADE);

  return { braceMeshes, counterBox, rIn, rOut, openings };
}

function buildRibbon(pts, thickness, height, mat, y0 = 0.020) {
  if (pts.length < 2) return;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i+1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 0.01;
    const m = addBox(houseGroup, len, height, thickness, mat, (a.x+b.x)/2, y0 + height/2, (a.z+b.z)/2);
    m.rotation.y = -Math.atan2(dz, dx);
  }
}

function fmtMm(m) {
  const n = Math.round(m * 1000);
  return n.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
}

function buildClashes(braceMeshes, worktops, segs, verts, U, plateTop, rIn) {
  // Recompute every clash from the raised geometry. Do not hard-code old B-sheet clashes.
  const LIMIT = 2.0;
  const EPS = 0.008; // treat 1.992–2.008 as "at the limit"
  const RING_IN = 4.825;
  computedClashes = [];
  CLASH_VIEWS = {};

  function highlight(mesh, mat) {
    const c = mesh.clone();
    c.material = mat;
    c.castShadow = false;
    c.receiveShadow = false;
    c.scale.set(1.15, 1.15, 1.05);
    clashGroup.add(c);
    return c;
  }

  const indoorLow = [];
  const outdoorLow = [];
  braceMeshes.forEach((m) => {
    const b = m.userData.brace;
    if (!b) return;
    const under = m.userData.underside;
    const midX = m.position.x, midZ = m.position.z;
    const rho = Math.hypot(midX, midZ);
    const indoor = rho < RING_IN + 0.15;
    const rec = { mesh: m, brace: b, under, midX, midZ, indoor };
    if (under < LIMIT - EPS) {
      (indoor ? indoorLow : outdoorLow).push(rec);
    } else if (Math.abs(under - LIMIT) <= EPS) {
      rec.atLimit = true;
      (indoor ? indoorLow : outdoorLow).push(rec);
    }
  });

  // S inside brace (indoor, at the 2.0 m limit after the raise)
  const sInside = indoorLow.find((r) => r.brace.post === 'S ring' && r.brace.dir === 'N-S' && r.brace.side === 1)
    || indoorLow.find((r) => r.brace.post === 'S ring');
  if (sInside) {
    highlight(sInside.mesh, sInside.atLimit || Math.abs(sInside.under - LIMIT) <= EPS ? materials.clashAmber : materials.clash);
    const underMm = fmtMm(sInside.under);
    const atLim = sInside.atLimit || Math.abs(sInside.under - LIMIT) <= EPS;
    computedClashes.push({
      id: 's-brace',
      severity: atLim ? 'amber' : 'red',
      title: 'S inside brace',
      detail: atLim
        ? `Underside ${underMm} mm — at the 2.0 m indoor headroom limit.`
        : `Underside ${underMm} mm, below the 2.0 m indoor headroom limit.`,
      under: sInside.under
    });
    CLASH_VIEWS['s-brace'] = {
      cam: { x: 2.35, y: 1.68, z: 2.15, tx: 0.15, ty: 1.92, tz: 4.55 }
    };
  }

  // Outdoor S-corner N–S braces (~1 877 mm) were accepted by Tom on 25 Nov 2026
  // (rev f): not a drawn clash, off the open list. Record only; do not highlight.
  const outdoorFlag = outdoorLow.filter((r) => r.under < LIMIT - EPS);
  const outdoorLimit = outdoorLow.filter((r) => r.atLimit || Math.abs(r.under - LIMIT) <= EPS);
  const outdoorAccepted = {};
  outdoorFlag.forEach((r) => {
    const k = r.brace.post + ' ' + r.brace.dir;
    if (!outdoorAccepted[k] || r.under < outdoorAccepted[k].under) {
      outdoorAccepted[k] = { post: r.brace.post, dir: r.brace.dir, under: r.under };
    }
  });

  // Window vs worktop: a clash only if the opening overlaps a 900 mm work surface
  // in plan and the sill is below the worktop. Kitchen sill 1 200 mm leaves a
  // 300 mm wall/apron above the confirmed 900 mm counter (cleared).
  const WIN_HEAD = 2.300; // confirmed: all window tops at one height
  const SILL_OF = { kitchen: 1.200, big: 0.400, small: 0.400 };
  function planOverlaps(seg, box) {
    if (!box) return false;
    for (let i = 0; i <= 40; i++) {
      const th = seg.th0 + (seg.th1 - seg.th0) * i / 40;
      for (const r of [rIn, rIn - 0.40, rIn - 0.80]) {
        const p = polar(th, r);
        if (p.x >= box.x0 && p.x <= box.x1 && p.y >= box.z0 && p.y <= box.z1) return true;
      }
    }
    return false;
  }
  const windowChecks = [];
  segs.forEach((seg) => {
    if (!(seg.kind in SILL_OF)) return;
    const sill = SILL_OF[seg.kind];
    worktops.forEach((w) => {
      const overlap = planOverlaps(seg, w);
      const apron = sill - w.top;
      windowChecks.push({
        seg: seg.no, kind: seg.kind, note: seg.note, worktop: w.name,
        overlap, sill, worktopH: w.top, apron, clash: overlap && apron < -0.001
      });
      if (overlap && apron < -0.001) {
        const mid = (seg.th0 + seg.th1) / 2;
        const p = polar(mid, 4.7);
        const slab = addBox(clashGroup, 0.90, 0.30, 0.50, materials.clash, p.x, (sill + w.top) / 2, p.y);
        slab.rotation.y = Math.atan2(Math.sin(mid * DEG), Math.cos(mid * DEG));
        slab.castShadow = false;
        const id = `window-counter-${seg.no}-${w.name}`;
        computedClashes.push({
          id,
          severity: 'red',
          title: `${seg.kind === 'kitchen' ? 'Kitchen' : 'Window'} vs ${w.name}`,
          detail: `Window ${fmtMm(sill)}–${fmtMm(WIN_HEAD)} mm overlaps the ${fmtMm(w.top)} mm ${w.name} in plan.`
        });
        CLASH_VIEWS[id] = { cam: { x: p.x * 0.3, y: 1.50, z: p.y * 0.45, tx: p.x * 0.1, ty: 1.15, tz: p.y * 0.95 } };
      }
    });
  });

  const k = segs.find((s) => s.kind === 'kitchen');
  let kitchenMid = null, kitchenP = null;
  if (k) {
    kitchenMid = (k.th0 + k.th1) / 2;
    kitchenP = polar(kitchenMid, 4.7);
  }

  // Record clearances that used to be clashes, for the report (not highlighted).
  const sSoffit = soffitFFL(-5);
  const headTop = 2.475;
  const doorHead = 2.375;
  const ewBraces = braceMeshes.filter((m) => {
    const b = m.userData.brace;
    return b && (b.post === 'E ring' || b.post === 'W ring') && b.dir === 'N-S';
  });
  const ewUnder = ewBraces.length ? ewBraces[0].userData.underside : null;
  const seSoffit = soffitFFL(mm(U.y_s));
  const neSoffit = soffitFFL(mm(U.y_n));
  const seGap = seSoffit - plateTop;
  const neGap = neSoffit - plateTop;
  const eastEw = braceMeshes.filter((m) => {
    const b = m.userData.brace;
    return b && (b.post === 'SE-ext' || b.post === 'E-ext' || b.post === 'NE-ext') && b.dir === 'E-W';
  }).map((m) => ({ post: m.userData.brace.post, side: m.userData.brace.side, under: m.userData.underside }));
  const eaveS = mm(G.roof.y0), eaveN = mm(G.roof.y1);
  computedClashes.cleared = {
    sJoint: { beamSoffit: sSoffit, headPlateTop: headTop, clearance: sSoffit - headTop },
    ewBraces: ewUnder != null ? { underside: ewUnder, headPlateTop: headTop, doorHead, abovePlate: ewUnder - headTop, aboveDoor: ewUnder - doorHead } : null,
    utility: { plateTop, seSoffit, neSoffit, seGap, neGap },
    counterWindows: windowChecks,
    outdoorCornersAccepted: {
      note: 'SW / SE / SE-ext N–S braces at 1 877 mm accepted by Tom, 25 Nov 2026 (rev f); not a drawn clash.',
      items: Object.values(outdoorAccepted)
    },
    eastEwBraces: eastEw,
    eaves: { south: coverFFL(eaveS), north: coverFFL(eaveN), seGap, neGap }
  };

  // 2.0 m headroom planes
  function makePlane(name, x, z, visible) {
    const planeGroup = new THREE.Group();
    planeGroup.name = name;
    const planeGeo = new THREE.CircleGeometry(1.55, 48);
    planeGeo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(planeGeo, materials.headroom);
    mesh.position.set(x, 2.0, z);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.50, 1.56, 48),
      new THREE.MeshBasicMaterial({ color: 0x2a7aad, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(mesh.position).setY(2.002);
    planeGroup.add(mesh, ring);
    planeGroup.visible = !!visible;
    clashGroup.add(planeGroup);
    return planeGroup;
  }
  headroomPlane = makePlane('headroom-s', 0.15, 4.25, false);
  headroomOutdoor = makePlane('headroom-se', 5.0, 6.1, false);

  // Height labels from the raised geometry
  hudLabels = [];
  function addHud(text, x, y, z, groups) {
    hudLabels.push({ text, pos: new THREE.Vector3(x, y, z), groups: groups || ['heights'] });
  }
  addHud(`Beam soffit S ${fmtMm(sSoffit)} mm`, -0.85, sSoffit + 0.05, 4.65, ['heights']);
  addHud(`Head-plate top ${fmtMm(headTop)} mm`, 0.95, 2.60, 5.05, ['heights']);
  addHud(`Beam soffit centre ${fmtMm(soffitFFL(0))} mm`, 0.35, soffitFFL(0) + 0.04, 0, ['heights']);
  addHud(`Beam soffit N ${fmtMm(soffitFFL(5))} mm`, 0.35, soffitFFL(5) + 0.04, -5, ['heights']);
  addHud(`Roof underside ${fmtMm(coverFFL(-5))} mm at S`, -1.2, coverFFL(-5) + 0.02, 5, ['heights']);
  addHud(`Roof underside ${fmtMm(coverFFL(0))} mm at centre`, -1.2, coverFFL(0) + 0.02, 0, ['heights']);
  addHud(`Roof underside ${fmtMm(coverFFL(5))} mm at N`, -1.2, coverFFL(5) + 0.02, -5, ['heights']);
  addHud(`Eaves S ${fmtMm(coverFFL(eaveS))} mm`, -1.8, coverFFL(eaveS) + 0.02, wz(eaveS), ['heights']);
  addHud(`Eaves N ${fmtMm(coverFFL(eaveN))} mm`, -1.8, coverFFL(eaveN) + 0.02, wz(eaveN), ['heights']);
  addHud('1.5 m east overhang', 9.75, coverFFL(0) + 0.12, 0.15, ['heights']);
  // Per-beam soffits are identical at a given northing (x = -5, 0, +5, +9).
  addHud(`East beam soffit S ${fmtMm(soffitFFL(-5))} mm`, 9.0, soffitFFL(-5) + 0.04, 5.05, ['heights']);
  addHud(`East beam soffit centre ${fmtMm(soffitFFL(0))} mm`, 9.0, soffitFFL(0) + 0.04, 0, ['heights']);
  addHud(`East beam soffit N ${fmtMm(soffitFFL(5))} mm`, 9.0, soffitFFL(5) + 0.04, -5.05, ['heights']);
  if (sInside) {
    addHud(`S inside brace underside ${fmtMm(sInside.under)} mm`, 0.85, sInside.under + 0.04, 4.35, ['heights', 's-brace']);
    addHud('2.0 m headroom plane', -0.85, 2.00, 3.55, ['s-brace']);
    addHud(`At the 2.0 m indoor limit (${fmtMm(sInside.under)} mm)`, 0.95, 1.70, 4.75, ['s-brace']);
  }
  if (ewUnder != null) {
    addHud(`E/W brace underside ${fmtMm(ewUnder)} mm`, -4.45, ewUnder + 0.04, -0.85, ['heights']);
    addHud(`E brace underside ${fmtMm(ewUnder)} mm`, 4.65, ewUnder + 0.04, 0.35, ['heights']);
  }
  const nBrace = braceMeshes.find((m) => m.userData.brace && m.userData.brace.post === 'N ring' && m.userData.brace.dir === 'N-S');
  if (nBrace) addHud(`N brace underside ${fmtMm(nBrace.userData.underside)} mm`, 0.5, nBrace.userData.underside + 0.04, -4.4, ['heights']);
  addHud('Sill 400 / head 2 300 mm', -4.2, 2.35, 1.5, ['heights']);
  addHud('Kitchen sill 1 200 mm (assumed)', 1.15, 1.22, -4.45, ['heights']);
  addHud('Counter 900 mm (confirmed)', 0.70, 0.90, -3.25, ['heights']);
  addHud('300 mm wall above the counter', -0.35, 1.05, -4.15, ['heights']);
  addHud('Kitchen window 900 × 1 100 (assumed), top 2 300 mm', 0.55, 1.75, -4.55, ['heights']);
  addHud('Door head 2 375 mm', -5.3, 2.40, -0.3, ['heights']);
  addHud('Head plate top 2 475 mm', -5.3, 2.55, -0.9, ['heights']);
  addHud(`Utility plate ${fmtMm(plateTop)} mm`, 6.6, 2.50, 1.15, ['heights']);
  addHud(`SE gap ${fmtMm(seGap)} mm`, 9.55, plateTop + seGap / 2, 3.35, ['heights']);
  addHud(`East beam soffit SE ${fmtMm(seSoffit)} mm`, 8.2, seSoffit + 0.08, 1.85, ['heights']);
  addHud(`NE gap ${fmtMm(neGap)} mm`, 9.4, plateTop + neGap / 2, 0.2, ['heights']);
  addHud('FFL ±0', 1.5, 0.15, 0, ['heights']);
  addHud('Plinth top 220 mm', 3.2, 0.35, -3.2, ['heights']);
  if (outdoorFlag.length) {
    const sample = outdoorFlag.reduce((a, b) => a.under < b.under ? a : b);
    addHud(`Outdoor brace underside ${fmtMm(sample.under)} mm`, sample.midX + 0.4, sample.under + 0.05, sample.midZ + 0.4, ['heights']);
  }

  fillClashPanel();
}

function fillClashPanel() {
  const list = document.getElementById('clashList');
  const presets = document.getElementById('presets');
  if (!list || !presets) return;
  list.innerHTML = '';
  presets.innerHTML = '';
  (computedClashes || []).forEach((c) => {
    const li = document.createElement('li');
    li.className = c.severity || 'red';
    li.innerHTML = `<strong>${c.title}</strong> — ${c.detail}`;
    list.appendChild(li);
    if (!CLASH_VIEWS[c.id]) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.clash = c.id;
    btn.className = c.severity || 'red';
    btn.innerHTML = `${c.title}<small>${c.detail}</small>`;
    presets.appendChild(btn);
  });
}

function makeLabel(text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,512,128);
  ctx.fillStyle = 'rgba(20,18,16,0.78)';
  roundRect(ctx, 8, 16, 496, 96, 16);
  ctx.fill();
  ctx.fillStyle = '#f3eee6';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true }));
  spr.scale.set(1.6, 0.4, 1);
  return spr;
}
function roundRect(ctx, x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

/* ---------- sun ---------- */
function lisbonOffsetHours(date) {
  // Europe/Lisbon DST: last Sunday of March 01:00 UTC to last Sunday of October 01:00 UTC
  const y = date.getUTCFullYear();
  function lastSunday(month) {
    const d = new Date(Date.UTC(y, month + 1, 0));
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d;
  }
  const start = lastSunday(2); start.setUTCHours(1,0,0,0);
  const end = lastSunday(9); end.setUTCHours(1,0,0,0);
  return (date >= start && date < end) ? 1 : 0;
}

function solarPosition(dateLocal) {
  // dateLocal is a Date whose Y/M/D/H/Min are Lisbon wall time. Convert to UTC.
  const tmp = new Date(Date.UTC(dateLocal.getFullYear(), dateLocal.getMonth(), dateLocal.getDate(),
    dateLocal.getHours(), dateLocal.getMinutes(), dateLocal.getSeconds()));
  const off = lisbonOffsetHours(tmp);
  const utcMs = tmp.getTime() - off * 3600 * 1000;
  const utc = new Date(utcMs);
  // NOAA-like
  const d = (utcMs / 86400000) - 0.5 + 2440588 - 2451545.0; // days since J2000.0, approx
  const jc = d / 36525;
  const L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
  const M = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
  const Mr = M * DEG;
  const e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
  const C = Math.sin(Mr) * (1.914602 - jc * (0.004817 + 0.000014 * jc))
          + Math.sin(2*Mr) * (0.019993 - 0.000101 * jc)
          + Math.sin(3*Mr) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * jc;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG);
  const eps0 = 23.439291 - jc * (0.0130042 + jc * (0.00000016 * jc));
  const obl = eps0 + 0.00256 * Math.cos(omega * DEG);
  const alpha = Math.atan2(Math.cos(obl*DEG) * Math.sin(lambda*DEG), Math.cos(lambda*DEG));
  const delta = Math.asin(Math.sin(obl*DEG) * Math.sin(lambda*DEG));
  const y = Math.tan(obl*DEG/2); const y2 = y*y;
  const eqTime = 4 * (y2*Math.sin(2*L0*DEG) - 2*e*Math.sin(Mr) + 4*e*y2*Math.sin(Mr)*Math.cos(2*L0*DEG)
    - 0.5*y2*y2*Math.sin(4*L0*DEG) - 1.25*e*e*Math.sin(2*Mr)) * 180/Math.PI;
  const minutes = utc.getUTCHours()*60 + utc.getUTCMinutes() + utc.getUTCSeconds()/60;
  const trueSolar = minutes + eqTime + 4 * LON; // LON negative west
  let ha = (trueSolar / 4) - 180;
  const lat = LAT * DEG;
  const alt = Math.asin(Math.sin(lat)*Math.sin(delta) + Math.cos(lat)*Math.cos(delta)*Math.cos(ha*DEG));
  const az = Math.atan2(Math.sin(ha*DEG), Math.cos(ha*DEG)*Math.sin(lat) - Math.tan(delta)*Math.cos(lat));
  // az: 0 south in this formula? atan2(sin HA, ...) is 0 when HA=0 (south in the north hemisphere).
  // We want 0 = north, CW or a world direction. Three.js sun: from azimuth.
  // Astronomical azimuth often from south; convert to from north, clockwise: azN = az + π
  const azFromNorth = az + Math.PI; // radians, 0 = north
  return { alt, az: azFromNorth, altDeg: alt*180/Math.PI, azDeg: ((azFromNorth*180/Math.PI)%360+360)%360, off };
}

function applySun() {
  const dateEl = document.getElementById('sunDate');
  const timeEl = document.getElementById('sunTime');
  const [yy, mm_, dd] = dateEl.value.split('-').map(Number);
  const [hh, mi] = timeEl.value.split(':').map(Number);
  const local = new Date(yy, mm_ - 1, dd, hh, mi || 0, 0);
  const sol = solarPosition(local);
  const dist = 40;
  // World: +X east, +Y up, −Z north. Azimuth 0 = north, clockwise.
  const x = Math.sin(sol.az) * Math.cos(sol.alt) * dist;
  const y = Math.sin(sol.alt) * dist;
  const z = -Math.cos(sol.az) * Math.cos(sol.alt) * dist;
  sunLight.position.set(x, Math.max(y, -4), z);
  const up = sol.alt > 0;
  const dusk = Math.max(0, Math.min(1, (sol.altDeg + 6) / 12));
  sunLight.intensity = up ? 1.15 * Math.sin(sol.alt) + 0.25 : 0.06;
  sunLight.color.setRGB(1, 0.95 - 0.2*(1-dusk), 0.85 - 0.35*(1-dusk));
  hemi.intensity = 0.7 + 0.25 * dusk;
  fill.intensity = 0.45 + 0.15 * dusk;
  if (amb) amb.intensity = 0.4 + 0.2 * dusk;
  const sky = new THREE.Color().setHSL(0.62, 0.35, lerp(0.04, 0.62, dusk));
  const groundC = new THREE.Color().setHSL(0.08, 0.3, lerp(0.02, 0.2, dusk));
  scene.background = sky;
  scene.fog.color.copy(sky);
  hemi.color.copy(sky);
  hemi.groundColor.copy(groundC);
  const tz = sol.off === 1 ? 'WEST (UTC+1)' : 'WET (UTC+0)';
  const altS = sol.altDeg.toFixed(1);
  const azS = sol.azDeg.toFixed(0);
  document.getElementById('sunReadout').textContent =
    `${timeEl.value} Europe/Lisbon ${tz} · altitude ${altS}° · azimuth ${azS}° from north`;
  return sol;
}

/* ---------- controls & collision ---------- */
function thetaOf(x, z) {
  // degrees from south, CCW: south (0,+r) = 0, east (r,0) = 90
  let a = Math.atan2(x, z) * 180 / Math.PI;
  if (a < 0) a += 360;
  return a;
}

function collide(pos) {
  let x = pos.x, z = pos.z;
  const r = RADIUS;
  // house ring
  const ring = colliders.find((c) => c.type === 'ring');
  if (ring) {
    const rho = Math.hypot(x, z);
    if (rho > ring.rIn - r && rho < ring.rOut + r) {
      const th = thetaOf(x, z);
      let inDoor = false;
      for (const op of ring.openings) {
        let a0 = op.a0, a1 = op.a1;
        if (a1 < a0) a1 += 360;
        let t = th;
        if (t < a0) t += 360;
        const door = doors.find((d) => d.kind === op.kind);
        if (t >= a0 && t <= a1 && door && door.open) inDoor = true;
      }
      if (!inDoor) {
        // push out to nearer face
        const mid = (ring.rIn + ring.rOut) / 2;
        if (rho < mid) {
          const t = (ring.rIn - r) / (rho || 1e-6);
          x *= t; z *= t;
        } else {
          const t = (ring.rOut + r) / (rho || 1e-6);
          x *= t; z *= t;
        }
      }
    }
  }
  // posts
  for (const c of colliders) {
    if (c.type !== 'post') continue;
    const dx = x - c.x, dz = z - c.z;
    const d = Math.hypot(dx, dz);
    const min = c.r + r;
    if (d < min && d > 1e-6) {
      const k = min / d;
      x = c.x + dx * k;
      z = c.z + dz * k;
    }
  }
  // aabbs (furniture, partitions)
  for (const c of colliders) {
    if (c.type !== 'aabb') continue;
    const x0 = c.x0 - r, x1 = c.x1 + r, z0 = c.z0 - r, z1 = c.z1 + r;
    if (x > x0 && x < x1 && z > z0 && z < z1) {
      const px0 = x - x0, px1 = x1 - x, pz0 = z - z0, pz1 = z1 - z;
      const m = Math.min(px0, px1, pz0, pz1);
      if (m === px0) x = x0;
      else if (m === px1) x = x1;
      else if (m === pz0) z = z0;
      else z = z1;
    }
  }
  // utility walls
  const u = colliders.find((c) => c.type === 'utility');
  if (u) {
    const inside = x > u.ix0 + r && x < u.ix1 - r && z > u.iz0 + r && z < u.iz1 - r;
    const inShell = x > u.x0 - r && x < u.x1 + r && z > u.z0 - r && z < u.z1 + r;
    const uDoor = doors.find((d) => d.kind === 'utility');
    const inDoor = uDoor && uDoor.open && x > u.doorX0 && x < u.doorX1 && z > u.doorZ - r - 0.15 && z < u.doorZ + r + 0.15;
    if (inShell && !inside && !inDoor) {
      // push to nearest of outside shell or inside hollow
      const opts = [
        {x: u.x0 - r, z, d: Math.abs(x - (u.x0 - r))},
        {x: u.x1 + r, z, d: Math.abs(x - (u.x1 + r))},
        {x, z: u.z0 - r, d: Math.abs(z - (u.z0 - r))},
        {x, z: u.z1 + r, d: Math.abs(z - (u.z1 + r))},
        {x: u.ix0 + r, z, d: Math.abs(x - (u.ix0 + r))},
        {x: u.ix1 - r, z, d: Math.abs(x - (u.ix1 - r))},
        {x, z: u.iz0 + r, d: Math.abs(z - (u.iz0 + r))},
        {x, z: u.iz1 - r, d: Math.abs(z - (u.iz1 - r))}
      ];
      // only interior-push options if roughly in wall
      opts.sort((a,b) => a.d - b.d);
      x = opts[0].x; z = opts[0].z;
    }
  }
  // curved wall: distance to polyline
  const arc = colliders.find((c) => c.type === 'arc');
  if (arc && arc.pts) {
    let best = 1e9, bx = x, bz = z, nx, nz;
    for (let i = 0; i < arc.pts.length - 1; i++) {
      const ax = arc.pts[i].x, az = arc.pts[i].z, cx = arc.pts[i+1].x, cz = arc.pts[i+1].z;
      const ex = cx-ax, ez = cz-az;
      const t = Math.max(0, Math.min(1, ((x-ax)*ex + (z-az)*ez) / (ex*ex + ez*ez || 1)));
      const px = ax + t*ex, pz = az + t*ez;
      const d = Math.hypot(x-px, z-pz);
      if (d < best) { best = d; bx = px; bz = pz; }
    }
    const min = arc.half + r;
    if (best < min && best > 1e-6) {
      const k = min / best;
      x = bx + (x - bx) * k;
      z = bz + (z - bz) * k;
    }
  }
  pos.x = x; pos.z = z;
}

let CLASH_VIEWS = {};

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function flyToView(cam, duration = 0.85) {
  if (mode !== 'orbit') setMode('orbit', { keepCamera: true });
  orbit.enabled = false;
  fly = {
    fromPos: camera.position.clone(),
    toPos: new THREE.Vector3(cam.x, cam.y, cam.z),
    fromTarget: orbit.target.clone(),
    toTarget: new THREE.Vector3(cam.tx, cam.ty, cam.tz),
    t: 0,
    dur: duration
  };
}

function tickFly(dt) {
  if (!fly) return;
  fly.t += dt / fly.dur;
  const k = easeInOut(Math.min(1, fly.t));
  camera.position.lerpVectors(fly.fromPos, fly.toPos, k);
  orbit.target.lerpVectors(fly.fromTarget, fly.toTarget, k);
  camera.lookAt(orbit.target);
  if (fly.t >= 1) {
    camera.position.copy(fly.toPos);
    orbit.target.copy(fly.toTarget);
    orbit.update();
    orbit.enabled = mode === 'orbit';
    fly = null;
  }
}

function setClashes(v) {
  clashesOn = !!v;
  clashGroup.visible = clashesOn;
  const btn = document.getElementById('btnClash');
  if (btn) btn.setAttribute('aria-pressed', String(clashesOn));
  if (!clashesOn) {
    activeClash = null;
    if (headroomPlane) headroomPlane.visible = false;
    if (headroomOutdoor) headroomOutdoor.visible = false;
    document.querySelectorAll('#presets button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  }
  syncHudLabels();
}

function flyToClash(id, instant) {
  const view = CLASH_VIEWS[id];
  if (!view) return;
  setClashes(true);
  activeClash = id;
  if (headroomPlane) headroomPlane.visible = id === 's-brace';
  if (headroomOutdoor) headroomOutdoor.visible = id === 'outdoor-corners';
  document.querySelectorAll('#presets button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.clash === id));
  });
  syncHudLabels();
  if (instant) {
    if (mode !== 'orbit') setMode('orbit', { keepCamera: true });
    fly = null;
    camera.position.set(view.cam.x, view.cam.y, view.cam.z);
    orbit.target.set(view.cam.tx, view.cam.ty, view.cam.tz);
    orbit.update();
    orbit.enabled = true;
  } else {
    flyToView(view.cam);
  }
}

function setWalkView(name) {
  setMode('walk');
  if (name === 'kitchen') {
    player.set(0.15, EYE, -2.45);
    yaw = 0.16;
    pitch = -0.12;
  } else if (name === 'bathroom') {
    player.set(-1.55, EYE, -0.85);
    yaw = 2.15;
    pitch = -0.05;
  } else {
    player.set(WALK_START.x, EYE, WALK_START.z);
    yaw = WALK_START.yaw;
    pitch = WALK_START.pitch;
  }
  collide(player);
  player.y = EYE;
}

function syncHudLabels() {
  const root = document.getElementById('hudLabels');
  if (!root) return;
  root.innerHTML = '';
  hudLabels.forEach((l) => {
    const show = (activeClash && l.groups.includes(activeClash))
      || (heightsOn && l.groups.includes('heights'));
    if (!show) return;
    const el = document.createElement('div');
    el.className = 'lab';
    el.textContent = l.text;
    el._lab = l;
    root.appendChild(el);
  });
}

const _hudTmp = new THREE.Vector3();
const _hudDir = new THREE.Vector3();
function projectHud() {
  const root = document.getElementById('hudLabels');
  if (!root || !root.children.length) return;
  const w = window.innerWidth, h = window.innerHeight;
  camera.getWorldDirection(_hudDir);
  for (const el of root.children) {
    const l = el._lab;
    if (!l) continue;
    _hudTmp.copy(l.pos).sub(camera.position);
    if (_hudTmp.dot(_hudDir) < 0.15) { el.style.visibility = 'hidden'; continue; }
    _hudTmp.copy(l.pos).project(camera);
    if (_hudTmp.z > 1) { el.style.visibility = 'hidden'; continue; }
    let x = (_hudTmp.x * 0.5 + 0.5) * w;
    let y = (-_hudTmp.y * 0.5 + 0.5) * h;
    // Hide if way off-screen; otherwise clamp so the label stays readable.
    if (x < -80 || x > w + 80 || y < -80 || y > h + 80) {
      el.style.visibility = 'hidden';
      continue;
    }
    const lw = el.offsetWidth || 180, lh = el.offsetHeight || 36;
    const pad = 10;
    x = Math.max(pad + lw / 2, Math.min(w - pad - lw / 2, x));
    y = Math.max(pad + lh, Math.min(h - pad, y));
    el.style.visibility = 'visible';
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  }
}

function setMode(next, opts = {}) {
  mode = next;
  document.getElementById('btnOrbit').setAttribute('aria-pressed', String(mode === 'orbit'));
  document.getElementById('btnWalk').setAttribute('aria-pressed', String(mode === 'walk'));
  document.body.classList.toggle('walk', mode === 'walk');
  orbit.enabled = mode === 'orbit' && !fly;
  if (mode === 'walk') {
    fly = null;
    player.set(WALK_START.x, EYE, WALK_START.z);
    yaw = WALK_START.yaw;
    pitch = WALK_START.pitch;
    collide(player);
    player.y = EYE;
    if (pointerLocked && document.exitPointerLock) document.exitPointerLock();
  } else if (!opts.keepCamera) {
    camera.position.set(START_CAM.x, START_CAM.y, START_CAM.z);
    orbit.target.set(START_CAM.tx, START_CAM.ty, START_CAM.tz);
    orbit.update();
    if (document.exitPointerLock) document.exitPointerLock();
  } else if (document.exitPointerLock) {
    document.exitPointerLock();
  }
  document.getElementById('hint').textContent = mode === 'orbit'
    ? 'Orbit: drag to look, scroll or pinch to zoom. Tap a door to open it.'
    : (isTouch()
      ? 'Walk: use the joystick to move, drag to look. Tap a door to open it.'
      : 'Walk: WASD to move, click the view and move the mouse to look. Tap a door to open it.');
}

function isTouch() {
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

function updateWalk(dt) {
  let mx = 0, mz = 0;
  if (keys['KeyW'] || keys['ArrowUp']) mz += 1;
  if (keys['KeyS'] || keys['ArrowDown']) mz -= 1;
  if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if (joy.active) { mx += joy.x; mz += -joy.y; } // joystick y up is forward
  const len = Math.hypot(mx, mz);
  if (len > 1) { mx /= len; mz /= len; }
  if (len > 0.05) {
    const speed = WALK_SPEED * (keys['ShiftLeft'] ? 1.6 : 1);
    // yaw 0 looks north (−Z). Forward is (sin yaw, −cos yaw) in x-z
    const fx = Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.sin(yaw + Math.PI/2), rz = -Math.cos(yaw + Math.PI/2);
    player.x += (fx * mz + rx * mx) * speed * dt;
    player.z += (fz * mz + rz * mx) * speed * dt;
    collide(player);
  }
  player.y = EYE;
  camera.position.copy(player);
  const look = new THREE.Vector3(
    player.x + Math.sin(yaw) * Math.cos(pitch),
    player.y + Math.sin(pitch),
    player.z - Math.cos(yaw) * Math.cos(pitch)
  );
  camera.lookAt(look);
}

function toggleDoor(d) {
  d.open = !d.open;
  const target = d.open ? (90 * DEG) : 0;
  d.leaves.forEach((leaf) => { leaf.target = target; });
}

function tickDoors(dt) {
  doors.forEach((d) => {
    d.leaves.forEach((leaf) => {
      const tgt = (leaf.target || 0) * (leaf.sign || 1);
      const cur = leaf.angle || 0;
      const next = cur + Math.sign(tgt - cur) * Math.min(Math.abs(tgt - cur), 2.6 * dt);
      leaf.angle = next;
      leaf.pivot.rotation.y = next;
    });
  });
}

/* ---------- picking: doors, measure ---------- */
function ndcFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

function pickDoor(e) {
  ndcFromEvent(e);
  raycaster.setFromCamera(pointer, camera);
  const objs = [];
  doors.forEach((d) => d.leaves.forEach((leaf) => objs.push(leaf.pivot)));
  const hits = raycaster.intersectObjects(objs, true);
  if (hits.length) {
    const obj = hits[0].object;
    const d = doors.find((dd) => dd.leaves.some((l) => l.pivot === obj || l.pivot.children.includes(obj) || isChild(l.pivot, obj)));
    if (d) { toggleDoor(d); return true; }
  }
  return false;
}
function isChild(root, obj) {
  let o = obj;
  while (o) { if (o === root) return true; o = o.parent; }
  return false;
}

function pickMeasure(e) {
  ndcFromEvent(e);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(houseGroup.children, true);
  if (!hits.length) return;
  const p = hits[0].point.clone();
  measurePts.push(p);
  if (measurePts.length > 2) measurePts = measurePts.slice(-1);
  redrawMeasure();
}

function redrawMeasure() {
  while (measureGroup.children.length) {
    const c = measureGroup.children[0];
    measureGroup.remove(c);
    if (c.geometry) c.geometry.dispose();
  }
  const hud = document.getElementById('measureHud');
  measurePts.forEach((p) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), materials.measure);
    s.position.copy(p);
    measureGroup.add(s);
  });
  if (measurePts.length === 2) {
    const a = measurePts[0], b = measurePts[1];
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    measureGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd56a })));
    const d = a.distanceTo(b);
    const mmv = d * 1000;
    const mid = a.clone().lerp(b, 0.5);
    const spr = makeLabel(mmv >= 1000 ? `${d.toFixed(3)} m` : `${mmv.toFixed(0)} mm`);
    spr.position.copy(mid).add(new THREE.Vector3(0, 0.15, 0));
    measureGroup.add(spr);
    hud.textContent = mmv >= 1000
      ? `${d.toFixed(3)} m  (${mmv.toFixed(0)} mm)`
      : `${mmv.toFixed(0)} mm`;
    hud.classList.add('on');
  } else {
    hud.textContent = measurePts.length === 1 ? 'Tap a second point' : 'Tap two points';
    hud.classList.add('on');
  }
}

/* ---------- init ---------- */
async function init() {
  document.body.classList.toggle('touch', isTouch());
  if (window.innerWidth < 700) document.getElementById('panel').classList.add('hidden');
  const res = await fetch('data/geometry.json');
  G = await res.json();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87a0b8);
  scene.fog = new THREE.Fog(0x87a0b8, 40, 80);

  camera = new THREE.PerspectiveCamera(60, 2, 0.08, 80);
  camera.position.set(START_CAM.x, START_CAM.y, START_CAM.z);
  camera.lookAt(START_CAM.tx, START_CAM.ty, START_CAM.tz);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  amb = new THREE.AmbientLight(0xfff1e0, 0.55);
  scene.add(amb);
  hemi = new THREE.HemisphereLight(0xd6e6f6, 0x7a6a52, 0.85);
  scene.add(hemi);
  fill = new THREE.DirectionalLight(0xfff2e0, 0.55);
  fill.position.set(-6, 8, 5);
  fill.castShadow = false;
  scene.add(fill);
  sunLight = new THREE.DirectionalLight(0xfff5e8, 1.15);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 80;
  sunLight.shadow.camera.left = -22;
  sunLight.shadow.camera.right = 22;
  sunLight.shadow.camera.top = 22;
  sunLight.shadow.camera.bottom = -22;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  makeMaterials();
  buildModel();

  orbit = new OrbitControls(camera, canvas);
  orbit.target.set(START_CAM.tx, START_CAM.ty, START_CAM.tz);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.maxPolarAngle = Math.PI * 0.49;
  orbit.minDistance = 2;
  orbit.maxDistance = 36;
  orbit.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

  bindUI();
  applySun();
  onResize();
  loading.classList.add('done');
  renderer.setAnimationLoop(frame);
}

function bindUI() {
  document.getElementById('btnOrbit').addEventListener('click', () => setMode('orbit'));
  document.getElementById('btnWalk').addEventListener('click', () => setMode('walk'));
  document.getElementById('btnClash').addEventListener('click', () => {
    setClashes(!clashesOn);
  });
  document.getElementById('btnHeights').addEventListener('click', (e) => {
    heightsOn = !heightsOn;
    labelGroup.visible = false;
    e.currentTarget.setAttribute('aria-pressed', String(heightsOn));
    syncHudLabels();
  });
  document.getElementById('presets').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-clash]');
    if (btn) flyToClash(btn.dataset.clash);
  });
  document.getElementById('btnMeasure').addEventListener('click', (e) => {
    measureOn = !measureOn;
    e.currentTarget.setAttribute('aria-pressed', String(measureOn));
    const hud = document.getElementById('measureHud');
    if (!measureOn) {
      measurePts = [];
      redrawMeasure();
      hud.classList.remove('on');
    } else {
      hud.textContent = 'Tap two points';
      hud.classList.add('on');
    }
  });
  document.getElementById('togglePanel').addEventListener('click', () => {
    document.getElementById('panel').classList.toggle('hidden');
  });

  const date = document.getElementById('sunDate');
  const time = document.getElementById('sunTime');
  const slider = document.getElementById('sunSlider');
  function syncSliderFromTime() {
    const [h, m] = time.value.split(':').map(Number);
    slider.value = String(h * 60 + (m || 0));
    applySun();
  }
  function syncTimeFromSlider() {
    const v = Number(slider.value);
    const h = String(Math.floor(v / 60)).padStart(2, '0');
    const m = String(v % 60).padStart(2, '0');
    time.value = `${h}:${m}`;
    applySun();
  }
  date.addEventListener('change', applySun);
  time.addEventListener('change', syncSliderFromTime);
  slider.addEventListener('input', syncTimeFromSlider);

  window.addEventListener('resize', onResize);

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyM') document.getElementById('btnMeasure').click();
    if (e.code === 'KeyC') document.getElementById('btnClash').click();
    if (e.code === 'KeyH') document.getElementById('btnHeights').click();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  // Pointer: click doors / measure; walk look; orbit is handled by OrbitControls
  let downX = 0, downY = 0, downT = 0, looking = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    downX = lastX = e.clientX; downY = lastY = e.clientY; downT = performance.now();
    if (mode === 'walk' && !isTouch()) {
      // request pointer lock on a non-drag click later
    }
    if (mode === 'walk' && isTouch() && !inJoy(e)) {
      looking = true;
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (mode === 'walk' && pointerLocked) return; // movement handled by mousemove
    if (looking) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      yaw -= dx * 0.005;
      pitch -= dy * 0.005;
      pitch = Math.max(-1.2, Math.min(1.2, pitch));
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    const dt = performance.now() - downT;
    looking = false;
    if (moved < 8 && dt < 600) {
      if (measureOn) { pickMeasure(e); return; }
      if (pickDoor(e)) return;
      if (mode === 'walk' && !isTouch() && !pointerLocked) {
        canvas.requestPointerLock && canvas.requestPointerLock();
      }
    }
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
  });
  document.addEventListener('mousemove', (e) => {
    if (!pointerLocked || mode !== 'walk') return;
    yaw -= e.movementX * 0.0025;
    pitch -= e.movementY * 0.0025;
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
  });

  // Joystick
  const joyEl = document.getElementById('joy');
  const knob = joyEl.querySelector('.knob');
  function inJoy(e) {
    const r = joyEl.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }
  function setKnob(x, y) {
    const r = joyEl.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    let dx = x - cx, dy = y - cy;
    const max = r.width/2 - 28;
    const d = Math.hypot(dx, dy) || 1;
    if (d > max) { dx *= max/d; dy *= max/d; }
    knob.style.left = (r.width/2 - 28 + dx) + 'px';
    knob.style.top = (r.height/2 - 28 + dy) + 'px';
    joy.x = dx / max;
    joy.y = dy / max; // screen y down
    joy.active = true;
  }
  function resetJoy() {
    knob.style.left = '36px'; knob.style.top = '36px';
    joy.x = joy.y = 0; joy.active = false;
  }
  let joyPtr = null;
  joyEl.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    joyPtr = e.pointerId;
    joyEl.setPointerCapture(e.pointerId);
    setKnob(e.clientX, e.clientY);
  });
  joyEl.addEventListener('pointermove', (e) => {
    if (joyPtr === e.pointerId) setKnob(e.clientX, e.clientY);
  });
  joyEl.addEventListener('pointerup', (e) => { joyPtr = null; resetJoy(); });
  joyEl.addEventListener('pointercancel', () => { joyPtr = null; resetJoy(); });
}

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  tickDoors(dt);
  tickFly(dt);
  if (mode === 'orbit' && !fly) orbit.update();
  else if (mode === 'walk') updateWalk(dt);
  projectHud();
  renderer.render(scene, camera);
}

init().catch((err) => {
  console.error(err);
  loading.textContent = 'Could not load the walkthrough: ' + err.message;
});

// Expose a tiny hook for Playwright tests
window.__roundhouse = {
  ready: () => !!G && !!renderer,
  setMode,
  setClashes,
  setHeights(v) {
    heightsOn = !!v;
    labelGroup.visible = false;
    document.getElementById('btnHeights').setAttribute('aria-pressed', String(heightsOn));
    syncHudLabels();
  },
  setSun(date, time) {
    document.getElementById('sunDate').value = date;
    document.getElementById('sunTime').value = time;
    const [h,m] = time.split(':').map(Number);
    document.getElementById('sunSlider').value = String(h*60+(m||0));
    applySun();
  },
  openAllDoors() { doors.forEach((d) => { if (!d.open) toggleDoor(d); }); },
  getPlayer: () => ({x: player.x, y: player.y, z: player.z, yaw, pitch}),
  setPlayer(x,z,y=EYE, yawi=null, pitchi=null) {
    player.set(x,y,z);
    if (yawi != null) yaw = yawi;
    if (pitchi != null) pitch = pitchi;
    collide(player);
    player.y = y;
  },
  setOrbit(x,y,z, tx=2, ty=1.6, tz=0) {
    if (mode !== 'orbit') setMode('orbit', { keepCamera: true });
    fly = null;
    camera.position.set(x,y,z);
    orbit.target.set(tx,ty,tz);
    orbit.update();
  },
  hidePanel(v=true) {
    document.getElementById('panel').classList.toggle('hidden', v);
  },
  flyToClash,
  flyDone: () => !fly,
  getClashes: () => computedClashes,
  roofRaise: () => ROOF_RAISE,
  setWalkView,
  activeClash: () => activeClash,
  doors: () => doors.map((d) => d.name)
};
