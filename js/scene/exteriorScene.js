import * as THREE from 'three';
import { batchStatic, canvasTexture } from './sceneUtils.js';
import { reducedMotion } from './sceneSetup.js';

// ── MATERIALS ──
const M_EXT = {
  road: new THREE.MeshLambertMaterial({ color: 0x25272e }),
  roadStripe: new THREE.MeshLambertMaterial({ color: 0xf5eed7 }),
  sidewalk: new THREE.MeshLambertMaterial({ color: 0xd6d0c5 }),
  curb: new THREE.MeshLambertMaterial({ color: 0x9b958c }),
  grass: new THREE.MeshLambertMaterial({ color: 0x617d43 }),
  grassDark: new THREE.MeshLambertMaterial({ color: 0x465d33 }),
  walkway: new THREE.MeshLambertMaterial({ color: 0xdfd9ce }),

  // House walls & trim
  houseWall: new THREE.MeshLambertMaterial({ color: 0xe9d9b8 }),
  houseWallTrim: new THREE.MeshLambertMaterial({ color: 0x423830 }),
  houseBase: new THREE.MeshLambertMaterial({ color: 0x8a7f72 }),

  // Roofs
  roofTiles: new THREE.MeshLambertMaterial({ color: 0xa14e37 }),
  roofRidge: new THREE.MeshLambertMaterial({ color: 0x703d32 }),
  roofNeighbor: new THREE.MeshLambertMaterial({ color: 0x364f6b }),
  roofNeighborRidge: new THREE.MeshLambertMaterial({ color: 0x243547 }),
  roofNeighbor2: new THREE.MeshLambertMaterial({ color: 0x82593d }),

  // Porch & Door
  porchFloor: new THREE.MeshLambertMaterial({ color: 0xc8beb1 }),
  porchPillar: new THREE.MeshLambertMaterial({ color: 0xfbf8f3 }),
  doorFrame: new THREE.MeshLambertMaterial({ color: 0x3a2c1f }),
  doorWood: new THREE.MeshLambertMaterial({ color: 0x6e4323 }),
  doorKnob: new THREE.MeshLambertMaterial({ color: 0xf5b041, emissive: 0x734800, emissiveIntensity: 0.3 }),
  welcomeMat: new THREE.MeshLambertMaterial({ color: 0xb55138 }),
  welcomeText: new THREE.MeshLambertMaterial({ color: 0xf7e9d7 }),

  // Windows
  windowFrame: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  windowGlassWarm: new THREE.MeshLambertMaterial({
    color: 0xffe89e,
    emissive: 0xffc44d,
    emissiveIntensity: 0.75
  }),
  windowGlassReflect: new THREE.MeshLambertMaterial({
    color: 0x72a0c1,
    emissive: 0x224466,
    emissiveIntensity: 0.3
  }),

  // Foliage & Nature
  treeTrunk: new THREE.MeshLambertMaterial({ color: 0x5a3e28 }),
  leaves1: new THREE.MeshLambertMaterial({ color: 0x54703a }),
  leaves2: new THREE.MeshLambertMaterial({ color: 0x849a47 }),
  leaves3: new THREE.MeshLambertMaterial({ color: 0x365744 }),
  flowerRed: new THREE.MeshLambertMaterial({ color: 0xe74c3c }),
  flowerYellow: new THREE.MeshLambertMaterial({ color: 0xf1c40f }),
  flowerWhite: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  flowerPink: new THREE.MeshLambertMaterial({ color: 0xf48fb1 }),

  // Props & Street
  mailbox: new THREE.MeshLambertMaterial({ color: 0x2c3e50 }),
  mailboxPost: new THREE.MeshLambertMaterial({ color: 0x7f8c8d }),
  fence: new THREE.MeshLambertMaterial({ color: 0xedebe6 }),
  lanternMetal: new THREE.MeshLambertMaterial({ color: 0x1f2421 }),
  lanternGlow: new THREE.MeshLambertMaterial({ color: 0xffe599, emissive: 0xffbb33, emissiveIntensity: 1.0 }),

  // Cars & Details
  carRed: new THREE.MeshLambertMaterial({ color: 0xc0392b }),
  carGlass: new THREE.MeshLambertMaterial({ color: 0x34495e, emissive: 0x1a252f, emissiveIntensity: 0.4 }),
  carTire: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
  carWheel: new THREE.MeshLambertMaterial({ color: 0xbdc3c7 }),

  // Clouds & Birds
  cloud: new THREE.MeshLambertMaterial({ color: 0xf9e7cd }),
  bird: new THREE.MeshLambertMaterial({ color: 0x242d38 }),
  shutter: new THREE.MeshLambertMaterial({ color: 0x37675f }),
  soil: new THREE.MeshLambertMaterial({ color: 0x544239 }),
  brick: new THREE.MeshLambertMaterial({ color: 0xaa745a }),
  stone: new THREE.MeshLambertMaterial({ color: 0xaaa590 })
};

export let exteriorGroup = null;
export let frontFacadeGroup = null;
export let frontDoorMesh = null;
export let frontDoorGroup = null;
export let birdFlock = [];
export let cloudList = [];
export let treeCanopies = [];
export let outdoorLights = [];
let doorwayGlow, chimneySmoke, gardenMotes, windChime;

export function setFrontFacadeVisible(visible) {
  if (frontFacadeGroup) {
    frontFacadeGroup.visible = visible;
  }
}

export function setExteriorActive(isActive) {
  if (exteriorGroup) {
    exteriorGroup.visible = isActive;
  }
  outdoorLights.forEach(item => {
    if (item.light) {
      item.light.visible = isActive;
      item.light.intensity = isActive ? item.baseIntensity : 0;
    }
  });
}


// Helper box creator
function makeBox(w, h, d, mat, x, y, z, parent = exteriorGroup, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  if (castShadow) {
    mesh.castShadow = true;
  }
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// ── ROOF BUILDER (Pitched / Gable Roof) ──
function makePitchedRoof(w, h, d, roofMat, ridgeMat, x, y, z, parent = exteriorGroup) {
  const roofGroup = new THREE.Group();
  roofGroup.position.set(x, y, z);

  // Left slope
  const slopeLen = Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h, 2));
  const angle = Math.atan2(h, w / 2);
  const thickness = 0.35;

  const leftSlope = new THREE.Mesh(new THREE.BoxGeometry(slopeLen + 0.4, thickness, d + 0.6), roofMat);
  leftSlope.position.set(-w / 4, h / 2, 0);
  leftSlope.rotation.z = angle;
  leftSlope.castShadow = true;
  roofGroup.add(leftSlope);

  // Right slope
  const rightSlope = new THREE.Mesh(new THREE.BoxGeometry(slopeLen + 0.4, thickness, d + 0.6), roofMat);
  rightSlope.position.set(w / 4, h / 2, 0);
  rightSlope.rotation.z = -angle;
  rightSlope.castShadow = true;
  roofGroup.add(rightSlope);

  // Ridge cap
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, d + 0.8), ridgeMat);
  ridge.position.set(0, h + 0.05, 0);
  ridge.castShadow = true;
  roofGroup.add(ridge);

  // Raised courses catch the low sun without a tile texture or extra materials.
  for (let row = 1; row < 7; row++) {
    const u = row / 7;
    for (const side of [-1, 1]) {
      const course = makeBox(0.075, 0.085, d + 0.65, ridgeMat,
        side * w * u / 2, h * (1 - u) + 0.23, 0, roofGroup, false);
      course.rotation.z = -side * angle;
    }
  }
  for (const side of [-1, 1]) {
    makeBox(0.18, 0.2, d + 0.8, ridgeMat, side * (w / 2 + 0.18), 0, 0, roofGroup);
  }

  // Gable ends (triangular front & back walls)
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-w / 2, 0);
  gableShape.lineTo(w / 2, 0);
  gableShape.lineTo(0, h);
  gableShape.closePath();

  const gableGeo = new THREE.ShapeGeometry(gableShape);
  const frontGable = new THREE.Mesh(gableGeo, M_EXT.houseWall);
  frontGable.position.set(0, 0, d / 2 - 0.02);
  frontGable.castShadow = true;
  roofGroup.add(frontGable);

  const backGable = new THREE.Mesh(gableGeo, M_EXT.houseWall);
  backGable.position.set(0, 0, -d / 2 + 0.02);
  backGable.rotation.y = Math.PI;
  backGable.castShadow = true;
  roofGroup.add(backGable);

  parent.add(roofGroup);
  return roofGroup;
}

