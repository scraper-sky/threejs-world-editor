// ─── Imports (all from the same three@0.160.0 package) ──────────────────────
import * as THREE from 'https://esm.sh/three@0.160.0';
import { TransformControls }  from 'https://esm.sh/three@0.160.0/examples/jsm/controls/TransformControls.js';
import { OBJLoader }          from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader }         from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { SelectionBox }       from 'https://esm.sh/three@0.160.0/examples/jsm/interactive/SelectionBox.js';
import { setupScene }     from './scene/sceneManager.js';
import { setupSelector }  from './input/selector.js';
import { createCube, createSphere, createCylinder, createTorus } from './objects/prefabs.js';
import { HistoryManager } from './utils/history.js';
import { saveScene, loadScene } from './utils/saveLoad.js';
import { setupPalette }   from './ui/palette.js';

// ─── Scene & Renderer Setup ─────────────────────────────────────────────────
const { scene, camera, renderer, controls, grid } = setupScene();
const history    = new HistoryManager();
const gltfLoader = new GLTFLoader();
const objLoader  = new OBJLoader();
const uploadedAssets = [];

// ─── TransformControls & Undo Logic ──────────────────────────────────────────
const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);
transformControls.addEventListener('dragging-changed', e => controls.enabled = !e.value);

transformControls.addEventListener('objectChange', () => {
  if (_boxHelper) {
    // redraw the box whenever the group moves
    selectedGroup.updateMatrixWorld(true);
    _boxHelper.update();
  }
});

let transformSnapshot = null;
let _boxHelper = null; // will hold our 3D bounding‐box helper
transformControls.addEventListener('mouseDown', () => {
  const o = transformControls.object;
  if (!o) return;
  transformSnapshot = {
    object:  o,
    position:o.position.clone(),
    rotation:o.rotation.clone(),
    scale:   o.scale.clone()
  };
});
transformControls.addEventListener('mouseUp', () => {
  const o = transformControls.object;
  if (!o || !transformSnapshot) return;

  const { position: bP, rotation: bR, scale: bS } = transformSnapshot;
  const aP = o.position.clone(), aR = o.rotation.clone(), aS = o.scale.clone();

  if (!bP.equals(aP) || !bR.equals(aR) || !bS.equals(aS)) {
    history.execute(
      () => { o.position.copy(aP); o.rotation.copy(aR); o.scale.copy(aS); updateBoundingBox();},
      () => { o.position.copy(bP); o.rotation.copy(bR); o.scale.copy(bS); updateBoundingBox();}
    );
  }
  transformSnapshot = null;
});

// ─── Selection Data Structures ────────────────────────────────────────────────
const selectedGroup   = new THREE.Group();
selectedGroup.position.set(0,0,0);
selectedGroup.rotation.set(0,0,0);
selectedGroup.scale.set(1,1,1);
scene.add(selectedGroup);

let currentSelected = [];

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Clear any selection, reattach children to scene root */
function clearSelection() {
  currentSelected.forEach(o => {
    o.userData.isSelected = false;
    o.material?.color.set(0x00ff00);
    scene.attach(o);
  });
  selectedGroup.clear();
  currentSelected = [];
  transformControls.detach();
}

/** Handle single-click or shift-click on one mesh */
function handleSelection(clicked, event) {
  const shift = event?.shiftKey;

  // empty click → clear
  if (!clicked) { clearSelection(); return; }

  if (shift) {
    const idx = currentSelected.indexOf(clicked);
    if (idx !== -1) {
      // deselect
      clicked.userData.isSelected = false;
      clicked.material.color.set(0x00ff00);
      selectedGroup.remove(clicked);
      currentSelected.splice(idx,1);
    } else {
      // add
      clicked.userData.isSelected = true;
      clicked.material.color.set(0xff0000);
      selectedGroup.add(clicked);
      currentSelected.push(clicked);
    }
  } else {
    // single-click: clear then add
    clearSelection();
    clicked.userData.isSelected = true;
    clicked.material.color.set(0xff0000);
    selectedGroup.add(clicked);
    currentSelected = [clicked];
  }

  // attach TransformControls
  if (currentSelected.length === 1) {
    transformControls.attach(currentSelected[0]);
  } else if (currentSelected.length > 1) {
    transformControls.attach(selectedGroup);
  } else {
    transformControls.detach();
  }
}

