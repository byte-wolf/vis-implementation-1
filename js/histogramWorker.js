if ('function' === typeof importScripts) {
  importScripts('../d3.js/d3.v7.js');
  addEventListener('message', onMessage);

  function onMessage(event) {
    const { enabled, volume, position, rotation, innerWidth } = event.data;
    console.log("worker start", volume, position, rotation);

    let data;

    if (enabled) {

      let newIdx = 0;
      data = new Float32Array(volume.width * volume.height * volume.depth);

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
      data = data.subarray(0, newIdx);
    } else {
      data = volume.voxels;
    }

    console.log("worker calc", data.length);

    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]).nice();

    const histogramLayout = d3
      .histogram()
      .value((d) => d)
      .domain(x.domain())
      .thresholds(x.ticks(100));

    const bins = histogramLayout(data);

    console.log("worker bins", bins.length);

    postMessage({
      bins,
    });
  }
}

function vectorDot(v1x, v1y, v1z, v2x, v2y, v2z) {
  return v1x * v2x + v1y * v2y + v1z * v2z;
}