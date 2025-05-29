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
const gizmoGroup = new THREE.Group();
let rotationGizmos = [];

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

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

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
    //raycastMesh.scale.set(volume.width, volume.height, volume.depth);
    scene.add(raycastMesh);

    setupGizmo(scene);

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


function setupGizmo(scene) {

    const ringRadius = 75.0; // Adjust size
    const tubeRadius = 1.5; // Adjust thickness

    const rotXMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, opacity: 0.3, transparent: true });
    const rotYMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, opacity: 0.3, transparent: true });
    const rotZMat = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide, opacity: 0.3, transparent: true });

    const rotXRing = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, tubeRadius, 16, 64), rotXMat);
    rotXRing.name = "rotXGizmo";
    rotXRing.rotation.y = Math.PI / 2; // Orient to rotate around X

    const rotYRing = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, tubeRadius, 16, 64), rotYMat);
    rotYRing.name = "rotYGizmo";
    rotYRing.rotation.x = Math.PI / 2; // Orient to rotate around Y

    const rotZRing = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, tubeRadius, 16, 64), rotZMat);
    rotZRing.name = "rotZGizmo";
    // No initial rotation needed if it's to rotate around Z

    gizmoGroup.add(rotXRing, rotYRing, rotZRing);
    scene.add(gizmoGroup);

    // Store rings for raycasting
    rotationGizmos = [rotXRing, rotYRing, rotZRing];
}

function updateGizmoTransform(planePosition, planeNormal) {
    gizmoGroup.position.copy(planePosition);

    // For Object/Plane Space Alignment (more intuitive):
    // Make the gizmoGroup look in the direction of the planeNormal.
    // The 'up' vector for lookAt depends on your convention.
    // If normal is (0,0,1), an up of (0,1,0) works.
    // If normal is (0,1,0), an up of (0,0,1) might be better.
    // Need a robust way to get an 'up' vector.
    // One way: if normal is mostly Z, up is Y. If mostly Y, up is Z.
    let upVector = new THREE.Vector3(0, 1, 0);
    if (Math.abs(planeNormal.y) > 0.9) { // If normal is close to Y-axis
        upVector.set(0, 0, 1);
    }
    //gizmoGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), planeNormal.clone().normalize()); // Simpler:
    // gizmoGroup.lookAt(planePosition.clone().add(planeNormal));

    // For World Space Alignment (simpler to start):
    // gizmoGroup.rotation.set(0, 0, 0);
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
 * @param {{ backgroundColor: number[], foregroundColor: number[]}} settings - The settings object containing input values.
 */
function updateShaderInput(settings) {
    if (!raycastShader) {
        return;
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

    raycastShader.setUniform(
        "uCuttingPlanePoint",
        new THREE.Vector3(
            0.0,
            settings.cuttingPlaneHeight,
            0.0
        )
    );

    updateGizmoTransform(new THREE.Vector3(
        0.0,
        settings.cuttingPlaneHeight,
        0.0
    ), new THREE.Vector3(
        0.3,
        0.3,
        0.3
    ))

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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedGizmo = null;
let initialPlaneNormal = new THREE.Vector3();
let initialQuaternion = new THREE.Quaternion(); // To store initial gizmo/plane orientation
let dragStartPointOnGizmoPlane = new THREE.Vector3();
let rotationAxis = new THREE.Vector3();

function onPointerDown(event) {
    mouse.x = (event.offsetX / renderer.domElement.width) * 2 - 1;
    mouse.y = -(event.offsetY / renderer.domElement.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    console.log("Raycaster set with mouse coordinates:", mouse);

    const intersects = raycaster.intersectObjects(rotationGizmos);
    if (intersects.length > 0) {
        console.log("Gizmo selected:", intersects[0].object.name);
        selectedGizmo = intersects[0].object;
        controls.enabled = false; // Disable orbit controls

        // Store initial state
        initialPlaneNormal.copy(currentPlaneNormal); // Assuming currentPlaneNormal is your state
        initialQuaternion.copy(gizmoGroup.quaternion); // Or plane's quaternion if orienting plane directly

        // Determine rotation axis based on selectedGizmo
        if (selectedGizmo.name === "rotXGizmo") rotationAxis.set(1, 0, 0);
        else if (selectedGizmo.name === "rotYGizmo") rotationAxis.set(0, 1, 0);
        else if (selectedGizmo.name === "rotZGizmo") rotationAxis.set(0, 0, 1);

        // If gizmo is object-aligned, transform rotationAxis to world space
        // OR, better: keep rotationAxis in gizmo's local space and do calcs there.

        // Project click onto a plane perpendicular to the rotation axis
        const planeOfRotation = new THREE.Plane();
        planeOfRotation.setFromNormalAndCoplanarPoint(rotationAxis.clone().applyQuaternion(gizmoGroup.quaternion), gizmoGroup.position);
        raycaster.ray.intersectPlane(planeOfRotation, dragStartPointOnGizmoPlane);
    }
}

function onPointerMove(event) {
    if (!selectedGizmo) return;

    mouse.x = (event.clientX / renderer.domElement.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const planeOfRotation = new THREE.Plane();
    const worldRotationAxis = rotationAxis.clone().applyQuaternion(gizmoGroup.quaternion); // Axis in world space
    planeOfRotation.setFromNormalAndCoplanarPoint(worldRotationAxis, gizmoGroup.position);

    const currentPointOnGizmoPlane = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(planeOfRotation, currentPointOnGizmoPlane)) {
        const v1 = dragStartPointOnGizmoPlane.clone().sub(gizmoGroup.position);
        const v2 = currentPointOnGizmoPlane.clone().sub(gizmoGroup.position);

        // Calculate angle
        let angle = v1.angleTo(v2);
        const cross = new THREE.Vector3().crossVectors(v1, v2);
        if (worldRotationAxis.dot(cross) < 0) { // Check direction
            angle = -angle;
        }

        if (isNaN(angle)) return;

        // Apply rotation
        const deltaQuaternion = new THREE.Quaternion();
        deltaQuaternion.setFromAxisAngle(rotationAxis, angle); // Rotate around local axis of gizmo

        // Apply to plane normal:
        // Option A: Rotate initial normal
        currentPlaneNormal.copy(initialPlaneNormal).applyQuaternion(deltaQuaternion);
        // (If gizmo is object-aligned, its quaternion effectively IS the plane's orientation)
        // gizmoGroup.quaternion.copy(initialQuaternion).multiply(deltaQuaternion);
        // currentPlaneNormal.set(0,0,1).applyQuaternion(gizmoGroup.quaternion);

        // Option B: Incrementally rotate (might accumulate errors)
        // currentPlaneNormal.applyAxisAngle(worldRotationAxis, angle_delta_from_last_frame);


        // Update gizmo and scene
        updateGizmoTransform(currentPlanePosition, currentPlaneNormal); // currentPlanePosition may also change
        updateShaderUniforms(); // Pass new currentPlaneNormal
        render();
    }
}

function onPointerUp(event) {
    if (selectedGizmo) {
        selectedGizmo = null;
        controls.enabled = true; // Re-enable orbit controls
    }
}

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);