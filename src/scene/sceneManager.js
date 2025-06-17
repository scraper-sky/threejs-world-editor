import * as THREE from 'https://esm.sh/three';
import { OrbitControls } from 'https://esm.sh/three/examples/jsm/controls/OrbitControls.js';
//scene graph root, we create the camera and the renderer, set up visual helpers and add lighting/orbit controls, handle response resizing

export function setupScene() {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // we add orbit controls here 
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.update();

  // helpers to add gridHelper and axesHelper
  const gridHelper = new THREE.GridHelper(20, 20);
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(gridHelper);
  scene.add(axesHelper);

  // this handles lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // this handles window resizing 
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  //+OrbitControls, Grid, Axes, Lighting, Resizing ... 

  return { scene, camera, renderer, controls }; //we return scene, camera, and renderer for use in main.js
}