/**
 * handleBoxSelection( hits )
 *  • groups + colours all hits
 *  • draws a 3D BoxHelper around the group
 *  • attaches the TransformControls
 */
// ─── Updated handleBoxSelection ─────────────────────────────────────────────
function handleBoxSelection(hits) {
  clearSelection();
  if (_boxHelper) {
    scene.remove(_boxHelper);
    _boxHelper = null;
  }
  if (hits.length === 0) return;

  // 1) compute bounds & center
  const tmpBox = new THREE.Box3();
  hits.forEach(o => tmpBox.expandByObject(o));
  const center = tmpBox.getCenter(new THREE.Vector3());

  // 2) reposition your group to that center
  selectedGroup.position.copy(center);

  // 3) reparent meshes *relative* to that center
  hits.forEach(obj => {
    obj.userData.isSelected = true;
    obj.material.color.set(0xff0000);
    // convert world→local
    obj.position.sub(center);
    selectedGroup.add(obj);
    currentSelected.push(obj);
  });

  // 4) draw your BoxHelper around the *group*
  selectedGroup.updateMatrixWorld(true);
  _boxHelper = new THREE.BoxHelper(selectedGroup, 0xffff00);
  scene.add(_boxHelper);

  // 5) attach the gizmo to the group
  transformControls.attach(selectedGroup);
}



/** Common init for imported GLTF/OBJ roots */
function initImported(root) {
  root.position.set(0, 0.5, 0);
  root.traverse(c => {
    if (c.isMesh) {
      c.userData.isSelectable = true;
      c.userData._root        = root;
    }
  });
  root.userData.isSelectable = true;
  root.userData._root        = root;
  scene.add(root);
}

/** Mark existing meshes selectable */
function markMeshesSelectable(obj) {
  obj.traverse(c => { if (c.isMesh) c.userData.isSelectable = true; });
}

// ─── Mouse‐drag Marquee Setup ─────────────────────────────────────────────────
const selectionBox = new SelectionBox(camera, scene);
let isDragging = false;

const marqueeEl = document.getElementById('selectBox');
let startPoint = new THREE.Vector2();

// on pointerdown: only enter marquee mode if Ctrl/Cmd
renderer.domElement.addEventListener('pointerdown', e => {
  const marqueeMode = e.ctrlKey || e.metaKey;
  if (!marqueeMode) return;

  e.preventDefault();
  controls.enabled = false;
  isDragging = true;

  // record screen coords
  const r = renderer.domElement.getBoundingClientRect();
  startPoint.set(e.clientX - r.left, e.clientY - r.top);

  // position & show the <div>
  marqueeEl.style.left   = `${startPoint.x}px`;
  marqueeEl.style.top    = `${startPoint.y}px`;
  marqueeEl.style.width  = `0px`;
  marqueeEl.style.height = `0px`;
  marqueeEl.style.display= 'block';

  // tell the SelectionBox too
  selectionBox.startPoint.set(
    (startPoint.x/r.width)*2 -1,
    -(startPoint.y/r.height)*2 +1,
    0.5
  );
});

renderer.domElement.addEventListener('pointermove', e => {
  if (!isDragging) return;
  e.preventDefault();

  const r = renderer.domElement.getBoundingClientRect();
  const currentX = e.clientX - r.left;
  const currentY = e.clientY - r.top;

  // update <div> dims
  const x = Math.min(currentX, startPoint.x),
        y = Math.min(currentY, startPoint.y),
        w = Math.abs(currentX - startPoint.x),
        h = Math.abs(currentY - startPoint.y);

  marqueeEl.style.left   = `${x}px`;
  marqueeEl.style.top    = `${y}px`;
  marqueeEl.style.width  = `${w}px`;
  marqueeEl.style.height = `${h}px`;

  // update SelectionBox endPoint
  selectionBox.endPoint.set(
    (currentX/r.width)*2 -1,
    -(currentY/r.height)*2 +1,
    0.5
  );
});

renderer.domElement.addEventListener('pointerup', e => {
  if (!isDragging) return;
  e.preventDefault();

  isDragging = false;
  controls.enabled = true;
  marqueeEl.style.display = 'none';

  // do the 3D selection
  const hits = selectionBox.select()
    .filter(o => o.userData.isSelectable);
  handleBoxSelection(hits);
});

