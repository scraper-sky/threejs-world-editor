import * as THREE from 'https://esm.sh/three@0.160.0';
import { Raycaster, Vector2 } from 'https://esm.sh/three';

export function setupSelector(scene, camera, renderer, onSelect) {
  const raycaster = new Raycaster();
  const mouse = new Vector2();
  let selectedObjects = [];

  function getSelected() {
    return selectedObjects.slice();
  }

  function onClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true).filter(i => i.object.userData.isSelectable);

    if (intersects.length > 0) {
      const rawClickedObject = intersects[0].object;
      const shift = event.shiftKey;

      const groupSelect = typeof getGroupSelectionFlag === 'function' && getGroupSelectionFlag();
      const clickedObject = groupSelect ? getTopLevelParent(rawClickedObject) : rawClickedObject;

      if (shift) {
        const index = selectedObjects.indexOf(clickedObject);
        if (index !== -1) {
          clickedObject.userData.isSelected = false;
          clickedObject.material?.color.set(0x00ff00);
          selectedObjects.splice(index, 1);
        } else {
          clickedObject.userData.isSelected = true;
          clickedObject.material?.color.set(0xff0000);
          selectedObjects.push(clickedObject);
        }
      } else {
        selectedObjects.forEach(obj => {
          obj.userData.isSelected = false;
          obj.material?.color.set(0x00ff00);
        });
        clickedObject.userData.isSelected = true;
        clickedObject.material?.color.set(0xff0000);
        selectedObjects = [clickedObject];
      }

      if (onSelect) onSelect(clickedObject, event);
    } else {
      selectedObjects.forEach(obj => {
        obj.userData.isSelected = false;
        obj.material?.color.set(0x00ff00);
      });
      selectedObjects = [];
      if (onSelect) onSelect(null, event);
    }
  }

  function getTopLevelParent(obj) {
    while (obj.parent && obj.parent.type !== 'Scene') {
      obj = obj.parent;
    }
    return obj;
  }

  renderer.domElement.addEventListener('click', onClick);
  return { getSelected };
}
