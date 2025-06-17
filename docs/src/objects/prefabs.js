import * as THREE from 'https://esm.sh/three@0.160.0';

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


export function createCylinder() {
  // radiusTop, radiusBottom, height, radialSegments
  const geo  = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  const mat  = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isSelectable = true;
  return mesh;
}

export function createTorus() {
  // radius, tube, radialSegments, tubularSegments
  const geo  = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
  const mat  = new THREE.MeshStandardMaterial({ color: 0x8888ff });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isSelectable = true;
  return mesh;
}

export function createPlane() {
  // width, height, widthSegments, heightSegments
  const geo  = new THREE.PlaneGeometry(2, 2, 1, 1);
  const mat  = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;   // lay it flat
  mesh.userData.isSelectable = true;
  return mesh;
}
