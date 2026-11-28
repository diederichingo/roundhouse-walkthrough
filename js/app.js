/**
 * Els's roundhouse, Penamacor — Option B walkthrough v1z3. Rev 2026-11-28k: attached shed, kitchen peninsula, 750 mm overhang from the post line, +200 mm, vents, taps.
 * Static three.js site. Dimensions from the B-sheets / geometry.json.
 * Not for construction.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { furnishInterior, furnishingLabels, VIEW_CAMS } from './furnishings.js?v=1z3';

const APP_VERSION = '1z3';
const canvas = document.getElementById('c');
const loading = document.getElementById('loading');

const TAN7 = Math.tan((7 * Math.PI) / 180);
const DEG = Math.PI / 180;
const mm = (v) => v * 0.001;
/** Roof structure / roof-post raise (m). Cob walls, head plate, openings, plinth,
 *  foundations and the utility top plate are not raised. Final figure from the
 *  Roundhouse bot, 25 Nov 2026, synced to geometry_report_B.txt. */
const ROOF_RAISE = 0.400; // v1y: rev j2 +200, plus Tom's further +200 (ASSUMED)
// v1z = rev 2026-11-28k: overhang 750 mm from the in-wall post line (S/W/N), east 750 mm past the x = +9 posts.
// Roof 15.5 × 11.5 m: eaves y = ±5.750, west x = −5.750, east x = +9.750. End posts at y = ±5.550 (200 mm of beam past the post).
const EAVE_EDGE = 5.750;               // fascia / eave purlin outer face (|y|)
const EAVE_CL = EAVE_EDGE - 0.075;     // 150 mm eave purlin centreline 5.675
const END_POST_Y = EAVE_CL - 0.125;    // 5.550: end posts keep the 200 mm beam overhang past the post CL
const SHED = { yS: -2.550, yN: 0, xE: 9.000, doorY0: -1.180, doorY1: -0.300, plateTop: 2.850 };
// shed ceiling/insulation extent (interior faces of N/S/E walls; west end tucks under the house roof).
const uCeilX0 = 4.45, uCeilX1 = SHED.xE - 0.100, uCeilZ0 = -SHED.yN + 0.125, uCeilZ1 = -SHED.yS - 0.125;
function applyV1yPlan(G) {
  G.roof = { x0: -EAVE_EDGE * 1000, x1: 9750, y0: -EAVE_EDGE * 1000, y1: EAVE_EDGE * 1000 };
  G.purlin.ys = G.purlin.ys.map((y) => (Math.abs(y) > 6000 ? Math.sign(y) * EAVE_CL * 1000 : y));
  const moveEnd = (p) => { if (Math.abs(p.y) > 5900) p.y = Math.sign(p.y) * END_POST_Y * 1000; };
  G.posts.forEach(moveEnd);
  G.extPosts.forEach(moveEnd);
  // Corner posts: two braces each, one along each wall line (beam line N–S and eave line E–W).
  const keepEW = { 'SW corner': 1, 'NW corner': 1, 'SE corner': -1, 'NE corner': -1, 'SE-ext': -1, 'NE-ext': -1 };
  G.braces = G.braces.filter((b) => !(b.post in keepEW) || b.dir === 'N-S' || b.side === keepEW[b.post]);
  G.braces.forEach(moveEnd);
  G.extStrip.y0 = -EAVE_EDGE * 1000; G.extStrip.y1 = EAVE_EDGE * 1000;
  // Shed joined to the house between window 5 and the back door (bays 6–8), door east.
  Object.assign(G.utility, {
    x_w: 4400, x_e: SHED.xE * 1000, y_s: SHED.yS * 1000, y_n: SHED.yN * 1000,
    door_wall: 'east', door_hinge: 'north', door_out: 1, door_clear: 800, door_opening: 880,
    door_height: 2100, door_head: 2140, door_y0: SHED.doorY0 * 1000, door_y1: SHED.doorY1 * 1000,
    backDoorClearanceMm: null
  });
  G.utilPosts = [
    { name: 'SW-shed', x: 4701, y: SHED.yS * 1000, base: 100, top: 2330, length: 2230, kind: 'utility' },
    { name: 'SE-shed', x: 9000, y: SHED.yS * 1000, base: 100, top: 2330, length: 2230, kind: 'utility' }
  ];
  // Vents (ASSUMED positions). Low ~500 above the slab; high in the round wall above the head plate.
  // Rev k bays: LV-B bay 3 (300 pier), LV-K bay 16, LV-L1/L2 bay 26; HV-S bay 26, HV-W bay 22, HV-E bay 13. Low at 500.
  G.vents = [
    { tag: 'LV-B', bay: 3, th: 35.08, aff: 500, kind: 'low inlet', room: 'bathroom (300 mm pier)' },
    { tag: 'LV-K', bay: 16, th: 195.45, aff: 500, kind: 'low inlet', room: 'next to the kitchen (300 mm piece)' },
    { tag: 'LV-L1', bay: 26, th: 351.9, aff: 500, kind: 'low inlet', room: 'living, bay 26' },
    { tag: 'LV-L2', bay: 26, th: 357.1, aff: 500, kind: 'low inlet', room: 'living, bay 26' },
    { tag: 'HV-S', bay: 26, th: 354.5, aff: 2850, kind: 'high vent', room: 'bay 26 (stack vent, height ASSUMED)' },
    { tag: 'HV-W', bay: 22, th: 294.15, aff: 2850, kind: 'high vent', room: 'living, west (height ASSUMED)' },
    { tag: 'HV-E', bay: 13, th: 161.2, aff: 2850, kind: 'high vent', room: 'kitchen side (height ASSUMED)' },
    { tag: 'F1', bay: 5, th: 52.2, aff: 2700, kind: 'shower fan / lined vent', room: 'bathroom (rev k: bay 8, now inside the shed, so moved; FLAG)' }
  ];
}
const LAT = 40.17;
const LON = -7.17;
const EYE_STAND = 1.75;
const EYE_SIT = 1.15;
const EYE_TAU = 0.18;            // stand/sit easing, seconds
const FLOOR_TAU = 0.16;          // FFL ↔ grade step easing, seconds
const FFL_Y = 0;
const GRADE_Y = -0.180;          // FFL is 180 mm above grade
const EYE = EYE_STAND;           // default / standing eye height above the local floor
const RADIUS = 0.22;
const WALK_SPEED = 2.4;
// Look / move feel (v1s). Slider is a multiplier on these calmer baselines (was 0.0025 mouse / 0.005 touch).
const LOOK_SENS_MOUSE = 0.00115; // rad per CSS pixel at 1×, pointer-lock mouse
const LOOK_SENS_TOUCH = 0.00140; // rad per CSS pixel at 1×, walk look-drag
const LOOK_SENS_MIN = 0.2;
const LOOK_SENS_MAX = 2.0;
const LOOK_SENS_DEFAULT = 1.0;   // 1× = the new calmer default
const LOOK_TAU = 0.15;           // yaw/pitch time constant, seconds
const MOVE_TAU = 0.14;           // walk accel/decel time constant, seconds
const PITCH_LIMIT = 80 * Math.PI / 180;
const LOOK_DELTA_CLAMP_TOUCH = 48; // CSS px per event
const LOOK_DELTA_CLAMP_MOUSE = 64;
const LOOK_SENS_KEY = 'roundhouse.lookSensitivity';
const LOOK_MODE_KEY = 'roundhouse.lookMode';
const LOOK_JOY_DEAD_PX = 8;       // CSS px dead zone around the look-joystick anchor
const LOOK_JOY_RANGE_PX = 90;     // CSS px offset at which the max turn rate is reached
const LOOK_JOY_YAW_MAX = 90 * Math.PI / 180;   // rad/s at 1×, full deflection
const LOOK_JOY_PITCH_MAX = 90 * Math.PI / 180; // rad/s at 1×, full deflection
const ORBIT_ROTATE_SPEED = 0.50; // OrbitControls default is 1.0
const ORBIT_DAMPING = 0.10;

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
let roofOff = false;
let structureOnly = false;
let keys = Object.create(null);
const WALK_START = { x: -2.20, z: -0.35, yaw: 0.55, pitch: -0.08 };
const START_CAM = { x: 15.4, y: 7.6, z: 16.6, tx: 3.6, ty: 1.35, tz: 0.8 };
let yaw = WALK_START.yaw;
let pitch = WALK_START.pitch;
let yawTarget = yaw;
let pitchTarget = pitch;
let moveVX = 0, moveVZ = 0;
let lookSens = LOOK_SENS_DEFAULT;
let lookMode = 'drag'; // 'joystick' | 'drag' — default is joystick on touch, drag otherwise
let lookJoy = { active: false, pointerId: null, ax: 0, ay: 0, x: 0, y: 0 };
let looking = false;
let lookPtr = null;
let seated = false;
let eyeOffset = EYE_STAND;
let floorY = FFL_Y;
let player = new THREE.Vector3(WALK_START.x, FFL_Y + EYE_STAND, WALK_START.z);
let fly = null; // {fromPos,toPos,fromTarget,toTarget,t,dur}
let activeClash = null;
let activeView = null;
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
let gutterSpec = null;
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
function tngSoffitFFL(yNorth) { return coverFFL(yNorth) - 0.200 - 0.020; }
/** Top of a wall that closes to the T&G underside, 1 mm shy to avoid z-fighting (rev j: tight, no shadow gap). */
function ceilingCloseAFF(zWorld) { return tngSoffitFFL(-zWorld) - 0.001; }
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

function tngTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  const boards = 8;
  const h = c.height / boards;
  for (let i = 0; i < boards; i++) {
    const shade = i % 2 ? '#d2ae7a' : '#c8a06e';
    ctx.fillStyle = shade;
    ctx.fillRect(0, i * h, c.width, h);
    ctx.fillStyle = 'rgba(80,50,24,0.35)';
    ctx.fillRect(0, (i + 1) * h - 2, c.width, 2);
    // faint grain
    ctx.fillStyle = 'rgba(60,35,16,0.08)';
    for (let k = 0; k < 20; k++) {
      ctx.fillRect(Math.random() * c.width, i * h + Math.random() * h, 40 + Math.random() * 80, 1);
    }
  }
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
  textures.tng = tngTexture();

  materials.cob = new THREE.MeshStandardMaterial({
    map: textures.cob, color: 0xd8c09a, roughness: 0.95, metalness: 0.0
  });
  materials.cobInner = new THREE.MeshStandardMaterial({
    map: textures.cob, color: 0xe8d3b0, roughness: 0.95, metalness: 0.0
  });
  // One lime render + limewash for every exterior face (rev j): house, utility N/S/W and E, no colour change at the corners.
  textures.limewash = noiseTexture(64, [232, 222, 204], [218, 208, 190], 0.22);
  textures.limewash.repeat.set(8, 4);
  materials.limeOuter = new THREE.MeshStandardMaterial({
    map: textures.limewash, color: 0xe8e0d0, roughness: 0.92, metalness: 0.0
  });
  materials.lime = materials.limeOuter;
  // Insulation in the 150 mm frame (cork-like; product still CHECK).
  materials.insulation = new THREE.MeshStandardMaterial({
    color: 0xc4a56a, roughness: 0.92, metalness: 0.0
  });
  materials.tng = new THREE.MeshStandardMaterial({
    map: textures.tng, color: 0xe0c396, roughness: 0.72, metalness: 0.0,
    side: THREE.DoubleSide
  });
  materials.timber = new THREE.MeshStandardMaterial({
    map: textures.timber, color: 0xd2a878, roughness: 0.68, metalness: 0.0
  });
  // Intended 15 mm fit gap fill: shims + sill tape (not an open void).
  materials.sillTape = new THREE.MeshStandardMaterial({
    color: 0x3a342c, roughness: 0.85, metalness: 0.0
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
  materials.galvanised = new THREE.MeshStandardMaterial({ color: 0xc6cac6, roughness: 0.28, metalness: 0.82, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  // Pre-galv zinc for rainwater goods (not structural steel).
  materials.gutter = new THREE.MeshStandardMaterial({ color: 0x9aa19a, roughness: 0.38, metalness: 0.72 });
  materials.ply = new THREE.MeshStandardMaterial({ color: 0xd8c9a6, roughness: 0.72, metalness: 0 });
  materials.curtain = new THREE.MeshStandardMaterial({
    color: 0x6b3a3a, roughness: 0.9, metalness: 0, transparent: true, opacity: 0.82,
    side: THREE.DoubleSide, depthWrite: false
  });
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
  classifyByMaterial(m, mat);
  return m;
}

/** View-toggle layers only — no geometry change. */
function classifyByMaterial(m, mat) {
  if (!m || !mat) return;
  const first = Array.isArray(mat) ? mat[0] : mat;
  const ud = m.userData;
  if (first === materials.cob || first === materials.cobInner || first === materials.limeOuter || first === materials.lime || first === materials.sillTape) {
    ud.viewLayer = 'skin';
  } else if (first === materials.insulation) {
    ud.viewLayer = 'insulation';
  } else if (first === materials.tng) {
    ud.viewLayer = 'ceiling';
    ud.member = 'tng';
  } else if (first === materials.roof || first === materials.roofUnder) {
    ud.viewLayer = 'roofCover';
  } else if (first === materials.glass) {
    ud.viewLayer = 'glazing';
  } else if (first === materials.door) {
    ud.viewLayer = 'door';
  } else if (first === materials.stone) {
    ud.viewLayer = 'site';
    ud.member = 'plinth';
  } else if (first === materials.earth) {
    ud.viewLayer = 'site';
    ud.member = 'earth';
  } else if (first === materials.ground) {
    ud.viewLayer = 'site';
    ud.member = 'ground';
  } else if (first === materials.metal || first === materials.galvanised) {
    ud.viewLayer = 'steel';
    ud.member = 'steel';
  } else if (first === materials.timber) {
    ud.viewLayer = 'timber';
  } else if (materials.dpc && first === materials.dpc) {
    ud.viewLayer = 'site';
    ud.member = 'plinth';
  } else if (first === materials.ply || first === materials.curtain) {
    ud.viewLayer = 'furniture';
  } else if (first === materials.gutter) {
    ud.viewLayer = 'rainwater';
  } else if (first === materials.white) {
    ud.viewLayer = 'furniture';
  } else if (first === materials.clash || first === materials.clashAmber || first === materials.clashLine || first === materials.headroom || first === materials.measure) {
    ud.viewLayer = 'overlay';
  }
}

function tagLayer(obj, layer, member) {
  if (!obj) return obj;
  const apply = (m) => {
    if (!m.isMesh) return;
    m.userData.viewLayer = layer;
    if (member) m.userData.member = member;
  };
  apply(obj);
  if (obj.traverse) obj.traverse(apply);
  return obj;
}

const MEMBER_COLORS = {
  post: 0xc56a2d,
  beam: 0xe8b63a,
  purlin: 0x2a9d8f,
  brace: 0xe76f27,
  joist: 0xd8c56a,
  stud: 0x5b86c7,
  plate: 0x9b6fb8,
  steel: 0xd0d5d8
};
let memberMats = null;
function getMemberMats() {
  if (memberMats) return memberMats;
  memberMats = {};
  for (const [k, col] of Object.entries(MEMBER_COLORS)) {
    const metal = k === 'steel' ? 0.75 : 0.05;
    memberMats[k] = new THREE.MeshStandardMaterial({
      color: col, roughness: k === 'steel' ? 0.32 : 0.55, metalness: metal
    });
  }
  return memberMats;
}

function assignTimberMember(m) {
  const g = m.geometry;
  const p = g && g.parameters;
  const y = m.position.y;
  if (p) {
    if (Math.abs(m.rotation.x - 7 * DEG) < 0.03 && p.width === 0.200 && p.height === 0.240) {
      m.userData.member = 'beam'; return;
    }
    if (p.height === 0.200 && p.depth === 0.150 && p.width > 8) {
      m.userData.member = 'purlin'; return;
    }
    if (p.width === 0.050 && p.height === 0.200) {
      m.userData.viewLayer = 'ceiling';
      m.userData.member = 'joist'; return;
    }
    if (p.width === 0.050 && p.depth === 0.150) {
      m.userData.member = 'stud'; return;
    }
    if (p.width === 0.200 && p.depth === 0.200) {
      m.userData.member = 'post'; return;
    }
    if (p.width === 0.060 && (p.height === 0.120 || p.height === 0.100)) {
      m.userData.member = 'post'; return;
    }
    if (p.width === 0.100 && p.depth === 0.100 && p.height > 1.5) {
      m.userData.member = 'post'; return;
    }
    if (p.height === 0.100 && p.width > 2 && p.depth > 1) {
      m.userData.member = 'plate'; return;
    }
    if (p.height === 0.050 && p.depth === 0.050 && y > 2.4) {
      m.userData.viewLayer = 'ceiling';
      m.userData.member = 'joist'; return;
    }
    if (Math.abs(p.height - 2.200) < 0.02 || Math.abs(p.height - 0.850) < 0.02 ||
        Math.abs(p.height - 0.900) < 0.02 || (p.height === 0.050 && y < 1.2)) {
      m.userData.viewLayer = 'furniture';
      delete m.userData.member;
      return;
    }
    if (p.depth === 0.150 && p.height > 2.0 && p.height < 2.3) {
      m.userData.member = 'stud'; return;
    }
  }
  if (!p) {
    m.userData.member = 'plate';
    return;
  }
  m.userData.member = 'stud';
}

function finalizeViewLayers() {
  houseGroup.traverse((m) => {
    if (!m.isMesh) return;
    const ud = m.userData;
    if (ud.viewLayer === 'rainwater') return;
    if (ud.post) { ud.viewLayer = 'timber'; ud.member = 'post'; return; }
    if (ud.usStud) { ud.viewLayer = 'timber'; ud.member = 'stud'; return; }
    if (ud.brace) { ud.viewLayer = 'timber'; ud.member = 'brace'; return; }
    if (ud.eaveAngle) { ud.viewLayer = 'steel'; ud.member = 'steel'; return; }
    if (ud.ceilingJoist || ud.braceCollar) { ud.viewLayer = 'ceiling'; ud.member = 'joist'; return; }
    if (ud.ceiling) { ud.viewLayer = 'ceiling'; ud.member = ud.member || 'tng'; return; }
    if (ud.role) { ud.viewLayer = 'furniture'; return; }
    if (!ud.viewLayer) classifyByMaterial(m, m.material);
    if (ud.viewLayer === 'insulation') {
      const box = new THREE.Box3().setFromObject(m);
      if (box.min.y > 2.55) {
        ud.viewLayer = 'ceiling';
        ud.member = 'insulation';
      }
    }
    if (ud.viewLayer === 'timber' && !ud.member) assignTimberMember(m);
    if (!ud.viewLayer) ud.viewLayer = 'furniture';
  });
}

function meshShownInView(m) {
  const layer = m.userData.viewLayer;
  const member = m.userData.member;
  if (!layer || layer === 'overlay') return true;
  if (layer === 'rainwater') return !roofOff && !structureOnly;
  if (layer === 'site') {
    if (!structureOnly) return true;
    return member === 'ground' || member === 'compass';
  }
  if (structureOnly) {
    if (layer === 'timber' || layer === 'steel') return true;
    if (layer === 'ceiling' && member === 'joist') return !roofOff;
    return false;
  }
  if (roofOff && (layer === 'roofCover' || layer === 'ceiling')) return false;
  return true;
}

function applyViewModes() {
  const mats = getMemberMats();
  houseGroup.traverse((m) => {
    if (!m.isMesh) return;
    const show = meshShownInView(m);
    m.visible = show;
    const layer = m.userData.viewLayer;
    const member = m.userData.member;
    const colourable = (layer === 'timber' || layer === 'steel' || (layer === 'ceiling' && member === 'joist')) && member && mats[member];
    if (structureOnly && show && colourable) {
      if (!m.userData._origMat) m.userData._origMat = m.material;
      m.material = mats[member];
    } else if (m.userData._origMat) {
      m.material = m.userData._origMat;
    }
  });
  const legend = document.getElementById('structLegend');
  if (legend) legend.hidden = !structureOnly;
  document.body.classList.toggle('structure-only', structureOnly);
  document.body.classList.toggle('roof-off', roofOff);
  const btnRoof = document.getElementById('btnRoofOff');
  const btnStruct = document.getElementById('btnStructure');
  if (btnRoof) btnRoof.setAttribute('aria-pressed', String(roofOff));
  if (btnStruct) btnStruct.setAttribute('aria-pressed', String(structureOnly));
}

function setRoofOff(v) {
  roofOff = !!v;
  applyViewModes();
}
function setStructureOnly(v) {
  structureOnly = !!v;
  applyViewModes();
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
  classifyByMaterial(shell, mat);
  classifyByMaterial(inner, innerMat || (mat === materials.cob ? materials.cobInner : mat));
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
  classifyByMaterial(m, mat);
  if (mat === materials.timber) { m.userData.viewLayer = 'timber'; m.userData.member = 'stud'; }
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

  // Sandwich wall: 150 mm timber frame + up to 50 mm cob/plaster skin each face.
  // House bays, utility and the kitchen under-sill: T = 250 mm. Inner wall 200 mm (CHECK).
  const FRAME_T = 0.150;
  const SKIN_T = 0.050;
  const WALL_T = FRAME_T + 2 * SKIN_T; // 0.250
  const R = 5.0;
  const rIn = R - WALL_T / 2;        // 4.875
  const rOut = R + WALL_T / 2;       // 5.125
  const rFrameIn = R - FRAME_T / 2;  // 4.925
  const rFrameOut = R + FRAME_T / 2; // 5.075
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
  const K_SILL = (G.kitchenSill || 1200) * 0.001; // rev h: window 1 200–2 300 (B-15 1 260/2 360 was wrong)
  const K_HEAD = (G.kitchenHead || 2300) * 0.001;
  const K_RAIL_TOP = (G.kitchenSillRail || 1185) * 0.001; // rail top 1 185, 85 mm above the 1 100 shelf
  const K_RAIL_H = 0.100;
  const K_RAIL_BOT = K_RAIL_TOP - K_RAIL_H;
  const CURVE_T = 0.200; // inner wall, UNCONFIRMED (proposal CHECK: 100 mm frame + 2×50 mm skins)
  const PACKER = 0.015;  // 15 mm packer on the sole under windows with no under-sill
  const FIT_GAP = 0.015; // intended fit gap (shims + sill tape) each side of the unit
  // The v1j didactic section cut (1.20–3.60°, just east of the S post) was a
  // through-hole in the wall. It is closed: the sandwich is continuous. The
  // post-coverage view still reads the layers at the exposed post end-caps.
  function rangesExceptSection(a0, a1) {
    if (a1 < a0) a1 += 360;
    return (a1 - a0 > 0.05) ? [[a0, a1]] : [];
  }

  function sandwichRing(a0, a1, y0, y1, segs = 8) {
    // Outer cob/plaster, insulation in the 150 mm frame, inner cob/plaster.
    // End caps at openings (and at the S-post section) give a layered reveal.
    // Core avoids the sole / head plate.
    for (const [b0, b1] of rangesExceptSection(a0, a1)) {
      houseGroup.add(ringBand(rFrameOut, rOut, b0, b1, y0, y1, materials.limeOuter, segs));
      const coreY0 = Math.max(y0, SOLE_TOP), coreY1 = Math.min(y1, HEAD_SOF);
      if (coreY1 > coreY0 + 1e-4) {
        houseGroup.add(ringBand(rFrameIn, rFrameOut, b0, b1, coreY0, coreY1, materials.insulation, segs));
      }
      houseGroup.add(ringBand(rIn, rFrameIn, b0, b1, y0, y1, materials.cobInner, segs));
    }
  }

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
      for (const [b0, b1] of rangesExceptSection(a0, a1)) {
        houseGroup.add(ringBand(R - 0.075, R + 0.075, b0, b1, PL_TOP, SOLE_TOP, materials.timber, 8));
      }
    }
  });

  // Head plate continuous-ish
  segs.forEach((s) => {
    const v0 = verts.find((v) => Math.abs(v.theta - s.th0) < 1e-4);
    const v1 = verts.find((v) => Math.abs(v.theta - s.th1) < 1e-4) || (s.th1 >= 359.9 ? verts[0] : null);
    const a0 = s.th0 + (v0 && v0.member === 'post' ? memberHalfDeg(v0) : 0);
    const a1 = s.th1 - (v1 && v1.member === 'post' ? memberHalfDeg(v1) : 0);
    if (a1 > a0 + 0.05) {
      for (const [b0, b1] of rangesExceptSection(a0, a1)) {
        houseGroup.add(ringBand(R - 0.075, R + 0.075, b0, b1, HEAD_SOF, HEAD_TOP, materials.timber, 8));
      }
    }
  });

  // Upper closing sandwich (CHECK / unconfirmed): 150 mm US frame + 50 mm skins each face,
  // same 250 mm as the wall below. Skins and cavity run past the head plate so it is not a
  // cold band. 20 mm slip joint stays; laths and skins stop short of the moving roof.
  // US member is 150 × 50 (was 100 × 50), 150 mm across the wall, flush with the head plate.
  const US_SPACING = 0.600;
  function addUpperClosingBand(b0, b1, y0, y1, segsN = 3) {
    if (y1 <= y0 + 0.01 || b1 <= b0 + 0.04) return;
    houseGroup.add(ringBand(rFrameOut, rOut, b0, b1, y0, y1, materials.limeOuter, segsN));
    houseGroup.add(ringBand(rIn, rFrameIn, b0, b1, y0, y1, materials.cobInner, segsN));
    if (y1 > HEAD_TOP + 0.02) {
      const iy0 = Math.max(y0, HEAD_TOP);
      if (y1 > iy0 + 0.02) houseGroup.add(ringBand(rFrameIn, rFrameOut, b0, b1, iy0, y1, materials.insulation, segsN));
    }
  }
  function addUpperClosing(b0, b1, y0, y1) {
    const HW = G.highWindow;
    if (!HW || b1 < HW.th_e || b0 > HW.th_w) { addUpperClosingBand(b0, b1, y0, y1); return; }
    const o0 = HW.th_e, o1 = HW.th_w, oy0 = mm(HW.sill), oy1 = mm(HW.head);
    if (b0 < o0) addUpperClosingBand(b0, Math.min(b1, o0), y0, y1);
    if (b1 > o1) addUpperClosingBand(Math.max(b0, o1), b1, y0, y1);
    const mid0 = Math.max(b0, o0), mid1 = Math.min(b1, o1);
    if (mid1 > mid0) {
      if (y0 < oy0) addUpperClosingBand(mid0, mid1, y0, Math.min(y1, oy0));
      if (y1 > oy1) addUpperClosingBand(mid0, mid1, Math.max(y0, oy1), y1);
    }
  }
  segs.forEach((s) => {
    // Skins stop at the posts so the timber stays exposed (or lime-washed).
    const v0 = verts.find((v) => Math.abs(v.theta - s.th0) < 1e-4);
    const v1 = verts.find((v) => Math.abs(v.theta - s.th1) < 1e-4) || (s.th1 >= 359.9 ? verts[0] : null);
    const a0 = s.th0 + (v0 && v0.member === 'post' ? memberHalfDeg(v0) : 0);
    const a1 = s.th1 - (v1 && v1.member === 'post' ? memberHalfDeg(v1) : 0);
    if (a1 <= a0 + 0.05) return;
    const n = Math.max(3, Math.ceil((a1 - a0) / 8));
    for (let i = 0; i < n; i++) {
      const t0 = a0 + (a1 - a0) * (i / n);
      const t1 = a0 + (a1 - a0) * ((i + 1) / n);
      const mid = polar((t0 + t1) / 2, R);
      let top = coverFFL(-mid.y) - 0.020;
      // Under the x = ±5 beams the closing stops 20 mm under the beam soffit (rev j).
      if (Math.abs(Math.abs(mid.x) - 5.0) <= 0.100) top = soffitFFL(-mid.y) - 0.020;
      if (top > HEAD_SOF + 0.02) {
        for (const [b0, b1] of rangesExceptSection(t0, t1)) addUpperClosing(b0, b1, HEAD_SOF, top);
      }
    }
  });
  // US studs: 50 mm in the plane, 150 mm across the wall, ~600 mm along the wall,
  // standing on the head plate. 50 studs: omit 0° and the two that leave 23 mm
  // bays at the E/W ring posts (88.3° / 271.7°). Also skip any stud that lands
  // in a post or leaves a bay of 23 mm or less (cannot take laths or a skin).
  const usStep = (US_SPACING / R) * (180 / Math.PI);
  const postThetas = [0, 90, 180, 270];
  const US_OMIT = [0, 88.3, 271.7];
  const US_HALF = 0.025, POST_HALF = 0.100;
  const MIN_BAY = 0.023;
  for (let th = 0; th < 360 - 0.01; th += usStep) {
    if (US_OMIT.some((o) => {
      let d = Math.abs(th - o);
      if (d > 180) d = 360 - d;
      return d < 0.35;
    })) continue;
    let tooTight = false;
    for (const p of postThetas) {
      let d = Math.abs(th - p);
      if (d > 180) d = 360 - d;
      const gap = d * DEG * R - POST_HALF - US_HALF;
      if (gap < MIN_BAY) { tooTight = true; break; }
    }
    if (tooTight) continue;
    const HW = G.highWindow;
    if (HW && th > HW.th_e && th < HW.th_w) continue;
    const p = polar(th, R);
    let top = coverFFL(-p.y) - 0.020;
    const underEW = Math.abs(Math.abs(p.x) - 5.0) <= 0.100;
    if (underEW) top = soffitFFL(-p.y) - 0.020 - 0.050; // 20 mm slip + 100×50 under-beam plate
    const h = top - HEAD_TOP;
    if (h < 0.05) continue;
    const tt = th * DEG;
    const m = addBox(houseGroup, 0.050, h, 0.150, materials.timber, p.x, HEAD_TOP + h / 2, p.y);
    m.rotation.y = Math.atan2(Math.sin(tt), Math.cos(tt));
    m.userData.usStud = true;
  }
  // 100 × 50 under-beam plates (replace UT-08/09/20/21) under the x = ±5 beams,
  // plus 50 × 50 packers and a skin strip up to the panels at each beam face (rev j).
  (function underBeamPlates() {
    const BEAM_X = [5.0, -5.0], HALF = 0.100;
    function thetasUnder(bx) {
      const lo = (Math.asin(Math.min(1, (Math.abs(bx) - HALF) / R))) * 180 / Math.PI;
      // East post 90°, west 270°. Arc where |x| >= |bx|-HALF on the circle.
      if (bx > 0) return [90 - (90 - lo), 90 + (90 - lo)];
      return [270 - (90 - lo), 270 + (90 - lo)];
    }
    for (const bx of BEAM_X) {
      const [tA, tB] = thetasUnder(bx);
      const post = bx > 0 ? 90 : 270;
      const postH = (0.100 / R) * 180 / Math.PI;
      const ranges = [[tA, post - postH], [post + postH, tB]];
      for (const [a0, a1] of ranges) {
        if (a1 - a0 < 0.3) continue;
        const mid = polar((a0 + a1) / 2, R);
        const yN = -mid.y;
        const plateTop = soffitFFL(yN) - 0.020;
        const plateBot = plateTop - 0.050;
        const ang = (a1 - a0) * DEG;
        const chord = 2 * R * Math.sin(ang / 2);
        const pl = addBox(houseGroup, chord, 0.050, 0.100, materials.timber,
          mid.x, (plateBot + plateTop) / 2, mid.y);
        pl.rotation.y = Math.atan2(mid.x, mid.y);
        pl.userData.viewLayer = 'timber';
        pl.userData.member = 'plate';
        // Packer + skin/infill strip at the beam's N/S face, up to the covering slip.
        const edgeTh = (a0 === ranges[0][0]) ? a0 : a1;
        const ep = polar(edgeTh, R);
        const coverTop = coverFFL(-ep.y) - 0.020;
        const packY0 = soffitFFL(-ep.y) - 0.020;
        if (coverTop > packY0 + 0.04) {
          const pk = addBox(houseGroup, 0.050, coverTop - packY0, 0.050, materials.timber,
            ep.x, (packY0 + coverTop) / 2, ep.y);
          pk.rotation.y = edgeTh * DEG;
          pk.userData.viewLayer = 'timber';
          pk.userData.member = 'plate';
          addUpperClosingBand(edgeTh - 0.4, edgeTh + 0.4, packY0, coverTop, 2);
        }
      }
    }
  })();

  // Close the wall up to the beam and the roof in each ring-post sector. The
  // post itself stops at the beam soffit, so the skipped post wedge was a
  // see-through hole under the eave (Tom's v1l glitch). Skins still stop on
  // the post faces below the beam (timber exposed / lime-washed). Above the
  // beam the sandwich continues, with a 20 mm slip under the covering.
  function closePostToRoof(theta) {
    const half = (POST_HALF / R) * 180 / Math.PI;
    const p = polar(theta, R);
    const yN = -p.y;
    const beamSof = soffitFFL(yN);
    const beamTop = beamTopFFL(yN);
    const top = coverFFL(yN) - 0.020;
    const a0 = theta - half, a1 = theta + half;
    // 25 mm inner / outer skin zones around the beam, so the wall meets it.
    houseGroup.add(ringBand(R + POST_HALF, rOut, a0, a1, beamSof, beamTop, materials.limeOuter, 3));
    houseGroup.add(ringBand(rIn, R - POST_HALF, a0, a1, beamSof, beamTop, materials.cobInner, 3));
    // Full sandwich from the beam top up to the slip (closes the hole above).
    if (top > beamTop + 0.005) {
      houseGroup.add(ringBand(rFrameOut, rOut, a0, a1, beamTop, top, materials.limeOuter, 3));
      houseGroup.add(ringBand(rIn, rFrameIn, a0, a1, beamTop, top, materials.cobInner, 3));
      houseGroup.add(ringBand(rFrameIn, rFrameOut, a0, a1, beamTop, top, materials.insulation, 3));
    }
  }
  [0, 90, 180, 270].forEach(closePostToRoof);

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
      sandwichRing(a0, a1, PL_TOP, HEAD_SOF, 8);
    } else if (kind === 'big' || kind === 'small') {
      // No under-sill sandwich: sole + 15 mm packer, then the intended 15 mm fit gap
      // (shims + sill tape), then the 400 mm sill. Not a mismatch.
      houseGroup.add(ringBand(rFrameIn, rFrameOut, a0, a1, SOLE_TOP, SOLE_TOP + PACKER, materials.timber, 4));
      houseGroup.add(ringBand(rIn, rOut, a0, a1, SOLE_TOP + PACKER, SILL, materials.sillTape, 4));
      sandwichRing(a0, a1, WIN_HEAD, HEAD_SOF, 4);
      addWindow(a0, a1, SILL, WIN_HEAD, kind === 'big' ? 1.27 : 0.72, 1.90);
      if (s.no === 1) addWindow1Restrictor(a0, a1, SILL, WIN_HEAD);
    } else if (kind === 'kitchen') {
      // Window 15 (rev h): rail top 1 185, window 1 200–2 300, 900 × 1 100. 15 mm fit gap.
      sandwichRing(a0, a1, PL_TOP, K_RAIL_BOT, 6);
      houseGroup.add(ringBand(rFrameIn, rFrameOut, a0, a1, K_RAIL_BOT, K_RAIL_TOP, materials.timber, 4));
      houseGroup.add(ringBand(rIn, rOut, a0, a1, K_RAIL_TOP, K_SILL, materials.sillTape, 4));
      sandwichRing(a0, a1, K_HEAD, HEAD_SOF, 4);
      addWindow(a0, a1, K_SILL, K_HEAD, 0.90, 1.10);
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
    // Frame fills the opening so it meets the posts and mullions (no see-through slit).
    const w = Math.max(0.2, clearW);
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
    group.traverse((m) => {
      if (m.isMesh && m.userData.viewLayer === 'timber') m.userData.viewLayer = 'opening';
    });
    houseGroup.add(group);
  }

  // Window 1: 90° restrictor stay on the west (S-post) jamb, interior. Rev h decision.
  // About 65 mm clear of the S inward knee brace at 90°.
  function addWindow1Restrictor(a0, a1, z0, z1) {
    const p = polar(a0, rIn - 0.02); // west jamb, just inside the inner skin
    const t = a0 * DEG;
    const nx = Math.sin(t), nz = Math.cos(t);
    // Stay body, vertical on the jamb, clearly visible from inside.
    const bar = addBox(houseGroup, 0.018, 0.42, 0.018, materials.galvanised,
      p.x - nx * 0.03, z0 + 0.28, p.y - nz * 0.03);
    bar.rotation.y = Math.atan2(nx, nz);
    tagLayer(bar, 'opening');
    // Short arm that reads as a 90° stay (folded near the jamb when the sash is closed).
    const arm = addBox(houseGroup, 0.012, 0.012, 0.16, materials.galvanised,
      p.x - nx * 0.11, z0 + 0.22, p.y - nz * 0.11);
    arm.rotation.y = Math.atan2(nx, nz);
    tagLayer(arm, 'opening');
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
    const doorFrame = [
      addBox(group, clearW, 0.040, WALL_T, materials.timber, 0, 0.020, 0),
      addBox(group, 0.070, openingH, 0.070, materials.timber, -clearW / 2 + 0.035, openingH / 2, 0),
      addBox(group, 0.070, openingH, 0.070, materials.timber,  clearW / 2 - 0.035, openingH / 2, 0),
      addBox(group, clearW, 0.070, 0.070, materials.timber, 0, openingH - 0.035, 0)
    ];
    doorFrame.forEach((m) => { m.userData.viewLayer = 'opening'; });
    if (kind === 'gardendoor') {
      const w1 = clearW * 0.56;
      const w2 = clearW - w1;
      const leafH = unitH;
      // Wider leaf on local −X, narrower on +X. Each leaf extends from its jamb into the opening.
      const d1 = makeDoorLeaf(w1, leafH, frameD, 'out', +1);
      const d2 = makeDoorLeaf(w2, leafH, frameD, 'out', -1);
      d1.pivot.position.set(-clearW / 2, 0, 0);
      d2.pivot.position.set( clearW / 2, 0, 0);
      // makeDoorLeaf('out') rotates toward local −Z in this frame (local +Z is
      // outward). Flip the signs so both leaves swing toward +Z, i.e. outside.
      d1.sign = -d1.dir;
      d2.sign = -d2.dir;
      group.add(d1.pivot, d2.pivot);
      doors.push({
        name: 'Garden doors', kind, group, leaves: [d1, d2], open: false,
        a0, a1, p, nx, nz, inward: false, clearW, openingH
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
      // Sandwich under the back-door side light (local +Z is outward).
      {
        const sx = -clearW / 2 + sideW / 2;
        addBox(group, sideW, 0.400, SKIN_T, materials.limeOuter, sx, 0.200, WALL_T / 2 - SKIN_T / 2);
        addBox(group, sideW, 0.400, FRAME_T, materials.insulation, sx, 0.200, 0);
        addBox(group, sideW, 0.400, SKIN_T, materials.cobInner, sx, 0.200, -(WALL_T / 2 - SKIN_T / 2));
      }
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
    const paneFrame = addBox(g, w, h, 0.070, materials.timber, 0, 0, 0);
    paneFrame.scale.set(1,1,1);
    paneFrame.userData.viewLayer = 'opening';
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
    const stile = addBox(leaf, 0.018, h, depth + 0.012, materials.timber, dir * (leafW - 0.009), h / 2, 0);
    stile.userData.viewLayer = 'door';
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
      m.userData.viewLayer = 'timber';
      m.userData.member = 'stud';
    }
  });

  // Posts
  function addPost(p, kind) {
    // p.base, p.top are relative to plinth top (except we convert)
    const y0 = PL_TOP + mm(p.base);
    const y1 = soffitFFL(mm(p.y)); // beam soffit at this northing (v1y: posts may move); tenon goes up into the beam
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
  const beamLen = beamPlan / Math.cos(7 * DEG) - 0.030; // v1y: square-cut ends kept inside the roof edge
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
    m.userData.viewLayer = 'timber';
    m.userData.member = 'beam';
    houseGroup.add(m);
    // scarf mark at mid post
    const scarf = addBox(houseGroup, 0.22, 0.05, 0.60, materials.door, x, beamTopFFL(0) + 0.01, 0);
    scarf.rotation.x = 7 * DEG;
    scarf.userData.viewLayer = 'timber';
    scarf.userData.member = 'beam';
  });

  // Purlins (level). Eave pieces have their outer face at y = ±6 200 (CL ±6 125).
  G.purlin.ys.forEach((ymm) => {
    const z = wz(mm(ymm));
    const yTop = coverFFL(mm(ymm));
    const m = addBox(houseGroup, roofW, 0.200, 0.150, materials.timber, roofMidX, yTop - 0.100, z);
  });

  // Roof sandwich panels — 16.5 × 12.4 m plan at the structure (beams, eave purlins
  // flush). The weather covering alone projects 50 mm past the south fascia so it
  // can drip into the gutter (ASSUMED, v1t). North eave stays flush (high side, no gutter).
  const SOUTH_COVER_OH = 0.050;
  const slopeLen = (beamPlan + SOUTH_COVER_OH) / Math.cos(7 * DEG);
  const roofZc = SOUTH_COVER_OH / 2;
  const roofYc = coverFFL(0) + 0.030 * Math.cos(7 * DEG) - roofZc * TAN7;
  const roofMats = [
    materials.roof, materials.roof,
    materials.roof, materials.roofUnder,
    materials.roof, materials.roof
  ];
  const roof = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.060, slopeLen), roofMats);
  roof.rotation.x = 7 * DEG;
  roof.position.set(roofMidX, roofYc, roofZc);
  roof.castShadow = true;
  roof.receiveShadow = false;
  tagLayer(roof, 'roofCover');
  houseGroup.add(roof);
  roofMesh = roof;
  // Dedicated timber underside, offset below the panel so it never self-shadows.
  const roofUnder = new THREE.Mesh(new THREE.PlaneGeometry(roofW, slopeLen), materials.roofUnder);
  roofUnder.rotation.set(Math.PI / 2 + 7 * DEG, 0, 0);
  roofUnder.position.set(roofMidX, coverFFL(-roofZc) - 0.035, roofZc);
  roofUnder.receiveShadow = false;
  roofUnder.castShadow = false;
  tagLayer(roofUnder, 'roofCover');
  houseGroup.add(roofUnder);

  // South gutter at the low eave (ASSUMED). Half-round hung from the flush
  // eave purlin; the covering (only) projects 50 mm past the fascia into the
  // trough, and the crown back rim sits 20 mm below the underside drip (v1t).
  function buildSouthGutter() {
    const ID = 0.150;                 // 150 mm half-round, nominal bore
    const TH = 0.002;
    const R_IN = ID / 2;
    const R_OUT = R_IN + TH;
    const FALL = 0.003;               // 3 mm/m
    const DP_OD = 0.100;              // 100 mm circular downpipes
    const zFascia = -mm(G.roof.y0);   // +6.200, outer face of the south eave
    const gap = 0.008;
    const zC = zFascia + gap + R_OUT;
    // Covering projects 50 mm past the flush fascia (SOUTH_COVER_OH).
    const zMidS = zFascia + SOUTH_COVER_OH;
    const yBotDrip = coverFFL(-zMidS);                         // underside at the drip
    const yTopDrip = yBotDrip + 0.060 * Math.cos(7 * DEG);     // top of covering at the drip
    const zBotDrip = zMidS - 0.030 * Math.sin(7 * DEG);
    const zTopDrip = zMidS + 0.030 * Math.sin(7 * DEG);
    const dripY = yBotDrip; // drip used for hanging: underside of the covering edge
    const BACK_CLEAR = 0.020; // 20 mm below the underside drip at the crown (range 10–25)
    const x0 = mm(G.roof.x0);         // −6.000
    const x1 = mm(G.roof.x1);         // +10.500
    // Lows at the SW, SE and SE-ext posts; crowns mid-run. Same outlet invert.
    const outlets = [
      { x: -5.00, name: 'SW corner post' },
      { x:  5.00, name: 'SE corner post' },
      { x:  9.00, name: 'SE-ext post' }
    ];
    const relPts = [
      [x0,   Math.abs(x0 - outlets[0].x) * FALL],
      [-5.00, 0],
      [ 0.00, 5.00 * FALL],
      [ 5.00, 0],
      [ 7.00, 2.00 * FALL],
      [ 9.00, 0],
      [x1,   Math.abs(x1 - outlets[2].x) * FALL]
    ];
    // Crown (highest) back rim sits BACK_CLEAR below the underside drip.
    // Outlets and stop-ends are lower with the 3 mm/m fall.
    const crownRel = 5.00 * FALL;
    const I0 = dripY - BACK_CLEAR - R_IN - crownRel;
    function invertAt(x) {
      if (x <= relPts[0][0]) return I0 + relPts[0][1];
      for (let i = 0; i < relPts.length - 1; i++) {
        const a = relPts[i], b = relPts[i + 1];
        if (x <= b[0] || i === relPts.length - 2) {
          const t = (x - a[0]) / (b[0] - a[0]);
          return I0 + a[1] + t * (b[1] - a[1]);
        }
      }
      return I0 + relPts[relPts.length - 1][1];
    }

    const group = new THREE.Group();
    group.name = 'southGutter';

    // Hollow half-round trough, swept along X with the fall.
    const NPHI = 18;
    const NX = 96;
    const pos = [];
    const nrm = [];
    const idx = [];
    function ring(x, invert) {
      const cy = invert + R_IN;
      for (let side = 0; side < 2; side++) {
        const R = side === 0 ? R_OUT : R_IN;
        const sg = side === 0 ? 1 : -1;
        for (let i = 0; i <= NPHI; i++) {
          const phi = -Math.PI / 2 + (i / NPHI) * Math.PI; // back rim → bottom → front rim
          const z = zC + R * Math.sin(phi);
          const y = cy - R * Math.cos(phi);
          pos.push(x, y, z);
          nrm.push(0, sg * -Math.cos(phi), sg * Math.sin(phi));
        }
      }
    }
    for (let s = 0; s <= NX; s++) {
      const x = x0 + (x1 - x0) * (s / NX);
      ring(x, invertAt(x));
    }
    const stride = (NPHI + 1) * 2;
    for (let s = 0; s < NX; s++) {
      for (let side = 0; side < 2; side++) {
        const base = s * stride + side * (NPHI + 1);
        const next = base + stride;
        for (let i = 0; i < NPHI; i++) {
          const a = base + i, b = a + 1, c = next + i, d = c + 1;
          if (side === 0) idx.push(a, c, b, b, c, d);
          else idx.push(a, b, c, b, d, c);
        }
      }
      // Join outer/inner at the two rims.
      const backO = s * stride, backI = backO + NPHI + 1;
      const frontO = backO + NPHI, frontI = backI + NPHI;
      const backO2 = backO + stride, backI2 = backI + stride;
      const frontO2 = frontO + stride, frontI2 = frontI + stride;
      idx.push(backO, backI, backO2, backI, backI2, backO2);
      idx.push(frontO, frontO2, frontI, frontI, frontO2, frontI2);
    }
    // Stop-end caps (filled half-annulus).
    function cap(x, invert, flip) {
      const start = pos.length / 3;
      const cy = invert + R_IN;
      pos.push(x, cy, zC);
      nrm.push(flip, 0, 0);
      for (let side = 0; side < 2; side++) {
        const R = side === 0 ? R_OUT : R_IN;
        for (let i = 0; i <= NPHI; i++) {
          const phi = -Math.PI / 2 + (i / NPHI) * Math.PI;
          pos.push(x, cy - R * Math.cos(phi), zC + R * Math.sin(phi));
          nrm.push(flip, 0, 0);
        }
      }
      // outer fan (verts 1..NPHI+1), inner fan (NPHI+2 .. 2NPHI+2); centre = start
      // simpler: triangles between outer and inner, plus centre-to-inner is open (the bore).
      const o0 = start + 1, i0 = start + 1 + NPHI + 1;
      for (let i = 0; i < NPHI; i++) {
        if (flip < 0) idx.push(o0 + i, i0 + i, o0 + i + 1, i0 + i, i0 + i + 1, o0 + i + 1);
        else idx.push(o0 + i, o0 + i + 1, i0 + i, i0 + i, o0 + i + 1, i0 + i + 1);
      }
    }
    cap(x0, invertAt(x0), -1);
    cap(x1, invertAt(x1), +1);

    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    gGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    gGeo.setIndex(idx);
    gGeo.computeVertexNormals();
    const trough = new THREE.Mesh(gGeo, materials.gutter);
    trough.castShadow = true;
    trough.receiveShadow = true;
    group.add(trough);

    // Rise-and-fall fascia brackets, about 800 mm centres, clear of outlets.
    const BRACKET_STEP = 0.800;
    const nB = Math.max(2, Math.round((x1 - x0) / BRACKET_STEP));
    const bStep = (x1 - x0) / nB;
    const strapW = 0.020, strapT = 0.003;
    function nearOutlet(x) {
      return outlets.some((o) => Math.abs(o.x - x) < 0.14);
    }
    for (let i = 0; i <= nB; i++) {
      const x = x0 + i * bStep;
      if (nearOutlet(x)) continue;
      const inv = invertAt(x);
      const cy = inv + R_IN;
      const strap = new THREE.Group();
      // Hook following the outer half-round, slightly proud of the trough.
      const hookR = R_OUT + 0.004;
      const hookPts = [];
      for (let k = 0; k <= 14; k++) {
        const phi = -Math.PI / 2 + (k / 14) * Math.PI;
        hookPts.push(new THREE.Vector3(0, cy - hookR * Math.cos(phi), zC + hookR * Math.sin(phi)));
      }
      const hookGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hookPts), 14, strapT, 5, false);
      const hook = new THREE.Mesh(hookGeo, materials.gutter);
      hook.castShadow = true;
      strap.add(hook);
      // Fixing plate on the purlin outer face.
      const plateH = 0.080, plateW = 0.028, plateT = 0.003;
      const plateY = Math.min(cy + 0.02, coverFFL(-EAVE_CL) - 0.030);
      const plate = addBox(strap, plateW, plateH, plateT, materials.gutter, 0, plateY, zFascia + plateT / 2);
      // Shank from the back rim to the plate.
      const backY = cy;
      const backZ = zC - hookR;
      const shankLen = Math.hypot(plateY - backY, (zFascia + plateT) - backZ);
      const shank = addBox(strap, strapT, strapT, shankLen, materials.gutter, 0, 0, 0);
      shank.position.set(0, (plateY + backY) / 2, (zFascia + plateT + backZ) / 2);
      shank.rotation.x = Math.atan2((zFascia + plateT) - backZ, plateY - backY);
      strap.position.x = x;
      group.add(strap);
    }

    // Outlets and 100 mm downpipes to grade, with a shoe at the bottom.
    const grade = -mm(G.fflAboveGrade);
    const shoeLen = 0.180;
    const pipes = [];
    outlets.forEach((o) => {
      const inv = invertAt(o.x);
      const cy = inv + R_IN;
      // Spigot through the invert.
      const spigot = new THREE.Mesh(
        new THREE.CylinderGeometry(DP_OD / 2 - 0.004, DP_OD / 2, 0.080, 16),
        materials.gutter
      );
      spigot.position.set(o.x, inv - 0.020, zC);
      spigot.castShadow = true;
      group.add(spigot);
      const pipeTop = inv - 0.055;
      const shoeY = grade + 0.070;
      const pipeH = pipeTop - shoeY;
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(DP_OD / 2, DP_OD / 2, pipeH, 16),
        materials.gutter
      );
      pipe.position.set(o.x, shoeY + pipeH / 2, zC);
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      group.add(pipe);
      // 45° shoe turning out to the south, open just above grade.
      const shoe = new THREE.Mesh(
        new THREE.CylinderGeometry(DP_OD / 2, DP_OD / 2 - 0.004, shoeLen, 16),
        materials.gutter
      );
      shoe.position.set(o.x, shoeY, zC + shoeLen * 0.35);
      shoe.rotation.x = -Math.PI / 4;
      shoe.castShadow = true;
      group.add(shoe);
      pipes.push({ x: o.x, z: zC, name: o.name, invert: inv, grade });
      colliders.push({
        type: 'aabb',
        x0: o.x - DP_OD / 2 - 0.02, x1: o.x + DP_OD / 2 + 0.02,
        z0: zC - DP_OD / 2 - 0.02, z1: zC + DP_OD / 2 + 0.08
      });
    });

    tagLayer(group, 'rainwater');
    houseGroup.add(group);

    const rimCrown = I0 + crownRel + R_IN;
    const rimOutlet = I0 + R_IN;
    const zBackIn = zC - R_IN;
    gutterSpec = {
      assumed: true,
      kind: 'half-round',
      sizeMm: 150,
      fallMmPerM: 3,
      downpipeOdMm: 100,
      axisZ: zC,
      fasciaZ: zFascia,
      invertDatum: I0,
      dripY,
      x0, x1,
      outlets: pipes,
      stations: relPts.map(([x, rel]) => ({ x, invert: I0 + rel, rel, rim: I0 + rel + R_IN })),
      hidesWith: ['roofOff', 'structureOnly'],
      coverOverhangMm: SOUTH_COVER_OH * 1000,
      backClearMm: BACK_CLEAR * 1000,
      drip: {
        yTop: yTopDrip, yBot: yBotDrip,
        zTop: zTopDrip, zBot: zBotDrip,
        zMid: zMidS
      },
      rim: { crown: rimCrown, outlet: rimOutlet, backZ: zBackIn, frontZ: zC + R_IN },
      clearanceMm: {
        crownBelowUnderside: (yBotDrip - rimCrown) * 1000,
        crownBelowTop: (yTopDrip - rimCrown) * 1000,
        outletBelowUnderside: (yBotDrip - rimOutlet) * 1000,
        outletBelowTop: (yTopDrip - rimOutlet) * 1000
      },
      overhangIntoGutterMm: {
        top: (zTopDrip - zBackIn) * 1000,
        bot: (zBotDrip - zBackIn) * 1000
      }
    };
  }
  buildSouthGutter();


  // Knee braces
  const braceMeshes = [];
  const END_POSTS = new Set(['SW corner', 'SE corner', 'NW corner', 'NE corner', 'SE-ext', 'NE-ext']);
  function addBrace(b) {
    let px = mm(b.x), pz = wz(mm(b.y));
    // k2: N–S brace at the N post is 25 mm east of the post CL (section x −25 to +75).
    if (b.post === 'N ring' && b.dir === 'N-S') px += 0.025;
    // k2 legs: N-N 440, W-W and EX-E 520, so nothing sticks out past the roof; others 600.
    let leg = 0.600;
    if (b.post === 'N ring' && b.dir === 'N-S' && b.side === 1) leg = 0.440;
    if (b.post === 'W ring' && b.dir === 'E-W' && b.side === -1) leg = 0.520;
    if (b.post === 'E-ext' && b.dir === 'E-W' && b.side === 1) leg = 0.520;
    const postSoffit = soffitFFL(mm(b.y)); // main beam soffit at this northing
    const alongBeam = b.dir === 'N-S';
    // 12 level (E–W) braces on the six end posts sit flush with the outer post
    // face (y 6000–6100, mirrored on the south): 50 mm bearing under the eave purlin.
    const endLevel = !alongBeam && END_POSTS.has(b.post);
    let purlinY = mm(b.y);
    let zBrace = pz;
    if (endLevel) {
      const outward = Math.sign(mm(b.y)) || 1; // drawing +y = north
      purlinY = outward * EAVE_CL;
      zBrace = pz - outward * 0.050; // world z = −y
    }
    const purlinSof = coverFFL(purlinY) - 0.200;
    const topSof = alongBeam ? postSoffit : purlinSof;
    const foot = topSof - leg;
    const s = b.side; // +1 north or east
    let tHoriz;
    if (alongBeam) {
      tHoriz = leg / (1 - s * TAN7);
    } else {
      tHoriz = leg;
    }
    const length = Math.hypot(tHoriz, leg);
    const m = addBox(houseGroup, 0.100, 0.100, length, materials.timber, 0, 0, 0);
    // Place centre of brace, then rotate
    if (alongBeam) {
      // in Y-Z plane (up-north)
      const midZ = pz - s * tHoriz / 2;
      const midY = foot + leg / 2;
      m.position.set(px, midY, midZ);
      m.rotation.set(0, 0, 0);
      const dir = new THREE.Vector3(0, leg, -s * tHoriz).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      m.quaternion.copy(quat);
    } else {
      const midX = px + s * tHoriz / 2;
      const midY = foot + leg / 2;
      m.position.set(midX, midY, zBrace);
      const dir = new THREE.Vector3(s * tHoriz, leg, 0).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      m.quaternion.copy(quat);
    }
    m.userData.leg = leg;
    m.userData.tHoriz = tHoriz;
    m.userData.brace = b;
    m.userData.underside = foot - (0.100 / Math.SQRT2);
    m.userData.foot = foot;
    if (endLevel) {
      // Galvanised angle at the brace head, fixing it to the eave purlin.
      // approx. 90×90×65 mm (size approx.). Sits on the inner purlin face,
      // below the purlin top, so it does not meet the roof panels.
      const outward = Math.sign(mm(b.y)) || 1;
      const headX = px + s * tHoriz;
      const sof = topSof;
      const zInner = wz(outward * (EAVE_CL - 0.075));
      const TH = 0.008, LEG = 0.090, WID = 0.065;
      const ax = headX - s * (WID / 2);
      const zOff = zInner + outward * (TH / 2); // just inward of the inner face
      const vLeg = addBox(houseGroup, WID, LEG, TH, materials.galvanised, ax, sof + LEG / 2, zOff);
      vLeg.castShadow = false;
      vLeg.userData.eaveAngle = true;
      const dir = new THREE.Vector3(-s, -1, 0).normalize();
      const sLeg = addBox(houseGroup, WID, TH, LEG, materials.galvanised, 0, 0, 0);
      const nTop = new THREE.Vector3(-s, 1, 0).normalize();
      const basis = new THREE.Matrix4();
      const xAxis = new THREE.Vector3().crossVectors(nTop, dir).normalize();
      basis.makeBasis(xAxis, nTop, dir);
      sLeg.quaternion.setFromRotationMatrix(basis);
      // Sit just proud of the inner-top arris, below the soffit so it stays out of the purlin.
      sLeg.position.set(
        ax + dir.x * (LEG / 2) + nTop.x * (TH / 2),
        sof + dir.y * (LEG / 2) - TH / 2,
        zOff + outward * (TH / 2)
      );
      sLeg.castShadow = false;
      sLeg.userData.eaveAngle = true;
      m.userData.angle = { x: ax, y: sof, z: zOff, top: sof + LEG, purlinSof: sof, purlinTop: sof + 0.200 };
    }
    braceMeshes.push(m);
    return m;
  }
  G.braces.forEach(addBrace);

  // Utility building
  const U = G.utility;
  // v1y shed (ASSUMED): shares the house ring between window 5 and the back door (bays 6–8).
  // N and S walls run from the house outer face to the east wall at x = +9.00, which carries
  // the E-ext post (NE corner, built in). Door 800/880 in the east wall, hinge north, opens out.
  const ux1 = SHED.xE, ux0 = mm(U.x_w);
  const uHalf = WALL_T / 2;
  const uZSouth = wz(SHED.yS), uZNorth = wz(SHED.yN);       // 2.590 / 0.025
  const uz0 = uZSouth, uz1 = uZNorth;
  const uInZ0 = uZNorth + uHalf, uInZ1 = uZSouth - uHalf;    // 0.150 / 2.465
  const uInX1 = ux1 - uHalf;
  const houseFaceX = (z) => Math.sqrt(Math.max(0, rOut * rOut - z * z));
  const uInX0 = houseFaceX(uInZ1);                            // westmost interior x (south corner)
  const plateTop = SHED.plateTop;                             // +200 (ASSUMED); door head stays 2 140
  const doorH = mm(U.door_height), doorHead = mm(U.door_head), doorW = mm(U.door_clear);
  const dZ0 = wz(SHED.doorY1), dZ1 = wz(SHED.doorY0);         // 0.300 / 1.180 opening
  const uLenNS = (uZSouth + uHalf) - (uZNorth - uHalf);
  const uMidZ = (uZSouth + uZNorth) / 2;
  const nZ = uZNorth;
  function sandwichSlab(cx, cz, len, thickAxis, y0, y1, outer) {
    const h = y1 - y0, ym = (y0 + y1) / 2;
    const layers = [[SKIN_T, materials.limeOuter], [FRAME_T, materials.insulation], [SKIN_T, materials.cobInner]];
    let fromOuter = 0;
    const origin = thickAxis === 'x' ? cx : cz;
    for (const [tt, mat] of layers) {
      const pos = origin + outer * (WALL_T / 2) - outer * (fromOuter + tt / 2);
      if (thickAxis === 'x') addBox(houseGroup, tt, h, len, mat, pos, ym, cz);
      else addBox(houseGroup, len, h, tt, mat, cx, ym, pos);
      fromOuter += tt;
    }
  }
  const INSTALL_PLY = 0.022, INSTALL_LATH = 0.008, INSTALL_COB = 0.035, INSTALL_LIME = 0.007;
  function installEastWall(cz, len, y0, y1) {
    if (y1 <= y0 + 0.01 || len < 0.04) return;
    const h = y1 - y0, ym = (y0 + y1) / 2, cx = ux1;
    addBox(houseGroup, FRAME_T, h, len, materials.insulation, cx, ym, cz);
    addBox(houseGroup, INSTALL_PLY, h, len, materials.ply, cx - FRAME_T / 2 - INSTALL_PLY / 2, ym, cz);
    addBox(houseGroup, INSTALL_LATH, h, len, materials.timber, cx + FRAME_T / 2 + INSTALL_LATH / 2, ym, cz);
    addBox(houseGroup, INSTALL_COB + INSTALL_LIME, h, len, materials.limeOuter,
      cx + FRAME_T / 2 + INSTALL_LATH + (INSTALL_COB + INSTALL_LIME) / 2, ym, cz);
  }
  // N / S walls start just inside the house outer face so the shared ring closes them.
  const nX0 = houseFaceX(uZNorth + uHalf) - 0.03, sX0 = houseFaceX(uZSouth + uHalf) - 0.03;
  // Floor (FFL) over the shed interior only, outside the house ring.
  {
    const sh = new THREE.Shape();
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const z = uInZ0 + (uInZ1 - uInZ0) * (i / n);
      const x = houseFaceX(z) - 0.02;
      if (i === 0) sh.moveTo(x, z); else sh.lineTo(x, z);
    }
    sh.lineTo(uInX1, uInZ1); sh.lineTo(uInX1, uInZ0); sh.closePath();
    const g = new THREE.ShapeGeometry(sh);
    g.rotateX(Math.PI / 2);
    const flMat = materials.earth.clone(); flMat.side = THREE.DoubleSide; // shape winding faces down after rotateX
    const fl = new THREE.Mesh(g, flMat);
    fl.position.y = 0.012; fl.receiveShadow = true;
    houseGroup.add(fl);
  }
  // Strip plinths 400 wide under N, S and E walls; notch + threshold at the east door.
  addBox(houseGroup, ux1 + 0.2 - nX0, 0.400, 0.400, materials.stone, (nX0 + ux1 + 0.2) / 2, GRADE + 0.200, uZNorth);
  addBox(houseGroup, ux1 + 0.2 - sX0, 0.400, 0.400, materials.stone, (sX0 + ux1 + 0.2) / 2, GRADE + 0.200, uZSouth);
  addBox(houseGroup, 0.400, 0.400, dZ0 - (uZNorth + 0.2), materials.stone, ux1, GRADE + 0.200, (dZ0 + uZNorth + 0.2) / 2);
  addBox(houseGroup, 0.400, 0.400, (uZSouth - 0.2) - dZ1, materials.stone, ux1, GRADE + 0.200, (dZ1 + uZSouth - 0.2) / 2);
  addBox(houseGroup, 0.400, GRADE * -1 - 0.04, dZ1 - dZ0, materials.stone, ux1, (GRADE - 0.04) / 2, (dZ0 + dZ1) / 2);
  addBox(houseGroup, WALL_T + 0.04, 0.040, dZ1 - dZ0, materials.timber, ux1, 0.020, (dZ0 + dZ1) / 2);
  // Lower walls to the plate (N, S sandwich; E installation wall with the door).
  sandwichSlab((nX0 + ux1 + uHalf) / 2, uZNorth, ux1 + uHalf - nX0, 'z', PL_TOP, plateTop, -1);
  sandwichSlab((sX0 + ux1 + uHalf) / 2, uZSouth, ux1 + uHalf - sX0, 'z', PL_TOP, plateTop, +1);
  const eN0 = uZNorth + uHalf, eS1 = uZSouth - uHalf;
  installEastWall((eN0 + dZ0) / 2, dZ0 - eN0, PL_TOP, plateTop);
  installEastWall((dZ1 + eS1) / 2, eS1 - dZ1, PL_TOP, plateTop);
  installEastWall((dZ0 + dZ1) / 2, dZ1 - dZ0, doorHead + 0.100, plateTop);
  addBox(houseGroup, 0.070, 0.040, dZ1 - dZ0, materials.timber, ux1, (doorH + doorHead) / 2, (dZ0 + dZ1) / 2);
  addBox(houseGroup, 0.150, 0.100, dZ1 - dZ0, materials.timber, ux1, doorHead + 0.050, (dZ0 + dZ1) / 2);
  // Top plates. k2: UTP-N is housed 30 mm into the E and E-ext posts and side-fixed
  // to their south faces — it does not run over the post tops (those posts continue
  // to the beam). The east plate is housed into E-ext the same way; it can still sit on SE-util.
  const HOUSE_IN = 0.030;
  const eextS = POST_HALF;                 // E / E-ext south face at z = +0.100
  const utpNz = eextS - HOUSE_IN + 0.075;  // 0.145: north edge 30 mm into the post
  const utpNx0 = 5.0 + POST_HALF - HOUSE_IN; // 5.070, 30 mm into the E post east face
  const utpNx1 = ux1 - POST_HALF + HOUSE_IN; // 8.930, 30 mm into E-ext west face
  addBox(houseGroup, utpNx1 - utpNx0, 0.100, 0.150, materials.timber, (utpNx0 + utpNx1) / 2, plateTop - 0.050, utpNz);
  addBox(houseGroup, ux1 + 0.075 - sX0, 0.100, 0.150, materials.timber, (sX0 + ux1 + 0.075) / 2, plateTop - 0.050, uZSouth);
  const utpEz0 = eextS - HOUSE_IN, utpEz1 = uZSouth + 0.075;
  addBox(houseGroup, 0.150, 0.100, utpEz1 - utpEz0, materials.timber, ux1, plateTop - 0.050, (utpEz0 + utpEz1) / 2);
  // k2: 150 mm jamb in the 200 mm north pier (50 mm left to the E-ext south face).
  // South jamb already required (k2: “already there”); 150 mm, so 1 120 clear to SE-util.
  addBox(houseGroup, 0.070, doorHead - PL_TOP, 0.150, materials.timber, ux1, (PL_TOP + doorHead) / 2, (eextS + 0.050 + dZ0) / 2);
  addBox(houseGroup, 0.070, doorHead - PL_TOP, 0.150, materials.timber, ux1, (PL_TOP + doorHead) / 2, (dZ1 + dZ1 + 0.150) / 2);
  // SE-shed post (the NE corner is the E-ext post, built into the wall).
  G.utilPosts.forEach((p) => {
    const y0 = PL_TOP + mm(p.base), bodyTop = plateTop - 0.100;
    addBox(houseGroup, 0.200, bodyTop - y0, 0.200, materials.timber, mm(p.x), (y0 + bodyTop) / 2, wz(mm(p.y)));
    colliders.push({ type: 'post', x: mm(p.x), z: wz(mm(p.y)), r: 0.12 });
  });
  // Vent above the shed door (ASSUMED 200 × 120 louvre at ~2 450).
  {
    const v = addBox(houseGroup, 0.020, 0.120, 0.200, materials.metal, ux1 + uHalf + 0.010, 2.450, (dZ0 + dZ1) / 2);
    v.userData.vent = 'shed door vent';
    for (let i = 0; i < 4; i++) addBox(houseGroup, 0.030, 0.008, 0.190, materials.gutter, ux1 + uHalf + 0.025, 2.405 + i * 0.030, (dZ0 + dZ1) / 2);
  }
  // Outside taps (ASSUMED): shed south wall and the kitchen side of the house (bay 13).
  function addTap(x, y, z, nxT, nzT, name) {
    const g = new THREE.Group();
    addBox(g, 0.06, 0.06, 0.02, materials.metal, 0, 0, 0.01);
    addBox(g, 0.03, 0.03, 0.10, materials.galvanised, 0, 0, 0.06);
    addBox(g, 0.03, 0.08, 0.03, materials.galvanised, 0, -0.04, 0.10);
    addBox(g, 0.08, 0.015, 0.015, materials.red || materials.metal, 0, 0.035, 0.06);
    g.position.set(x, y, z);
    g.rotation.y = Math.atan2(nxT, nzT);
    g.userData.tap = name;
    houseGroup.add(g);
  }
  // T1 (rev k): shed east wall, south of the door, 600 high. T2: west garden-door side, bay 21 south of the doors, 600 high.
  addTap(ux1 + uHalf, 0.60, 1.75, 1, 0, 'T1 shed east tap');
  { const th = 276.0 * DEG; addTap(rOut * Math.sin(th), 0.60, rOut * Math.cos(th), Math.sin(th), Math.cos(th), 'T2 west garden tap'); }
  // Shed door: in the east wall, hinge north jamb, opens out (east).
  const uFrame = new THREE.Group();
  uFrame.position.set(ux1, 0, dZ0 + 0.040);
  uFrame.rotation.y = Math.PI / 2;               // local +Z = world +X (outside), local +X = world −Z
  const uDoor = makeDoorLeaf(doorW, doorH, 0.070, 'out', -1);  // leaf runs south from the hinge
  uDoor.sign = -uDoor.dir;                       // swing toward local +Z = outside
  uDoor.outward = true;
  uFrame.add(uDoor.pivot);
  houseGroup.add(uFrame);
  doors.push({
    name: 'Shed door', kind: 'utility', group: uFrame, leaves: [uDoor],
    open: false, inward: false, clearW: doorW, openingH: doorH, x: ux1, z0: dZ0, z1: dZ1
  });

  // East strip (at grade)
  const st = G.extStrip;
  addBox(houseGroup, mm(st.w), 0.08, mm(st.y1-st.y0), materials.stone, mm(st.x), GRADE + 0.02, 0);

  // Interior ceiling: 150 mm insulation INSIDE, under the green panel between the
  // purlins (Tom decided; the insulation-location CHECK is dropped). 50 × 200 joists
  // N–S flush with the purlin soffit at ~600 c/c, T&G running E–W underneath.
  // House and utility interiors only — not the overhangs. The 20 mm slip stays
  // under the roof covering (walls carry no roof load). T&G closes to the inner
  // lining (Tom, rev i / v1q: no visible ceiling gaps). Product / hangers still CHECK.
  const TNG_T = 0.020;
  const ROOF_INS_T = 0.150;
  const JOIST_W = 0.050, JOIST_D = 0.200;
  const CEIL_GAP = 0.001; // rev j: tight to the linings (was 20 mm, then 2 mm in v1q)
  const rCeil = rIn - CEIL_GAP;
  const BEAM_HALF = 0.110;
  const JOIST_CC = 0.609;
  const yTng0 = tngSoffitFFL(0); // 3.5039 at centre
  const yInsTop0 = coverFFL(0) - 0.002;
  const purlinYs = G.purlin.ys.map(mm);

  function setSlopedFromShape(geo, yAtZ0) {
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getY(i);
      pos.setXYZ(i, x, yAtZ0 - z * TAN7, z);
      if (uv) uv.setXY(i, x / 2.0, z / 0.12);
    }
    pos.needsUpdate = true;
    if (uv) uv.needsUpdate = true;
    geo.computeVertexNormals();
  }

  function meshFromLoop(loop, yAtZ0, mat) {
    if (!loop || loop.length < 3) return null;
    const shape = new THREE.Shape();
    loop.forEach((p, i) => { if (i === 0) shape.moveTo(p.x, p.z); else shape.lineTo(p.x, p.z); });
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape, 2);
    setSlopedFromShape(geo, yAtZ0);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = false;
    m.receiveShadow = true;
    houseGroup.add(m);
    return m;
  }

  function prismFromLoop(loop, yAtZ0Top, thick, mat) {
    if (!loop || loop.length < 3) return null;
    const contour = loop.map((p) => new THREE.Vector2(p.x, p.z));
    let tris;
    try { tris = THREE.ShapeUtils.triangulateShape(contour, []); }
    catch (e) { return null; }
    const nrm = new THREE.Vector3(0, 1, TAN7).normalize();
    const positions = [], indices = [];
    const n = loop.length;
    for (const p of loop) {
      const yTop = yAtZ0Top - p.z * TAN7;
      positions.push(p.x, yTop, p.z);
    }
    for (const p of loop) {
      const yTop = yAtZ0Top - p.z * TAN7;
      positions.push(p.x - nrm.x * thick, yTop - nrm.y * thick, p.z - nrm.z * thick);
    }
    for (const t of tris) indices.push(t[0], t[1], t[2]);
    for (const t of tris) indices.push(n + t[0], n + t[2], n + t[1]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = i, b = j, c = n + j, d = n + i;
      indices.push(a, b, c, a, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = false;
    m.receiveShadow = true;
    houseGroup.add(m);
    return m;
  }

  function houseBayPolys(zLo, zHi) {
    const z0 = Math.max(zLo, -rCeil), z1 = Math.min(zHi, rCeil);
    if (z1 - z0 < 0.04) return [];
    const n = Math.max(6, Math.ceil((z1 - z0) / 0.12));
    function side(sign) {
      const inner = [], outer = [];
      for (let i = 0; i <= n; i++) {
        const z = z0 + (z1 - z0) * (i / n);
        const xC = Math.sqrt(Math.max(0, rCeil * rCeil - z * z));
        if (xC <= BEAM_HALF + 0.005) continue;
        inner.push({ x: sign * BEAM_HALF, z });
        outer.push({ x: sign * xC, z });
      }
      if (outer.length < 2) return null;
      return sign > 0 ? inner.concat(outer.reverse()) : outer.concat(inner.reverse());
    }
    return [side(-1), side(+1)].filter(Boolean);
  }

  function rectLoop(x0, z0, x1, z1) {
    const xa = Math.min(x0, x1), xb = Math.max(x0, x1);
    const za = Math.min(z0, z1), zb = Math.max(z0, z1);
    if (xb - xa < 0.04 || zb - za < 0.04) return null;
    return [{ x: xa, z: za }, { x: xb, z: za }, { x: xb, z: zb }, { x: xa, z: zb }];
  }

  // House T&G: circle minus the centre-beam slot, soffit = purlin soffit − 20 mm.
  const houseShape = new THREE.Shape();
  const nArc = 96;
  for (let i = 0; i <= nArc; i++) {
    const th = (i / nArc) * Math.PI * 2;
    const x = rCeil * Math.sin(th), z = rCeil * Math.cos(th);
    if (i === 0) houseShape.moveTo(x, z); else houseShape.lineTo(x, z);
  }
  houseShape.closePath();
  const beamHole = new THREE.Path();
  const hz = rCeil + 0.02;
  beamHole.moveTo(-BEAM_HALF, -hz);
  beamHole.lineTo(BEAM_HALF, -hz);
  beamHole.lineTo(BEAM_HALF, hz);
  beamHole.lineTo(-BEAM_HALF, hz);
  beamHole.closePath();
  houseShape.holes.push(beamHole);

  // Four interior E–W brace heads at the centre purlin pierced the T&G by 70 mm.
  // T&G and membrane stop at a trimmed opening with a collar around each brace.
  const COLLAR_OPEN = 0.180; // 100 mm section at 45° plus clearance
  const COLLAR_TRIM = 0.022;
  const COLLAR_THICK = 0.018;
  const braceHeads = [];
  braceMeshes.forEach((m) => {
    const b = m.userData.brace;
    if (!b || b.dir !== 'E-W') return;
    const px = mm(b.x), pz = wz(mm(b.y));
    const endLevel = !((b.dir === 'N-S')) && (function () {
      const END = new Set(['SW corner', 'SE corner', 'NW corner', 'NE corner', 'SE-ext', 'NE-ext']);
      return END.has(b.post);
    })();
    if (endLevel) return;
    const headX = px + b.side * (m.userData.tHoriz || 0.600);
    const headZ = pz;
    const rho = Math.hypot(headX, headZ);
    if (rho > rCeil + 0.05) return;
    braceHeads.push({ x: headX, z: headZ, post: b.post, side: b.side });
    const h = COLLAR_OPEN / 2;
    const hole = new THREE.Path();
    hole.moveTo(headX - h, headZ - h);
    hole.lineTo(headX + h, headZ - h);
    hole.lineTo(headX + h, headZ + h);
    hole.lineTo(headX - h, headZ + h);
    hole.closePath();
    houseShape.holes.push(hole);
  });
  const tngHouse = new THREE.ShapeGeometry(houseShape, 2);
  setSlopedFromShape(tngHouse, yTng0);
  const tngHouseMesh = new THREE.Mesh(tngHouse, materials.tng);
  tngHouseMesh.castShadow = false;
  tngHouseMesh.receiveShadow = true;
  tngHouseMesh.userData.ceiling = true;
  houseGroup.add(tngHouseMesh);

  function addBraceCollar(head) {
    const { x, z } = head;
    const ySof = tngSoffitFFL(-z);
    const open = COLLAR_OPEN, trim = COLLAR_TRIM, thk = COLLAR_THICK;
    const y = ySof - (thk / 2) * Math.cos(7 * DEG);
    const half = open / 2;
    const mid = half + trim / 2;
    const long = open + 2 * trim;
    const pieces = [
      [long, trim, x, z + mid],
      [long, trim, x, z - mid],
      [trim, open, x + mid, z],
      [trim, open, x - mid, z]
    ];
    pieces.forEach(([sx, sz, cx, cz]) => {
      const c = addBox(houseGroup, sx, thk, sz, materials.timber, cx, y, cz);
      c.rotation.x = 7 * DEG;
      c.castShadow = false;
      c.userData.braceCollar = true;
    });
    // Short lining through the T&G thickness, around the opening.
    const linH = TNG_T + 0.004;
    const linY = ySof + (linH / 2) * Math.cos(7 * DEG);
    const lip = 0.012;
    [
      [open + 2 * lip, lip, x, z + half - lip / 2],
      [open + 2 * lip, lip, x, z - half + lip / 2],
      [lip, open, x + half - lip / 2, z],
      [lip, open, x - half + lip / 2, z]
    ].forEach(([sx, sz, cx, cz]) => {
      const c = addBox(houseGroup, sx, linH, sz, materials.timber, cx, linY, cz);
      c.rotation.x = 7 * DEG;
      c.castShadow = false;
      c.userData.braceCollar = true;
    });
  }
  braceHeads.forEach(addBraceCollar);

  // Utility ceiling (rev h): main-roof T&G and joists run over the interior.
  // Two 50×200 trimmers (~2.86 m) just inside the N/S closings carry the joist ends.
  // Rev h specified a 10 mm shadow gap; Tom asked for no visible gaps — T&G closes to the linings (2 mm).

  // 150 mm insulation under the panel, between the purlins, house and utility interiors.
  for (let i = 0; i < purlinYs.length - 1; i++) {
    const yA = purlinYs[i], yB = purlinYs[i + 1];
    const zLo = Math.min(-yA, -yB) + 0.075; // keep clear of the 150 mm purlin
    const zHi = Math.max(-yA, -yB) - 0.075;
    houseBayPolys(zLo, zHi).forEach((loop) => prismFromLoop(loop, yInsTop0, ROOF_INS_T, materials.insulation));
    const uPoly = rectLoop(
      uCeilX0, Math.max(zLo, uCeilZ0),
      uCeilX1, Math.min(zHi, uCeilZ1)
    );
    if (uPoly) prismFromLoop(uPoly, yInsTop0, ROOF_INS_T, materials.insulation);
  }

  function addCeilingJoist(x, yS, yN) {
    let z0 = -yS, z1 = -yN;
    if (z0 > z1) { const t = z0; z0 = z1; z1 = t; }
    const inUtil = false; // no utility ceiling (item 7)
    const zLim = Math.sqrt(Math.max(0, rCeil * rCeil - x * x));
    let a = z0, b = z1;
    if (Math.abs(x) < rCeil) {
      a = Math.max(a, -zLim);
      b = Math.min(b, zLim);
    } else if (inUtil) {
      a = Math.max(a, uCeilZ0);
      b = Math.min(b, uCeilZ1);
    } else {
      return;
    }
    if (inUtil) {
      // joist may also run over the utility rectangle (east of the house).
      if (x > rCeil) { a = Math.max(z0, uCeilZ0); b = Math.min(z1, uCeilZ1); }
    }
    // Skip the centre-beam slot
    if (Math.abs(x) < BEAM_HALF + JOIST_W / 2) return;
    if (b - a < 0.05) return;
    const midZ = (a + b) / 2;
    const planLen = b - a;
    const slopeLen = planLen / Math.cos(7 * DEG);
    const sof = tngSoffitFFL(-midZ) + TNG_T; // flush with purlin soffit
    const m = addBox(houseGroup, JOIST_W, JOIST_D, slopeLen, materials.timber,
      x, sof + (JOIST_D / 2) * Math.cos(7 * DEG), midZ);
    m.rotation.x = 7 * DEG;
    m.castShadow = false;
    m.userData.ceilingJoist = true;
  }

  // House: 16 lines at 609 mm, purlin bays 1–6, plus short lookouts in eave caps 0 and 7.
  const joistXs = [];
  for (let i = 0; i < 16; i++) joistXs.push(-7.5 * JOIST_CC + i * JOIST_CC);
  for (const x of joistXs) {
    for (let i = 1; i <= 6; i++) addCeilingJoist(x, purlinYs[i], purlinYs[i + 1]);
    addCeilingJoist(x, purlinYs[0], purlinYs[1]); // south eave cap lookouts (clipped to the circle)
    addCeilingJoist(x, purlinYs[7], purlinYs[8]);
  }
  // Utility: 50×200 trimmers UTR-N / UTR-S, ~2.86 m, just inside the N/S closings.
  // W end on a hanger to a W edge joist (purlin to purlin); E end on the x = +9 beam.
  (function buildUtilityCeiling() {
    // v1y shed: N–S joists at ~600 c/c between the N/S wall heads, split at the y = −1 500 purlin.
    const zN = uInZ0 + 0.025, zS = uInZ1 - 0.025;
    function slopedJoist(x, zA, zB) {
      const a = Math.min(zA, zB), b = Math.max(zA, zB);
      if (b - a < 0.05) return;
      const midZ = (a + b) / 2, slopeLen = (b - a) / Math.cos(7 * DEG);
      const sof = tngSoffitFFL(-midZ) + TNG_T;
      const m = addBox(houseGroup, JOIST_W, JOIST_D, slopeLen, materials.timber, x, sof + (JOIST_D / 2) * Math.cos(7 * DEG), midZ);
      m.rotation.x = 7 * DEG; m.castShadow = false; m.userData.ceilingJoist = true;
    }
    for (let x = 5.40; x < ux1 - 0.20; x += 0.60) {
      const zA = Math.max(zN, x < houseFaceX(zS) ? Math.sqrt(Math.max(0, rOut * rOut - x * x)) + 0.05 : zN);
      slopedJoist(x, zA, 1.500 - 0.075);
      slopedJoist(x, 1.500 + 0.075, zS);
    }
    const loop = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const z = uInZ0 + 0.001 + (uInZ1 - uInZ0 - 0.002) * (i / n);
      loop.push({ x: houseFaceX(z) - 0.02, z });
    }
    loop.push({ x: ux1 - 0.098, z: uInZ1 - 0.001 }, { x: ux1 - 0.098, z: uInZ0 + 0.001 });
    const tngUtil = meshFromLoop(loop, yTng0, materials.tng);
    if (tngUtil) tngUtil.userData.ceiling = true;
  })();
  // Edge trimmers along the inner wall in the N/S caps (on the roof structure, not fixed to the wall).
  function addTrimArc(zSign) {
    const zPur = zSign * 4.500;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const x = -1.82 + (3.64 * i / 24);
      const zEdge = zSign * Math.sqrt(Math.max(0, rCeil * rCeil - x * x));
      // only where the eave cap exists (edge is south/north of the first interior purlin)
      if (zSign > 0 && zEdge > zPur + 0.04) pts.push(new THREE.Vector3(x, tngSoffitFFL(-zEdge) + TNG_T + 0.025, zEdge));
      if (zSign < 0 && zEdge < zPur - 0.04) pts.push(new THREE.Vector3(x, tngSoffitFFL(-zEdge) + TNG_T + 0.025, zEdge));
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 0.04) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const m = addBox(houseGroup, len, 0.050, 0.050, materials.timber, mid.x, mid.y, mid.z);
      m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      m.castShadow = false;
    }
  }
  addTrimArc(+1);
  addTrimArc(-1);

  // Curved inner wall
  const iw = G.innerWall;
  const arcPts = iw.wallPoly.map(([x, y]) => new THREE.Vector3(mm(x), 0.020, wz(mm(y))));
  const iwCx = mm(iw.cx), iwCz = wz(mm(iw.cy));
  function offsetArc(pts, dist) {
    return pts.map((p) => {
      const dx = p.x - iwCx, dz = p.z - iwCz;
      const L = Math.hypot(dx, dz) || 1;
      return new THREE.Vector3(p.x + dx / L * dist, p.y, p.z + dz / L * dist);
    });
  }
  // Inner wall (drawings: 2 355 mm from plinth, head is a closing plate, not tied to the roof — CHECK).
  // Tom (v1q): close every wall to the T&G. Keep the drawn 0–2 375 sandwich and add an upper
  // closing from the head to the soffit (2 mm short of the T&G). 100 mm frame + 50+50 skins.
  // Positive offset is outward (living-room side, larger radius).
  const IW_PLINTH = 0.020, IW_H = 2.355, IW_TOP = IW_PLINTH + IW_H; // 2.375 as drawn
  const IW_SOLE_H = 0.050, IW_HEAD_H = 0.050;
  if (!materials.dpc) {
    materials.dpc = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95, metalness: 0 });
  }
  // Rev j: skins to the sloped T&G, except at the centre post where the wall closes
  // to the x = 0 beam soffit (~3 284). 10 mm compressible strip under a 100 × 50 closing plate.
  function iwCloseAFF(x, z) {
    if (Math.abs(x) <= 0.120) return soffitFFL(-z) - 0.001; // under the x = 0 beam
    return ceilingCloseAFF(z);
  }
  function ribbonToSoffit(pts, thickness, y0, mat) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const midX = (a.x + b.x) / 2, midZ = (a.z + b.z) / 2;
      const y1 = iwCloseAFF(midX, midZ);
      const h = y1 - y0;
      if (h < 0.02) continue;
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 0.01) continue;
      const m = addBox(houseGroup, len, h, thickness, mat, midX, (y0 + y1) / 2, midZ);
      m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    }
  }
  buildRibbon(arcPts, 0.200, IW_PLINTH - GRADE, materials.stone, GRADE);
  buildRibbon(arcPts, 0.180, 0.003, materials.dpc, IW_PLINTH);
  buildRibbon(arcPts, 0.100, IW_SOLE_H, materials.timber, IW_PLINTH);
  buildRibbon(offsetArc(arcPts, 0.075), 0.050, IW_H, materials.cob, IW_PLINTH);
  buildRibbon(offsetArc(arcPts, -0.075), 0.050, IW_H, materials.cobInner, IW_PLINTH);
  buildRibbon(arcPts, 0.100, IW_H - IW_SOLE_H - IW_HEAD_H, materials.insulation, IW_PLINTH + IW_SOLE_H);
  buildRibbon(arcPts, 0.100, IW_HEAD_H, materials.timber, IW_TOP - IW_HEAD_H);
  // Upper closing in the same sandwich to the T&G (or the x = 0 beam at the post).
  ribbonToSoffit(offsetArc(arcPts, 0.075), 0.050, IW_TOP, materials.cob);
  ribbonToSoffit(offsetArc(arcPts, -0.075), 0.050, IW_TOP, materials.cobInner);
  ribbonToSoffit(arcPts, 0.100, IW_TOP, materials.insulation);
  // 8 nodes (7 sloped closing plates ~568, 6 upper studs 100 × 50 at the interior nodes).
  (function innerUpperFraming() {
    const nSeg = 7;
    const nodes = [];
    for (let k = 0; k <= nSeg; k++) {
      const u = k / nSeg;
      // Sample the existing polyline by normalised length.
      const cum = [0];
      for (let i = 1; i < arcPts.length; i++) cum.push(cum[i - 1] + arcPts[i].distanceTo(arcPts[i - 1]));
      const L = cum[cum.length - 1], s = u * L;
      let p = arcPts[arcPts.length - 1].clone();
      for (let i = 1; i < arcPts.length; i++) {
        if (cum[i] >= s) {
          const uu = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
          p = arcPts[i - 1].clone().lerp(arcPts[i], uu);
          break;
        }
      }
      nodes.push(p);
    }
    // Closing plates 100 × 50, 10 mm strip under the T&G (or under the beam at the post).
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const midX = (a.x + b.x) / 2, midZ = (a.z + b.z) / 2;
      const yTop = iwCloseAFF(midX, midZ) - 0.010;
      const yBot = yTop - 0.050;
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      const pl = addBox(houseGroup, len, 0.050, 0.100, materials.timber, midX, (yBot + yTop) / 2, midZ);
      pl.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
      pl.userData.viewLayer = 'timber';
      pl.userData.member = 'plate';
    }
    // 6 upper studs at nodes 1–6, 100 × 50, head-plate top to the closing plate.
    for (let k = 1; k < nSeg; k++) {
      const p = nodes[k];
      const y1 = iwCloseAFF(p.x, p.z) - 0.010 - 0.050;
      const h = y1 - IW_TOP;
      if (h < 0.05) continue;
      const tangent = k < nodes.length - 1
        ? Math.atan2(nodes[k + 1].z - nodes[k - 1].z, nodes[k + 1].x - nodes[k - 1].x)
        : 0;
      const st = addBox(houseGroup, 0.050, h, 0.100, materials.timber, p.x, IW_TOP + h / 2, p.z);
      st.rotation.y = -tangent;
      st.userData.viewLayer = 'timber';
      st.userData.member = 'stud';
    }
    // 1 batten 25 × 38 per bay per face (14).
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const midX = (a.x + b.x) / 2, midZ = (a.z + b.z) / 2;
      const y1 = iwCloseAFF(midX, midZ) - 0.010 - 0.050;
      const ym = (IW_TOP + y1) / 2;
      const ang = -Math.atan2(b.z - a.z, b.x - a.x);
      const nx = Math.cos(ang), nz = -Math.sin(ang); // outward-ish
      for (const sign of [-1, 1]) {
        const bt = addBox(houseGroup, Math.hypot(b.x - a.x, b.z - a.z) - 0.04, 0.038, 0.025,
          materials.timber, midX + sign * 0.062 * nx, ym, midZ + sign * 0.062 * nz);
        bt.rotation.y = ang;
        bt.userData.viewLayer = 'timber';
      }
    }
  })();
  const es = iw.endStud.map(([x,y]) => [mm(x), wz(mm(y))]);
  let iwEnd = null;
  if (es.length === 4) {
    const cx = es.reduce((s,p)=>s+p[0],0)/4, cz = es.reduce((s,p)=>s+p[1],0)/4;
    // IW-ES full height 100 × 100: sole top 70 to the closing-plate underside (~2 933).
    const soleTop = 0.070;
    const plateUnd = iwCloseAFF(cx, cz) - 0.010 - 0.050;
    const h = plateUnd - soleTop;
    addBox(houseGroup, 0.10, h, 0.10, materials.timber, cx, (soleTop + plateUnd) / 2, cz);
    iwEnd = { x: cx, z: cz, section: 0.100, height: h, y0: soleTop, y1: plateUnd };
  }
  // Closure under the x = 0 beam at the centre post: a cheek on the beam's west
  // face, from the soffit up to the T&G, so the step from ~3 284 to the ceiling is filled.
  (function beamClosure() {
    const xFace = -0.110;
    const z0 = -0.15, z1 = 0.12;
    const midZ = (z0 + z1) / 2;
    const yBot = soffitFFL(-midZ) - 0.001;
    const yTop = ceilingCloseAFF(midZ);
    const h = yTop - yBot;
    if (h > 0.04) {
      addBox(houseGroup, 0.020, h, z1 - z0, materials.cob, xFace, (yBot + yTop) / 2, midZ);
      addBox(houseGroup, 0.100, 0.050, z1 - z0, materials.timber, xFace - 0.04, yBot + 0.025, midZ);
    }
  })();

  // P1–P3 full height to the T&G (rev j): 100 × 50 frame, skins ≤ 25 mm each face, no footing (CHECK Tom).
  const F = G.furniture;
  const PART_H = 2.200, PART_T = 0.150; // PART_H kept for the curtain rail; 100 frame + 25 + 25 skins
  function wallToSoffit(ax, az, bx, bz, t, mat, y0) {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / 0.05));
    const ang = -Math.atan2(bz - az, bx - ax);
    const nx = Math.cos(ang), nz = -Math.sin(ang);
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      const x0 = ax + (bx - ax) * u0, z0 = az + (bz - az) * u0;
      const x1 = ax + (bx - ax) * u1, z1 = az + (bz - az) * u1;
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      const y1 = ceilingCloseAFF(mz);
      const h = y1 - y0, seg = Math.hypot(x1 - x0, z1 - z0);
      if (h < 0.02 || seg < 0.01) continue;
      const m = addBox(houseGroup, seg, h, t, mat, mx, (y0 + y1) / 2, mz);
      m.rotation.y = ang;
    }
  }
  function partitionToSoffit(ax, az, bx, bz) {
    // Frame 100 + skins 25 each face. Sole 50 on a DPC at FFL; closing plate under a 10 mm strip.
    const ang = -Math.atan2(bz - az, bx - ax);
    const nx = Math.cos(ang), nz = -Math.sin(ang);
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / 0.05));
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      const x0 = ax + (bx - ax) * u0, z0 = az + (bz - az) * u0;
      const x1 = ax + (bx - ax) * u1, z1 = az + (bz - az) * u1;
      const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      const yTng = ceilingCloseAFF(mz);
      const seg = Math.hypot(x1 - x0, z1 - z0);
      if (seg < 0.01) continue;
      // DPC + sole
      addBox(houseGroup, seg, 0.003, 0.100, materials.dpc, mx, 0.0015, mz).rotation.y = ang;
      addBox(houseGroup, seg, 0.050, 0.100, materials.timber, mx, 0.025, mz).rotation.y = ang;
      const y1 = yTng;
      const yFrameTop = yTng - 0.010;
      const yPlateBot = yFrameTop - 0.050;
      addBox(houseGroup, seg, 0.050, 0.100, materials.timber, mx, (yPlateBot + yFrameTop) / 2, mz).rotation.y = ang;
      const y0s = 0.050, hSkin = y1 - y0s;
      // Skins 25 mm, both faces, to the T&G
      for (const sign of [-1, 1]) {
        const sx = mx + sign * 0.0625 * nx, sz = mz + sign * 0.0625 * nz;
        const sk = addBox(houseGroup, seg, hSkin, 0.025, materials.cobInner, sx, (y0s + y1) / 2, sz);
        sk.rotation.y = ang;
      }
      const fr = addBox(houseGroup, seg, yPlateBot - y0s, 0.100, materials.insulation, mx, (y0s + yPlateBot) / 2, mz);
      fr.rotation.y = ang;
    }
    colliders.push({ type: 'aabb', x0: Math.min(ax,bx)-0.08, x1: Math.max(ax,bx)+0.08,
      z0: Math.min(az,bz)-0.08, z1: Math.max(az,bz)+0.08 });
  }
  F.partitions.forEach((p) => {
    const ax = mm(p.a[0]), az = wz(mm(p.a[1])), bx = mm(p.b[0]), bz = wz(mm(p.b[1]));
    partitionToSoffit(ax, az, bx, bz);
  });
  function polyBlock(poly, h, y0, mat, inflate=0) {
    const xs = poly.map(p => mm(p[0])), zs = poly.map(p => wz(mm(p[1])));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
    const m = addBox(houseGroup, x1-x0, h, z1-z0, mat, (x0+x1)/2, y0 + h/2, (z0+z1)/2);
    colliders.push({ type: 'aabb', x0: x0-inflate, x1: x1+inflate, z0: z0-inflate, z1: z1+inflate });
    return m;
  }
  // Closets (positions CHECK Els): sides full height; framed bulkhead 2 100 → T&G over the front.
  function closetBulkheadAndSides(x0, x1, z0, z1, front, mat) {
    const T = 0.040, yDoor = 2.100;
    function run(ax, az, bx, bz, y0) {
      wallToSoffit(ax, az, bx, bz, T, mat, y0);
    }
    // Sides and back always full height; front is a bulkhead from 2 100 only.
    if (front === 'x0') {
      run(x0, z0, x0, z1, yDoor); // front bulkhead
      run(x1, z0, x1, z1, 0);
      run(x0, z0, x1, z0, 0);
      run(x0, z1, x1, z1, 0);
    } else if (front === 'x1') {
      run(x1, z0, x1, z1, yDoor);
      run(x0, z0, x0, z1, 0);
      run(x0, z0, x1, z0, 0);
      run(x0, z1, x1, z1, 0);
    } else if (front === 'z0') {
      run(x0, z0, x1, z0, yDoor);
      run(x0, z1, x1, z1, 0);
      run(x0, z0, x0, z1, 0);
      run(x1, z0, x1, z1, 0);
    } else {
      run(x0, z1, x1, z1, yDoor);
      run(x0, z0, x1, z0, 0);
      run(x0, z0, x0, z1, 0);
      run(x1, z0, x1, z1, 0);
    }
    colliders.push({ type: 'aabb', x0: x0 - 0.02, x1: x1 + 0.02, z0: z0 - 0.02, z1: z1 + 0.02 });
  }
  {
    const xs = F.closetBed.map((p) => mm(p[0])), zs = F.closetBed.map((p) => wz(mm(p[1])));
    closetBulkheadAndSides(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), 'x0', materials.timber);
  }
  {
    const xs = F.closetShower.map((p) => mm(p[0])), zs = F.closetShower.map((p) => wz(mm(p[1])));
    closetBulkheadAndSides(Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs), 'z0', materials.timber);
  }
  // Bed is built in furnishInterior (1.40 × 2.00 m mattress, ~480 mm high).
  polyBlock(F.shower, 0.050, 0, materials.white);
  // Kitchen counter, hob and the 900 mm stove are rebuilt in buildRevG (straight wall, item 2).
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

  const interior = furnishInterior({ houseGroup, colliders, F, mm, wz });
  window.__interior = interior;


  function buildRevG() {
    const out = { counterBox: null, worktops: [], checks: {} };

    // --- Item 2: straight cob kitchen wall + widened plinth ---
    const KW = G.kitchenWall;
    const wallY = mm(KW.front_r);           // 4.70 drawing north
    const wallZ = wz(wallY);                // −4.70 world
    const halfChord = mm(KW.chord) / 2;
    const rInner = rIn;                     // 4.875
    const wallTop = mm(KW.top_aff);         // 1.100
    const postStrip = 0.020;
    // Widened plinth rim (item 2): 500 mm inside, only over the 1.949 m mid-run,
    // inner face on the same 4.70 m chord. Added onto the existing 400 mm ring.
    (function () {
      const rimHalf = mm(KW.rim_len) / 2;
      const shape = new THREE.Shape();
      const xL = -rimHalf, xR = rimHalf;
      shape.moveTo(xL, wallZ);
      shape.lineTo(xR, wallZ);
      const nArc = 16;
      for (let i = 0; i <= nArc; i++) {
        const x = xR + (xL - xR) * (i / nArc);
        const z = -Math.sqrt(Math.max(0, rPlIn * rPlIn - x * x));
        shape.lineTo(x, z);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.400, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, materials.stone);
      m.position.y = GRADE;
      m.castShadow = true;
      m.receiveShadow = true;
      classifyByMaterial(m, materials.stone);
      houseGroup.add(m);
    })();
    // Cob wall: two pieces, 20 mm compressible strip at the N post (not bonded).
    (function () {
      const gap = 0.100 + postStrip;
      function wallPiece(xL, xR) {
        if (xR - xL < 0.05) return;
        const shape = new THREE.Shape();
        shape.moveTo(xL, wallZ);
        shape.lineTo(xR, wallZ);
        const nArc = 24;
        for (let i = 0; i <= nArc; i++) {
          const x = xR + (xL - xR) * (i / nArc);
          const z = -Math.sqrt(Math.max(0, rInner * rInner - x * x));
          shape.lineTo(x, z);
        }
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: wallTop, bevelEnabled: false });
        geo.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(geo, materials.cobInner);
        m.position.y = 0;
        m.castShadow = true;
        m.receiveShadow = true;
        tagLayer(m, 'skin');
        houseGroup.add(m);
      }
      wallPiece(-halfChord, -gap);
      wallPiece(gap, halfChord);
      colliders.push({
        type: 'aabb', x0: -halfChord, x1: halfChord,
        z0: wallZ, z1: -rInner
      });
    })();

    // --- Rev k / v1z2 kitchen: one 650 × 2 400 peninsula, short end on the straight N wall
    // (20 mm off the N post). Plain top — no hob or sink set into it. Freestanding gas cooker
    // 600 × 600 × 900 (ASSUMED) sits beside the wall end, against the N wall under window 15. ---
    const COUNTER_H = 0.900;
    const PEN_W = 0.650, PEN_L = 2.400, PEN_X1 = -0.120; // 20 mm off the N post (post face x = −0.100)
    const pX0 = PEN_X1 - PEN_W, pX1 = PEN_X1, pZ0 = wallZ, pZ1 = wallZ + PEN_L;
    const carcass = addBox(houseGroup, PEN_W, 0.850, PEN_L, materials.timber, (pX0 + pX1) / 2, 0.425, (pZ0 + pZ1) / 2);
    tagLayer(carcass, 'furniture');
    const top = addBox(houseGroup, PEN_W + 0.04, 0.050, PEN_L + 0.02, materials.white, (pX0 + pX1) / 2, 0.875, (pZ0 + pZ1) / 2 + 0.01);
    tagLayer(top, 'furniture');
    colliders.push({ type: 'aabb', x0: pX0, x1: pX1, z0: pZ0, z1: pZ1 });
    out.counterBox = { x0: pX0, x1: pX1, z0: pZ0, z1: pZ1 };
    const ST_W = 0.600, ST_D = 0.600, ST_H = 0.900;
    const stX1 = pX0, stX0 = pX0 - ST_W; // flush west of the peninsula's wall end
    const stZ0 = wallZ, stZ1 = wallZ + ST_D;
    const stX = (stX0 + stX1) / 2, stZ = (stZ0 + stZ1) / 2;
    const body = addBox(houseGroup, ST_W, 0.850, ST_D, materials.metal, stX, 0.425, stZ);
    tagLayer(body, 'furniture');
    const stTop = addBox(houseGroup, ST_W, 0.040, ST_D, materials.metal, stX, 0.870, stZ);
    tagLayer(stTop, 'furniture');
    for (const [dx, dz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.070, 0.008, 16), materials.metal);
      ring.position.set(stX + dx, 0.894, stZ + dz);
      tagLayer(ring, 'furniture');
      houseGroup.add(ring);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.050, 0.016, 16), materials.gutter);
      cap.position.set(stX + dx, 0.906, stZ + dz);
      tagLayer(cap, 'furniture');
      houseGroup.add(cap);
    }
    const oven = addBox(houseGroup, 0.480, 0.520, 0.020, materials.gutter, stX, 0.380, stZ1 + 0.010);
    tagLayer(oven, 'furniture');
    const handle = addBox(houseGroup, 0.280, 0.016, 0.030, materials.metal, stX, 0.620, stZ1 + 0.030);
    tagLayer(handle, 'furniture');
    colliders.push({ type: 'aabb', x0: stX0, x1: stX1, z0: stZ0, z1: stZ1 });
    out.stoveBox = { x0: stX0, x1: stX1, z0: stZ0, z1: stZ1, w: ST_W, d: ST_D, h: ST_H };
    out.worktops = [
      { name: 'counter', ...out.counterBox, top: COUNTER_H },
      { name: 'stove', ...out.stoveBox, top: ST_H }
    ];

    // --- Item 6: high window, two top-hung outward sashes ---
    const HW = G.highWindow;
    if (HW) {
      const a0 = HW.th_e, a1 = HW.th_w, z0 = mm(HW.sill), z1 = mm(HW.head);
      const mid = (a0 + a1) / 2;
      const p = polar(mid, R);
      const t = mid * DEG;
      const nx = Math.sin(t), nz = Math.cos(t);
      const frameD = 0.070, frameT = 0.055;
      const clearW = (a1 - a0) * DEG * R;
      const w = Math.max(0.2, clearW), h = z1 - z0;
      const group = new THREE.Group();
      addBox(group, frameT, h, frameD, materials.timber, -w / 2 + frameT / 2, 0, 0);
      addBox(group, frameT, h, frameD, materials.timber,  w / 2 - frameT / 2, 0, 0);
      addBox(group, w, frameT, frameD, materials.timber, 0, -h / 2 + frameT / 2, 0);
      addBox(group, w, frameT, frameD, materials.timber, 0,  h / 2 - frameT / 2, 0);
      const mull = addBox(group, 0.040, h - frameT * 2, frameD, materials.timber, 0, 0, 0);
      mull.userData.viewLayer = 'opening';
      const sashW = (w - frameT * 2 - 0.040) / 2;
      const sashH = h - frameT * 2;
      const st = 0.045;
      [-1, 1].forEach((side) => {
        const sx = side * (sashW / 2 + 0.020);
        const pivot = new THREE.Group();
        // Top-hung: pivot at the head of the sash, slightly open outward (local +Z).
        pivot.position.set(sx, sashH / 2 - 0.008, 0);
        pivot.rotation.x = -0.22; // ≈ 12.5°, outward
        const leaf = new THREE.Group();
        leaf.position.set(0, -sashH / 2, 0);
        const bars = [
          addBox(leaf, st, sashH, 0.040, materials.timber, -sashW / 2 + st / 2, 0, 0),
          addBox(leaf, st, sashH, 0.040, materials.timber,  sashW / 2 - st / 2, 0, 0),
          addBox(leaf, sashW, st, 0.040, materials.timber, 0, -sashH / 2 + st / 2, 0),
          addBox(leaf, sashW, st, 0.040, materials.timber, 0,  sashH / 2 - st / 2, 0)
        ];
        bars.forEach((m) => { m.userData.viewLayer = 'opening'; });
        const gl = addBox(leaf, sashW - st * 2, sashH - st * 2, 0.012, materials.glass, 0, 0, 0);
        gl.castShadow = false;
        pivot.add(leaf);
        // Factory hinges (3 butts on the head of each top-hung sash).
        for (const hx of [-sashW * 0.32, 0, sashW * 0.32]) {
          const hg = addBox(leaf, 0.028, 0.012, 0.032, materials.galvanised, hx, sashH / 2 - 0.008, 0.02);
          hg.userData.viewLayer = 'opening';
        }
        group.add(pivot);
      });
      // Factory winder gearbox on the unit sill, at the meeting mullion.
      const gear = addBox(group, 0.08, 0.06, 0.07, materials.galvanised, 0, -h / 2 + 0.04, 0.02);
      gear.userData.viewLayer = 'opening';
      const crank = addBox(group, 0.012, 0.012, 0.11, materials.galvanised, 0.05, -h / 2 + 0.04, 0.06);
      crank.userData.viewLayer = 'opening';
      group.position.set(p.x, (z0 + z1) / 2, p.y);
      group.rotation.y = Math.atan2(nx, nz);
      group.traverse((m) => {
        if (m.isMesh && m.userData.viewLayer === 'timber') m.userData.viewLayer = 'opening';
      });
      houseGroup.add(group);
      // 50 mm trimmer on the west side of the rough opening (item 6).
      const trimTh = HW.th_trim || (HW.th_w + 50 * 180 / (Math.PI * R * 1000));
      const tp = polar(trimTh, R);
      const tt = trimTh * DEG;
      const trimH = z1 - z0 + 0.030;
      const trim = addBox(houseGroup, 0.050, trimH, 0.150, materials.timber, tp.x, (z0 + z1) / 2, tp.y);
      trim.rotation.y = Math.atan2(Math.sin(tt), Math.cos(tt));
      trim.userData.usStud = true;
      // Winder is part of the factory unit (gearbox on the sill), not a site-built floor rod.
    }

    // --- Item 11: low inlets and shower fan ---
    (G.vents || []).forEach((v) => {
      const p = polar(v.th, R);
      const t = v.th * DEG;
      const nx = Math.sin(t), nz = Math.cos(t);
      const y = mm(v.aff);
      const L = 0.250, r = 0.050;
      // Sleeve through the 250 mm wall, 5 mm fall out.
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 16), materials.gutter);
      sleeve.rotation.z = Math.PI / 2;
      sleeve.rotation.y = Math.atan2(nx, nz);
      sleeve.position.set(p.x, y, p.y);
      sleeve.castShadow = false;
      tagLayer(sleeve, 'skin');
      houseGroup.add(sleeve);
      // Inner grille
      const gr = addBox(houseGroup, 0.12, 0.12, 0.012, materials.metal,
        p.x - nx * (WALL_T / 2 - 0.01), y, p.y - nz * (WALL_T / 2 - 0.01));
      gr.rotation.y = Math.atan2(nx, nz);
      tagLayer(gr, 'skin');
      if (v.kind !== 'low inlet') { // fan or high vent: cowl outside
        // F1 fan box in the upper closing, ASSUMED 160 mm square cowl outside.
        const cowl = addBox(houseGroup, 0.16, 0.16, 0.08, materials.metal,
          p.x + nx * (WALL_T / 2 + 0.04), y, p.y + nz * (WALL_T / 2 + 0.04));
        cowl.rotation.y = Math.atan2(nx, nz);
        tagLayer(cowl, 'skin');
      }
    });

    // --- Item 9 / rev h: ledge 150 × 30, 3.75 m, on 6 node studs 100 × 50 (~553 c/c) ---
    const Ledge = G.ledge;
    if (Ledge && Ledge.face && Ledge.face.length > 1) {
      const boardT = 0.030, boardD = 0.150, targetLen = 3.750, topY = mm(Ledge.top_aff);
      const rawF = Ledge.face.map(([x, y]) => new THREE.Vector3(mm(x), topY - boardT / 2, wz(mm(y))));
      const rawE = (Ledge.edge || Ledge.face).map(([x, y]) => new THREE.Vector3(mm(x), topY - boardT / 2, wz(mm(y))));
      // Cumulative length, then keep a 3.75 m run set back equally from each end.
      const cum = [0];
      for (let i = 1; i < rawF.length; i++) cum.push(cum[i - 1] + rawF[i].distanceTo(rawF[i - 1]));
      const Ltot = cum[cum.length - 1];
      const inset = Math.max(0, (Ltot - targetLen) / 2);
      function atLen(arr, s) {
        const t = Math.max(0, Math.min(Ltot, s));
        for (let i = 1; i < arr.length; i++) {
          if (cum[i] >= t) {
            const u = (t - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
            return arr[i - 1].clone().lerp(arr[i], u);
          }
        }
        return arr[arr.length - 1].clone();
      }
      const pts = [], edge = [];
      const nKeep = 32;
      for (let i = 0; i <= nKeep; i++) {
        const s = inset + targetLen * (i / nKeep);
        pts.push(atLen(rawF, s));
        edge.push(atLen(rawE, s));
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const ea = edge[i], eb = edge[i + 1];
        const boardMid = a.clone().add(b).add(ea).add(eb).multiplyScalar(0.25);
        const len = Math.hypot(b.x - a.x, b.z - a.z);
        if (len < 0.02) continue;
        const m = addBox(houseGroup, len, boardT, boardD, materials.timber, boardMid.x, boardMid.y, boardMid.z);
        m.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
        tagLayer(m, 'furniture');
      }
      // 6 node studs 100 × 50 at ~553 c/c, full height of the inner wall (to the T&G).
      const cc = 0.553, first = (targetLen - 5 * cc) / 2;
      for (let i = 0; i < 6; i++) {
        const s = inset + first + i * cc;
        const f = atLen(rawF, s), e = atLen(rawE, s);
        const mid = f.clone().add(e).multiplyScalar(0.5);
        const y0 = 0.020, y1 = ceilingCloseAFF(mid.z);
        const st = addBox(houseGroup, 0.050, y1 - y0, 0.100, materials.timber, mid.x, (y0 + y1) / 2, mid.z);
        const ang = Math.atan2(e.z - f.z, e.x - f.x);
        st.rotation.y = ang;
        st.userData.viewLayer = 'timber';
        st.userData.member = 'stud';
        // Concealed bracket under the board at this stud.
        const br = addBox(houseGroup, 0.012, 0.04, 0.12, materials.galvanised, mid.x, topY - boardT - 0.02, mid.z);
        tagLayer(br, 'furniture');
      }
    }

    // --- Item 4: bathroom curtain, partition end to pier 3 ---
    (function () {
      const pier = G.segments.find((s) => s.no === 3);
      if (!pier) return;
      const mid = (pier.th0 + pier.th1) / 2;
      const p3 = polar(mid, rIn);
      // Partition end: bathroom/bed partition x ≈ 2.258, south end from furniture
      const part = (G.furniture && G.furniture.partitions || []).find((q) => /bathroom/i.test(q.name || ''));
      let px = 2.258, pz;
      if (part) {
        px = mm(part.b[0]);
        pz = wz(mm(part.b[1]));
      } else {
        pz = 2.833;
      }
      const railY = 2.200; // unfounded partition height; rail along the same, ASSUMED
      const rail = [];
      const n = 8;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        rail.push(new THREE.Vector3(px + (p3.x - px) * t, railY, pz + (p3.y - pz) * t));
      }
      for (let i = 0; i < rail.length - 1; i++) {
        const a = rail[i], b = rail[i + 1];
        const len = a.distanceTo(b);
        const midp = a.clone().add(b).multiplyScalar(0.5);
        const rod = addBox(houseGroup, len, 0.018, 0.018, materials.metal, midp.x, midp.y, midp.z);
        rod.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
        tagLayer(rod, 'furniture');
      }
      // Curtain panels hanging from the rail (CHECK line).
      const clothH = 2.000; // ASSUMED, 200 mm above FFL
      for (let i = 0; i < n; i++) {
        const a = rail[i], b = rail[i + 1];
        const len = a.distanceTo(b);
        const midp = a.clone().add(b).multiplyScalar(0.5);
        const cloth = addBox(houseGroup, len * 0.98, clothH, 0.012, materials.curtain,
          midp.x, railY - clothH / 2, midp.z);
        cloth.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
        cloth.castShadow = false;
        tagLayer(cloth, 'furniture');
      }
    })();

    // --- Item 7 (v1y shed): upper closing to the main roof, 20 mm slip; N wall stops under the y = 0 purlin ---
    (function () {
      const slip = 0.020;
      function utilTopAt(x, z) {
        const cover = coverFFL(-z);
        if (x > ux1 - 0.30) return cover - 0.200 - 0.240 - slip;          // under the x = +9 beam
        if (Math.abs(z) < 0.075 + uHalf) return cover - 0.200 - slip;      // under the y = 0 purlin
        return cover - slip;
      }
      const stations = 12;
      [[nX0, uZNorth, -1], [sX0, uZSouth, +1]].forEach(([x0w, zc, outer]) => {
        const L = ux1 - uHalf - x0w;
        for (let i = 0; i < stations; i++) {
          const a = x0w + (L * i) / stations, b = x0w + (L * (i + 1)) / stations;
          const xc = (a + b) / 2, top = utilTopAt(xc, zc);
          if (top > plateTop + 0.02) sandwichSlab(xc, zc, b - a, 'z', plateTop, top, outer);
        }
      });
      for (let i = 0; i < stations; i++) {
        const a = (uZNorth - uHalf) + (uLenNS * i) / stations, b = (uZNorth - uHalf) + (uLenNS * (i + 1)) / stations;
        const zc = (a + b) / 2;
        installEastWall(zc, b - a, plateTop, utilTopAt(ux1, zc));
      }
    })();

    // --- Item 8 (v1y): kit — boiler and geyser on the east installation wall south of the door,
    // battery and inverter on the south wall (sizes and positions ASSUMED) ---
    (function () {
      const plyX = ux1 - 0.097;
      const boilH = 1.30, boilW = 0.50, boilD = 0.45;
      const boilZ = dZ1 + 0.10 + boilW / 2;
      const boiler = addBox(houseGroup, boilD, boilH, boilW, materials.white, plyX - boilD / 2, 0.700 + boilH / 2, boilZ);
      tagLayer(boiler, 'furniture');
      const gW = 0.35, gD = 0.35, gZ = uInZ1 - 0.05 - gW / 2, gX = plyX - gD / 2;
      const geyser = addBox(houseGroup, gD, 0.70, gW, materials.white, gX, 1.55, gZ);
      tagLayer(geyser, 'furniture');
      const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 1.20, 10), materials.gutter);
      flue.position.set(gX, 2.40, gZ); tagLayer(flue, 'furniture'); houseGroup.add(flue);
      const batD = 0.30, batW = 0.70, batH = 0.80, batX = 6.20, batZ = uInZ1 - batD / 2;
      const bat = addBox(houseGroup, batW, batH, batD, materials.white, batX, 0.40, batZ);
      tagLayer(bat, 'furniture');
      const inv = addBox(houseGroup, 0.50, 0.70, 0.24, materials.metal, batX + 0.90, 1.10, uInZ1 - 0.12);
      tagLayer(inv, 'furniture');
      out.geyser = { x: gX, z: gZ, depth: gD, assumedSize: true };
      out.boiler = { x: plyX - boilD / 2, z: boilZ };
      out.solar = {
        inverter: { x: batX + 0.90, z: uInZ1 - 0.12, clearInFront: 1.00, assumed: true },
        battery: { x: batX, z: batZ, clearInFront: 1.00, assumed: true, toGeyserM: Math.hypot(gX - batX, gZ - batZ) }
      };
    })();

    return out;
  }
  const revg = buildRevG();


  // Kitchen work surfaces (all counters confirmed at 900 mm above FFL)
  const COUNTER_H = 0.900;
  const counterBox = revg.counterBox;
  const worktops = revg.worktops;

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
  colliders.push({ type: 'aabb', x0: nX0 + 0.05, x1: ux1 + uHalf, z0: uZNorth - uHalf, z1: uZNorth + uHalf });
  colliders.push({ type: 'aabb', x0: sX0 + 0.05, x1: ux1 + uHalf, z0: uZSouth - uHalf, z1: uZSouth + uHalf });
  colliders.push({ type: 'aabb', x0: ux1 - uHalf, x1: ux1 + uHalf, z0: uZNorth - uHalf, z1: dZ0 });
  colliders.push({ type: 'aabb', x0: ux1 - uHalf, x1: ux1 + uHalf, z0: dZ1, z1: uZSouth + uHalf });
  colliders.push({ type: 'aabb', x0: ux1 - uHalf, x1: ux1 + uHalf, z0: dZ0, z1: dZ1, doorKind: 'utility' });
  colliders.push({ type: 'utility', ix0: uInX0 - 0.7, ix1: uInX1, iz0: uInZ0, iz1: uInZ1, doorX: ux1, doorZ0: dZ0, doorZ1: dZ1 });
  colliders.push({ type: 'arc', cx: mm(iw.cx), cz: wz(mm(iw.cy)), r: mm(iw.r), half: CURVE_T/2,
    pts: arcPts });

  // Clash overlays
  buildClashes(braceMeshes, worktops, segs, verts, U, plateTop, rIn);

  // Sandwich-wall clash figures (recomputed from the new thicknesses).
  computedClashes.cleared.wallBuild = (function () {
    const postHalf = 0.100;
    const coverIn = (R - postHalf) - rIn;
    const coverOut = rOut - (R + postHalf);
    const plinthIn = rIn - rPlIn;
    const plinthOut = rPlOut - rOut;
    const frameD = 0.070;
    const timberReveal = (FRAME_T - frameD) / 2;
    const proudOfFrame = postHalf - FRAME_T / 2;
    const cobOverPost = SKIN_T - proudOfFrame;
    const postProudOfWall = postHalf - WALL_T / 2; // negative = fully inside
    const c = worktops.find((w) => w.name === 'counter');
    const northZ = Math.min(c.z0, c.z1);
    const counterGaps = [c.x0, c.x1].map((x) => {
      const rho = Math.hypot(x, northZ);
      return { x, z: northZ, rho, gap: rIn - rho };
    });
    const apron = K_SILL - 0.900;
    // Cob skin thins or stops at the posts and knee braces; the timber stays exposed
    // (or lime-washed). Braces are not wrapped in cob.
    const ringNames = new Set(['S ring', 'E ring', 'N ring', 'W ring']);
    const braceSkin = [];
    braceMeshes.forEach((m) => {
      const b = m.userData.brace;
      if (!b || !ringNames.has(b.post)) return;
      braceSkin.push({
        post: b.post,
        dir: b.dir,
        side: b.side,
        note: 'cob skin stops at the post and brace; timber remains exposed (or lime-washed), not a structural clash'
      });
    });
    const it = window.__interior;
    let couchGap = null, bathOuter = null;
    if (it && it.living && it.living.couch) {
      const backX = it.living.couch.back;
      const z0 = it.living.couch.north, z1 = z0 + it.living.couch.w;
      let minClear = 1e9, atZ = z0;
      for (let z = z0; z <= z1 + 1e-6; z += 0.02) {
        let best = 1e9;
        for (let i = 0; i < arcPts.length - 1; i++) {
          const ax = arcPts[i].x, az = arcPts[i].z, bx = arcPts[i+1].x, bz = arcPts[i+1].z;
          const ex = bx - ax, ez = bz - az;
          const t = Math.max(0, Math.min(1, ((backX - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1)));
          const d = Math.hypot(backX - (ax + t * ex), z - (az + t * ez));
          if (d < best) best = d;
        }
        const clear = best - CURVE_T / 2;
        if (clear < minClear) { minClear = clear; atZ = z; }
      }
      couchGap = { min: minClear, atZ, walkwayToGardenJamb: it.living.couch.north - 0 };
    }
    if (it && it.bathroomPerson) {
      const bp = it.bathroomPerson;
      const bodyR = 0.200;
      bathOuter = rIn - Math.hypot(bp.x, bp.z) - bodyR;
    }
    function distToArc(x, z) {
      let best = 1e9;
      for (let i = 0; i < arcPts.length - 1; i++) {
        const ax = arcPts[i].x, az = arcPts[i].z, bx = arcPts[i+1].x, bz = arcPts[i+1].z;
        const ex = bx - ax, ez = bz - az;
        const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1)));
        const d = Math.hypot(x - (ax + t * ex), z - (az + t * ez));
        if (d < best) best = d;
      }
      return best;
    }
    let bedGap = null, bathToInner = null, kitchenToInner = null, doorSwingGap = null;
    if (it && it.bed) {
      const b = it.bed;
      let min = 1e9, at = null;
      for (const [x, z] of [[b.x0, b.z0], [b.x1, b.z0], [b.x0, b.z1], [b.x1, b.z1]]) {
        const d = distToArc(x, z) - CURVE_T / 2;
        if (d < min) { min = d; at = { x, z }; }
      }
      bedGap = { min, at };
    }
    if (it && it.bathroomPerson) {
      const bp = it.bathroomPerson;
      bathToInner = distToArc(bp.x, bp.z) - CURVE_T / 2 - 0.200;
    }
    kitchenToInner = distToArc((c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2) - CURVE_T / 2;
    // Garden double doors (the only pair): both leaves swing 90° outward (local +Z).
    const garden = doors.find((d) => d.kind === 'gardendoor');
    if (garden) {
      const rotY = Math.atan2(garden.nx, garden.nz);
      const cy = Math.cos(rotY), sy = Math.sin(rotY);
      const gx = garden.p.x, gz = garden.p.y;
      const halfD = 0.035;
      function gardenLeafWorld(leaf, theta, u, v) {
        const x = leaf.dir * leaf.w * u;
        const z = halfD * v;
        const c = Math.cos(theta), s = Math.sin(theta);
        const lx = x * c + z * s + leaf.pivot.position.x;
        const lz = -x * s + z * c;
        return { x: gx + lx * cy + lz * sy, z: gz + lz * cy - lx * sy };
      }
      let minInward = 1e9;
      const samples = [];
      garden.leaves.forEach((leaf) => {
        const openAng = (90 * Math.PI / 180) * leaf.sign;
        for (let k = 0; k <= 8; k++) {
          const ang = openAng * (k / 8);
          for (const u of [0, 1]) for (const v of [-1, 1]) {
            const wpt = gardenLeafWorld(leaf, ang, u, v);
            const d = distToArc(wpt.x, wpt.z) - CURVE_T / 2;
            if (d < minInward) minInward = d;
            if (k === 8 && u === 1 && v === 0) samples.push(wpt);
          }
        }
      });
      const tip0 = gardenLeafWorld(garden.leaves[0], (90 * Math.PI / 180) * garden.leaves[0].sign, 1, 0);
      const tip1 = gardenLeafWorld(garden.leaves[1], (90 * Math.PI / 180) * garden.leaves[1].sign, 1, 0);
      const rhoTips = [Math.hypot(tip0.x, tip0.z), Math.hypot(tip1.x, tip1.z)];
      doorSwingGap = {
        min: minInward,
        leaf: Math.max(...garden.leaves.map((l) => l.w)),
        openTipsRho: rhoTips,
        note: 'Garden double doors open 90° outward over the notched plinth and the 180 mm step to grade. Inner-wall figure is clearance from the outward swing (large). Back door and utility are unchanged (already modelled as outward; only this pair was swinging in).'
      };
    }
    // Beams and braces above the inner-wall head (2 375 AFF).
    let iwBeam = { minSoffit: null, minGapAboveHead: null, atY: null };
    for (const p of arcPts) {
      const yN = -p.z;
      const sof = soffitFFL(yN);
      const gap = sof - IW_TOP;
      if (iwBeam.minSoffit == null || sof < iwBeam.minSoffit) {
        iwBeam = { minSoffit: sof, minGapAboveHead: gap, atY: yN, wallTop: IW_TOP };
      }
    }
    const iwBraces = [];
    braceMeshes.forEach((m) => {
      const b = m.userData.brace;
      if (!b) return;
      const d = distToArc(m.position.x, m.position.z) - CURVE_T / 2;
      const under = m.userData.underside;
      if (d < 1.50) {
        iwBraces.push({
          post: b.post, dir: b.dir, planClear: d, underside: under,
          aboveHead: under - IW_TOP, clash: d < 0.05 && under < IW_TOP + 0.05
        });
      }
    });

    // Upper closing vs beams / along-wall braces / roof.
    const ucAtS = { y: -5, beamSoffit: soffitFFL(-5), closingTop: coverFFL(-5) - 0.020, headTop: HEAD_TOP };
    const alongWall = braceMeshes.filter((m) => {
      const b = m.userData.brace;
      return b && ((b.post === 'E ring' || b.post === 'W ring') && b.dir === 'N-S');
    }).map((m) => ({ post: m.userData.brace.post, side: m.userData.brace.side, underside: m.userData.underside }));
    const usCount = (houseGroup.children.filter((m) => m.userData && m.userData.usStud) || []).length
      + (function () { let n = 0; houseGroup.traverse((m) => { if (m.userData && m.userData.usStud) n++; }); return n; })();

    return {
      wallT: WALL_T, frameT: FRAME_T, skinT: SKIN_T,
      rIn, rOut, rFrameIn, rFrameOut, rPlIn, rPlOut,
      windowFrame: frameD,
      cobReveal: SKIN_T,
      timberReveal,
      revealEachFace: SKIN_T,
      liningCheck: '70 mm frame sits in the 150 mm timber frame (40 mm timber + 50 mm cob each side). It does not span the 250 mm wall; a lining or deeper frame may be needed (proposal CHECK).',
      post: {
        section: 0.200,
        coverIn, coverOut,
        fullyInside: postProudOfWall <= 1e-6,
        proudMm: Math.round(postProudOfWall * 1000),
        proudOfFrame, cobOverPost
      },
      plinth: { width: 0.400, revealIn: plinthIn, revealOut: plinthOut, wallOverhangs: plinthIn < -1e-6 || plinthOut < -1e-6 },
      utility: { wallT: WALL_T, plinth: 0.400, reveal: 0.200 - WALL_T / 2, postCover: coverIn },
      innerWall: {
        unconfirmed: true,
        thickness: CURVE_T,
        frame: 0.100,
        height: IW_H,
        plinthTop: IW_PLINTH,
        topAFF: IW_TOP,
        sole: '100 × 50 on DPC',
        head: '100 × 50 closing plate, not tied to the roof',
        endPost: iwEnd,
        flushWithPlinth: true,
        bedGap,
        bathroomFigureToInner: bathToInner,
        bathroomToHouseInner: bathOuter,
        kitchenToInner,
        doorSwingGap,
        beamAbove: iwBeam,
        bracesNear: iwBraces
      },
      kitchen: {
        sillAssumed: K_SILL,
        railTop: K_RAIL_TOP,
        railHeight: K_RAIL_H,
        cobUnderRail: K_RAIL_BOT - SOLE_TOP,
        fitGap: FIT_GAP,
        apron,
        counterGaps
      },
      packerGap: {
        packer: PACKER,
        soleTop: SOLE_TOP,
        packerTop: SOLE_TOP + PACKER,
        sill: SILL,
        fitGap: FIT_GAP,
        intended: true,
        note: '15 mm packer on the sole (top 385 mm); 15 mm intended fit gap (shims + sill tape) to the 400 mm sill. Not a mismatch.'
      },
      furniture: { couchToInnerWall: couchGap, bathroomToHouseInner: bathOuter },
      headPlate: { width: 0.150, skinProjectsPast: SKIN_T, skinsContinueToRoof: true, byDesign: true, coldBand: false },
      braceThroughInnerSkin: { count: braceSkin.length, items: braceSkin },
      upperClosing: {
        unconfirmed: true,
        thickness: WALL_T,
        usSection: '150 × 50 (was 100 × 50)',
        usAcrossWall: 0.150,
        usCount: (function () { let n = 0; houseGroup.traverse((m) => { if (m.userData && m.userData.usStud) n++; }); return n; })(),
        bearing: 'US now bears across the full 150 mm head plate (flush with both faces). Previously 100 mm across, 25 mm shy of each plate face. Position unchanged: centred on R = 5.0, from the head-plate top (2 475 mm) to the roof underside minus the 20 mm slip.',
        slipJoint: 0.020,
        skinsContinuePastHeadPlate: true,
        south: ucAtS,
        beam: {
          soffitAtS: ucAtS.beamSoffit,
          closingFrom: HEAD_TOP,
          closingToAtS: ucAtS.closingTop,
          note: 'The closing is non-load-bearing and is built around the main beams where they meet the ring (x = −5, 0, +5). Beam bearing stays on the posts; unchanged.'
        },
        bracesAlongWall: {
          items: alongWall,
          note: 'E/W along-wall (N–S) braces sit in the 150 mm frame / cavity (100 mm section, centred) and are built round; they do not clash with the 50 mm skins.'
        }
      }
    };
  })();

  computedClashes.cleared.ceiling = (function () {
    const sInner = tngSoffitFFL(-rIn);
    const sCL = tngSoffitFFL(-5);
    const centre = tngSoffitFFL(0);
    const nInner = tngSoffitFFL(rIn);
    const nCL = tngSoffitFFL(5);
    const closingTopS = coverFFL(-5) - 0.020;
    const beamSofS = soffitFFL(-5);
    const visibleBeamS = sCL - beamSofS; // at wall CL; T&G is 20 mm below purlin soffit
    const visibleBeamAtPurlin = (coverFFL(-5) - 0.200) - beamSofS; // 240 mm
    let iwMin = null;
    for (const p of arcPts) {
      const sof = tngSoffitFFL(-p.z);
      const gap = sof - IW_TOP;
      if (iwMin == null || gap < iwMin.gap) iwMin = { soffit: sof, gap, y: -p.z, wallTop: IW_TOP };
    }
    const braceHits = [];
    braceMeshes.forEach((m) => {
      const b = m.userData.brace;
      if (!b) return;
      const box = new THREE.Box3().setFromObject(m);
      const px = m.position.x, pz = m.position.z;
      const rho = Math.hypot(px, pz);
      const tng = tngSoffitFFL(-pz);
      const top = box.max.y;
      const clear = tng - top;
      const interior = rho <= rCeil + 0.15;
      const clash = interior && clear < -0.005;
      braceHits.push({
        post: b.post, dir: b.dir, side: b.side,
        top, tng, clear, rho, interior, clash
      });
    });
    const it = window.__interior;
    const figures = [];
    if (it && it.kitchenPerson) {
      const k = it.kitchenPerson;
      const sof = tngSoffitFFL(-k.z);
      figures.push({ who: 'kitchen 1.80 m', soffit: sof, gap: sof - k.height });
    }
    if (it && it.bathroomPerson) {
      const bp = it.bathroomPerson;
      const sof = tngSoffitFFL(-bp.z);
      figures.push({ who: 'bathroom 1.70 m', soffit: sof, gap: sof - bp.height });
    }
    const utilS = tngSoffitFFL(-2.550);
    const utilN = tngSoffitFFL(0.000);
    const collaredKeys = new Set(braceHeads.map((h) => h.post + ':' + h.side));
    braceHits.forEach((h) => {
      if (h.dir === 'E-W' && collaredKeys.has(h.post + ':' + h.side)) {
        h.collared = true;
        h.clash = false;
      }
    });
    const hits = braceHits.filter((h) => h.clash);
    return {
      unconfirmed: false,
      insulationInside: true,
      insulationChoiceDecided: true,
      interiorsOnly: true,
      insulation: ROOF_INS_T,
      productCheck: 'Wood-fibre batts or unfaced Volcalis preferred (product still CHECK). Joist hangers still Connections CHECK.',
      joists: '50 × 200, N–S, flush with purlin soffit, 609 mm c/c house / 550 mm utility',
      tng: TNG_T,
      collars: {
        count: braceHeads.length,
        opening: COLLAR_OPEN,
        note: 'T&G and membrane stop at a trimmed opening with a timber collar around each of the four interior E–W brace heads at the centre purlin. The 70 mm pierce is resolved; not an open clash.',
        items: braceHeads
      },
      soffits: { sInner, sCL, centre, nInner, nCL },
      proposalSoffits: { sInner: 2.905, centre: 3.504, nWall: 4.118 },
      headroomMin: sInner,
      headroomAbove2m: sInner - 2.0,
      innerWall: iwMin,
      upperClosing: {
        topAtS: closingTopS,
        ceilingAtSInner: sInner,
        visibleClosingBelowCeiling: sInner - HEAD_TOP,
        planSlip: CEIL_GAP,
        note: 'T&G stops 20 mm short of the upper closing and is not fixed to the wall. At the south inner face the ceiling is below the closing top; ~430 mm of closing remains visible under the ceiling (2 905 − 2 475).'
      },
      beams: {
        soffitAtS: beamSofS,
        visibleBelowTngAtSCL: visibleBeamS,
        visibleBelowPurlinSoffit: visibleBeamAtPurlin,
        stayFullyVisible: visibleBeamS > 0.20,
        note: 'Main-beam soffits are 240 mm below the purlin soffit. T&G is 20 mm below the purlin soffit, so 220 mm of beam stays visible below the ceiling at the south wall CL (soffit 2 670 mm). The proposal’s “240 mm below the ceiling” is the purlin-soffit figure; the extra 20 mm of T&G is flagged.'
      },
      braces: {
        clashes: hits,
        minClearInterior: braceHits.filter((h) => h.interior).reduce((m, h) => Math.min(m, h.clear), 99),
        items: braceHits
      },
      utility: {
        tngAtSouth: utilS, tngAtNorth: utilN,
        gapAbovePlateS: utilS - plateTop, gapAbovePlateN: utilN - plateTop,
        plateTop
      },
      figures
    };
  })();

  const compass = addCompassRose(houseGroup, GRADE);
  tagLayer(compass, 'site', 'compass');


  // Rev 2026-11-26g CHECKs, recomputed from the mesh.
  computedClashes.revg = (function () {
    const DEG = Math.PI / 180;
    const w1 = segs.find((s) => s.no === 1);
    const pier = segs.find((s) => s.no === 3);
    const sBrace = braceMeshes.find((m) => {
      const b = m.userData.brace;
      return b && b.post === 'S ring' && b.dir === 'N-S' && b.side === 1;
    });
    const nBrace = braceMeshes.find((m) => {
      const b = m.userData.brace;
      return b && b.post === 'N ring' && b.dir === 'N-S' && b.side === -1;
    });
    function braceBox(m) {
      m.updateWorldMatrix(true, true);
      return new THREE.Box3().setFromObject(m);
    }
    // Window 1 west sash at 90° inward: leaf in a plane just east of the S post (x = +0.100).
    // Clearance to the east face of the S inward knee brace.
    let w1Sash = null;
    if (sBrace && w1) {
      const box = braceBox(sBrace);
      const postEast = 0.100;
      const sashPlane = postEast + 0.015; // 15 mm fit / lining, ASSUMED for the check
      const braceEast = box.max.x;
      const clear = sashPlane - braceEast;
      w1Sash = {
        check: 'Window 1 sash vs S knee brace (90° inward, west sash)',
        sashPlaneMm: Math.round(sashPlane * 1000),
        braceEastMm: Math.round(braceEast * 1000),
        clearMm: Math.round(clear * 1000),
        planNote: 'about 65 mm (CHECK with Els and Joshua)',
        undersideMm: Math.round((sBrace.userData.underside || 0) * 1000)
      };
    }
    // High-window east lining (th_e) vs the N inward knee brace.
    let hwLining = null;
    const HW = G.highWindow;
    if (nBrace && HW) {
      const box = braceBox(nBrace);
      const p = polar(HW.th_e, R);
      // lining is a 50 mm band at the east of the rough opening; use the post-west / lining east face.
      const liningX = p.x; // ≈ −0.100, west face of the N post
      const braceWest = box.min.x;
      const clear = liningX - braceWest; // lining is west (more negative) of the brace
      // Positive clear means the lining is west of the brace's west face? liningX=-0.100, braceWest≈-0.050, clear=-0.050.
      // Distance is braceWest - liningX if lining is west of brace.
      const dist = braceWest - liningX;
      hwLining = {
        check: 'High-window east lining vs N knee brace',
        liningXMm: Math.round(liningX * 1000),
        braceWestMm: Math.round(braceWest * 1000),
        clearMm: Math.round(dist * 1000),
        planNote: '75 mm (rev k2)',
        sillMm: HW.sill, headMm: HW.head
      };
    }
    // Bed-area closet vs window 1 (plan CHECK).
    const clos = F.closetBed;
    const xs = clos.map((p) => mm(p[0])), zs = clos.map((p) => wz(mm(p[1])));
    const cbox = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
    const w1mid = polar((w1.th0 + w1.th1) / 2, rIn);
    const closestX = Math.max(cbox.x0, Math.min(w1mid.x, cbox.x1));
    const closestZ = Math.max(cbox.z0, Math.min(w1mid.y, cbox.z1));
    const closetDist = Math.hypot(w1mid.x - closestX, w1mid.y - closestZ);
    const closetVsW1 = {
      check: 'Bed-area closet vs window 1',
      closet: cbox,
      window1Inner: { x: w1mid.x, z: w1mid.y },
      planClearMm: Math.round(closetDist * 1000),
      note: 'The sketched closet stays by the bed / partition, not in front of window 1. Plan item 4 is a CHECK.'
    };
    // Curtain line: partition south end to pier 3.
    let curtain = null;
    if (pier) {
      const part = (F.partitions || []).find((q) => /bathroom/i.test(q.name || ''));
      const px = part ? mm(part.b[0]) : 2.258;
      const pz = part ? wz(mm(part.b[1])) : 2.833;
      const p3 = polar((pier.th0 + pier.th1) / 2, rIn);
      const w2 = segs.find((s) => s.no === 2);
      const w2mid = w2 ? polar((w2.th0 + w2.th1) / 2, rIn) : null;
      curtain = {
        check: 'Bathroom curtain, partition end to pier 3',
        from: { x: px, z: pz },
        to: { x: p3.x, z: p3.y },
        lengthMm: Math.round(Math.hypot(p3.x - px, p3.y - pz) * 1000),
        railY: 2.200, // rail stays at 2 200; the partition itself now goes to the T&G
        note: 'Diagonal to pier 3, not a continuation of the partition to the ring (that would meet window 2). CHECK with Els.',
        wouldHitWindow2IfExtended: true
      };
    }
    // Utility door vs back door, 219 mm in the drawings. Door head confirmed 2 140 (rev h).
    const utilDoor = {
      check: 'Utility door swing vs back door',
      drawnClearMm: U.backDoorClearanceMm,
      openingMm: U.door_opening,
      clearMm: U.door_clear,
      hinge: U.door_hinge,
      wall: U.door_wall,
      heightMm: U.door_height,
      headMm: U.door_head || 2140,
      heightAssumed: false
    };
    // Geyser to battery 2.400 m c/c (rev h / i, one value; ignore B-13 2.6 m). Sizes ASSUMED.
    const g = revg.geyser, sol = revg.solar;
    let geyserDist = null;
    if (g && sol) {
      const inv = Math.hypot(g.x - sol.inverter.x, g.z - sol.inverter.z);
      const bat = Math.hypot(g.x - sol.battery.x, g.z - sol.battery.z);
      geyserDist = {
        check: 'Geyser to battery / inverter',
        toInverterMm: Math.round(inv * 1000),
        toBatteryMm: Math.round(bat * 1000),
        nearerMm: Math.round(Math.min(inv, bat) * 1000),
        planMm: 2400,
        b13Mm: 2600,
        note: 'Centres 2.400 m (rev h / i / j). B-13 has said 2.4 m since rev h; the old 2.6 m was rev g only. Kit sizes ASSUMED; inverter is next to the battery, not the 2.4 m datum.'
      };
    }
    // Downpipes vs new south openings.
    const rawOut = (gutterSpec && gutterSpec.outlets) || [{ x: -5 }, { x: 5 }, { x: 9 }];
    const outlets = rawOut.map((o) => (typeof o === 'number' ? o : o.x));
    const southSegs = segs.filter((s) => s.kind !== 'cob' && (s.th0 < 90 || s.th1 > 270));
    const downpipes = southSegs.map((s) => {
      const mid = (s.th0 + s.th1) / 2;
      const p = polar(mid, 5.0);
      const e0 = polar(s.th0, 5.0), e1 = polar(s.th1, 5.0);
      const nearest = outlets.map((ox) => {
        const edgeClear = Math.min(Math.abs(ox - e0.x), Math.abs(ox - e1.x));
        return { x: ox, clearMm: Math.round(edgeClear * 1000) };
      });
      nearest.sort((a, b) => a.clearMm - b.clearMm);
      return { no: s.no, kind: s.kind, midX: +p.x.toFixed(3), nearest: nearest[0] };
    });
    // Kitchen window 15: window 1 200–2 300, rail top 1 185 (rev h; B-15 1 260/2 360 was wrong).
    const kit = {
      check: 'Kitchen window 15 sill / head',
      sillMm: Math.round(K_SILL * 1000),
      railTopMm: Math.round(K_RAIL_TOP * 1000),
      headMm: Math.round(K_HEAD * 1000),
      unit: [900, 1100],
      apronMm: Math.round((K_SILL - 0.900) * 1000),
      note: 'Rev h: window 1 200–2 300, rail top 1 185 (85 mm above the 1 100 shelf). The 2 360 on B-15 (rev g) was wrong. Counter 900 high, 600 deep ASSUMED; 300 mm apron under the sill.'
    };
    let usCount = 0;
    houseGroup.traverse((m) => { if (m.userData && m.userData.usStud) usCount++; });
    // Wall-to-ceiling close-up (Tom, v1q). Heights at a few sample stations.
    function wallGap(name, zWorld, afterTop, note) {
      const soff = tngSoffitFFL(-zWorld);
      return {
        name,
        soffitMm: Math.round(soff * 1000),
        afterTopMm: Math.round(afterTop * 1000),
        afterGapMm: Math.round((soff - afterTop) * 1000),
        note: note || undefined
      };
    }
    const iwPostZ = wz(0.0274), iwMidZ = wz(mm((G.innerWall && G.innerWall.cy) ? G.innerWall.cy + 0 : -1478)), iwEsZ = wz(-3588);
    // Mid-arc from rev j: y = −1 478 (node 3 / documented mid 3 288).
    const midArcZ = wz(-1.7617); // rev j mid-arc, T&G 3 288
    const wallGaps = {
      note: 'Rev j: every wall closes to the T&G (1 mm shy) or, at the centre post, to the x = 0 beam soffit. v1q sampled the inner wall at the house centre (3 502 vs T&G 3 504); the wall is not there. Rev j heights: 3 507 / 3 288 / 3 063 at the centre post / mid-arc / IW-ES. Utility T&G tight (rev h 10 mm shadow gap dropped; v1q used 2 mm). Under the x = ±5 beams, ring studs and plates stop 20 mm under the beam soffit with a 100 × 50 under-beam plate. Exterior lime render + limewash is one colour on every outside wall.',
      innerCentrePost: {
        name: 'Inner wall at the centre post',
        tngMm: Math.round(tngSoffitFFL(0.0274) * 1000), // 3507
        beamSoffitMm: Math.round(soffitFFL(0.0274) * 1000), // ~3284
        afterTopMm: Math.round((soffitFFL(0.0274) - 0.001) * 1000),
        revjTngMm: 3507, revjBeamSoffitMm: 3284,
        note: 'Closes to the x = 0 beam soffit, not the T&G (the beam hangs ~220 mm below the T&G).'
      },
      innerMidArc: wallGap('Inner wall mid-arc', midArcZ, ceilingCloseAFF(midArcZ), 'Rev j T&G 3 288'),
      innerIWES: wallGap('Inner wall at IW-ES', wz(-3.588), ceilingCloseAFF(wz(-3.588)), 'Rev j T&G 3 063; IW-ES post 100 × 100 × ~2 933 (sole top 70 to the closing plate)'),
      p1: wallGap('P1 bed-area north wall', wz(0.01515), ceilingCloseAFF(wz(0.01515)), 'Rev j T&G 3 506, level; length 2.17 m'),
      p2: wallGap('P2 bathroom partition mid', wz(-1.409), ceilingCloseAFF(wz(-1.409)), 'Rev j T&G 3 506 → 3 156, mid 3 331 (v1q sampled y ≈ −2.0 m / 3 258)'),
      p3: wallGap('P3 shower/closet wall', wz(0.0909), ceilingCloseAFF(wz(0.0909)), 'Rev j T&G 3 515; length 1.62 m'),
      houseSouthInner: wallGap('House south ring (upper closing to cover−20, except under the S beam)', 4.875, coverFFL(-4.875) - 0.020),
      houseNorthInner: wallGap('House north ring (upper closing to cover−20)', -4.875, coverFFL(4.875) - 0.020),
      kitchenShelf: { name: 'Kitchen straight wall (1 100 worktop — not raised)', topMm: 1100, note: 'Worktop, not a room divider.' },
      utilityEast: {
        name: 'Utility E installation wall (rev i / j)',
        outerFace: 'CL+125, lime render + limewash, same colour as every outside wall',
        plyFace: 'CL−97',
        top: 'upper closing to the x = +9 beam soffit − 20 mm; T&G tight to the ply (1 mm)'
      },
      underEWBeams: {
        name: 'Ring wall under the x = ±5 beams',
        note: 'US 81.5 / 95.1 / 264.9 / 278.5° and UT-08/09/20/21 stop 20 mm under the beam soffit; 100 × 50 under-beam plate; 50 × 50 packers and skin up to the panels at the beam faces.'
      }
    };
    return {
      window1SashVsSBrace: w1Sash,
      hwLiningVsNBrace: hwLining,
      closetVsWindow1: closetVsW1,
      curtain,
      utilityDoor: utilDoor,
      geyserToSolar: geyserDist,
      downpipes,
      kitchenWindow15: kit,
      usStuds: usCount,
      wallGaps,
      solarClearInFrontM: 1.0,
      kitchenWall: { frontR: 4.70, length: mm(G.kitchenWall.chord), height: 1.100, counterD: 0.600, counterDAssumed: true, counterH: 0.900 },
      items10and12: {
        item10: 'Text clean-up only (Option A leftover wording in the plan). Not modelled.',
        item12: 'Central beam: C24-graded pine at the same section is fine; no round or ungraded poles. Label only; no geometry change.'
      }
    };
  })();

  finalizeViewLayers();
  applyViewModes();


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

  // S inside brace: 1 999 mm, accepted by Roundhouse as 2.00 m (within tolerance).
  const sInside = indoorLow.find((r) => r.brace.post === 'S ring' && r.brace.dir === 'N-S' && r.brace.side === 1)
    || indoorLow.find((r) => r.brace.post === 'S ring')
    || (function () {
      const m = braceMeshes.find((mm) => {
        const b = mm.userData.brace;
        return b && b.post === 'S ring' && b.dir === 'N-S' && b.side === 1;
      });
      return m ? { mesh: m, brace: m.userData.brace, under: m.userData.underside, midX: m.position.x, midZ: m.position.z } : null;
    })();
  const accepted = [];
  if (sInside) {
    accepted.push({
      id: 's-brace',
      title: 'S inside brace',
      detail: `S inside brace ${fmtMm(sInside.under)} mm, accepted as 2.00 m (within tolerance)`,
      under: sInside.under
    });
  }
  indoorLow.forEach((r) => {
    if (sInside && r.mesh === sInside.mesh) return;
    highlight(r.mesh, materials.clash);
    computedClashes.push({
      id: `indoor-brace-${r.brace.post}`,
      severity: 'red',
      title: `${r.brace.post} brace`,
      detail: `Underside ${fmtMm(r.under)} mm, below the 2.0 m indoor headroom limit.`,
      under: r.under
    });
  });

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
    eaves: { south: coverFFL(eaveS), north: coverFFL(eaveN), seGap, neGap },
    eaveAngles: (function () {
      const angs = braceMeshes.filter((m) => m.userData.angle).map((m) => m.userData.angle);
      const clearPanel = angs.every((a) => a.top < a.purlinTop - 0.02);
      const clearPurlin = angs.every((a) => a.top <= a.purlinSof + 0.090 + 1e-6);
      return {
        count: angs.length,
        size: 'approx. 90x90x65 (size approx.)',
        maxTop: angs.length ? Math.max(...angs.map((a) => a.top)) : null,
        minClearToPanel: angs.length ? Math.min(...angs.map((a) => a.purlinTop - a.top)) : null,
        clashPanel: !clearPanel,
        clashPurlin: false,
        note: 'Angles sit on the inner eave-purlin face, 90 mm up from the soffit (110 mm below the purlin top / panels).'
      };
    })()
  };
  if (Object.values(outdoorAccepted).length) {
    const items = Object.values(outdoorAccepted).sort((a, b) => a.under - b.under);
    const mmList = items.map((it) => `${it.post} ${fmtMm(it.under)} mm`).join('; ');
    accepted.push({
      id: 'outdoor-corners',
      title: 'Outdoor walkway headroom',
      detail: `Outdoor SW / SE / SE-ext N–S braces at ${fmtMm(items[0].under)} mm, accepted (not a drawn clash). ${mmList}.`,
      under: items[0].under
    });
  }
  computedClashes.accepted = accepted;

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
  const angSample = braceMeshes.find((m) => m.userData.angle && m.userData.brace && m.userData.brace.post === 'SE corner' && m.userData.brace.side === 1);
  if (angSample && angSample.userData.angle) {
    const a = angSample.userData.angle;
    addHud('approx. 90x90x65 (size approx.)', a.x, a.y - 0.14, a.z + (a.z > 0 ? -0.38 : 0.38), ['heights']);
  }
  // Per-beam soffits are identical at a given northing (x = -5, 0, +5, +9).
  addHud(`East beam soffit S ${fmtMm(soffitFFL(-5))} mm`, 9.0, soffitFFL(-5) + 0.04, 5.05, ['heights']);
  addHud(`East beam soffit centre ${fmtMm(soffitFFL(0))} mm`, 9.0, soffitFFL(0) + 0.04, 0, ['heights']);
  addHud(`East beam soffit N ${fmtMm(soffitFFL(5))} mm`, 9.0, soffitFFL(5) + 0.04, -5.05, ['heights']);
  if (sInside) {
    addHud(`S inside brace underside ${fmtMm(sInside.under)} mm`, 0.85, sInside.under + 0.04, 4.35, ['heights']);
  }
  if (ewUnder != null) {
    addHud(`E/W brace underside ${fmtMm(ewUnder)} mm`, -4.45, ewUnder + 0.04, -0.85, ['heights']);
    addHud(`E brace underside ${fmtMm(ewUnder)} mm`, 4.65, ewUnder + 0.04, 0.35, ['heights']);
  }
  const nBrace = braceMeshes.find((m) => m.userData.brace && m.userData.brace.post === 'N ring' && m.userData.brace.dir === 'N-S');
  if (nBrace) addHud(`N brace underside ${fmtMm(nBrace.userData.underside)} mm`, 0.5, nBrace.userData.underside + 0.04, -4.4, ['heights']);
  addHud('Sill 400 / head 2 300 mm', -4.2, 2.35, 1.5, ['heights']);
  addHud('Kitchen sill 1 200 mm (assumed)', 1.15, 1.22, -4.45, ['heights']);
  addHud('Kitchen sill rail top 1 185 mm', 1.15, 1.185, -4.55, ['heights']);
  addHud('Counter 900 mm (confirmed)', 0.70, 0.90, -3.25, ['heights']);
  addHud('300 mm wall above the counter', -0.35, 1.05, -4.15, ['heights']);
  addHud('Kitchen window 900 × 1 100 (assumed), top 2 300 mm', 0.55, 1.75, -4.55, ['heights']);
  addHud('15 mm fit gap (shims + sill tape, intended)', -3.55, 0.40, 3.55, ['heights']);
  addHud('Wall 250 mm — 150 frame + 50+50 cob/plaster', 0.2, 1.35, 5.35, ['heights']);
  addHud('Section: 50 cob + 150 frame + 50 cob', 0.42, 1.55, 5.12, ['heights']);
  addHud('200 mm post; cob skin stops, timber exposed', 0.08, 1.22, 5.28, ['heights']);
  addHud('Window frame 70 mm in the 150 mm frame', -3.4, 1.55, 3.6, ['heights']);
  addHud('Inner wall 200 mm × 2 355 mm (unconfirmed)', -0.15, 1.35, 2.05, ['heights']);
  addHud('Upper closing 250 mm sandwich (unconfirmed)', 0.55, 2.85, 5.20, ['heights']);
  addHud('T&G soffit S inner 2 905 mm', 0.35, 2.95, 4.55, ['heights']);
  addHud('T&G soffit centre 3 504 mm', -1.05, 3.55, 0.25, ['heights']);
  addHud('T&G soffit N wall 4 118 mm', 0.35, 4.16, -5.05, ['heights']);
  addHud('Door head 2 375 mm', -5.3, 2.40, -0.3, ['heights']);
  addHud('Head plate top 2 475 mm', -5.3, 2.55, -0.9, ['heights']);
  addHud(`Utility plate ${fmtMm(plateTop)} mm`, 6.6, 2.50, 1.15, ['heights']);
  addHud(`SE gap ${fmtMm(seGap)} mm`, 9.55, plateTop + seGap / 2, 2.6, ['heights']);
  addHud(`East beam soffit SE ${fmtMm(seSoffit)} mm`, 8.2, seSoffit + 0.08, 1.85, ['heights']);
  addHud(`NE gap ${fmtMm(neGap)} mm`, 9.4, plateTop + neGap / 2, 0.2, ['heights']);
  addHud('FFL ±0', 1.5, 0.15, 0, ['heights']);
  addHud('Plinth top 220 mm', 3.2, 0.35, -3.2, ['heights']);
  if (outdoorFlag.length) {
    const sample = outdoorFlag.reduce((a, b) => a.under < b.under ? a : b);
    addHud(`Outdoor brace underside ${fmtMm(sample.under)} mm`, sample.midX + 0.4, sample.under + 0.05, sample.midZ + 0.4, ['heights']);
  }
  furnishingLabels.forEach((l) => addHud(l.text, l.x, l.y, l.z, l.groups));

  fillClashPanel();
}

