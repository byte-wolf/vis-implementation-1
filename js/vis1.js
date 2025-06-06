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
let planeControls = null;
let planeControlsObject = null;
let isCuttingPlaneFlipped = false;

let isoSurfacePoints = [];

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

    // initialize iso points list
    renderIsoPointsList();

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

    planeControlsObject = new THREE.Object3D();
    planeControlsObject.position.set(0, 0, 0);
    scene.add(planeControlsObject);

    planeControls = new THREE.TransformControls(camera, renderer.domElement);
    planeControls.setSpace("local");
    scene.add(planeControls);

    planeControls.addEventListener("change", () => {
        updateCuttingPlane(
            planeControlsObject.position,
            planeControlsObject.getWorldDirection(new THREE.Vector3())
        );
    });

    planeControls.addEventListener("mouseDown", () => {
        orbitCamera.setEnabled(false);
    });
    planeControls.addEventListener("mouseUp", () => {
        orbitCamera.setEnabled(true);
        updateHistogram();
    });

    updateHistogram();

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
    raycastShader.setUniform("uBackgroundColor", [0.0, 0.0, 0.0]);
    raycastShader.setUniform("uForegroundColor", [1.0, 1.0, 1.0]);

    await raycastShader.load();

    const boxGeometry = new THREE.BoxGeometry(
        volume.width,
        volume.height,
        volume.depth
    );
    const raycastMaterial = raycastShader.material;
    raycastMaterial.side = THREE.BackSide;

    raycastMesh = new THREE.Mesh(boxGeometry, raycastMaterial);
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

    // Initialize cutting plane position and rotation
    const initialPlaneNormal = planeControlsObject.getWorldDirection(
        new THREE.Vector3()
    );
    updateCuttingPlane(planeControlsObject.position, initialPlaneNormal);

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
 * @param {{ backgroundColor?: number[], foregroundColor: number[], renderMode?: number, cuttingPlaneEnabled?: boolean, cuttingPlaneFlipped?: boolean, isoFalloffMode?: number}} settings - The settings object containing input values.
 */
function updateShaderInput(settings) {
    if (!raycastShader) {
        return;
    }

    if (settings.backgroundColor !== undefined) {
        raycastShader.material.uniforms.uBackgroundColor.value =
            new THREE.Vector3(
                settings.backgroundColor[0],
                settings.backgroundColor[1],
                settings.backgroundColor[2]
            );

        renderer.setClearColor(
            new THREE.Color().setRGB(
                settings.backgroundColor[0],
                settings.backgroundColor[1],
                settings.backgroundColor[2]
            ),
            1
        );
    }

    if (settings.foregroundColor !== undefined) {
        raycastShader.material.uniforms.uForegroundColor.value =
            new THREE.Vector3(
                settings.foregroundColor[0],
                settings.foregroundColor[1],
                settings.foregroundColor[2]
            );
    }

    if (settings.renderMode !== undefined) {
        raycastShader.setUniform("uRenderMode", settings.renderMode);
    }

    if (settings.cuttingPlaneEnabled !== undefined) {
        raycastShader.setUniform(
            "uCuttingPlaneEnabled",
            settings.cuttingPlaneEnabled ? 1 : 0
        );
    }

    if (settings.cuttingPlaneFlipped !== undefined) {
        isCuttingPlaneFlipped = settings.cuttingPlaneFlipped;
    }

    if (settings.cuttingPlanePosition !== undefined) {
        raycastShader.setUniform(
            "uCuttingPlanePosition",
            new THREE.Vector3(
                settings.cuttingPlanePosition[0],
                settings.cuttingPlanePosition[1],
                settings.cuttingPlanePosition[2]
            )
        );
    }

    if (settings.cuttingPlaneRotation !== undefined) {
        const rotation = new THREE.Vector3(
            settings.cuttingPlaneRotation[0],
            settings.cuttingPlaneRotation[1],
            settings.cuttingPlaneRotation[2]
        );

        if (isCuttingPlaneFlipped) {
            rotation.multiplyScalar(-1);
        }

        raycastShader.setUniform("uCuttingPlaneRotation", rotation);
    }

    if (settings.isoFalloffMode !== undefined) {
        raycastShader.setUniform("uIsoFalloffMode", settings.isoFalloffMode);
    }

    if (settings.backgroundColor !== undefined) {
        renderer.setClearColor(
            new THREE.Color().setRGB(
                settings.backgroundColor[0],
                settings.backgroundColor[1],
                settings.backgroundColor[2]
            ),
            1
        );
    }

    updateTransferFunctionUniforms();
}

