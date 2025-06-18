import * as THREE from 'https://esm.sh/three@0.160.0';
//redundant because we already have TransformControls set up in main.js, but this is an optional lightweight dragging alternative if necessary

export function setupSimpleDrag(scene, camera, renderer, selector) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let dragging = false;
  let selected = null;
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // ground plane
  const intersection = new THREE.Vector3();

  function onMouseDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const objects = [];
    scene.traverse((child) => {
      if (child.isMesh && child.userData.isSelectable) objects.push(child);
    });

    const hits = raycaster.intersectObjects(objects);
    if (hits.length > 0) {
      selected = hits[0].object;
      dragging = true;
    }
  }

  function onMouseMove(event) {
    if (!dragging || !selected) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, intersection);
    selected.position.copy(intersection);
  }

  function onMouseUp() {
    dragging = false;
    selected = null;
  }

  renderer.domElement.addEventListener('pointerdown', onMouseDown);
  renderer.domElement.addEventListener('pointermove', onMouseMove);
  renderer.domElement.addEventListener('pointerup', onMouseUp);
}
