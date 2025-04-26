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
let canvasWidth, canvasHeight = 0;
let container = null;
let volume = null;
let fileInput = null;
let testShader = null;

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
    renderer.setSize( canvasWidth, canvasHeight );
    container.appendChild( renderer.domElement );

    // read and parse volume file
    fileInput = document.getElementById("upload");
    fileInput.addEventListener('change', readFile);

    // dummy shader gets a color as input
    testShader = new TestShader([255.0, 255.0, 0.0]);
}

/**
 * Handles the file reader. No need to change anything here.
 */
function readFile(){
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
 * Currently, renders the bounding box of the volume.
 */
// At global scope, add a variable to keep a reference to the volume rendering shader.
let volumeShader = null;

async function resetVis(){
    // Create new scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);

    // Create the 3D texture from the volume data (this part remains correct)
    const dataTexture = new THREE.Data3DTexture(
        volume.voxels, volume.width, volume.height, volume.depth
    );
    dataTexture.format = THREE.RedFormat;
    dataTexture.type = THREE.FloatType;
    dataTexture.minFilter = THREE.LinearFilter;
    dataTexture.magFilter = THREE.LinearFilter;
    dataTexture.unpackAlignment = 1;
    dataTexture.needsUpdate = true;

    // Instantiate your volume shader.
    // Note: Use camera.position for now; it will be updated by the orbit camera.
    volumeShader = new VolumeRenderer(dataTexture, camera.position);
    await volumeShader.load();

    // Create a unit cube that represents the volume (normalized to [0,1]^3)
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    boxGeometry.translate(0.5, 0.5, 0.5); // Centralize the cube: from (0,0,0) to (1,1,1)
    const volumeMesh = new THREE.Mesh(boxGeometry, volumeShader.material);
    scene.add(volumeMesh);



    // --- IMPORTANT UPDATE ---
    // Set the orbit camera to rotate around the center of the unit cube.
    // Use a smaller radius (e.g., 2.0) so the camera is in [0,1] space.
    orbitCamera = new OrbitCamera(camera, new THREE.Vector3(0.5, 0.5, 0.5), 2.0, renderer.domElement);


    // Start the render loop.
    requestAnimationFrame(paint);
}

/**
 * Render the scene and update all necessary shader information.
 */
function paint(){
    if (volume) {
        // Update the volume shader with the current camera position.
        if(volumeShader){
            volumeShader.updateCameraPosition(camera.position);
        }
        renderer.render(scene, camera);
    }
    // Optionally, request another frame (if not driven by OrbitCamera's internal loop).
    // requestAnimationFrame(paint);
}