/**
 * Set the iso points.
 * @param {{x: number, y: number, color: string}[]} isoPoints
 */
function setIsoPoints(isoPoints) {
    if (!isoPoints || !Array.isArray(isoPoints)) {
        console.error("Invalid isoPoints array provided.");
        return;
    }

    isoSurfacePoints = isoPoints;
}

/**
 * Update the transfer function uniforms based on the provided iso surface points.
 */
function updateTransferFunctionUniforms() {
    const MAX_ISO_POINTS_JS = 4;
    const numPoints = Math.min(isoSurfacePoints.length, MAX_ISO_POINTS_JS);

    raycastShader.setUniform("uNumIsoPoints", numPoints);

    const isoValues = new Array(MAX_ISO_POINTS_JS).fill(1.0);
    const isoOpacities = new Array(MAX_ISO_POINTS_JS).fill(1.0);
    const isoColors = new Array(MAX_ISO_POINTS_JS).fill(
        new THREE.Vector3(0.0, 0.0, 0.0)
    );

    const sortedPoints = [...isoSurfacePoints].sort((a, b) => a.x - b.x);

    for (let idx = 0; idx < MAX_ISO_POINTS_JS; idx++) {
        if (idx < numPoints) {
            const point = sortedPoints[idx];
            isoValues[idx] = point.x;
            isoOpacities[idx] = point.y;
            isoColors[idx] = new THREE.Vector3(
                point.color[0],
                point.color[1],
                point.color[2]
            );
            raycastShader.setUniform("uIsoValues", isoValues);
            raycastShader.setUniform("uIsoOpacities", isoOpacities);
            raycastShader.setUniform("uIsoColors", isoColors);
        } else {
            isoValues[idx] = -1.0;
            isoOpacities[idx] = 0.0;
            isoColors[idx] = new THREE.Vector3(0, 0, 0);

            raycastShader.setUniform("uIsoValues", isoValues);
            raycastShader.setUniform("uIsoOpacities", isoOpacities);
            raycastShader.setUniform("uIsoColors", isoColors);
        }
    }

    if (currentIsoRange !== undefined) {
        raycastShader.setUniform("uIsoRange", currentIsoRange);
    }

    if (orbitCamera === undefined) {
        return;
    }

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

/**
 * Update the cutting plane controls mode.
 * @param {'translate' | 'rotate' | 'none'} mode - The mode to update the cutting plane controls to.
 */
function updatePlaneControlsMode(mode) {
    if (mode === "translate") {
        planeControls.attach(planeControlsObject);
        planeControls.showX = false;
        planeControls.showY = false;
        planeControls.setMode("translate");
    } else if (mode === "rotate") {
        planeControls.attach(planeControlsObject);
        planeControls.showX = true;
        planeControls.showY = true;
        planeControls.setMode("rotate");
    } else {
        planeControls.detach(planeControlsObject);
    }
    requestAnimationFrame(paint);
}

/**
 * Get the volume cutting plane properties.
 * @returns {{volume: Volume, position: THREE.Vector3, rotation: THREE.Vector3}} The volume cutting plane properties.
 */
function getVolumeCuttingPlaneProps() {
    return {
        volume,
        position: planeControlsObject.position,
        rotation: planeControlsObject.getWorldDirection(new THREE.Vector3()),
    };
}
