import * as THREE from 'https://esm.sh/three';

export function saveScene(scene) {
  const json = scene.toJSON();
  const dataStr = JSON.stringify(json, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'scene.json';
  a.click();
}

export function loadScene(scene, jsonData, onObjectLoaded = () => {}) {
  const loader = new THREE.ObjectLoader();

  loader.parse(jsonData, (loadedScene) => {
    loadedScene.children.forEach(child => {
      if (child.isMesh) {
        child.userData.isSelectable = true; // Re-enable interactivity
        onObjectLoaded(child); // Optional: reattach logic
      }
      scene.add(child);
    });
  });
}
