import * as THREE from 'https://esm.sh/three';
//selection logic

export function setupSelector(scene, camera, renderer, onSelect) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let selectedObject = null;

  function handleClick(event) { //convert mouse coordinates to NDC, builds selectable meshes from arrays of objects, raycasts only with SelectableMeshes
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const selectableMeshes = []; //create an array to store only the objects of .userData.isSelectable = true
    //this way, we can avoid selecting helper objects like grids and axes while keeping the general performance high (only raycast relevant objects)
    scene.traverse((child) => {
    if (child.isMesh && child.userData.isSelectable) { //call onSelected(selected) or onSelect(null) accordingly
        selectableMeshes.push(child);
    }
    }); 

    const intersects = raycaster.intersectObjects(selectableMeshes, true); //raycast only against SelectableMeshes

    if (intersects.length > 0) { //check intersection with object
      selectedObject = intersects[0].object; //store closest intersected object, then selects it
      selectedObject.userData.isSelected = true; //metadata tag added to the object itself
      if (onSelect) onSelect(selectedObject);
      console.log('Selected:', selectedObject.name || selectedObject.uuid);
    } else {
      if (selectedObject) selectedObject.userData.isSelected = false; //deselect logic, if selected before --> deselect
      selectedObject = null; //clear selectedObject variable
      if (onSelect) onSelect(null); 
      console.log('Selection cleared');
    }
  }

  let pointerDown = null;
  //we add logic here to detect true clicks vs accidental drags based on mouse movement

    renderer.domElement.addEventListener('pointerdown', (e) => {
        pointerDown = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('pointerup', (e) => {
        const dx = Math.abs(e.clientX - pointerDown.x);
        const dy = Math.abs(e.clientY - pointerDown.y);
        const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 2) {
    // Count it as a true click
        handleClick(e);
    }

    pointerDown = null;
});

  return {
    getSelected: () => selectedObject,
    clearSelection: () => {
      if (selectedObject) selectedObject.userData.isSelected = false;
      selectedObject = null;
    }
  };
}
