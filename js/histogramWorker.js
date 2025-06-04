onmessage = (event) => {
  const { volume, position, rotation } = event.data;
  console.log("worker start", volume, position, rotation);

  let newIdx = 0;
  const data = new Float32Array(volume.width * volume.height * volume.depth);

  for (let i = 0; i < volume.width; i++) {
    for (let j = 0; j < volume.height; j++) {
      for (let k = 0; k < volume.depth; k++) {
        const idx = i + j * volume.width + k * volume.width * volume.height;
        const voxel = volume.voxels[idx];

        const x = i - volume.width * 0.5;
        const y = j - volume.height * 0.5;
        const z = k - volume.depth * 0.5;

        const d = vectorDot(x - position.x, y - position.y, z - position.z,
          rotation.x, rotation.y, rotation.z);

        if (d > 0) {
          data[newIdx] = voxel;
          newIdx++;
        }
      }
    }
  }
  const trimmed = data.subarray(0, newIdx);

  console.log("worker end");
  
  postMessage({
    voxels: trimmed,
  });
}

function vectorDot(v1x, v1y, v1z, v2x, v2y, v2z) {
  return v1x * v2x + v1y * v2y + v1z * v2z;
}