// ── TREE BUILDER ──
function makeTree(x, z, scale = 1.0, parent = exteriorGroup) {
  const treeG = new THREE.Group();
  treeG.position.set(x, 0, z);
  treeG.scale.setScalar(scale);

  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 3.2, 7),
    M_EXT.treeTrunk
  );
  trunk.position.y = 1.6;
  trunk.castShadow = true;
  treeG.add(trunk);

  // Foliage layers (conical / tiered voxel spheres)
  const foliageG = new THREE.Group();
  foliageG.position.y = 3.0;

  const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 0), M_EXT.leaves1);
  f1.position.y = 1.0; f1.castShadow = true; foliageG.add(f1);

  const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0), M_EXT.leaves2);
  f2.position.set(1.0, 2.0, -0.3); f2.castShadow = true; foliageG.add(f2);

  const f3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), M_EXT.leaves3);
  f3.position.set(-1.2, 1.7, 0.2); f3.castShadow = true; foliageG.add(f3);

  treeG.add(foliageG);
  treeCanopies.push({ group: foliageG, baseRot: foliageG.rotation.clone(), speed: 0.8 + Math.random() * 0.4 });

  parent.add(treeG);
  return treeG;
}

// ── BIRD BUILDER ──
function makeBird() {
  const birdG = new THREE.Group();

  // Body
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.7, 4), M_EXT.bird);
  body.rotation.x = Math.PI / 2;
  birdG.add(body);

  // Left Wing
  const leftWingG = new THREE.Group();
  leftWingG.position.set(-0.1, 0, 0);
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.25), M_EXT.bird);
  leftWing.position.set(-0.35, 0, 0);
  leftWingG.add(leftWing);
  birdG.add(leftWingG);

  // Right Wing
  const rightWingG = new THREE.Group();
  rightWingG.position.set(0.1, 0, 0);
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.25), M_EXT.bird);
  rightWing.position.set(0.35, 0, 0);
  rightWingG.add(rightWing);
  birdG.add(rightWingG);

  return { group: birdG, leftWing: leftWingG, rightWing: rightWingG };
}

// ── FLOWER BUSH BUILDER ──
function makeFlowerBush(x, y, z, parent = exteriorGroup) {
  const bushG = new THREE.Group();
  bushG.position.set(x, y, z);

  const bush = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), M_EXT.leaves2);
  bush.scale.set(1.2, 0.8, 1.0);
  bush.position.y = 0.35;
  bushG.add(bush);

  const flowerColors = [M_EXT.flowerRed, M_EXT.flowerYellow, M_EXT.flowerWhite, M_EXT.flowerPink];
  for (let i = 0; i < 5; i++) {
    const fMat = flowerColors[i % flowerColors.length];
    const flower = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), fMat);
    flower.scale.y = 0.55;
    const ang = (i / 5) * Math.PI * 2;
    flower.position.set(Math.cos(ang) * 0.45, 0.45 + (i % 2) * 0.15, Math.sin(ang) * 0.4);
    bushG.add(flower);
  }
  parent.add(bushG);
  return bushG;
}

// ── STREET LAMP BUILDER ──
function makeStreetLamp(x, z, parent = exteriorGroup) {
  const lampG = new THREE.Group();
  lampG.position.set(x, 0, z);

  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.8, 6), M_EXT.lanternMetal);
  pole.position.y = 2.4;
  pole.castShadow = true;
  lampG.add(pole);

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.4, 6), M_EXT.lanternMetal);
  base.position.y = 0.2;
  lampG.add(base);

  // Arm & Lantern Head
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.1), M_EXT.lanternMetal);
  arm.position.set(0.35, 4.7, 0);
  lampG.add(arm);

  const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.4), M_EXT.lanternGlow);
  lantern.position.set(0.75, 4.45, 0);
  lampG.add(lantern);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.25, 4), M_EXT.lanternMetal);
  cap.position.set(0.75, 4.85, 0);
  lampG.add(cap);

  parent.add(lampG);
  return lampG;
}

// ── RETRO CAR BUILDER ──
function makeRetroCar(x, z, rotationY = 0, colorMat = M_EXT.carRed, parent = exteriorGroup) {
  const carG = new THREE.Group();
  carG.position.set(x, 0, z);
  carG.rotation.y = rotationY;

  // Lower chassis
  makeBox(4.4, 0.8, 2.0, colorMat, 0, 0.7, 0, carG);

  // Cabin
  makeBox(2.4, 0.8, 1.8, colorMat, -0.3, 1.45, 0, carG);

  // Windows
  makeBox(2.2, 0.65, 1.85, M_EXT.carGlass, -0.3, 1.48, 0, carG);

  // Bumpers & lights
  makeBox(0.2, 0.25, 2.0, M_EXT.sidewalk, 2.25, 0.55, 0, carG);
  makeBox(0.2, 0.25, 2.0, M_EXT.sidewalk, -2.25, 0.55, 0, carG);

  // Headlights
  makeBox(0.1, 0.2, 0.35, M_EXT.lanternGlow, 2.23, 0.8, 0.65, carG);
  makeBox(0.1, 0.2, 0.35, M_EXT.lanternGlow, 2.23, 0.8, -0.65, carG);

  // Wheels
  const wheelOffsets = [
    [-1.3, 0.35, 1.05],
    [1.3, 0.35, 1.05],
    [-1.3, 0.35, -1.05],
    [1.3, 0.35, -1.05]
  ];
  wheelOffsets.forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.28, 12), M_EXT.carTire);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    carG.add(wheel);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8), M_EXT.carWheel);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(wx, wy, wz);
    carG.add(rim);
  });

  parent.add(carG);
  return carG;
}

