import * as THREE from 'https://esm.sh/three';

export function createCube({ size = 1, color = 0x00ff00, name = 'Cube' } = {}) {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.name = name;
  mesh.userData.isSelectable = true;

  return mesh;
}

export function createSphere({ radius = 0.5, color = 0x0099ff, name = 'Sphere' } = {}) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.name = name;
  mesh.userData.isSelectable = true;

  return mesh;
}
