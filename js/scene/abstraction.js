import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  scene, camera, renderer, composer, reducedMotion, ambient, dirLight,
  tvLight, lampLight, windowLightAmb
} from './sceneSetup.js';
import {
  exteriorGroup, skyDome, sunSprite, breakableRoofs, outdoorLights, birdFlock
} from './exteriorScene.js';
import { canvasTexture, batchStatic } from './sceneUtils.js';
import { prepModel, fitModelToHeight } from '../objects/roomObjects.js';
import {
  startAbstractionAudio, updateAbstractionAudio, playAbstractionImpact, setAbstractionMuted
} from '../audio/audioManager.js';

const color = hex => new THREE.Color(hex).convertSRGBToLinear();
const smooth = (start, end, value) => THREE.MathUtils.smoothstep(value, start, end);
const vertexShader = `varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const noiseGLSL = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
      mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
  }
  float fbm(vec2 p) { return noise(p) * .57 + noise(p * 2.03) * .28 + noise(p * 4.07) * .15; }
`;

// One post pass: displaced scan bands, RGB separation, grain and a dark lens edge.
// Bursts are short and spaced apart; there is no full-screen white strobe.
function createGlitchPass() {
  return new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAmount: { value: 0 }, uRuin: { value: 0 } },
    vertexShader,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime, uAmount, uRuin;
      varying vec2 vUv;
      ${noiseGLSL}
      void main() {
        vec2 uv = vUv;
        float tick = floor(uTime * 13.0);
        float band = floor(uv.y * 23.0);
        float tear = step(.81, hash(vec2(band, tick)));
        uv.x += (hash(vec2(band + 7., tick)) - .5) * tear * uAmount * .16;
        uv.x += sin(uv.y * 85. + uTime * 2.) * .001 * uRuin;
        uv = clamp(uv, .001, .999);
        float split = .0007 * uRuin + .011 * uAmount;
        vec3 c = vec3(texture2D(tDiffuse, uv + vec2(split, 0.)).r,
          texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - vec2(split, 0.)).b);
        c *= 1.0 - .07 * uRuin * (.5 + .5 * sin(vUv.y * 1000.));
        c += (hash(vUv * 1200. + mod(uTime, 100.)) - .5) * (.025 * uRuin + uAmount * .045);
        float edge = smoothstep(.20, .72, distance(vUv, vec2(.5)));
        c *= 1.0 - edge * .5 * uRuin;
        gl_FragColor = vec4(max(c, 0.), 1.);
      }`
  });
}

function makeRiftMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms, side: THREE.DoubleSide, toneMapped: false,
    vertexShader: `varying vec2 vPoint;
      void main() { vPoint = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `
      varying vec2 vPoint;
      uniform float uTime, uMotion;
      uniform vec2 uGaze;
      ${noiseGLSL}
      vec3 neon(float n) {
        if (n < .2) return vec3(.1, 1., .8);
        if (n < .4) return vec3(.94, .04, .75);
        if (n < .6) return vec3(.55, 1., .04);
        if (n < .8) return vec3(1., .65, .06);
        return vec3(.07, .8, 1.);
      }
      void main() {
        vec2 p = vPoint;
        vec3 c = vec3(.002, .001, .008);
        for (int i = 0; i < 9; i++) {
          float n = float(i);
          vec2 center = vec2(sin(n * 2.4) * .28, -1.54 + n * .385);
          vec2 q = p - center;
          float angle = sin(n * 7.1) * .65;
          q = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * q;
          float blink = 1. - uMotion * .95 * pow(max(0., cos(uTime * .65 + n * 2.3)), 60.);
          q /= vec2(.24 + hash(vec2(n, 4.)) * .12, .14 * blink);
          float lens = 1. - pow(abs(q.x), 1.3) - q.y * q.y;
          if (lens > 0.) {
            c = neon(fract(n * .37));
            vec2 eye = (q - uGaze * vec2(.24, .2)) * vec2(1., .53);
            float iris = length(eye);
            if (iris < .36) c = vec3(.005);
            if (iris < .285) c = neon(fract(n * .37 + .5));
            if (iris < .20) c = vec3(.01, .005, .025);
            if (iris < .14) c = neon(fract(n * .37 + .25));
            if (iris < .085) c = vec3(.003);
            if (length(eye - vec2(-.05, .05)) < .035) c = vec3(.9, 1., 1.);
            c *= smoothstep(0., .10, lens);
          }
        }
        c *= .91 + .09 * hash(floor(p * 480.));
        gl_FragColor = vec4(c, 1.);
      }`
  });
}

function makeFireMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `varying vec2 vUv; varying float vSeed;
      void main() { vUv = uv; vSeed = modelMatrix[3].x * .7 + modelMatrix[3].z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `
      varying vec2 vUv; varying float vSeed;
      uniform float uTime;
      ${noiseGLSL}
      void main() {
        vec2 uv = vUv;
        float n = fbm(vec2(uv.x * 5. + vSeed, uv.y * 5. - uTime * 2.8));
        float sway = sin(uv.y * 8. - uTime * 2. + vSeed) * .08 * uv.y;
        float width = pow(1. - uv.y, .8) * .48;
        float body = width - abs(uv.x - .5 + sway) - n * .22;
        float alpha = smoothstep(0., .12, body) * (1. - smoothstep(.78, 1., uv.y));
        vec3 c = mix(vec3(.7, .015, .004), vec3(1., .23, .015), smoothstep(.03, .2, body));
        c = mix(c, vec3(1., .83, .29), smoothstep(.18, .38, body) * (1. - uv.y));
        gl_FragColor = vec4(c, alpha * .9);
      }`
  });
}

export function createAbstraction(room, roomContainer) {
  const overlay = document.getElementById('abstraction-overlay');
  const message = document.getElementById('abstraction-message');
  const controls = document.getElementById('abstraction-controls');
  const announcement = document.getElementById('abstraction-announcement');
  const motion = { value: reducedMotion.matches ? 0 : 1 };
  const time = { value: 0 };
  const gaze = { value: new THREE.Vector2() };
  const rifts = [], fires = [], moves = [], particles = [], lightRecords = [], materialRecords = [];
  const clearColor = new THREE.Color();
  const ash = color(0x6b343e), ember = color(0xe95842);
  let elapsed = 0, active = false, amount = 0, phase = -1, built = false;
  let pass, insideFX, outsideFX, errorTexture, lastTextTick = -1, lastRumble = -1;
  let monsterGroup = null, monsterMixer = null, monsterWaypoint = 0;
  let muted = false;
  const monsterPath = [
    new THREE.Vector3(8, 0, 24), new THREE.Vector3(14, 0, 29), new THREE.Vector3(8, 0, 35),
    new THREE.Vector3(-2, 0, 37), new THREE.Vector3(-12, 0, 33), new THREE.Vector3(-16, 0, 26),
    new THREE.Vector3(-8, 0, 20)
  ];
  const assetCredit = document.getElementById('asset-credit');
  const hudText = [document.getElementById('loc-name'), document.getElementById('loc-sub'), document.getElementById('hint-text')];
  const corruptedText = ['ROOM // NOT FOUND', '// something is looking back', 'The door is still there.'];

  document.addEventListener('pointermove', event => {
    gaze.value.set(event.clientX / innerWidth * 2 - 1, 1 - event.clientY / innerHeight * 2);
  });
  document.getElementById('abstraction-reset').addEventListener('click', () => location.reload());
  document.getElementById('abstraction-sound').addEventListener('click', event => {
    muted = !muted;
    setAbstractionMuted(muted);
    event.currentTarget.textContent = muted ? 'Unmute sound' : 'Mute sound';
    event.currentTarget.setAttribute('aria-pressed', String(muted));
  });

  function move(object, offset, rotation) {
    moves.push({ object, position: object.position.clone(), rotation: object.rotation.clone(), offset, turn: rotation });
  }

  function addRift(parent, x, y, z, size, turn = 0, wall = false) {
    // Asymmetric tears with long splinters; the eyes live inside the 3D opening.
    const points = [
      [-.06, 2.25], [.16, 1.65], [.55, 1.93], [.28, 1.22], [.61, 1.31], [.45, .92],
      [.96, 1.08], [.55, .52], [.7, .31], [.46, .08], [.9, -.21], [.47, -.36],
      [.65, -.84], [.29, -.7], [.4, -1.31], [.1, -1.1], [-.05, -2.18], [-.22, -1.38],
      [-.58, -1.61], [-.35, -1.01], [-.7, -.89], [-.44, -.49], [-.97, -.41],
      [-.51, -.03], [-.74, .31], [-.42, .59], [-.58, 1.15], [-.25, 1.04], [-.34, 1.69], [-.1, 1.46]
    ];
    const shape = new THREE.Shape(points.map(([px, py]) => new THREE.Vector2(px, py)));
    const geometry = new THREE.ShapeGeometry(shape);
    const group = new THREE.Group();
    group.name = 'RealityRift';
    group.position.set(x, y, z);
    group.rotation.set(0, wall ? 0 : .12, turn);
    const rim = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: color(0x8b214b), side: THREE.DoubleSide }));
    rim.scale.set(1.045, 1.012, 1); rim.position.z = -.018; group.add(rim);
    group.add(new THREE.Mesh(geometry, makeRiftMaterial({ uTime: time, uMotion: motion, uGaze: gaze })));
    group.scale.setScalar(.001);
    parent.add(group);
    rifts.push({ group, size, turn, wall, seed: rifts.length * 1.7 });
    return group;
  }

  function addFire(parent, x, y, z, height, material) {
    const fire = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    fire.name = 'AbstractionFire';
    fire.position.set(x, y + height * .5, z);
    fire.scale.set(height * .8, height, 1);
    parent.add(fire);
    fires.push({ fire, height, y });
  }

  function addEmbers(parent, count, spread, height) {
    const positions = [], seeds = [];
    for (let i = 0; i < count; i++) {
      positions.push((Math.random() - .5) * spread, Math.random() * height, (Math.random() - .5) * spread);
      seeds.push(Math.random());
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: time, uHeight: { value: height }, uOpacity: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aSeed; uniform float uTime, uHeight, uPixelRatio; varying float vSeed;
        void main() {
          vSeed = aSeed;
          vec3 p = position;
          p.y = mod(p.y + uTime * (.3 + aSeed * .9), uHeight);
          p.x += sin(uTime * .3 + aSeed * 50.) * .6;
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          gl_PointSize = clamp((22. + aSeed * 40.) / max(1., -mv.z), 1., 4.) * uPixelRatio;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform float uOpacity; varying float vSeed;
        void main() { float a = 1. - smoothstep(.1, .5, length(gl_PointCoord - .5));
          gl_FragColor = vec4(mix(vec3(.6, .07, .015), vec3(1., .64, .19), vSeed), a * uOpacity); }`
    });
    const sparks = new THREE.Points(geometry, material);
    sparks.frustumCulled = false;
    parent.add(sparks);
    particles.push(material);
  }

  function addRubble(parent, count, spread, zOffset = 0) {
    const group = new THREE.Group();
    const materials = [0x42262d, 0x735344, 0x2d232a].map(hex => new THREE.MeshLambertMaterial({ color: color(hex) }));
    const shard = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(shard, materials[i % 3]);
      mesh.position.set((Math.random() - .5) * spread, .09 + Math.random() * .17, (Math.random() - .5) * spread + zOffset);
      mesh.scale.set(.12 + Math.random() * .6, .08 + Math.random() * .18, .15 + Math.random() * .45);
      mesh.rotation.set(Math.random(), Math.random() * 6, Math.random());
      group.add(mesh);
    }
    parent.add(group);
    batchStatic(group);
  }

  function addMonsterSilhouette(parent) {
    const points = [
      [-1.55, .05], [-2.05, .52], [-1.48, .74], [-1.82, 1.28], [-1.24, 1.18],
      [-1.38, 1.86], [-.82, 1.66], [-.92, 2.48], [-.27, 2.18], [.02, 2.92],
      [.42, 2.34], [.93, 2.62], [.83, 2.02], [1.55, 2.22], [1.22, 1.55],
      [1.86, 1.46], [1.36, .95], [1.78, .47], [1.16, .31], [1.34, .04],
      [.72, .14], [.46, -.42], [.06, .02], [-.36, -.52], [-.62, .08], [-1.12, -.30]
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const shape = new THREE.Shape(points);
    const geometry = new THREE.ShapeGeometry(shape);
    const visual = new THREE.Group();
    visual.name = 'AbstractedSilhouetteGroup';
    visual.scale.set(1.12, 1.7, 1);
    parent.add(visual);
    const outline = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0xb52b62, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false
    }));
    outline.name = 'AbstractedSilhouetteRim';
    outline.position.set(0, 0, -.34);
    outline.scale.set(1.08, 1.08, 1);
    outline.renderOrder = 15;
    visual.add(outline);
    const body = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0x1c0615, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false
    }));
    body.name = 'AbstractedSilhouette';
    body.position.z = -.30;
    body.renderOrder = 16;
    visual.add(body);

    const eyeColors = [0x26e7e4, 0xff2e98, 0x8eff32, 0xffbd32, 0x44a7ff];
    [[-.83, 1.28, .30], [.24, 2.05, .34], [.86, 1.42, .28], [-.16, .74, .25], [.78, .46, .22]]
      .forEach(([x, y, size], i) => {
        const eye = new THREE.Group();
        eye.position.set(x, y, .02);
        const ring = new THREE.Mesh(new THREE.CircleGeometry(size, 18), new THREE.MeshBasicMaterial({
          color: eyeColors[i], side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false
        }));
        const iris = new THREE.Mesh(new THREE.CircleGeometry(size * .58, 16), new THREE.MeshBasicMaterial({
          color: 0xf5edc7, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false
        }));
        const pupil = new THREE.Mesh(new THREE.CircleGeometry(size * .27, 12), new THREE.MeshBasicMaterial({
          color: 0x09020d, side: THREE.DoubleSide, depthTest: false, depthWrite: false, toneMapped: false
        }));
        ring.renderOrder = 17; iris.renderOrder = 18; pupil.renderOrder = 19;
        eye.add(ring, iris, pupil);
        visual.add(eye);
      });
  }

  function loadAbstractedMonster() {
    new GLTFLoader().load('model/abstracted.glb', gltf => {
      const model = gltf.scene;
      prepModel(model);
      fitModelToHeight(model, 5.6);
      model.scale.multiplyScalar(1.8);
      model.position.z = .18;
      model.traverse(object => {
        if (!object.isMesh) return;
        object.frustumCulled = false;
        object.renderOrder = 20;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => { material.depthTest = false; material.depthWrite = false; });
      });
      monsterGroup = new THREE.Group();
      monsterGroup.name = 'AbstractedKaufmo';
      monsterGroup.position.copy(monsterPath[0]);
      monsterGroup.rotation.y = Math.PI;
      monsterGroup.visible = false;
      addMonsterSilhouette(monsterGroup);
      monsterGroup.add(model);
      outsideFX.add(monsterGroup);
      const walk = THREE.AnimationClip.findByName(gltf.animations, 'Walk') ||
        THREE.AnimationClip.findByName(gltf.animations, 'Run') ||
        THREE.AnimationClip.findByName(gltf.animations, 'Idle');
      if (walk) {
        monsterMixer = new THREE.AnimationMixer(model);
        monsterMixer.clipAction(walk).setLoop(THREE.LoopRepeat, Infinity).play();
      }
      if (exteriorGroup.visible) assetCredit.hidden = false;
    }, undefined, error => console.warn('Abstracted model could not load:', error));
  }

  function build() {
    // Allocate shaders and geometry only after the secret is unlocked.
    built = true;
    pass = createGlitchPass();
    composer.addPass(pass);
    const materials = new Set();
    [roomContainer, exteriorGroup].forEach(root => root.traverse(object => {
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(mat => materials.add(mat));
    }));
    materials.forEach(mat => {
      if (mat.color) materialRecords.push({ mat, original: mat.color.clone(), target: mat.color.clone().lerp(ash, .6) });
    });
    const lights = new Set([ambient, dirLight, tvLight, lampLight, windowLightAmb]);
    [roomContainer, exteriorGroup].forEach(root => root.traverse(object => { if (object.isLight) lights.add(object); }));
    lights.forEach(light => lightRecords.push({ light, color: light.color.clone(),
      base: outdoorLights.find(record => record.light === light)?.baseIntensity ?? light.intensity,
      switch: room.clickables.find(obj => obj.userData.toggleLight === light) }));

    skyDome.material = new THREE.ShaderMaterial({
      uniforms: { uTime: time }, side: THREE.BackSide, depthWrite: false, toneMapped: false,
      vertexShader: `varying vec3 vDirection;
        void main() { vDirection = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `varying vec3 vDirection; uniform float uTime; ${noiseGLSL}
        void main() {
          vec3 p = normalize(vDirection);
          float clouds = fbm(p.xz * 5. + vec2(uTime * .022, 0.) + p.y * 2.);
          vec3 c = mix(vec3(.32, .018, .035), vec3(.035, .003, .016), smoothstep(-.05, .75, p.y));
          c *= .45 + clouds * .9;
          c += vec3(.16, .016, .003) * pow(max(0., 1. - abs(p.y) * 3.), 3.);
          gl_FragColor = vec4(c, 1.);
        }`
    });
    sunSprite.visible = false;
    birdFlock.forEach(bird => { bird.group.visible = false; });

    insideFX = new THREE.Group(); insideFX.name = 'AbstractionRoom'; roomContainer.add(insideFX);
    outsideFX = new THREE.Group(); outsideFX.name = 'AbstractionOutside'; exteriorGroup.add(outsideFX);
    addRift(insideFX, -3.6, 4.3, -6.57, 1.58, -.30, true);
    addRift(insideFX, 6.5, 4.45, -2.9, 1.2, .34);
    addRift(insideFX, -6.5, 3.2, -.2, 1.02, -.62);
    const ceilingTear = addRift(insideFX, 1.3, 7.77, -1.5, 1.15, .6, true);
    ceilingTear.rotation.x = Math.PI / 2;
    const floorTear = addRift(insideFX, 1.0, .083, 4.8, 1.20, -.4, true);
    floorTear.rotation.x = -Math.PI / 2;

    // Spread the eyes across the back wall so the abstraction feels structural.
    [
      [-6.45, 2.65, .42, -.38], [-5.35, 5.65, .36, .16], [-4.15, 3.95, .48, -.44],
      [-2.65, 5.82, .40, .28], [-1.18, 3.22, .35, -.20], [.38, 5.35, .45, .22],
      [1.86, 3.60, .40, -.42], [3.48, 5.74, .47, .30], [5.12, 3.42, .44, -.24],
      [6.42, 5.78, .36, .36]
    ].forEach(([x, y, size, turn]) => addRift(insideFX, x, y, -6.70, size, turn, true));
    const sideEyeA = addRift(insideFX, 7.70, 5.45, -4.9, .43, .22, true);
    sideEyeA.rotation.y = -Math.PI / 2;
    const sideEyeB = addRift(insideFX, 7.70, 3.55, 1.6, .38, -.25, true);
    sideEyeB.rotation.y = -Math.PI / 2;
    addRift(outsideFX, -19, 18, -8, 7, -.43);
    addRift(outsideFX, 15, 22, -19, 8.5, .27);
    addRift(outsideFX, -40, 12, 15, 6, -.12);
    addRift(outsideFX, 5, 6, 7.65, 2, .22, true);
    const roadTear = addRift(outsideFX, 1, .3, 27, 6.5, .7, true);
    roadTear.rotation.x = -Math.PI / 2;

    const fireMaterial = makeFireMaterial({ uTime: time });
    [[-5.5, 0, -3, 2.4], [4.7, 0, -3.2, 3], [-3, 0, 1.5, 1.4], [6.8, 0, 2.5, 2.1],
      [-6.7, 0, 4.4, 1.3], [1.8, 0, -5.5, 2], [.7, .08, 3.6, 1.8]].forEach(p => addFire(insideFX, ...p, fireMaterial));
    [[-6, 0, 12, 6], [7, 0, 10, 7], [12, 0, 17, 4], [-12, 0, 22, 5], [3, 5, 2, 8],
      [-5, 7.6, 0, 7], [18, 0, 1, 6], [-22, 0, 4, 8], [6, 0, 30, 3.5], [-15, 0, 32, 3],
      [26, 0, -10, 9], [-29, 0, -13, 8]].forEach(p => addFire(outsideFX, ...p, fireMaterial));
    [[insideFX, -4, 2, -1, 10], [insideFX, 5, 2, -1, 11], [outsideFX, 0, 5, 10, 32]].forEach(([root, x, y, z, distance]) => {
      const fireLight = new THREE.PointLight(0xff5224, 1.7, distance);
      fireLight.position.set(x, y, z); root.add(fireLight);
    });
    addEmbers(insideFX, 130, 15, 8);
    addEmbers(outsideFX, 300, 65, 30);
    addRubble(insideFX, 65, 13, 1.5);
    addRubble(outsideFX, 95, 48, 15);
    loadAbstractedMonster();

    const [chair, desk, piano, poster, plant] = room.movableProps;
    move(chair, [-1.8, .4, 1.0], [0, -.55, 1.3]);
    move(desk, [.1, .15, -.25], [0, -.05, -.085]);
    move(piano, [.75, .25, .2], [.16, .18, -.28]);
    move(poster, [.22, -.4, 0], [0, 0, .26]);
    move(plant, [-.4, .2, 1.0], [.65, 0, -.55]);
    move(room.shelfGroup, [.25, .12, -.12], [-.06, -.08, -.16]);
    move(room.posterGroup, [.05, -.12, .07], [0, 0, -.20]);
    move(room.floorLampR, [-.6, .35, 0], [0, 0, -.45]);
    move(room.acGroup, [-.12, 0, 0], [.08, 0, -.05]);
    move(room.laptopGroup, [.45, -.09, .4], [.03, -.2, -.10]);
    breakableRoofs.forEach((roof, i) => {
      move(roof, [i % 2 ? 1.2 : -1, .65, .4], [.06, .08, -.11]);
      move(roof.children[0], [-.4, -.9, .4], [.08, 0, .19]);
      move(roof.children[1], [1, 1.45, -.6], [-.18, 0, -.2]);
    });

    // Fallen books and loose paper make the room read as physically disturbed.
    const debris = new THREE.Group(); insideFX.add(debris);
    const paper = new THREE.MeshLambertMaterial({ color: color(0xb39b85), side: THREE.DoubleSide });
    const covers = [0x5b3942, 0x857348, 0x31534e].map(hex => new THREE.MeshLambertMaterial({ color: color(hex) }));
    for (let i = 0; i < 20; i++) {
      const book = new THREE.Mesh(i < 9 ? new THREE.BoxGeometry(.45, .10, .65) : new THREE.PlaneGeometry(.4, .55), i < 9 ? covers[i % 3] : paper);
      book.position.set(1.5 + Math.sin(i * 2.4) * 4.5, .11 + i % 3 * .02, -1.3 + Math.cos(i * 1.7) * 4);
      book.rotation.set(i < 9 ? .08 : -Math.PI / 2, i * 1.6, i < 9 ? .14 : 0);
      debris.add(book);
    }
    batchStatic(debris);
    errorTexture = canvasTexture((ctx, w, h) => {
      ctx.fillStyle = '#080409'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff4260'; ctx.font = 'bold 45px monospace'; ctx.fillText('NO SIGNAL', 38, 105);
      ctx.font = '19px monospace'; ctx.fillText('YOU LET IT IN.', 40, 151);
      ctx.fillStyle = '#8cbfc5'; ctx.fillText('reality.sys is not responding', 40, 213);
      ctx.fillStyle = '#431525';
      for (let y = 0; y < h; y += 7) ctx.fillRect(0, y, w, 1);
    }, 512, 320);
    room.screens.forEach(screen => { screen.material.map = errorTexture; screen.material.needsUpdate = true; });
    room.particles.visible = false;
    insideFX.visible = outsideFX.visible = false;
  }

  function setPhase(next) {
    if (phase === next) return;
    phase = next;
    const messages = ['OVERRIDE ACCEPTED', 'SOMETHING IS WRONG', 'DON\'T LOOK AWAY', 'IT CAN SEE YOU', ''];
    message.textContent = messages[next];
    message.dataset.text = messages[next];
    overlay.classList.toggle('show-message', next < 4);
    document.body.dataset.abstraction = next === 4 ? 'ruined' : 'shifting';
    if (next === 1 || next === 2 || next === 3) playAbstractionImpact(next === 2 ? 1 : .5);
    if (next === 4) {
      announcement.textContent = 'The world has changed. You can explore outside, mute the sound, or restore the world.';
      document.getElementById('back-btn').focus({ preventScroll: true });
    }
  }

  return {
    get active() { return active; },
    get transitioning() { return active && elapsed < (reducedMotion.matches ? 2.2 : 10.5); },
    start() {
      if (active) return;
      active = true;
      startAbstractionAudio();
      playAbstractionImpact(.25);
      build();
      document.body.classList.add('abstracted');
      controls.hidden = false;
      announcement.textContent = 'Service override accepted. The world is changing.';
      setPhase(0);
    },
    outside() {
      if (!active) return;
      const title = document.querySelector('.menu-title');
      title.textContent = 'what have you done';
      title.dataset.text = 'what have you done';
      document.querySelector('.menu-subtitle').textContent = 'there is no outside anymore.';
      document.querySelector('[data-action="enter"] span:last-child').textContent = 'GO BACK INSIDE';
      assetCredit.hidden = false;
      announcement.textContent = 'what have you done';
      playAbstractionImpact(.7);
    },
    update(dt, state) {
      if (!active || !built) return;
      elapsed += dt;
      const reduced = reducedMotion.matches;
      const duration = reduced ? 2.2 : 10.5;
      const progress = Math.min(elapsed / duration, 1);
      amount = smooth(.12, .84, progress);
      motion.value = reduced ? 0 : 1;
      time.value = reduced ? 7 : elapsed;
      setPhase(progress >= 1 ? 4 : progress > .65 ? 3 : progress > .34 ? 2 : progress > .13 ? 1 : 0);
      updateAbstractionAudio(progress);

      const pulse = reduced ? 0 : Math.pow(Math.max(0, Math.sin(elapsed * .9)), 32);
      const burst = reduced ? 0 : progress < 1 ? (.16 + .5 * Math.pow(Math.sin(elapsed * 1.3), 12)) * smooth(0, .15, progress) : .13 * pulse;
      pass.uniforms.uTime.value = time.value;
      pass.uniforms.uAmount.value = burst;
      pass.uniforms.uRuin.value = amount;
      const rumble = Math.floor(elapsed / 8);
      if (progress === 1 && rumble !== lastRumble) { lastRumble = rumble; playAbstractionImpact(.2); }
      document.body.classList.toggle('glitch-burst', burst > .24 || pulse > .86);
      overlay.style.setProperty('--ruin', amount.toFixed(3));

      const outside = exteriorGroup.visible;
      if (monsterMixer) monsterMixer.update(reduced ? 0 : dt);
      if (monsterGroup) monsterGroup.visible = outside && amount > .02;
      if (monsterGroup?.visible && !reduced) {
        const target = monsterPath[monsterWaypoint];
        const dx = target.x - monsterGroup.position.x;
        const dz = target.z - monsterGroup.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance < .65) monsterWaypoint = (monsterWaypoint + 1) % monsterPath.length;
        else {
          const step = Math.min(distance, dt * 1.45);
          monsterGroup.position.x += dx / distance * step;
          monsterGroup.position.z += dz / distance * step;
          monsterGroup.rotation.y = Math.atan2(dx, dz) + Math.PI;
        }
      }
      clearColor.set(outside ? 0x350716 : 0x190b13).convertSRGBToLinear();
      renderer.setClearColor(clearColor);
      scene.fog.color.copy(clearColor);
      scene.fog.near = outside ? 34 : 28;
      scene.fog.far = outside ? 140 : 82;
      renderer.toneMappingExposure = .95 - amount * .07;
      materialRecords.forEach(({ mat, original, target }) => mat.color.lerpColors(original, target, amount));
      lightRecords.forEach(({ light, color: original, base, switch: toggle }) => {
        light.color.lerpColors(original, ember, amount * .84);
        const on = toggle ? toggle.userData.on : true;
        light.intensity = on ? base * (1 - amount * .3) : 0;
        if (light.isHemisphereLight) light.groundColor.copy(ash);
      });
      insideFX.visible = outsideFX.visible = amount > .02;
      const grow = smooth(.15, .72, progress);
      rifts.forEach(({ group, size, turn, wall, seed }) => {
        group.scale.set(size * grow * (1 + (reduced ? 0 : Math.sin(elapsed * .65 + seed) * .025)), size * grow, size);
        if (!wall) {
          group.quaternion.copy(camera.quaternion);
          group.rotateZ(turn + (reduced ? 0 : Math.sin(elapsed * .3 + seed) * .025));
        }
      });
      fires.forEach(({ fire, height, y }, i) => {
        const rise = height * smooth(.3, .83, progress) * (1 + (reduced ? 0 : Math.sin(elapsed * 2 + i) * .04));
        fire.scale.set(height * .8, rise, 1);
        fire.position.y = y + rise * .5;
        fire.quaternion.copy(camera.quaternion);
      });
      particles.forEach(material => {
        material.uniforms.uOpacity.value = grow * .8;
        material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      });
      moves.forEach(({ object, position, rotation, offset, turn }, i) => {
        const shift = smooth(.27 + i % 3 * .03, .78, progress);
        object.position.set(position.x + offset[0] * shift, position.y + offset[1] * shift, position.z + offset[2] * shift);
        object.rotation.set(rotation.x + turn[0] * shift, rotation.y + turn[1] * shift, rotation.z + turn[2] * shift);
      });
      if (!reduced && (state === 'ROOM' || state === 'OUTSIDE')) {
        camera.rotation.z += Math.sin(elapsed * 7) * burst * .008;
        camera.position.x += Math.sin(elapsed * 17) * burst * .055;
      }
      const tick = Math.floor(elapsed * 9);
      if (tick !== lastTextTick) {
        lastTextTick = tick;
        hudText.forEach((element, index) => {
          const text = corruptedText[index];
          element.textContent = !reduced && burst > .24 ? [...text].map((c, i) => c !== ' ' && (i + tick) % 7 === 0 ? '#/_[01'[Math.abs(i + tick) % 6] : c).join('') : text;
        });
      }
    }
  };
}