// ── MAIN EXTERIOR CREATION FUNCTION ──
export function createExteriorScene(scene) {
  exteriorGroup = new THREE.Group();
  exteriorGroup.name = 'ExteriorEnvironment';
  scene.add(exteriorGroup);

  // 1. TERRAIN & GROUND
  // Vast lush green ground extending around the entire neighborhood
  makeBox(350, 0.2, 350, M_EXT.grass, 0, -0.2, 30, exteriorGroup, false);

  // Distant low-poly hills along the horizon
  const hillMat = new THREE.MeshLambertMaterial({ color: 0x6c8b70 });
  const hillConfigs = [
    [-90, -10, 22, 14],
    [-45, -35, 30, 18],
    [20, -40, 28, 16],
    [80, -20, 25, 15],
    [-110, 80, 26, 16],
    [105, 75, 24, 15],
    [0, 100, 32, 20],
    [50, -30, 24, 14],
    [-70, -25, 20, 12],
    [130, -15, 22, 13],
    [-140, -5, 26, 16]
  ];
  hillConfigs.forEach(([hx, hz, hr, hh]) => {
    const hill = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), hillMat);
    hill.scale.set(hr, hh, hr * 0.8);
    hill.position.set(hx, -hh * 0.35, hz);
    exteriorGroup.add(hill);
  });

  // Dense forest of tall trees behind the hills (filling background)
  const forestTreeMat1 = new THREE.MeshLambertMaterial({ color: 0x46634e });
  const forestTreeMat2 = new THREE.MeshLambertMaterial({ color: 0x35584c });
  const forestTreeMat3 = new THREE.MeshLambertMaterial({ color: 0x647d50 });
  const forestTrunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2b1a });
  const forestMats = [forestTreeMat1, forestTreeMat2, forestTreeMat3];
  // Create a dense row of forest trees across the background
  for (let x = -120; x <= 120; x += 4 + Math.random() * 3) {
    for (let zOff = 0; zOff < 3; zOff++) {
      const z = -35 - zOff * 12 + (Math.random() - 0.5) * 6;
      const treeH = 5 + Math.random() * 7;
      const trunkH = treeH * 0.4;
      const canopyR = 2.0 + Math.random() * 2.0;
      const fMat = forestMats[Math.floor(Math.random() * forestMats.length)];
      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, trunkH, 5), forestTrunkMat);
      trunk.position.set(x + (Math.random() - 0.5) * 3, trunkH / 2, z);
      exteriorGroup.add(trunk);
      // Canopy
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(canopyR, treeH * 0.65, 6), fMat);
      canopy.position.set(trunk.position.x, trunkH + treeH * 0.25, z);
      exteriorGroup.add(canopy);
      // Second canopy layer on some trees
      if (Math.random() > 0.4) {
        const c2 = new THREE.Mesh(new THREE.ConeGeometry(canopyR * 0.7, treeH * 0.4, 6), fMat);
        c2.position.set(trunk.position.x, trunkH + treeH * 0.55, z);
        exteriorGroup.add(c2);
      }
    }
  }
  // Additional rows further behind the mountains
  for (let x = -130; x <= 130; x += 5 + Math.random() * 4) {
    const z = -55 + (Math.random() - 0.5) * 10;
    const treeH = 10 + Math.random() * 8;
    const fMat = forestMats[Math.floor(Math.random() * forestMats.length)];
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(3.0 + Math.random() * 1.5, treeH, 6), fMat);
    canopy.position.set(x + (Math.random() - 0.5) * 3, treeH / 2 - 1, z);
    exteriorGroup.add(canopy);
  }


  // 2. STREET & SIDEWALKS (Matching user's sketch with "Road")
  // Road extends across x-axis from -90 to 90 at z = 28 to 40 (width 12 units)
  const roadCenterZ = 34;
  const roadWidth = 11;
  makeBox(180, 0.22, roadWidth, M_EXT.road, 0, -0.09, roadCenterZ, exteriorGroup, false);

  // Dashed center markings
  for (let x = -80; x <= 80; x += 5) {
    makeBox(2.8, 0.02, 0.3, M_EXT.roadStripe, x, 0.03, roadCenterZ, exteriorGroup, false);
  }

  // South Sidewalk (in front of Olan's house, z = 24 to 28.5)
  makeBox(180, 0.3, 4.5, M_EXT.sidewalk, 0, 0.05, 26.25, exteriorGroup, false);
  makeBox(180, 0.35, 0.35, M_EXT.curb, 0, 0.08, 28.4, exteriorGroup, false);
  // Sidewalk slab lines
  for (let x = -75; x <= 75; x += 4) {
    makeBox(0.06, 0.02, 4.4, M_EXT.curb, x, 0.21, 26.25, exteriorGroup, false);
  }

  // North Sidewalk (across the street, z = 39.5 to 44)
  makeBox(180, 0.3, 4.5, M_EXT.sidewalk, 0, 0.05, 41.75, exteriorGroup, false);
  makeBox(180, 0.35, 0.35, M_EXT.curb, 0, 0.08, 39.6, exteriorGroup, false);
  for (let x = -75; x <= 75; x += 4) {
    makeBox(0.06, 0.02, 4.4, M_EXT.curb, x, 0.21, 41.75, exteriorGroup, false);
  }

  // Streetlamps along sidewalk (extended further)
  [-48, -24, 0, 24, 48].forEach(x => {
    makeStreetLamp(x + 2, 27.5, exteriorGroup);
  });
  [-40, -16, 16, 40].forEach(x => {
    const lamp = makeStreetLamp(x, 40.5, exteriorGroup);
    lamp.rotation.y = Math.PI;
  });

  // 3. OLAN'S HOUSE (The Main House at center)
  // House Base / Foundation
  makeBox(17, 0.6, 15, M_EXT.houseBase, 0, 0.05, 0.2, exteriorGroup);

  // ── SIDE & BACK WALLS of Olan's House ──
  // Left wall (x = -8)
  makeBox(0.4, 7.5, 15, M_EXT.houseWall, -8.3, 3.8, 0.0, exteriorGroup);
  // Right wall (x = 8)
  makeBox(0.4, 7.5, 15, M_EXT.houseWall, 8.3, 3.8, 0.0, exteriorGroup);
  // Back wall (z = -7)
  makeBox(17, 7.5, 0.4, M_EXT.houseWall, 0, 3.8, -7.0, exteriorGroup);
  // Side window on right wall
  makeBox(0.2, 2.0, 2.2, M_EXT.windowFrame, 8.42, 3.8, 0.0, exteriorGroup);
  makeBox(0.04, 1.7, 1.9, M_EXT.windowGlassReflect, 8.54, 3.8, 0.0, exteriorGroup);
  // Side window on left wall
  makeBox(0.2, 2.0, 2.2, M_EXT.windowFrame, -8.42, 3.8, 0.0, exteriorGroup);
  makeBox(0.04, 1.7, 1.9, M_EXT.windowGlassReflect, -8.54, 3.8, 0.0, exteriorGroup);

  // Front facade group (contains front wall, door, porch, and roof so they can be toggled when inside the room)
  frontFacadeGroup = new THREE.Group();
  exteriorGroup.add(frontFacadeGroup);

  // ── WHITE INTERIOR PLANE behind doorway (so door swing doesn't show void) ──
  const interiorWhiteMat = new THREE.MeshBasicMaterial({ color: 0xfffcf1, fog: false, toneMapped: false });
  const portal = makeBox(2.38, 4.12, 0.04, interiorWhiteMat, 0, 2.1, 7.24, frontFacadeGroup, false);
  portal.name = 'DoorwayLight';

  // Left wall of facade
  makeBox(6.8, 7.5, 0.4, M_EXT.houseWall, -4.6, 3.8, 7.1, frontFacadeGroup);
  // Right wall of facade
  makeBox(6.8, 7.5, 0.4, M_EXT.houseWall, 4.6, 3.8, 7.1, frontFacadeGroup);
  // Header above the door
  makeBox(2.8, 3.4, 0.4, M_EXT.houseWall, 0, 5.8, 7.1, frontFacadeGroup);
  // Trim moulding
  [-4.65, 4.65].forEach(x => makeBox(6.5, 0.18, 0.5, M_EXT.houseWallTrim, x, 0.7, 7.15, frontFacadeGroup));
  makeBox(16.5, 0.3, 0.5, M_EXT.houseWallTrim, 0, 7.5, 7.15, frontFacadeGroup);

  // FRONT DOOR SYSTEM (Interactive hinge & swing)
  // Doorway opening is at x: -1.2 to 1.2, y: 0 to 4.1
  const doorWidth = 2.3;
  const doorHeight = 4.0;
  const doorThick = 0.15;

  // Door frame
  makeBox(doorWidth + 0.3, 0.18, 0.3, M_EXT.doorFrame, 0, doorHeight + 0.1, 7.12, frontFacadeGroup);
  makeBox(0.18, doorHeight + 0.2, 0.3, M_EXT.doorFrame, -doorWidth / 2 - 0.08, doorHeight / 2, 7.12, frontFacadeGroup);
  makeBox(0.18, doorHeight + 0.2, 0.3, M_EXT.doorFrame, doorWidth / 2 + 0.08, doorHeight / 2, 7.12, frontFacadeGroup);

  // The Door Group with pivot on the left edge
  frontDoorGroup = new THREE.Group();
  frontDoorGroup.position.set(-doorWidth / 2, 0.1, 7.39);
  frontDoorGroup.name = 'FrontDoorHinge';
  frontFacadeGroup.add(frontDoorGroup);

  // Door leaf
  frontDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorThick), M_EXT.doorWood);
  frontDoorMesh.position.set(doorWidth / 2, doorHeight / 2, 0);
  frontDoorMesh.castShadow = true;
  frontDoorGroup.add(frontDoorMesh);

  // Door panels (classic retro 4-panel wooden door)
  [
    [-0.55, 2.7, 0.45, 0.7],
    [0.55, 2.7, 0.45, 0.7],
    [-0.55, 1.3, 0.45, 0.7],
    [0.55, 1.3, 0.45, 0.7]
  ].forEach(([px, py, pw, ph]) => {
    const pMesh = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, 0.04), M_EXT.doorFrame);
    pMesh.position.set(doorWidth / 2 + px, py, 0.08);
    frontDoorGroup.add(pMesh);
  });

  // Brass Door Handle / Knob
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), M_EXT.doorKnob);
  knob.position.set(doorWidth - 0.28, 1.8, 0.14);
  frontDoorGroup.add(knob);
  const knobBack = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 6), M_EXT.doorKnob);
  knobBack.rotation.x = Math.PI / 2;
  knobBack.position.set(doorWidth - 0.28, 1.8, 0.08);
  frontDoorGroup.add(knobBack);

  // Front Porch
  // Porch slab
  makeBox(5.6, 0.35, 3.8, M_EXT.porchFloor, 0, 0.18, 9.0, frontFacadeGroup);
  // Porch steps leading down to yard
  makeBox(5.0, 0.2, 0.8, M_EXT.porchFloor, 0, 0.1, 11.2, frontFacadeGroup);
  // Welcome Mat
  makeBox(2.2, 0.04, 1.2, M_EXT.welcomeMat, 0, 0.38, 8.8, frontFacadeGroup);
  const matText = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.95), new THREE.MeshBasicMaterial({
    map: canvasTexture(ctx => {
      ctx.fillStyle = '#9f6349'; ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#d9b98c'; ctx.lineWidth = 8; ctx.strokeRect(18, 18, 476, 220);
      ctx.fillStyle = '#ffe3b0'; ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center'; ctx.fillText('come on in', 256, 146);
    })
  }));
  matText.rotation.x = -Math.PI / 2; matText.position.set(0, 0.407, 8.8); frontFacadeGroup.add(matText);

  // Porch pillars (white square columns)
  const pillarL = makeBox(0.3, 3.6, 0.3, M_EXT.porchPillar, -2.5, 2.0, 10.6, frontFacadeGroup);
  const pillarR = makeBox(0.3, 3.6, 0.3, M_EXT.porchPillar, 2.5, 2.0, 10.6, frontFacadeGroup);

  // Porch Roof
  const porchRoof = makePitchedRoof(6.2, 1.4, 4.2, M_EXT.roofTiles, M_EXT.roofRidge, 0, 3.8, 9.1, frontFacadeGroup);

  // Porch wall lanterns
  const porchLanternL = makeBox(0.25, 0.4, 0.25, M_EXT.lanternGlow, -1.8, 3.0, 7.35, frontFacadeGroup);
  const porchLanternR = makeBox(0.25, 0.4, 0.25, M_EXT.lanternGlow, 1.8, 3.0, 7.35, frontFacadeGroup);
  const pLight = new THREE.PointLight(0xffcc66, 1.5, 8);
  pLight.position.set(0, 3.2, 8.5);
  exteriorGroup.add(pLight);
  outdoorLights.push({ light: pLight, baseIntensity: 1.5 });

  // Front Windows on Olan's House
  // Left front window
  makeBox(2.4, 2.2, 0.2, M_EXT.windowFrame, -4.5, 3.8, 7.22, frontFacadeGroup);
  makeBox(2.1, 1.9, 0.04, M_EXT.windowGlassWarm, -4.5, 3.8, 7.36, frontFacadeGroup);
  makeBox(2.1, 0.08, 0.1, M_EXT.windowFrame, -4.5, 3.8, 7.4, frontFacadeGroup);
  makeBox(0.08, 1.9, 0.1, M_EXT.windowFrame, -4.5, 3.8, 7.4, frontFacadeGroup);
  // Flower box under left window
  makeBox(2.6, 0.35, 0.45, M_EXT.doorFrame, -4.5, 2.5, 7.4, frontFacadeGroup);
  makeFlowerBush(-5.2, 2.7, 7.4, frontFacadeGroup);
  makeFlowerBush(-4.5, 2.7, 7.4, frontFacadeGroup);
  makeFlowerBush(-3.8, 2.7, 7.4, frontFacadeGroup);

  // Right front window
  makeBox(2.4, 2.2, 0.2, M_EXT.windowFrame, 4.5, 3.8, 7.22, frontFacadeGroup);
  makeBox(2.1, 1.9, 0.04, M_EXT.windowGlassWarm, 4.5, 3.8, 7.36, frontFacadeGroup);
  makeBox(2.1, 0.08, 0.1, M_EXT.windowFrame, 4.5, 3.8, 7.4, frontFacadeGroup);
  makeBox(0.08, 1.9, 0.1, M_EXT.windowFrame, 4.5, 3.8, 7.4, frontFacadeGroup);
  // Flower box under right window
  makeBox(2.6, 0.35, 0.45, M_EXT.doorFrame, 4.5, 2.5, 7.4, frontFacadeGroup);
  makeFlowerBush(3.8, 2.7, 7.4, frontFacadeGroup);
  makeFlowerBush(4.5, 2.7, 7.4, frontFacadeGroup);
  makeFlowerBush(5.2, 2.7, 7.4, frontFacadeGroup);

  // Main House Roof (above the entire house)
  makePitchedRoof(17.6, 4.8, 15.6, M_EXT.roofTiles, M_EXT.roofRidge, 0, 7.5, 0.2, frontFacadeGroup);

  // Chimney on main roof
  makeBox(1.4, 3.8, 1.4, M_EXT.roofRidge, -5.0, 10.0, -1.0, frontFacadeGroup);
  makeBox(1.7, 0.3, 1.7, M_EXT.houseWallTrim, -5.0, 11.9, -1.0, frontFacadeGroup);


  // SIDE GARAGE / WING (As drawn on right side of house in user sketch!)
  // Garage body
  makeBox(7.2, 5.0, 9.0, M_EXT.houseWall, 11.8, 2.5, 6.0, exteriorGroup);
  // Garage pitched roof
  makePitchedRoof(8.0, 2.4, 9.6, M_EXT.roofTiles, M_EXT.roofRidge, 11.8, 5.0, 6.0, exteriorGroup);
  // Garage door (large roll-up door)
  makeBox(5.4, 3.6, 0.2, M_EXT.sidewalk, 11.8, 1.8, 10.55, exteriorGroup);
  for (let y = 0.6; y <= 3.4; y += 0.7) {
    makeBox(5.2, 0.05, 0.24, M_EXT.houseWallTrim, 11.8, y, 10.56, exteriorGroup);
  }
  // Driveway paving leading from garage to street
  makeBox(6.4, 0.24, 15.5, M_EXT.curb, 11.8, 0.02, 18.5, exteriorGroup, false);

  // Parked Retro Car on Driveway
  makeRetroCar(11.8, 18.0, Math.PI / 2, M_EXT.carRed, exteriorGroup);

  // FRONT WALKWAY & YARD
  // Stone walkway from porch steps to sidewalk
  makeBox(2.65, 0.08, 12.8, M_EXT.soil, 0, 0.0, 18.0, exteriorGroup, false);
  for (let i = 0; i < 9; i++) {
    const step = makeBox(2.3, 0.13, 1.18, M_EXT.walkway, (i % 2 ? 0.07 : -0.05), 0.07, 12.1 + i * 1.4, exteriorGroup, false);
    step.rotation.y = (i % 3 - 1) * 0.025;
  }

  // Mailbox ("OLAN" on post near sidewalk)
  const mailboxG = new THREE.Group();
  mailboxG.position.set(2.0, 0, 23.5);
  const mbPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6), M_EXT.mailboxPost);
  mbPost.position.y = 0.8;
  mailboxG.add(mbPost);
  const mbBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.8), M_EXT.mailbox);
  mbBox.position.set(0, 1.6, 0);
  mailboxG.add(mbBox);
  // Flag
  const mbFlag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.12), M_EXT.flowerRed);
  mbFlag.position.set(0.28, 1.7, -0.15);
  mailboxG.add(mbFlag);
  exteriorGroup.add(mailboxG);

  // Picket fence along front yard
  for (const [start, end] of [[-11, -1.65], [2.8, 8]]) {
    for (const y of [0.42, 0.9]) makeBox(end - start, 0.09, 0.12, M_EXT.fence, (start + end) / 2, y, 23.8);
    for (let x = start; x <= end; x += 0.47) {
      makeBox(0.18, 1.25, 0.16, M_EXT.fence, x, 0.64, 23.85);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.18, 4), M_EXT.fence);
      cap.position.set(x, 1.35, 23.85); cap.rotation.y = Math.PI / 4; exteriorGroup.add(cap);
    }
  }

  // Trees in Olan's yard
  makeTree(-9.5, 16.0, 1.25, exteriorGroup);
  makeTree(-6.0, 21.0, 0.9, exteriorGroup);
  makeTree(6.5, 14.0, 1.1, exteriorGroup);

  // Flower bushes in front yard
  makeFlowerBush(-1.8, 0.1, 13.0, exteriorGroup);
  makeFlowerBush(-2.2, 0.1, 16.0, exteriorGroup);
  makeFlowerBush(-2.0, 0.1, 19.5, exteriorGroup);
  makeFlowerBush(1.8, 0.1, 13.0, exteriorGroup);
  makeFlowerBush(2.2, 0.1, 17.5, exteriorGroup);

  // 4. NEIGHBOR HOUSES (Across the street and adjacent, matching sketch!)
  // Neighbor House 1 (Right across street, z = 48)
  const n1G = new THREE.Group();
  n1G.position.set(0, 0, 52);
  n1G.rotation.y = Math.PI; // Faces the street
  exteriorGroup.add(n1G);

  makeBox(15, 6.5, 11, M_EXT.houseWall, 0, 3.25, 0, n1G);
  makePitchedRoof(15.8, 4.2, 11.8, M_EXT.roofNeighbor, M_EXT.roofNeighborRidge, 0, 6.5, 0, n1G);
  // Front door & windows
  makeBox(1.8, 3.5, 0.2, M_EXT.doorWood, 0, 1.75, 5.55, n1G);
  makeBox(2.2, 2.0, 0.15, M_EXT.windowGlassWarm, -4.0, 3.5, 5.55, n1G);
  makeBox(2.2, 2.0, 0.15, M_EXT.windowGlassWarm, 4.0, 3.5, 5.55, n1G);
  // Garage on neighbor 1
  makeBox(6.5, 4.5, 8.0, M_EXT.houseWall, -10.5, 2.25, 0.5, n1G);
  makePitchedRoof(7.2, 2.2, 8.6, M_EXT.roofNeighbor, M_EXT.roofNeighborRidge, -10.5, 4.5, 0.5, n1G);
  makeBox(4.8, 3.2, 0.2, M_EXT.sidewalk, -10.5, 1.6, 4.55, n1G);
  makeTree(-4.0, 44.0, 1.2, exteriorGroup);
  makeTree(6.0, 45.0, 1.0, exteriorGroup);

  // Neighbor House 2 (Down the street to the right, x = 28, z = 54)
  const n2G = new THREE.Group();
  n2G.position.set(28, 0, 54);
  n2G.rotation.y = Math.PI;
  exteriorGroup.add(n2G);
  makeBox(14, 6.0, 10, M_EXT.houseWall, 0, 3.0, 0, n2G);
  makePitchedRoof(14.6, 3.8, 10.6, M_EXT.roofNeighbor2, M_EXT.roofRidge, 0, 6.0, 0, n2G);
  makeBox(1.8, 3.5, 0.2, M_EXT.doorWood, 0, 1.75, 5.05, n2G);
  makeBox(2.0, 1.8, 0.15, M_EXT.windowGlassWarm, -3.5, 3.2, 5.05, n2G);
  makeBox(2.0, 1.8, 0.15, M_EXT.windowGlassWarm, 3.5, 3.2, 5.05, n2G);
  makeTree(20.0, 46.0, 1.15, exteriorGroup);

  // Neighbor House 3 (Down the street to the left, x = -28, z = 53)
  const n3G = new THREE.Group();
  n3G.position.set(-28, 0, 53);
  n3G.rotation.y = Math.PI;
  exteriorGroup.add(n3G);
  makeBox(14, 6.0, 10, M_EXT.houseWall, 0, 3.0, 0, n3G);
  makePitchedRoof(14.6, 3.8, 10.6, M_EXT.roofTiles, M_EXT.roofRidge, 0, 6.0, 0, n3G);
  makeBox(1.8, 3.5, 0.2, M_EXT.doorWood, 0, 1.75, 5.05, n3G);
  makeTree(-24.0, 45.0, 1.3, exteriorGroup);

  // Neighbor House 4 (Next to Olan's house on the left, x = -26, z = 6)
  const n4G = new THREE.Group();
  n4G.position.set(-26, 0, 6);
  exteriorGroup.add(n4G);
  makeBox(14, 6.5, 12, M_EXT.houseWall, 0, 3.25, 0, n4G);
  makePitchedRoof(14.6, 4.0, 12.6, M_EXT.roofNeighbor2, M_EXT.roofRidge, 0, 6.5, 0, n4G);
  makeBox(1.8, 3.5, 0.2, M_EXT.doorWood, 0, 1.75, 6.05, n4G);
  makeBox(2.0, 1.8, 0.15, M_EXT.windowGlassWarm, -3.5, 3.2, 6.05, n4G);
  makeBox(2.0, 1.8, 0.15, M_EXT.windowGlassWarm, 3.5, 3.2, 6.05, n4G);
  makeTree(-18.0, 16.0, 1.3, exteriorGroup);
  makeTree(-33.0, 14.0, 1.1, exteriorGroup);

  // Neighbor House 5 (Right side of Olan's house, x = 30, z = 6)
  const n5G = new THREE.Group();
  n5G.position.set(30, 0, 6);
  exteriorGroup.add(n5G);
  makeBox(13, 6.0, 11, M_EXT.houseWall, 0, 3.0, 0, n5G);
  makePitchedRoof(13.6, 3.6, 11.6, M_EXT.roofNeighbor, M_EXT.roofNeighborRidge, 0, 6.0, 0, n5G);
  makeBox(1.8, 3.5, 0.2, M_EXT.doorWood, 0, 1.75, 5.55, n5G);
  makeBox(2.0, 1.8, 0.15, M_EXT.windowGlassWarm, -3.5, 3.2, 5.55, n5G);
  makeBox(2.0, 1.8, 0.15, M_EXT.windowGlassWarm, 3.5, 3.2, 5.55, n5G);
  makeTree(24.0, 15.0, 1.15, exteriorGroup);
  makeTree(37.0, 13.0, 0.95, exteriorGroup);

  // Neighbor House 6 (Further right, x = 52, z = 8)
  const n6G = new THREE.Group();
  n6G.position.set(52, 0, 8);
  exteriorGroup.add(n6G);
  makeBox(12, 5.5, 10, M_EXT.houseWall, 0, 2.75, 0, n6G);
  makePitchedRoof(12.6, 3.2, 10.6, M_EXT.roofTiles, M_EXT.roofRidge, 0, 5.5, 0, n6G);
  makeBox(1.8, 3.5, 0.2, M_EXT.doorWood, 0, 1.75, 5.05, n6G);
  makeBox(2.0, 1.8, 0.15, M_EXT.windowGlassReflect, -3.0, 3.0, 5.05, n6G);
  makeBox(2.0, 1.8, 0.15, M_EXT.windowGlassReflect, 3.0, 3.0, 5.05, n6G);
  makeTree(46.0, 16.0, 1.0, exteriorGroup);
  makeTree(58.0, 14.0, 1.2, exteriorGroup);

  // Neighbor House 7 (Further left, x = -50, z = 7)
  const n7G = new THREE.Group();
  n7G.position.set(-50, 0, 7);
  exteriorGroup.add(n7G);
  makeBox(12, 5.5, 10, M_EXT.houseWall, 0, 2.75, 0, n7G);
  makePitchedRoof(12.6, 3.2, 10.6, M_EXT.roofNeighbor2, M_EXT.roofRidge, 0, 5.5, 0, n7G);
  makeBox(1.8, 3.5, 0.2, M_EXT.doorWood, 0, 1.75, 5.05, n7G);
  makeTree(-44.0, 15.0, 1.1, exteriorGroup);
  makeTree(-56.0, 13.0, 0.9, exteriorGroup);

  // Neighbor House 8 (Across street further right, x = 50, z = 54)
  const n8G = new THREE.Group();
  n8G.position.set(50, 0, 55);
  n8G.rotation.y = Math.PI;
  exteriorGroup.add(n8G);
  makeBox(13, 5.5, 10, M_EXT.houseWall, 0, 2.75, 0, n8G);
  makePitchedRoof(13.6, 3.4, 10.6, M_EXT.roofNeighbor, M_EXT.roofNeighborRidge, 0, 5.5, 0, n8G);
  makeBox(1.8, 3.5, 0.2, M_EXT.doorWood, 0, 1.75, 5.05, n8G);
  makeTree(44.0, 46.0, 1.0, exteriorGroup);

  // Neighbor House 9 (Across street further left, x = -50, z = 55)
  const n9G = new THREE.Group();
  n9G.position.set(-50, 0, 55);
  n9G.rotation.y = Math.PI;
  exteriorGroup.add(n9G);
  makeBox(13, 5.5, 10, M_EXT.houseWall, 0, 2.75, 0, n9G);
  makePitchedRoof(13.6, 3.4, 10.6, M_EXT.roofTiles, M_EXT.roofRidge, 0, 5.5, 0, n9G);
  makeBox(1.8, 3.5, 0.2, M_EXT.doorWood, 0, 1.75, 5.05, n9G);
  makeTree(-44.0, 47.0, 1.1, exteriorGroup);

  // Parked Retro Car on the Street (Teal Sedan)
  makeRetroCar(-8.0, 31.5, 0, new THREE.MeshLambertMaterial({ color: 0x16a085 }), exteriorGroup);
  // Another parked car further down the street
  makeRetroCar(35.0, 32.0, 0, new THREE.MeshLambertMaterial({ color: 0x2c3e50 }), exteriorGroup);

  // 5. BIRDS IN THE SKY (Animated flock)
  birdFlock = [];
  const birdCount = 5;
  for (let i = 0; i < birdCount; i++) {
    const birdObj = makeBird();
    birdObj.group.position.set(
      -30 + i * 5 + (Math.random() - 0.5) * 4,
      22 + Math.sin(i) * 3,
      10 + i * 6 + (Math.random() - 0.5) * 4
    );
    birdObj.group.scale.setScalar(0.75);
    exteriorGroup.add(birdObj.group);
    birdFlock.push({
      ...birdObj,
      flightSpeed: 7.5 + Math.random() * 2.0,
      wingSpeed: 12 + Math.random() * 4,
      seed: i * 1.8,
      startX: -60,
      endX: 70
    });
  }

  // 6. CLOUDS & MIST (Atmospheric floating clouds)
  cloudList = [];
  const cloudConfigs = [
    { x: -35, y: 32, z: -90, s: 1.4, speed: 0.3 },
    { x: 10, y: 36, z: -45, s: 1.8, speed: 0.25 },
    { x: 45, y: 30, z: -65, s: 1.2, speed: 0.3 },
    { x: -15, y: 28, z: -35, s: 1.3, speed: 0.35 },
    { x: 30, y: 34, z: -110, s: 1.5, speed: 0.25 }
  ];

  cloudConfigs.forEach(cfg => {
    const cg = new THREE.Group();
    cg.position.set(cfg.x, cfg.y, cfg.z);
    cg.scale.setScalar(cfg.s);

    // Multi-puff voxel cloud
    const p1 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 0), M_EXT.cloud);
    cg.add(p1);
    const p2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 0), M_EXT.cloud);
    p2.position.set(-2.6, -0.4, 0.5); cg.add(p2);
    const p3 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 0), M_EXT.cloud);
    p3.position.set(2.8, -0.3, -0.4); cg.add(p3);
    const p4 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0, 0), M_EXT.cloud);
    p4.position.set(0.5, 1.2, 0.2); cg.add(p4);

    exteriorGroup.add(cg);
    cloudList.push({ group: cg, speed: cfg.speed, startX: -90, endX: 90 });
  });

  // 7. OUTDOOR SUN & SKY LIGHTING
  const sunLight = new THREE.DirectionalLight(0xffd49b, 1.65);
  sunLight.position.set(-24, 29, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 5;
  sunLight.shadow.camera.far = 130;
  sunLight.shadow.camera.left = -28;
  sunLight.shadow.camera.right = 28;
  sunLight.shadow.camera.top = 28;
  sunLight.shadow.camera.bottom = -28;
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.06;
  exteriorGroup.add(sunLight);
  outdoorLights.push({ light: sunLight, baseIntensity: 1.65 });

  const skyHemiLight = new THREE.HemisphereLight(0xb9d9dc, 0x695336, 0.7);
  exteriorGroup.add(skyHemiLight);
  outdoorLights.push({ light: skyHemiLight, baseIntensity: 0.7 });

  addGardenDetails();
  const moving = [frontFacadeGroup, ...treeCanopies.map(t => t.group), ...birdFlock.map(b => b.group), ...cloudList.map(c => c.group), windChime];
  batchStatic(exteriorGroup, moving);
  batchStatic(frontFacadeGroup, [frontDoorGroup, windChime]);
  batchStatic(frontDoorGroup);
  cloudList.forEach(c => batchStatic(c.group));

  return {
    exteriorGroup,
    frontDoorGroup,
    frontDoorMesh
  };
}