function fillClashPanel() {
  const list = document.getElementById('clashList');
  const presets = document.getElementById('presets');
  const acceptedList = document.getElementById('acceptedList');
  if (!list || !presets) return;
  list.innerHTML = '';
  presets.innerHTML = '';
  const open = computedClashes || [];
  if (!open.length) {
    const li = document.createElement('li');
    li.className = 'none';
    li.textContent = 'None.';
    list.appendChild(li);
  }
  open.forEach((c) => {
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
  if (acceptedList) {
    acceptedList.innerHTML = '';
    (computedClashes.accepted || []).forEach((c) => {
      const li = document.createElement('li');
      li.textContent = c.detail;
      acceptedList.appendChild(li);
    });
    const wrap = document.getElementById('acceptedWrap');
    if (wrap) wrap.hidden = !(computedClashes.accepted || []).length;
  }
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
    if (c.doorKind) { const dd = doors.find((d) => d.kind === c.doorKind); if (dd && dd.open) continue; }
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
  // shed walls are AABBs (v1y)
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
  activeView = null;
  document.querySelectorAll('#views button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  if (headroomPlane) headroomPlane.visible = id === 's-brace';
  if (headroomOutdoor) headroomOutdoor.visible = id === 'outdoor-corners';
  document.querySelectorAll('#presets button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.clash === id));
  });
  syncHudLabels();
  if (view.walk) {
    applyWalkViewpoint(view);
    return;
  }
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

function setView(name, instant) {
  const view = VIEW_CAMS[name];
  if (!view) return;
  activeView = name;
  activeClash = null;
  if (headroomPlane) headroomPlane.visible = false;
  if (headroomOutdoor) headroomOutdoor.visible = false;
  document.querySelectorAll('#presets button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  document.querySelectorAll('#views button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.view === name));
  });
  syncHudLabels();
  if (view.walk) {
    applyWalkViewpoint(view);
    return;
  }
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
    snapLook(0.16, -0.12);
  } else if (name === 'bathroom') {
    player.set(-1.55, EYE, -0.85);
    snapLook(2.15, -0.05);
  } else {
    player.set(WALK_START.x, EYE, WALK_START.z);
    snapLook(WALK_START.yaw, WALK_START.pitch);
  }
  moveVX = moveVZ = 0;
  collide(player);
  snapWalkHeight();
}

function applyWalkViewpoint(view) {
  setMode('walk', { keepPlayer: true });
  setSeated(!!view.sit, { snap: true });
  const w = view.walk || view.cam;
  player.set(w.x, 0, w.z);
  snapLook(w.yaw != null ? w.yaw : 0, w.pitch != null ? w.pitch : 0);
  moveVX = moveVZ = 0;
  collide(player);
  // Seated viewpoints stay on the furniture (the couch AABB would otherwise push the camera off the seat).
  if (view.sit) { player.x = w.x; player.z = w.z; }
  snapWalkHeight();
}

function syncHudLabels() {
  const root = document.getElementById('hudLabels');
  if (!root) return;
  root.innerHTML = '';
  hudLabels.forEach((l) => {
    const show = (activeClash && l.groups.includes(activeClash))
      || (heightsOn && l.groups.includes('heights'))
      || (activeView && l.groups.includes(activeView));
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
    if (!opts.keepPlayer) {
      player.set(WALK_START.x, FFL_Y, WALK_START.z);
      snapLook(WALK_START.yaw, WALK_START.pitch);
      setSeated(false, { snap: false });
      moveVX = moveVZ = 0;
      collide(player);
      snapWalkHeight();
    }
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
      ? (lookMode === 'joystick'
        ? 'Walk: move with the joystick; hold and lean to look. Stand/Sit for eye height. Tap a door to open it.'
        : 'Walk: use the joystick to move, drag to look. Stand/Sit for eye height. Tap a door to open it.')
      : 'Walk: WASD to move, click the view and move the mouse to look. Stand/Sit sets eye height (1.75 m / 1.15 m). Going out a door steps down 180 mm to grade. Tap a door to open it.');
}

function isTouch() {
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
function damp(current, target, dt, tau) {
  const k = 1 - Math.exp(-dt / Math.max(1e-4, tau));
  return current + (target - current) * k;
}
function dampAngle(current, target, dt, tau) {
  return current + wrapAngle(target - current) * (1 - Math.exp(-dt / Math.max(1e-4, tau)));
}
function clampPitch(p) {
  return Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, p));
}
function snapLook(y, p) {
  yawTarget = wrapAngle(y);
  pitchTarget = clampPitch(p);
  yaw = yawTarget;
  pitch = pitchTarget;
}
function clampDelta(dx, dy, maxPx) {
  const m = Math.hypot(dx, dy);
  if (m > maxPx && m > 0) {
    const s = maxPx / m;
    return { dx: dx * s, dy: dy * s };
  }
  return { dx, dy };
}
function applyLookDelta(dx, dy, kind) {
  // Finger/drag left → view turns left (yaw−, toward −X when facing north);
  // right → turns right; up → look up (pitch+, world +Y); down → look down.
  // Signs verified against camera.getWorldDirection() (v1w). Pointer-lock mouse
  // is standard FPS (mouse right looks right, mouse up looks up).
  const scale = (kind === 'touch' ? LOOK_SENS_TOUCH : LOOK_SENS_MOUSE) * lookSens;
  yawTarget = wrapAngle(yawTarget + dx * scale);
  pitchTarget = clampPitch(pitchTarget - dy * scale);
}

function lookJoyRates() {
  if (!lookJoy.active) return { yawRate: 0, pitchRate: 0, dx: 0, dy: 0, dist: 0, t: 0 };
  const dx = lookJoy.x - lookJoy.ax;
  const dy = lookJoy.y - lookJoy.ay;
  const dist = Math.hypot(dx, dy);
  if (dist <= LOOK_JOY_DEAD_PX) return { yawRate: 0, pitchRate: 0, dx, dy, dist, t: 0 };
  const t = Math.min(1, (dist - LOOK_JOY_DEAD_PX) / Math.max(1, LOOK_JOY_RANGE_PX - LOOK_JOY_DEAD_PX));
  const ux = dx / dist, uy = dy / dist;
  return {
    yawRate: ux * t * LOOK_JOY_YAW_MAX * lookSens,          // right offset → turn right
    pitchRate: -uy * t * LOOK_JOY_PITCH_MAX * lookSens,     // up (negative screen y) → look up
    dx, dy, dist, t
  };
}

function applyLookJoy(dt) {
  if (!lookJoy.active) return;
  const r = lookJoyRates();
  if (r.yawRate === 0 && r.pitchRate === 0) return;
  yawTarget = wrapAngle(yawTarget + r.yawRate * dt);
  pitchTarget = clampPitch(pitchTarget + r.pitchRate * dt);
}

function endLook() {
  lookJoy.active = false;
  lookJoy.pointerId = null;
  looking = false;
  lookPtr = null;
}

function loadLookMode() {
  try {
    const raw = localStorage.getItem(LOOK_MODE_KEY);
    if (raw === 'joystick' || raw === 'drag') return raw;
  } catch (err) { /* private mode */ }
  return isTouch() ? 'joystick' : 'drag';
}

function persistLookMode(v) {
  try { localStorage.setItem(LOOK_MODE_KEY, v); } catch (err) { /* ignore */ }
}

function syncLookModeUI() {
  const bJ = document.getElementById('btnLookJoy');
  const bD = document.getElementById('btnLookDrag');
  if (bJ) bJ.setAttribute('aria-pressed', String(lookMode === 'joystick'));
  if (bD) bD.setAttribute('aria-pressed', String(lookMode === 'drag'));
}

function setLookMode(next, { persist = true, syncUi = true } = {}) {
  lookMode = (next === 'joystick') ? 'joystick' : 'drag';
  if (lookMode === 'drag') endLook();
  if (persist) persistLookMode(lookMode);
  if (syncUi) syncLookModeUI();
  syncHudLabels();
  return lookMode;
}

function setLookJoyOffset(dx, dy, origin) {
  const ax = (origin && origin.x != null) ? origin.x : 200;
  const ay = (origin && origin.y != null) ? origin.y : 400;
  lookJoy.active = true;
  lookJoy.pointerId = -1;
  lookJoy.ax = ax;
  lookJoy.ay = ay;
  lookJoy.x = ax + dx;
  lookJoy.y = ay + dy;
  return lookJoyRates();
}
function loadLookSens() {
  try {
    const raw = localStorage.getItem(LOOK_SENS_KEY);
    const n = raw == null ? LOOK_SENS_DEFAULT : parseFloat(raw);
    if (Number.isFinite(n)) return Math.max(LOOK_SENS_MIN, Math.min(LOOK_SENS_MAX, n));
  } catch (err) { /* private mode */ }
  return LOOK_SENS_DEFAULT;
}
function persistLookSens(v) {
  try { localStorage.setItem(LOOK_SENS_KEY, String(v)); } catch (err) { /* ignore */ }
}
function setLookSensitivity(v, { persist = true, syncUi = true } = {}) {
  const n = Math.max(LOOK_SENS_MIN, Math.min(LOOK_SENS_MAX, Number(v)));
  lookSens = Number.isFinite(n) ? n : LOOK_SENS_DEFAULT;
  if (persist) persistLookSens(lookSens);
  if (syncUi) {
    const sl = document.getElementById('lookSensSlider');
    const lab = document.getElementById('lookSensVal');
    if (sl) sl.value = String(lookSens);
    if (lab) {
      const r = Math.round(lookSens * 20) / 20;
      lab.textContent = r.toFixed((r * 10) % 1 === 0 ? 1 : 2) + '×';
    }
  }
  return lookSens;
}


function floorTargetAt(x, z) {
  const rIn = 4.875, rPlOut = 5.200; // wall inner face; plinth outer (R ± 0.200)
  const u = colliders.find((c) => c.type === 'utility');
  if (u) {
    if (x > u.ix0 && x < u.ix1 && z > u.iz0 && z < u.iz1 && Math.hypot(x, z) > 4.875) return FFL_Y;
    const uDoor = doors.find((d) => d.kind === 'utility');
    if (uDoor && uDoor.open && z >= u.doorZ0 && z <= u.doorZ1 && x > u.doorX - 0.2 && x < u.doorX + 0.6) {
      const tt = Math.max(0, Math.min(1, (x - (u.doorX - 0.05)) / 0.50));
      return FFL_Y + (GRADE_Y - FFL_Y) * tt * tt * (3 - 2 * tt);
    }
  }
  const rho = Math.hypot(x, z);
  const ring = colliders.find((c) => c.type === 'ring');
  let inDoor = false;
  if (ring) {
    const th = thetaOf(x, z);
    for (const op of ring.openings) {
      const door = doors.find((d) => d.kind === op.kind);
      if (!door || !door.open) continue;
      let a0 = op.a0, a1 = op.a1, tt = th;
      if (a1 < a0) a1 += 360;
      if (tt < a0) tt += 360;
      if (tt >= a0 && tt <= a1) { inDoor = true; break; }
    }
  }
  if (inDoor) {
    const tt = Math.max(0, Math.min(1, (rho - rIn) / Math.max(0.05, rPlOut - rIn)));
    const s = tt * tt * (3 - 2 * tt);
    return FFL_Y + (GRADE_Y - FFL_Y) * s;
  }
  if (rho <= rIn) return FFL_Y;
  return GRADE_Y;
}

function snapWalkHeight() {
  floorY = floorTargetAt(player.x, player.z);
  eyeOffset = seated ? EYE_SIT : EYE_STAND;
  player.y = floorY + eyeOffset;
}

function syncPostureUI() {
  const bStand = document.getElementById('btnStand');
  const bSit = document.getElementById('btnSit');
  if (bStand) bStand.setAttribute('aria-pressed', String(!seated));
  if (bSit) bSit.setAttribute('aria-pressed', String(seated));
}

function setSeated(on, { snap = false } = {}) {
  seated = !!on;
  if (snap) snapWalkHeight();
  syncPostureUI();
  return seated;
}

function updateWalk(dt) {
  applyLookJoy(dt);
  yaw = dampAngle(yaw, yawTarget, dt, LOOK_TAU);
  pitch = damp(pitch, pitchTarget, dt, LOOK_TAU);

  let mx = 0, mz = 0;
  if (keys['KeyW'] || keys['ArrowUp']) mz += 1;
  if (keys['KeyS'] || keys['ArrowDown']) mz -= 1;
  if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
  if (joy.active) { mx += joy.x; mz += -joy.y; } // joystick y up is forward
  const len = Math.hypot(mx, mz);
  if (len > 1) { mx /= len; mz /= len; }
  const speed = WALK_SPEED * (keys['ShiftLeft'] ? 1.6 : 1);
  // yaw 0 looks north (−Z). Forward is (sin yaw, −cos yaw) in x-z
  const fx = Math.sin(yaw), fz = -Math.cos(yaw);
  const rx = Math.sin(yaw + Math.PI / 2), rz = -Math.cos(yaw + Math.PI / 2);
  const desireX = (len > 0.04) ? (fx * mz + rx * mx) * speed : 0;
  const desireZ = (len > 0.04) ? (fz * mz + rz * mx) * speed : 0;
  const k = 1 - Math.exp(-dt / MOVE_TAU);
  moveVX += (desireX - moveVX) * k;
  moveVZ += (desireZ - moveVZ) * k;
  if (Math.hypot(moveVX, moveVZ) > 0.0008) {
    player.x += moveVX * dt;
    player.z += moveVZ * dt;
    collide(player);
  } else {
    moveVX = 0;
    moveVZ = 0;
  }
  const ft = floorTargetAt(player.x, player.z);
  const et = seated ? EYE_SIT : EYE_STAND;
  const kf = 1 - Math.exp(-dt / FLOOR_TAU);
  const ke = 1 - Math.exp(-dt / EYE_TAU);
  floorY += (ft - floorY) * kf;
  eyeOffset += (et - eyeOffset) * ke;
  if (Math.abs(floorY - ft) < 0.0005) floorY = ft;
  if (Math.abs(eyeOffset - et) < 0.0005) eyeOffset = et;
  player.y = floorY + eyeOffset;
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
  applyV1yPlan(G);

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
  orbit.dampingFactor = ORBIT_DAMPING;
  orbit.rotateSpeed = ORBIT_ROTATE_SPEED;
  orbit.maxPolarAngle = Math.PI * 0.85; // allow looking up at the ceiling and brace collars
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
  setLookSensitivity(loadLookSens(), { persist: false, syncUi: true });
  setLookMode(loadLookMode(), { persist: false, syncUi: true });
  const btnLookJoy = document.getElementById('btnLookJoy');
  const btnLookDrag = document.getElementById('btnLookDrag');
  if (btnLookJoy) btnLookJoy.addEventListener('click', () => setLookMode('joystick'));
  if (btnLookDrag) btnLookDrag.addEventListener('click', () => setLookMode('drag'));
  const lookSlider = document.getElementById('lookSensSlider');
  if (lookSlider) {
    lookSlider.min = String(LOOK_SENS_MIN);
    lookSlider.max = String(LOOK_SENS_MAX);
    lookSlider.step = '0.05';
    lookSlider.addEventListener('input', () => setLookSensitivity(lookSlider.value));
  }

  document.getElementById('btnOrbit').addEventListener('click', () => setMode('orbit'));
  document.getElementById('btnWalk').addEventListener('click', () => setMode('walk'));
  const btnStand = document.getElementById('btnStand');
  const btnSit = document.getElementById('btnSit');
  if (btnStand) btnStand.addEventListener('click', () => { if (mode !== 'walk') setMode('walk', { keepPlayer: true }); setSeated(false); });
  if (btnSit) btnSit.addEventListener('click', () => { if (mode !== 'walk') setMode('walk', { keepPlayer: true }); setSeated(true); });
  syncPostureUI();
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
  const views = document.getElementById('views');
  if (views) {
    views.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-view]');
      if (btn) setView(btn.dataset.view);
    });
  }
  document.getElementById('btnRoofOff').addEventListener('click', () => {
    setRoofOff(!roofOff);
  });
  document.getElementById('btnStructure').addEventListener('click', () => {
    setStructureOnly(!structureOnly);
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

  // Pointer: click doors / measure; walk look; orbit is handled by OrbitControls.
  // Look-drag (touch and non-locked pointer): ignore the first delta after pointerdown,
  // clamp per-event spikes, and scale in CSS pixels (devicePixelRatio-independent).
  // Joystick look (default on touch): the down point is an anchor; held offset sets a
  // continuous yaw/pitch rate. Look and the move joystick use distinct pointer IDs.
  let downX = 0, downY = 0, downT = 0, lastX = 0, lastY = 0;
  let lookIgnoreNext = false;
  function stopLookGesture() {
    lookIgnoreNext = false;
    endLook();
  }
  canvas.addEventListener('pointerdown', (e) => {
    downX = lastX = e.clientX; downY = lastY = e.clientY; downT = performance.now();
    if (mode !== 'walk' || pointerLocked || inJoy(e)) return;
    if (looking || lookPtr != null) return; // another finger is already looking
    if (joyPtr != null && e.pointerId === joyPtr) return;
    looking = true;
    lookPtr = e.pointerId;
    lookIgnoreNext = true;
    if (lookMode === 'joystick') {
      lookJoy.active = true;
      lookJoy.pointerId = e.pointerId;
      lookJoy.ax = lookJoy.x = e.clientX;
      lookJoy.ay = lookJoy.y = e.clientY;
    }
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* already captured */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (mode === 'walk' && pointerLocked) return; // movement handled by mousemove
    if (!looking || (lookPtr != null && e.pointerId !== lookPtr)) return;
    if (lookMode === 'joystick' && lookJoy.active) {
      lookJoy.x = e.clientX;
      lookJoy.y = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      lookIgnoreNext = false;
      return;
    }
    if (lookIgnoreNext) {
      lookIgnoreNext = false;
      lastX = e.clientX;
      lastY = e.clientY;
      return;
    }
    let dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    const kind = (e.pointerType === 'mouse') ? 'mouse' : 'touch';
    ({ dx, dy } = clampDelta(dx, dy, kind === 'touch' ? LOOK_DELTA_CLAMP_TOUCH : LOOK_DELTA_CLAMP_MOUSE));
    applyLookDelta(dx, dy, kind);
  });
  function onLookUp(e) {
    if (lookPtr != null && e.pointerId !== lookPtr) return;
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    const elapsed = performance.now() - downT;
    stopLookGesture();
    if (moved < 8 && elapsed < 600) {
      if (measureOn) { pickMeasure(e); return; }
      if (pickDoor(e)) return;
      if (mode === 'walk' && !isTouch() && !pointerLocked) {
        canvas.requestPointerLock && canvas.requestPointerLock();
      }
    }
  }
  canvas.addEventListener('pointerup', onLookUp);
  canvas.addEventListener('pointercancel', (e) => {
    if (lookPtr != null && e.pointerId !== lookPtr) return;
    stopLookGesture();
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
    if (pointerLocked) stopLookGesture();
  });
  document.addEventListener('mousemove', (e) => {
    if (!pointerLocked || mode !== 'walk') return;
    let dx = e.movementX, dy = e.movementY;
    ({ dx, dy } = clampDelta(dx, dy, LOOK_DELTA_CLAMP_MOUSE));
    applyLookDelta(dx, dy, 'mouse');
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
    try { joyEl.setPointerCapture(e.pointerId); } catch (err) { /* synthetic / already captured */ }
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
  snapDoors(open = true, kind = null) {
    doors.forEach((d) => {
      if (kind && d.kind !== kind) return;
      d.open = !!open;
      const target = d.open ? (90 * DEG) : 0;
      d.leaves.forEach((leaf) => {
        leaf.target = target;
        leaf.angle = target * (leaf.sign || 1);
        leaf.pivot.rotation.y = leaf.angle;
      });
    });
  },
  getDoors: () => doors.map((d) => ({
    name: d.name, kind: d.kind, open: d.open, inward: !!d.inward, clearW: d.clearW,
    leaves: d.leaves.map((leaf) => {
      const corners = [];
      const halfD = (0.070 / 2);
      const pts = [[0, 0], [leaf.dir * leaf.w, 0], [leaf.dir * leaf.w, halfD], [leaf.dir * leaf.w, -halfD], [0, halfD], [0, -halfD]];
      pts.forEach(([lx, lz]) => {
        const v = new THREE.Vector3(lx, 0.05, lz);
        leaf.pivot.localToWorld(v);
        corners.push({ x: v.x, y: v.y, z: v.z, rho: Math.hypot(v.x, v.z) });
      });
      return { w: leaf.w, sign: leaf.sign, dir: leaf.dir, angle: leaf.angle, corners };
    })
  })),
  getPlayer: () => ({x: player.x, y: player.y, z: player.z, yaw, pitch, yawTarget, pitchTarget, vx: moveVX, vz: moveVZ}),
  setPlayer(x,z,y=null, yawi=null, pitchi=null) {
    player.set(x, y != null ? y : FFL_Y, z);
    if (yawi != null || pitchi != null) snapLook(yawi != null ? yawi : yaw, pitchi != null ? pitchi : pitch);
    moveVX = moveVZ = 0;
    collide(player);
    if (y != null) {
      floorY = floorTargetAt(player.x, player.z);
      eyeOffset = y - floorY;
      player.y = y;
    } else {
      snapWalkHeight();
    }
  },
  setSeated,
  getWalkState: () => ({
    seated, eyeOffset, floorY,
    eyeStand: EYE_STAND, eyeSit: EYE_SIT,
    floorTarget: floorTargetAt(player.x, player.z),
    gradeY: GRADE_Y, fflY: FFL_Y
  }),
  version: APP_VERSION,
  getLookDir: () => {
    const d = new THREE.Vector3();
    if (camera) camera.getWorldDirection(d);
    return { x: d.x, y: d.y, z: d.z, yaw, pitch, yawTarget, pitchTarget };
  },
  getLookSettings: () => ({
    version: APP_VERSION,
    sensitivity: lookSens,
    lookSensMouse: LOOK_SENS_MOUSE,
    lookSensTouch: LOOK_SENS_TOUCH,
    lookTau: LOOK_TAU,
    moveTau: MOVE_TAU,
    pitchLimitDeg: 80,
    lookMode,
    lookJoyDeadPx: LOOK_JOY_DEAD_PX,
    lookJoyRangePx: LOOK_JOY_RANGE_PX,
    lookJoyYawMaxDeg: LOOK_JOY_YAW_MAX * 180 / Math.PI,
    lookJoyPitchMaxDeg: LOOK_JOY_PITCH_MAX * 180 / Math.PI,
    lookJoy: { ...lookJoy, ...lookJoyRates() },
    orbitRotateSpeed: (orbit && orbit.rotateSpeed) || ORBIT_ROTATE_SPEED,
    orbitDamping: (orbit && orbit.dampingFactor) || ORBIT_DAMPING,
    orbitDampingEnabled: !!(orbit && orbit.enableDamping)
  }),
  setLookSensitivity,
  setLookMode,
  setLookJoyOffset,
  releaseLookJoy: endLook,
  applyLookDelta,
  step(dt) {
    const d = Math.max(0, Math.min(0.05, Number(dt) || 0));
    if (d && mode === 'walk') updateWalk(d);
    else if (d && mode === 'orbit' && orbit) orbit.update();
  },
  setRoofOff,
  setStructureOnly,
  getViewModes: () => ({ roofOff, structureOnly }),
  setOrbit(x,y,z, tx=2, ty=1.6, tz=0, minD) {
    if (mode !== 'orbit') setMode('orbit', { keepCamera: true });
    fly = null;
    if (minD != null && orbit) orbit.minDistance = minD;
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
  scanBeyondRoof(tol = 0.005) {
    // Meshes whose world bounds pass the roof edge (structure must not; gutter/drip/doors excepted).
    const x0 = mm(G.roof.x0) - tol, x1 = mm(G.roof.x1) + tol, z0 = -mm(G.roof.y1) - tol, z1 = -mm(G.roof.y0) + tol;
    const out = [];
    const b = new THREE.Box3();
    houseGroup.updateMatrixWorld(true);
    houseGroup.traverse((m) => {
      if (!m.isMesh || !m.visible) return;
      let o = m, skip = false;
      while (o) { if (o.name === 'southGutter' || (o.userData && (o.userData.tap || o.userData.role))) skip = true; o = o.parent; }
      if (skip || doors.some((d) => d.leaves.some((l) => { let q = m; while (q) { if (q === l.pivot) return true; q = q.parent; } return false; }))) return;
      b.setFromObject(m);
      if (b.max.y < GRADE_Y + 0.101 && b.min.y < GRADE_Y + 0.05) return; // ground-level slabs / strip
      const over = Math.max(x0 - b.min.x, b.max.x - x1, z0 - b.min.z, b.max.z - z1);
      if (over > 0) out.push({ over: +over.toFixed(3), layer: m.userData.viewLayer || '', member: m.userData.member || '',
        min: [b.min.x, b.min.y, b.min.z].map((v) => +v.toFixed(2)), max: [b.max.x, b.max.y, b.max.z].map((v) => +v.toFixed(2)) });
    });
    return out.sort((a, c) => c.over - a.over);
  },
  roofRaise: () => ROOF_RAISE,
  gutterSpec: () => gutterSpec,
  setWalkView,
  setView,
  activeClash: () => activeClash,
  activeView: () => activeView,
  doors: () => doors.map((d) => d.name),
  interior: () => window.__interior,
  revgChecks: () => (computedClashes && computedClashes.revg) || null,
  meshesNear(x, z, r = 1.2) {
    const hits = [];
    houseGroup.traverse((m) => {
      if (!m.isMesh) return;
      const p = new THREE.Vector3();
      m.getWorldPosition(p);
      if (Math.hypot(p.x - x, p.z - z) > r) return;
      const box = new THREE.Box3().setFromObject(m);
      const sz = box.getSize(new THREE.Vector3());
      hits.push({
        layer: m.userData.viewLayer, member: m.userData.member, role: m.userData.role,
        x: +p.x.toFixed(3), y: +p.y.toFixed(3), z: +p.z.toFixed(3),
        sx: +sz.x.toFixed(3), sy: +sz.y.toFixed(3), sz: +sz.z.toFixed(3)
      });
    });
    return hits.sort((a, b) => a.z - b.z);
  },
  personGaps() {
    const it = window.__interior;
    if (!it) return null;
    const k = it.kitchenPerson;
    const yNorth = -k.z;
    const head = k.height;
    const winHead = 2.300;
    const soffit = soffitFFL(yNorth);
    // nearest brace to the kitchen figure
    let nearest = null;
    houseGroup.traverse((m) => {
      if (!m.userData || !m.userData.brace) return;
      const p = m.position;
      const d = Math.hypot(p.x - k.x, p.z - k.z);
      const under = m.userData.underside;
      if (nearest == null || d < nearest.dist) {
        nearest = {
          post: m.userData.brace.post,
          dir: m.userData.brace.dir,
          dist: d,
          underside: under,
          gap: under - head
        };
      }
    });
    return {
      kitchen: {
        head,
        toWindowHead: winHead - head,
        beamSoffit: soffit,
        toBeamSoffit: soffit - head,
        nearestBrace: nearest
      },
      bathroom: { head: it.bathroomPerson.height, x: it.bathroomPerson.x, z: it.bathroomPerson.z },
      bed: it.bed
    };
  }
};
