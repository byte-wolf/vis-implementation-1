/**
 * Vis 1 Task 1 Framework
 * Copyright (C) TU Wien
 *   Institute of Visual Computing and Human-Centered Technology
 *   Research Unit of Computer Graphics
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are not permitted.
 *
 * Main script for Vis1 exercise. Loads the volume, initializes the scene, and contains the paint function.
 *
 * @author Manuela Waldner
 * @author Laura Luidolt
 * @author Diana Schalko
 */
let renderer, camera, scene, orbitCamera;
let canvasWidth,
    canvasHeight = 0;
let container = null;
let volume = null;
let fileInput = null;
// let testShader = null;
let raycastShader = null;
let raycastMesh = null;

/**
 * Load all data and initialize UI here.
 */
function init() {
    // volume viewer
    container = document.getElementById("viewContainer");
    canvasWidth = window.innerWidth * 0.7;
    canvasHeight = window.innerHeight * 0.7;

    // WebGL renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(canvasWidth, canvasHeight);
    //renderer.setClearColor(0x0000ff, 1);
    container.appendChild(renderer.domElement);

    // read and parse volume file
    fileInput = document.getElementById("upload");
    fileInput.addEventListener("change", readFile);

    // initialize raycast shader
    raycastShader = new RaycastShader("dvr_vert", "dvr_frag");

    // initialize histogram
    createHistogram("histogram", 100);

    if (fileInput.files[0]) {
        readFile();
    }
}

/**
 * Handles the file reader. No need to change anything here.
 */
function readFile() {
    let reader = new FileReader();
    reader.onloadend = function () {
        console.log("data loaded: ");

        let data = new Uint16Array(reader.result);
        volume = new Volume(data);

        resetVis();
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

/**
 * Construct the THREE.js scene and update histogram when a new volume is loaded by the user.
 *
 * Currently renders the bounding box of the volume.
 */
async function resetVis() {
    // create new empty scene and perspective camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        canvasWidth / canvasHeight,
        0.1,
        1000
    );

    // dummy scene: we render a box and attach our color test shader as material
    /* const testCube = new THREE.BoxGeometry(volume.width, volume.height, volume.depth);
    const testMaterial = testShader.material;
    await testShader.load(); // this function needs to be called explicitly, and only works within an async function!
    const testMesh = new THREE.Mesh(testCube, testMaterial);
    scene.add(testMesh); */

    updateHistogram(volume);

    const volumeTexture = new THREE.Data3DTexture(
        volume.voxels,
        volume.width,
        volume.height,
        volume.depth
    );

    volumeTexture.format = THREE.RedFormat;
    volumeTexture.type = THREE.FloatType;
    volumeTexture.minFilter = THREE.LinearFilter;
    volumeTexture.magFilter = THREE.LinearFilter;
    volumeTexture.unpackAlignment = 1;
    volumeTexture.needsUpdate = true;

    raycastShader.setUniform("uVolumeTexture", volumeTexture);
    raycastShader.setUniform(
        "uVolumeSize",
        new THREE.Vector3(volume.width, volume.height, volume.depth)
    );
    raycastShader.setUniform("uCameraPosition", camera.position);
    raycastShader.setUniform("uStepSize", stepSize ?? 1.0);
    raycastShader.setUniform(
        "uBackgroundColor",
        backgroundColor ?? [0.0, 0.0, 0.0]
    );
    raycastShader.setUniform(
        "uForegroundColor",
        foregroundColor ?? [1.0, 1.0, 1.0]
    );

    await raycastShader.load();

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const raycastMaterial = raycastShader.material;
    raycastMaterial.side = THREE.BackSide;

    raycastMesh = new THREE.Mesh(boxGeometry, raycastMaterial);
    raycastMesh.scale.set(volume.width, volume.height, volume.depth);
    scene.add(raycastMesh);

    // our camera orbits around an object centered at (0,0,0)
    orbitCamera = new OrbitCamera(
        camera,
        new THREE.Vector3(0, 0, 0),
        1.1 * volume.max,
        renderer.domElement
    );

    // load ui input values
    loadInput();

    // init paint loop
    requestAnimationFrame(paint);
}

/**
 * Render the scene and update all necessary shader information.
 */
function paint() {
    //requestAnimationFrame(paint);

    orbitCamera.update();

    if (scene && camera && renderer) {
        if (raycastShader && raycastShader.material.uniforms.uCameraPosition) {
            raycastShader.material.uniforms.uCameraPosition.value.copy(
                camera.position
            );
        }

        renderer.render(scene, camera);
    }
}

/**
 * Update the values based on user input.
 *
 * @param {{stepSize: number, backgroundColor: number[], foregroundColor: number[]}} settings - The settings object containing input values.
 */
function updateShaderInput(settings) {
    if (!raycastShader) {
        return;
    }

    if (raycastShader.material.uniforms.uStepSize) {
        raycastShader.material.uniforms.uStepSize.value = settings.stepSize;
    }

    if (raycastShader.material.uniforms.uBackgroundColor) {
        raycastShader.material.uniforms.uBackgroundColor.value =
            new THREE.Vector3(
                settings.backgroundColor[0],
                settings.backgroundColor[1],
                settings.backgroundColor[2]
            );
    }

    if (raycastShader.material.uniforms.uForegroundColor) {
        raycastShader.material.uniforms.uForegroundColor.value =
            new THREE.Vector3(
                settings.foregroundColor[0],
                settings.foregroundColor[1],
                settings.foregroundColor[2]
            );
    }

    renderer.setClearColor(
        new THREE.Color().setRGB(
            settings.backgroundColor[0],
            settings.backgroundColor[1],
            settings.backgroundColor[2]
        ),
        1
    );

    requestAnimationFrame(paint);
}

/**
 * Set the auto-rotate property of the orbit camera.
 *
 * @param {boolean} value
 */
function setAutoRotate(value) {
    if (!orbitCamera) {
        return;
    }

    orbitCamera.setAutoRotate(value);
    orbitCamera.update();
}