function addGardenDetails() {
  const skyGeo = new THREE.SphereGeometry(190, 24, 12);
  const colors = [];
  const top = new THREE.Color(0x80afbc).convertSRGBToLinear(), horizon = new THREE.Color(0xf5dec0).convertSRGBToLinear();
  const vertex = skyGeo.attributes.position;
  for (let i = 0; i < vertex.count; i++) {
    const color = horizon.clone().lerp(top, THREE.MathUtils.clamp(vertex.getY(i) / 100, 0, 1));
    colors.push(color.r, color.g, color.b);
  }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.renderOrder = -10; exteriorGroup.add(sky);

  const glowTexture = canvasTexture((ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, '#fffdf0'); gradient.addColorStop(0.25, '#fff0ca'); gradient.addColorStop(1, 'rgba(255,232,186,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
  }, 128, 128);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, fog: false, depthWrite: false, toneMapped: false, opacity: 0.65 }));
  sun.position.set(-62, 38, -85); sun.scale.set(35, 35, 1); exteriorGroup.add(sun);
  doorwayGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, fog: false, depthWrite: false, toneMapped: false, opacity: 0 }));
  doorwayGlow.position.set(0, 2.2, 7.6); doorwayGlow.scale.set(4.5, 6.0, 1); frontFacadeGroup.add(doorwayGlow);

  // Siding, shutters and a proper brick plinth give the house a readable scale.
  for (const x of [-4.6, 4.6]) {
    for (let y = 1; y < 7.3; y += 0.48) makeBox(6.65, 0.028, 0.02, M_EXT.porchFloor, x, y, 7.312, frontFacadeGroup, false);
    for (const side of [-1, 1]) {
      makeBox(0.6, 2.35, 0.12, M_EXT.shutter, x + side * 1.65, 3.8, 7.38, frontFacadeGroup);
      for (let row = 0; row < 7; row++) makeBox(0.5, 0.06, 0.06, M_EXT.houseWallTrim, x + side * 1.65, 2.92 + row * 0.28, 7.46, frontFacadeGroup, false);
    }
    for (let i = 0; i < 8; i++) makeBox(0.72, 0.25, 0.12, M_EXT.brick, x - 2.85 + i * 0.82, 0.38, 7.38, frontFacadeGroup, false);
  }
  for (const x of [-2.5, 2.5]) {
    makeBox(0.48, 0.22, 0.48, M_EXT.porchFloor, x, 0.5, 10.6, frontFacadeGroup);
    makeBox(0.47, 0.18, 0.47, M_EXT.porchPillar, x, 3.6, 10.6, frontFacadeGroup);
    const brace = makeBox(0.16, 0.9, 0.18, M_EXT.houseWallTrim, x - Math.sign(x) * 0.27, 3.35, 10.6, frontFacadeGroup);
    brace.rotation.z = -Math.sign(x) * Math.PI / 4;
  }
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2, 0.57, 0.08), new THREE.MeshLambertMaterial({
    map: canvasTexture(ctx => {
      ctx.fillStyle = '#334d43'; ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#d5bc82'; ctx.lineWidth = 9; ctx.strokeRect(14, 14, 484, 228);
      ctx.fillStyle = '#fff0ce'; ctx.font = 'bold 68px monospace'; ctx.textAlign = 'center'; ctx.fillText("OLAN'S", 256, 150);
    })
  }));
  sign.position.set(0, 5.65, 7.4); frontFacadeGroup.add(sign);

  // Front garden: beds, a slatted bench, grasses and a parked bicycle.
  for (const x of [-3.0, 3.0]) {
    makeBox(1.3, 0.12, 9.5, M_EXT.soil, x, 0.03, 17.5, exteriorGroup, false);
    for (let i = 0; i < 7; i++) {
      makeFlowerBush(x, 0.05, 13.4 + i * 1.25);
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), M_EXT.stone);
      stone.scale.set(1.3, 0.7, 1); stone.position.set(x + Math.sign(x) * 0.72, 0.12, 13.2 + i * 1.4); exteriorGroup.add(stone);
    }
  }
  const bench = new THREE.Group(); bench.position.set(-5.4, 0, 12.6); bench.rotation.y = -0.14; exteriorGroup.add(bench);
  for (let i = 0; i < 4; i++) {
    makeBox(3.1, 0.13, 0.2, M_EXT.doorWood, 0, 1.0, -0.32 + i * 0.24, bench);
    makeBox(3.1, 0.2, 0.12, M_EXT.doorWood, 0, 1.35 + i * 0.25, -0.5, bench);
  }
  for (const x of [-1.2, 1.2]) {
    makeBox(0.12, 1.0, 0.8, M_EXT.lanternMetal, x, 0.5, 0, bench);
    makeBox(0.12, 1.65, 0.12, M_EXT.lanternMetal, x, 1.05, -0.5, bench);
    makeBox(0.14, 0.1, 0.95, M_EXT.lanternMetal, x, 1.5, 0, bench);
  }
  const grassGeo = new THREE.ConeGeometry(0.08, 0.5, 3);
  for (let i = 0; i < 100; i++) {
    const x = -12 + Math.random() * 20, z = 11.6 + Math.random() * 12;
    if (Math.abs(x) < 3.8) continue;
    const blade = new THREE.Mesh(grassGeo, i % 3 ? M_EXT.grassDark : M_EXT.leaves2);
    blade.position.set(x, 0.2, z); blade.rotation.z = Math.sin(i) * 0.3; exteriorGroup.add(blade);
  }
  const bike = new THREE.Group(); bike.position.set(7, 0, 9.4); bike.rotation.y = -0.3; exteriorGroup.add(bike);
  for (const x of [-0.85, 0.85]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.045, 4, 16), M_EXT.carTire);
    wheel.position.set(x, 0.64, 0); bike.add(wheel);
    for (let i = 0; i < 4; i++) {
      const spoke = makeBox(0.025, 1.08, 0.025, M_EXT.carWheel, x, 0.64, 0, bike, false);
      spoke.rotation.z = i * Math.PI / 4;
    }
  }
  const bars = [[-0.85, 0.64, -0.35, 1.43], [-0.35, 1.43, 0.2, 0.65], [0.2, 0.65, -0.85, 0.64], [-0.35, 1.43, 0.65, 1.45], [0.65, 1.45, 0.2, 0.65], [0.85, 0.64, 0.55, 1.8]];
  bars.forEach(([ax, ay, bx, by]) => {
    const bar = makeBox(0.065, Math.hypot(bx - ax, by - ay), 0.065, M_EXT.shutter, (ax + bx) / 2, (ay + by) / 2, 0, bike);
    bar.rotation.z = -Math.atan2(bx - ax, by - ay);
  });
  makeBox(0.45, 0.1, 0.23, M_EXT.doorFrame, -0.38, 1.57, 0, bike);
  makeBox(0.12, 0.07, 0.65, M_EXT.carWheel, 0.55, 1.8, 0, bike);

  // Porch bulbs share an emissive material, rather than nine more point lights.
  const wire = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.5, 3.75, 10.55), new THREE.Vector3(0, 3.35, 10.55), new THREE.Vector3(2.5, 3.75, 10.55)]);
  frontFacadeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(wire, 16, 0.018, 3, false), M_EXT.lanternMetal));
  for (let i = 0; i < 9; i++) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 4), M_EXT.lanternGlow);
    bulb.position.copy(wire.getPoint(i / 8)); bulb.position.y -= 0.08; frontFacadeGroup.add(bulb);
  }
  windChime = new THREE.Group(); windChime.position.set(-2.05, 3.6, 8.7); frontFacadeGroup.add(windChime);
  makeBox(0.42, 0.06, 0.32, M_EXT.doorWood, 0, 0, 0, windChime);
  for (let i = 0; i < 4; i++) makeBox(0.035, 0.4 + i * 0.07, 0.035, M_EXT.doorKnob, -0.15 + i * 0.1, -0.35, 0, windChime);

  const smokeGeo = new THREE.BufferGeometry();
  smokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 6 }, (_, i) => [-5 + i * 0.2, 12.2 + i * 0.8, -1]).flat(), 3));
  chimneySmoke = new THREE.Points(smokeGeo, new THREE.PointsMaterial({ color: 0xf6eada, map: glowTexture, size: 2.3, opacity: 0.13, transparent: true, depthWrite: false }));
  chimneySmoke.frustumCulled = false; exteriorGroup.add(chimneySmoke);
  const motes = [];
  for (let i = 0; i < 45; i++) motes.push((Math.random() - 0.5) * 23, 0.7 + Math.random() * 4, 10 + Math.random() * 15);
  const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute('position', new THREE.Float32BufferAttribute(motes, 3));
  gardenMotes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0xffe8ac, size: 0.06, transparent: true, opacity: 0.6, depthWrite: false }));
  exteriorGroup.add(gardenMotes);
}

