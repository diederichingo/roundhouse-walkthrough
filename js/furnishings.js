/**
 * Interior set dressing for the Option B walkthrough (v1q):
 * scale figures, a 1.40 × 2.00 m bed, and a living-room grouping (couch and coffee table only).
 * Pieces are typical sizes for a sense of space, not from the drawings.
 */
import * as THREE from 'three';

const DEG = Math.PI / 180;

function addMesh(parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(parent, sx, sy, sz, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  return addMesh(parent, new THREE.BoxGeometry(sx, sy, sz), mat, x, y, z, rx, ry, rz);
}
function cyl(parent, rTop, rBot, h, mat, x, y, z, rx = 0, ry = 0, rz = 0, segs = 12) {
  return addMesh(parent, new THREE.CylinderGeometry(rTop, rBot, h, segs), mat, x, y, z, rx, ry, rz);
}
function sph(parent, r, mat, x, y, z, sx = 1, sy = 1, sz = 1, segs = 14) {
  const m = addMesh(parent, new THREE.SphereGeometry(r, segs, segs), mat, x, y, z);
  m.scale.set(sx, sy, sz);
  return m;
}

function leopardTexture() {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c49a4a';
  ctx.fillRect(0, 0, s, s);
  // subtle grain
  for (let i = 0; i < 8000; i++) {
    const n = Math.random();
    ctx.fillStyle = n > 0.5 ? 'rgba(90,60,25,0.08)' : 'rgba(230,200,140,0.08)';
    ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * s, y = Math.random() * s;
    const r = 8 + Math.random() * 18;
    ctx.strokeStyle = '#2a1810';
    ctx.lineWidth = 2 + Math.random() * 2.2;
    ctx.lineCap = 'round';
    const spots = 4 + Math.floor(Math.random() * 3);
    for (let k = 0; k < spots; k++) {
      ctx.beginPath();
      const a0 = (k / spots) * Math.PI * 2 + Math.random() * 0.4;
      ctx.arc(x, y, r * (0.85 + Math.random() * 0.25), a0, a0 + 0.55 + Math.random() * 0.5);
      ctx.stroke();
    }
    if (Math.random() > 0.35) {
      ctx.fillStyle = '#2c1a10';
      ctx.beginPath();
      ctx.arc(x + (Math.random() - 0.5) * r * 0.3, y, r * (0.18 + Math.random() * 0.16), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.4);
  tex.anisotropy = 4;
  return tex;
}

function makeMats() {
  const skinA = new THREE.MeshStandardMaterial({ color: 0xd7b399, roughness: 0.62 });
  const skinB = new THREE.MeshStandardMaterial({ color: 0xdeb398, roughness: 0.62 });
  const hairWhite = new THREE.MeshStandardMaterial({ color: 0xefece6, roughness: 0.78 });
  const hairBrown = new THREE.MeshStandardMaterial({ color: 0x4a3324, roughness: 0.72 });
  const red = new THREE.MeshStandardMaterial({ color: 0xa3232c, roughness: 0.58 });
  const leopard = new THREE.MeshStandardMaterial({
    map: leopardTexture(), color: 0xffffff, roughness: 0.62
  });
  const shoeDark = new THREE.MeshStandardMaterial({ color: 0x3a312c, roughness: 0.55 });
  const shoeTan = new THREE.MeshStandardMaterial({ color: 0x6a5140, roughness: 0.58 });
  const fabric = new THREE.MeshStandardMaterial({ color: 0x8e8680, roughness: 0.82 });
  const cushion = new THREE.MeshStandardMaterial({ color: 0x9a928a, roughness: 0.8 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x2a1b16, roughness: 0.48, metalness: 0.04 });
  const walnut = new THREE.MeshStandardMaterial({ color: 0x6a4328, roughness: 0.52 });
  const linen = new THREE.MeshStandardMaterial({ color: 0xe6dfd2, roughness: 0.85 });
  const pillow = new THREE.MeshStandardMaterial({ color: 0xf0ebe3, roughness: 0.8 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a8c8e, roughness: 0.35, metalness: 0.7 });
  return { skinA, skinB, hairWhite, hairBrown, red, leopard, shoeDark, shoeTan, fabric, cushion, leather, walnut, linen, pillow, metal };
}

/**
 * Low-poly standing woman. Local +Z is facing. Feet on y=0.
 * top of head (highest point of hair) is exactly `height` metres.
 */
function addWoman(parent, mats, opts) {
  const {
    height, skin, hair, cloth, shoe,
    slim = true, age = 40, hairStyle = 'bob'
  } = opts;
  const k = height / 1.80;
  const g = new THREE.Group();
  // Head is nearly constant; body scales. Hair cap finishes at `height`.
  const headH = 0.215;
  const hairTop = height;
  const scalp = hairTop - 0.016;
  const chin = scalp - headH;
  const neckH = 0.07 * k + 0.02;
  const shoulderY = chin - neckH;
  const hipY = 0.88 * k;
  const waistY = 1.05 * k;
  const kneeY = 0.48 * k;
  const hemY = 0.50 * k; // just below the knee, modest
  const shoulderW = (slim ? 0.34 : 0.37) * k / k * (slim ? 0.34 : 0.36);
  const hipW = slim ? 0.30 : 0.33;
  const waistW = slim ? 0.24 : 0.27;

  // Shoes + legs (skin below the hem, dress covers the rest)
  for (const s of [-1, 1]) {
    box(g, 0.085, 0.030, 0.22, shoe, s * 0.075, 0.015, 0.02);
    cyl(g, 0.042, 0.048, kneeY - 0.03, skin, s * 0.075, 0.03 + (kneeY - 0.03) / 2, 0.01, 0, 0, 0, 10);
    cyl(g, 0.05, 0.045, hemY - kneeY + 0.02, skin, s * 0.075, (hemY + kneeY) / 2, 0.0, 0, 0, 0, 10);
  }
  // Dress — modest A-line, short sleeves. Skirt and bodice overlap so no waist gap.
  const skirtH = (waistY + 0.08) - hemY;
  cyl(g, waistW * 0.52, hipW * 0.70, skirtH, cloth, 0, hemY + skirtH / 2, 0, 0, 0, 0, 20);
  const bodyH = (shoulderY - 0.02) - (waistY - 0.10);
  cyl(g, shoulderW * 0.40, waistW * 0.52, bodyH, cloth, 0, (shoulderY - 0.02 + waistY - 0.10) / 2, 0.015, 0, 0, 0, 20);
  // short sleeves
  for (const s of [-1, 1]) {
    const sx = s * (shoulderW * 0.50);
    cyl(g, 0.052, 0.056, 0.15, cloth, sx, shoulderY - 0.09, 0.02, 0, 0, s * 0.18, 10);
  }
  // Arms, relaxed at the sides with a slight elbow bend
  for (const s of [-1, 1]) {
    const sx = s * (shoulderW * 0.55);
    const upperLen = 0.28 * (height / 1.70);
    const lowerLen = 0.25 * (height / 1.70);
    const arm = new THREE.Group();
    cyl(arm, 0.038, 0.034, upperLen, skin, 0, -upperLen / 2, 0, 0, 0, 0, 10);
    const fore = cyl(arm, 0.033, 0.030, lowerLen, skin, 0, -upperLen - lowerLen / 2 + 0.01, 0.03, 0.22, 0, 0, 10);
    sph(arm, 0.028, skin, 0, -upperLen - lowerLen + 0.02, 0.05, 1, 0.9, 1.3, 10);
    arm.position.set(sx, shoulderY - 0.04, 0.02);
    arm.rotation.z = s * 0.12;
    arm.rotation.x = 0.08;
    g.add(arm);
  }
  // Neck + head
  cyl(g, 0.045, 0.048, neckH, skin, 0, chin + neckH / 2, 0.01, 0, 0, 0, 12);
  sph(g, headH / 2, skin, 0, chin + headH / 2, 0.02, 0.82, 1, 0.9, 14);

  // Hair
  if (hairStyle === 'bob') {
    // White/short bob: cap over the scalp, slightly fuller at the sides and nape.
    const cap = sph(g, 0.122, hair, 0, scalp - 0.09, 0.01, 1.05, 0.92, 1.12, 14);
    cap.position.y = hairTop - 0.122 * 0.92; // top of scaled sphere = hairTop
    // nape / sides
    sph(g, 0.09, hair, 0, scalp - 0.14, -0.04, 1.15, 0.7, 0.9, 12);
    for (const s of [-1, 1]) sph(g, 0.07, hair, s * 0.09, scalp - 0.12, 0.01, 0.7, 0.85, 1.0, 10);
  } else {
    // Shoulder-length brown hair, 40s, loose — cap plus side/nape locks, no bun.
    const cap = sph(g, 0.118, hair, 0, scalp - 0.08, 0.01, 1.06, 0.92, 1.08, 14);
    cap.position.y = hairTop - 0.118 * 0.92;
    sph(g, 0.09, hair, 0, scalp - 0.14, -0.05, 1.2, 0.75, 0.95, 12);
    for (const s of [-1, 1]) {
      sph(g, 0.06, hair, s * 0.095, scalp - 0.16, 0.0, 0.8, 1.05, 0.9, 10);
      const lock = sph(g, 0.05, hair, s * 0.1, (scalp + shoulderY) / 2 + 0.02, -0.02, 0.65, 1.35, 0.7, 10);
    }
  }
  parent.add(g);
  g.userData.height = height;
  return g;
}

function addCouch(parent, mats, W, D, H) {
  const g = new THREE.Group();
  const seatH = 0.42, seatD = D - 0.14, armW = 0.12, backT = 0.14;
  // base + legs
  box(g, W - 0.04, 0.08, D - 0.06, mats.walnut, 0, 0.12, 0);
  for (const x of [-(W / 2 - 0.08), W / 2 - 0.08]) {
    for (const z of [-(D / 2 - 0.08), D / 2 - 0.08]) {
      cyl(g, 0.025, 0.03, 0.08, mats.walnut, x, 0.04, z, 0, 0, 0, 8);
    }
  }
  // arms
  for (const s of [-1, 1]) {
    box(g, armW, H * 0.55, D - 0.04, mats.fabric, s * (W / 2 - armW / 2), 0.12 + (H * 0.55) / 2, 0);
  }
  // back
  box(g, W - armW * 2, H - seatH, backT, mats.fabric, 0, seatH + (H - seatH) / 2, -(D / 2) + backT / 2);
  // seat and back cushions
  box(g, W - armW * 2 - 0.04, 0.12, seatD - 0.04, mats.cushion, 0, seatH + 0.02, 0.02);
  box(g, (W - armW * 2 - 0.08) / 2, 0.28, 0.10, mats.cushion, -(W / 4 - armW / 2), seatH + 0.22, -(D / 2) + backT + 0.06);
  box(g, (W - armW * 2 - 0.08) / 2, 0.28, 0.10, mats.cushion, (W / 4 - armW / 2), seatH + 0.22, -(D / 2) + backT + 0.06);
  parent.add(g);
  return g;
}

function addCoffeeTable(parent, mats, W, D, H) {
  const g = new THREE.Group();
  box(g, W, 0.036, D, mats.walnut, 0, H - 0.018, 0);
  box(g, W - 0.06, 0.018, D - 0.06, mats.walnut, 0, 0.14, 0);
  for (const x of [-(W / 2 - 0.05), W / 2 - 0.05]) {
    for (const z of [-(D / 2 - 0.05), D / 2 - 0.05]) {
      cyl(g, 0.018, 0.022, H - 0.036, mats.walnut, x, (H - 0.036) / 2, z, 0, 0, 0, 8);
    }
  }
  parent.add(g);
  return g;
}

function aabbCollider(colliders, x0, x1, z0, z1) {
  colliders.push({ type: 'aabb', x0, x1, z0, z1 });
}

export const furnishingLabels = [];

export function furnishInterior(ctx) {
  const { houseGroup, colliders, F, mm, wz } = ctx;
  const addHud = (text, x, y, z, groups) => furnishingLabels.push({ text, x, y, z, groups });
  const mats = makeMats();

  // ——— 1.40 × 2.00 m bed (mattress footprint), ~480 mm high ———
  // Head against the closet (north), east side against the bathroom partition.
  const bedX1 = mm(F.bed[0][0]), bedZ0 = wz(mm(F.bed[0][1]));
  const bedX0 = mm(F.bed[2][0]), bedZ1 = wz(mm(F.bed[2][1]));
  const bedCx = (bedX0 + bedX1) / 2, bedCz = (bedZ0 + bedZ1) / 2;
  const bedW = bedX1 - bedX0, bedL = bedZ1 - bedZ0;
  const BED_H = 0.480;
  // Low timber base + mattress + two pillows at the head (smaller-z / north).
  box(houseGroup, bedW, 0.26, bedL, mats.walnut, bedCx, 0.13, bedCz);
  box(houseGroup, bedW + 0.01, 0.22, bedL + 0.01, mats.linen, bedCx, 0.26 + 0.11, bedCz);
  const pillowZ = bedZ0 + 0.22;
  box(houseGroup, 0.52, 0.14, 0.32, mats.pillow, bedCx - 0.32, BED_H + 0.02, pillowZ);
  box(houseGroup, 0.52, 0.14, 0.32, mats.pillow, bedCx + 0.32, BED_H + 0.02, pillowZ);
  aabbCollider(colliders, bedX0, bedX1, bedZ0, bedZ1);
  addHud('1.40 x 2.00 m', bedCx, BED_H + 0.18, bedCz, ['heights', 'bedroom']);

  // ——— Kitchen figure: woman ~60, 1.80 m, slim, white hair, red dress ———
  // At the hob under window 15, facing north toward the straight kitchen wall.
  const kX = -0.55, kZ = -3.75;
  const kFig = addWoman(houseGroup, mats, {
    height: 1.80, skin: mats.skinA, hair: mats.hairWhite, cloth: mats.red, shoe: mats.shoeDark,
    slim: true, age: 60, hairStyle: 'bob'
  });
  kFig.position.set(kX, 0, kZ);
  kFig.rotation.y = Math.PI; // face −Z (north) toward the hob and window 15
  kFig.userData.role = 'kitchen-person';
  addHud('1.80 m', kX - 0.15, 1.86, kZ + 0.15, ['heights', 'kitchen-person']);

  // ——— Bathroom figure: woman ~40, 1.70 m, brown hair, leopard print ———
  const bX = 3.46, bZ = 1.58;
  const bFig = addWoman(houseGroup, mats, {
    height: 1.70, skin: mats.skinB, hair: mats.hairBrown, cloth: mats.leopard, shoe: mats.shoeTan,
    slim: false, age: 40, hairStyle: 'shoulder'
  });
  bFig.position.set(bX, 0, bZ);
  bFig.rotation.y = Math.PI / 2 + 0.25; // face roughly west, toward the room
  bFig.userData.role = 'bathroom-person';
  addHud('1.70 m', bX + 0.10, 1.76, bZ + 0.18, ['heights', 'bathroom-person']);

  // ——— Living room, SW bay, south of the garden-door path ———
  // Two-seat couch 1600 × 850 × 800 and coffee table 900 × 500 × 400 only. No chairs.
  // Couch 50 mm south so the walkway to the garden doors is 800 mm, and 70 mm west of
  // the first v1h position so the south end stays off the curved wall.
  const couch = addCouch(houseGroup, mats, 1.60, 0.85, 0.80);
  couch.position.set(-1.420, 0, 1.60);
  couch.rotation.y = -Math.PI / 2; // back to +X (curved wall), front to −X (garden)

  const table = addCoffeeTable(houseGroup, mats, 0.90, 0.50, 0.40);
  table.position.set(-2.245, 0, 1.60);
  table.rotation.y = -Math.PI / 2; // 900 along Z, 500 along X

  aabbCollider(colliders, -1.420 - 0.425, -1.420 + 0.425, 1.60 - 0.80, 1.60 + 0.80);
  aabbCollider(colliders, -2.245 - 0.25, -2.245 + 0.25, 1.60 - 0.45, 1.60 + 0.45);

  return {
    kitchenPerson: { x: kX, z: kZ, height: 1.80 },
    bathroomPerson: { x: bX, z: bZ, height: 1.70 },
    bed: { x0: bedX0, x1: bedX1, z0: bedZ0, z1: bedZ1, w: bedW, l: bedL, h: BED_H },
    living: {
      couch: { x: -1.420, z: 1.60, w: 1.60, d: 0.85, h: 0.80, back: -0.995, front: -1.845, north: 0.80 },
      table: { x: -2.245, z: 1.60, w: 0.90, d: 0.50, h: 0.40 }
    }
  };
}

export const VIEW_CAMS = {
  kitchen: {
    label: 'Kitchen (straight wall and high window)',
    cam: { x: 1.45, y: 1.55, z: -2.35, tx: -0.25, ty: 2.45, tz: -4.75 }
  },
  'kitchen-person': {
    label: 'Kitchen with person',
    cam: { x: 1.45, y: 1.55, z: -2.35, tx: -0.25, ty: 2.45, tz: -4.75 }
  },
  'utility-door': {
    label: 'Utility door',
    cam: { x: 5.15, y: 1.60, z: -0.85, tx: 6.51, ty: 1.15, tz: 0.60 }
  },
  'utility-ceiling': {
    label: 'Utility interior / ceiling',
    cam: { x: 7.15, y: 1.55, z: 1.55, tx: 8.15, ty: 2.70, tz: 1.15 }
  },
  'install-wall': {
    label: 'Installation wall from outside',
    cam: { x: 12.80, y: 1.85, z: 4.40, tx: 9.10, ty: 1.55, tz: 1.30 }
  },
  'bathroom-person': {
    label: 'Bathroom with person',
    cam: { x: 3.90, y: 1.60, z: 0.55, tx: 3.30, ty: 0.90, tz: 1.65 }
  },
  living: {
    label: 'Living room',
    cam: { x: -3.90, y: 1.70, z: 0.30, tx: -2.30, ty: 0.40, tz: 1.60 }
  },
  bedroom: {
    label: 'Bedroom',
    cam: { x: -0.15, y: 1.70, z: 1.40, tx: 1.55, ty: 0.40, tz: 1.60 }
  },
  'window-reveal': {
    label: 'Window reveal (kitchen 15)',
    cam: { x: -0.35, y: 1.70, z: -4.15, tx: -0.55, ty: 1.80, tz: -5.05 }
  },
  'post-coverage': {
    label: 'Post coverage',
    cam: { x: 1.15, y: 1.40, z: 5.65, tx: 0.05, ty: 1.15, tz: 5.02 }
  },
  ceiling: {
    label: 'Ceiling',
    cam: { x: 1.20, y: 2.30, z: 3.40, tx: 0.00, ty: 2.92, tz: 4.50 }
  },
  // Standing 1.65 m AFF, 1 m back from the glass, looking out. Numbered as on B-06 (rev g).
  'south-window-1': {
    label: 'South window 1 (from inside)',
    note: 'Bedroom, SSE, east of the S post (bay 1)',
    cam: { x: 0.570, y: 1.65, z: 3.959, tx: 1.141, ty: 1.80, tz: 7.919 }
  },
  'south-window-2': {
    label: 'South window 2 (from inside)',
    note: 'Bedroom, SE (bay 2)',
    cam: { x: 1.655, y: 1.65, z: 3.641, tx: 3.310, ty: 1.80, tz: 7.283 }
  },
  'south-window-24': {
    label: 'South window 24 (living SW, from inside)',
    note: 'Living, SW (bay 24)',
    cam: { x: -2.282, y: 1.65, z: 3.285, tx: -4.565, ty: 1.80, tz: 6.570 }
  },
  'south-window-25': {
    label: 'South window 25 (living SSW, from inside)',
    note: 'Living, SSW, west of the S post (bay 25)',
    cam: { x: -1.301, y: 1.65, z: 3.782, tx: -2.603, ty: 1.80, tz: 7.565 }
  }
};
