import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/addons/utils/BufferGeometryUtils.js';

// Keep moving parts and interactive roots separate; batch only their static siblings.
export function batchStatic(root, excluded = []) {
  root.updateMatrixWorld(true);
  const skip = new Set(excluded);
  const inverse = root.matrixWorld.clone().invert();
  const batches = new Map();
  function collect(object) {
    if (skip.has(object)) return;
    if (object.isMesh && !object.isSkinnedMesh && !object.isInstancedMesh &&
        !Array.isArray(object.material) && !object.material.transparent &&
        !Object.keys(object.geometry.morphAttributes).length) {
      const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}:${object.renderOrder}:${!!object.geometry.index}:${Object.keys(object.geometry.attributes).sort().join(',')}`;
      if (!batches.has(key)) batches.set(key, []);
      batches.get(key).push(object);
    }
    object.children.forEach(collect);
  }
  collect(root);
  batches.forEach(meshes => {
    if (meshes.length < 2) return;
    const geometries = meshes.map(mesh => mesh.geometry.clone().applyMatrix4(
      new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld)
    ));
    const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    geometries.forEach(g => g.dispose());
    if (!geometry) return;
    const source = meshes[0];
    const batch = new THREE.Mesh(geometry, source.material);
    batch.name = 'StaticBatch';
    batch.castShadow = source.castShadow;
    batch.receiveShadow = source.receiveShadow;
    batch.renderOrder = source.renderOrder;
    batch.matrixAutoUpdate = false;
    meshes.forEach(mesh => mesh.parent.remove(mesh));
    root.add(batch);
  });
}

export function canvasTexture(draw, width = 512, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = 4;
  return texture;
}
