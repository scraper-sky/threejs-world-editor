import * as THREE from 'https://esm.sh/three';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

export function setupScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  const canvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // create a large grid, we'll recenter it each frame
  const gridSize = 1000;
  const gridDivs = 200;
  const grid = new THREE.GridHelper(gridSize, gridDivs, 0xffffff, 0xffffff);
  grid.material.depthWrite = false;  // so it’s always visible
  grid.material.opacity    = 0.6;
  grid.material.transparent= true;
  scene.add(grid);

  // lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5, 10, 5);
  scene.add(directional);

  // handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // wrap up by returning everything plus our grid so we can update it
  return { scene, camera, renderer, controls, grid };
}