// ── DOOR ANIMATION CONTROLS ──
let doorAnimation = null;

export function openFrontDoor(duration = 1.2, onComplete = null) {
  if (!frontDoorGroup) return;
  const startRot = frontDoorGroup.rotation.y;
  const targetRot = Math.PI * 0.48;
  let elapsed = 0;

  doorAnimation = (dt) => {
    elapsed += dt;
    const progress = Math.min(elapsed / duration, 1.0);
    // easeOutQuad
    const ease = 1 - (1 - progress) * (1 - progress);
    frontDoorGroup.rotation.y = startRot + (targetRot - startRot) * ease;
    if (doorwayGlow) doorwayGlow.material.opacity = ease * 0.55;

    if (progress >= 1.0) {
      doorAnimation = null;
      if (onComplete) onComplete();
    }
  };
}

export function closeFrontDoor(duration = 1.0, onComplete = null) {
  if (!frontDoorGroup) return;
  const startRot = frontDoorGroup.rotation.y;
  const targetRot = 0; // Fully closed
  let elapsed = 0;

  doorAnimation = (dt) => {
    elapsed += dt;
    const progress = Math.min(elapsed / duration, 1.0);
    const ease = progress * progress; // easeInQuad
    frontDoorGroup.rotation.y = startRot + (targetRot - startRot) * ease;

    if (progress >= 1.0) {
      doorAnimation = null;
      if (onComplete) onComplete();
    }
  };
}

