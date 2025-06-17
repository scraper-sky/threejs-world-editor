import * as THREE from 'https://esm.sh/three';
import { TransformControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/TransformControls.js';
import { setupScene } from './scene/sceneManager.js';
import { setupSelector } from './input/selector.js';
import { createCube, createSphere } from './objects/prefabs.js';
import { HistoryManager } from './utils/history.js';
import { saveScene, loadScene } from './utils/saveLoad.js';
import { setupPalette } from './ui/palette.js';


/* Setup */
const { scene, camera, renderer, controls } = setupScene();
const history = new HistoryManager();

const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);

// Disable orbit controls while transforming
transformControls.addEventListener('dragging-changed', (event) => {
  controls.enabled = !event.value;
});

// Track transform for undo
let transformSnapshot = null;

transformControls.addEventListener('mouseDown', () => {
  const obj = transformControls.object;
  if (!obj) return;

  transformSnapshot = {
    object: obj,
    position: obj.position.clone(),
    rotation: obj.rotation.clone(),
    scale: obj.scale.clone()
  };
});

transformControls.addEventListener('mouseUp', () => {
  const obj = transformControls.object;
  if (!obj || !transformSnapshot) return;

  const { position: beforePos, rotation: beforeRot, scale: beforeScale } = transformSnapshot;

  const afterPos = obj.position.clone();
  const afterRot = obj.rotation.clone();
  const afterScale = obj.scale.clone();

  const changed =
    !beforePos.equals(afterPos) ||
    !beforeRot.equals(afterRot) ||
    !beforeScale.equals(afterScale);

  if (!changed) return;

  // Push transformation to undo stack
  history.execute(
    () => {
      obj.position.copy(afterPos);
      obj.rotation.copy(afterRot);
      obj.scale.copy(afterScale);
    },
    () => {
      obj.position.copy(beforePos);
      obj.rotation.copy(beforeRot);
      obj.scale.copy(beforeScale);
    }
  );

  transformSnapshot = null;
});

// Keyboard shortcuts to switch transform modes
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'g':
      transformControls.setMode('translate');
      break;
    case 'r':
      transformControls.setMode('rotate');
      break;
    case 's':
      transformControls.setMode('scale');
      break;
  }
});

setupPalette('palette', spawnObject);

/* Selection logic */
let lastSelected = null;

function handleSelection(selected) {
  if (lastSelected && lastSelected !== selected) {
    lastSelected.material.color.set(0x00ff00);
    lastSelected.userData.isSelected = false;
    transformControls.detach();
  }

  if (selected) {
    selected.material.color.set(0xff0000);
    selected.userData.isSelected = true;
    transformControls.attach(selected);
    lastSelected = selected;
  } else {
    transformControls.detach();
    lastSelected = null;
  }
}

const selector = setupSelector(scene, camera, renderer, handleSelection);

/* Utility to add object with undo support */
function spawnObject(mesh) {
  mesh.position.set(0, 0.5, 0);
  history.execute(
    () => scene.add(mesh),
    () => scene.remove(mesh)
  );
  selector.clearSelection();
  transformControls.detach();
}

/* UI Buttons */
document.getElementById('addCube').addEventListener('click', () => {
  spawnObject(createCube());
});

document.getElementById('addSphere').addEventListener('click', () => {
  spawnObject(createSphere());
});

document.getElementById('deleteSelected').addEventListener('click', () => {
  const selected = selector.getSelected();
  if (!selected) return;

  history.execute(
    () => {
      scene.remove(selected);
      selector.clearSelection();
      transformControls.detach();
    },
    () => {
      scene.add(selected);
    }
  );
});

document.getElementById('undo').addEventListener('click', () => {
  history.undo();
});

document.getElementById('redo').addEventListener('click', () => {
  history.redo();
});

document.getElementById('saveScene').addEventListener('click', () => {
  saveScene(scene);
});

document.getElementById('loadScene').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const json = JSON.parse(reader.result);

    // Clear current scene first (excluding camera, light, grid, etc.)
    [...scene.children].forEach((c) => {
      if (c.isMesh) scene.remove(c);
    });

    loadScene(scene, json, (mesh) => {
      mesh.userData.isSelectable = true;
    });

    selector.clearSelection();
    transformControls.detach();
    history.undoStack = [];
    history.redoStack = [];
  };
  if (file) reader.readAsText(file);
});

/* Animation loop */
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