// ─── Click / Shift‐Click Setup ───────────────────────────────────────────────
const selector = setupSelector(scene, camera, renderer, handleSelection);

// ─── Prefab & Palette Setup ──────────────────────────────────────────────────
function spawnObject(mesh) {
  mesh.position.set(0,0.5,0);
  history.execute(() => scene.add(mesh), () => scene.remove(mesh));
  clearSelection();
}
setupPalette('palette', spawnObject);

/**
 * Create a button in the bottom asset-bar for this model
 */
function addAssetBarButton(label, assetRoot) {
  const bar = document.getElementById('asset-bar');
  const btn = document.createElement('button');
  btn.textContent = label.replace(/\..+$/, ''); // strip extension
  btn.addEventListener('click', () => spawnAssetFromUpload(assetRoot));
  bar.appendChild(btn);
}

/**
 * Clone the uploaded asset & drop it into the scene
 */
function spawnAssetFromUpload(assetRoot) {
  // deep clone the group
  const clone = assetRoot.clone(true);
  // re-enable interactivity on all meshes
  clone.traverse(c => {
    if (c.isMesh) {
      c.userData.isSelectable = true;
      // copy material/color state if desired
    }
  });
  // position it at origin
  clone.position.set(0, 0.5, 0);
  // add via your undo/history system
  history.execute(
    () => scene.add(clone),
    () => scene.remove(clone)
  );
  clearSelection();
}

// ─── UI Button Bindings ──────────────────────────────────────────────────────
document.getElementById('addCube')   .addEventListener('click', () => spawnObject(createCube()));
document.getElementById('addSphere') .addEventListener('click', () => spawnObject(createSphere()));
document.getElementById('addCylinder').addEventListener('click', () => spawnObject(createCylinder()));
document.getElementById('addTorus')  .addEventListener('click', () => spawnObject(createTorus()));

document.getElementById('deleteSelected').addEventListener('click', () => {
  if (!currentSelected.length) return;
  history.execute(
    () => { currentSelected.forEach(o=>scene.remove(o)); clearSelection(); },
    () => { currentSelected.forEach(o=>scene.add(o)); }
  );
});

document.getElementById('undo')      .addEventListener('click', () => history.undo());
document.getElementById('redo')      .addEventListener('click', () => history.redo());
document.getElementById('saveScene').addEventListener('click', () => saveScene(scene));
document.getElementById('loadScene').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const json = JSON.parse(reader.result);
    [...scene.children].forEach(c => c.isMesh && scene.remove(c));
    loadScene(scene, json, m=>m.userData.isSelectable=true);
    clearSelection();
    history.undoStack = []; history.redoStack = [];
  };
  reader.readAsText(file);
});

// ─── Upload Model Handler ────────────────────────────────────────────────────
document.getElementById('uploadModel').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const isGLB = /\.glb$/i.test(file.name);
  const isOBJ = /\.obj$/i.test(file.name);
  const reader = new FileReader();

  reader.onload = evt => {
    if (isGLB) {
      gltfLoader.parse(evt.target.result, '', g=>initImported(g.scene), console.error);
      uploadedAssets.push(root);
      addAssetBarButton(file.name, root);
    } else if (isOBJ) {
      const root = objLoader.parse(evt.target.result);
      initImported(root);
      uploadedAssets.push(root);
      addAssetBarButton(file.name, root);
    } else {
      console.warn('Unsupported file:', file.name);
    }
  };

  if (isGLB) reader.readAsArrayBuffer(file);
  else        reader.readAsText(file);
});

// ─── Keyboard Shortcuts ─────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (e.key === 'g') transformControls.setMode('translate');
  if (e.key === 'r') transformControls.setMode('rotate');
  if (e.key === 's') transformControls.setMode('scale');
  if ( e.key === 'Escape' ) {
    clearSelection();
    if ( _boxHelper ) {
      scene.remove( _boxHelper );
      _boxHelper = null;
    }
    controls.enabled = true;
  }
});

// ─── Animation Loop ─────────────────────────────────────────────────────────
function animate() {
  try {
    requestAnimationFrame(animate);
    grid.position.x = camera.position.x;
    grid.position.z = camera.position.z;
    controls.update();
    renderer.render(scene, camera);
  } catch (error) {
    console.error('Error in animation loop:', error);
  }
}

// Start the animation loop
console.log('Starting animation loop...');
animate();