export function resetFrontDoor() {
  if (frontDoorGroup) frontDoorGroup.rotation.y = 0;
  if (doorwayGlow) doorwayGlow.material.opacity = 0;
  doorAnimation = null;
}

// ── FRAME UPDATE (Loop in animate) ──
export function updateExterior(dt, t) {
  if (!exteriorGroup?.visible) return;
  // 1. Door tween update
  if (doorAnimation) {
    doorAnimation(dt);
  }
  if (reducedMotion.matches) return;

  // 2. Animated flying birds
  birdFlock.forEach(b => {
    b.group.position.x += b.flightSpeed * dt;
    b.group.position.y = 22 + Math.sin(t * 1.5 + b.seed) * 0.7;
    b.group.position.z = 10 + b.seed * 3 + Math.cos(t * 0.8 + b.seed) * 0.6;

    // Wing flapping
    const wingAngle = Math.sin(t * b.wingSpeed) * 0.65;
    b.leftWing.rotation.z = wingAngle;
    b.rightWing.rotation.z = -wingAngle;

    // Loop flight across sky
    if (b.group.position.x > b.endX) {
      b.group.position.x = b.startX;
      b.group.position.z = 10 + (Math.random() - 0.5) * 20;
    }
  });

  // 3. Clouds drifting across sky
  cloudList.forEach(c => {
    c.group.position.x += c.speed * dt * 2.0;
    if (c.group.position.x > c.endX) {
      c.group.position.x = c.startX;
    }
  });

  // 4. Tree canopy gentle wind sway
  treeCanopies.forEach(tc => {
    tc.group.rotation.z = tc.baseRot.z + Math.sin(t * tc.speed) * 0.035;
    tc.group.rotation.x = tc.baseRot.x + Math.cos(t * tc.speed * 0.8) * 0.025;
  });
  if (windChime) windChime.rotation.z = Math.sin(t * 1.3) * 0.055;
  if (gardenMotes) gardenMotes.rotation.y = Math.sin(t * 0.12) * 0.12;
  if (chimneySmoke) {
    const positions = chimneySmoke.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const age = (t * 0.5 + i * 0.8) % 5;
      positions.setXYZ(i, -5 + age * 0.25 + Math.sin(t * 0.6 + i) * 0.12, 12.2 + age, -1);
    }
    positions.needsUpdate = true;
  }
}
