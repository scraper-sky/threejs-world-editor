export function setupPalette(containerId, spawnCallback) {
    const palette = document.getElementById(containerId);
  
    const prefabList = [
      { label: 'Cube', create: () => createCube() },
      { label: 'Sphere', create: () => createSphere() }
    ];
  
    prefabList.forEach(({ label, create }) => {
      const button = document.createElement('button');
      button.innerText = label;
      button.onclick = () => {
        const mesh = create();
        spawnCallback(mesh);
      };
      palette.appendChild(button);
    });
  }
  