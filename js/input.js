// Render modes configuration
const RENDER_MODES = {
    MAX_INTENSITY_PROJECTION: { value: 0, label: "Maximum Intensity Projection" },
    TRANSFER_FUNCTION: { value: 1, label: "Transfer Function" }
};

let backgroundColor = [0.0, 0.0, 0.0];
let foregroundColor = [1.0, 1.0, 1.0];
let cuttingPlanePosition = [0.0, 0.0, 0.0];
let cuttingPlaneRotation = [0.0, 0.0, 0.0];
let renderMode = RENDER_MODES.TRANSFER_FUNCTION.value; // Default to Transfer Function mode

function populateRenderModeSelect() {
    const select = document.getElementById("renderModeSelect");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    // Add options from configuration
    Object.values(RENDER_MODES).forEach(mode => {
        const option = document.createElement("option");
        option.value = mode.value.toString();
        option.textContent = mode.label;
        select.appendChild(option);
    });

    // Set default value
    select.value = renderMode.toString();
}

function updateForegroundColorVisibility() {
    const foregroundColorField = document.getElementById("foregroundColorField");
    if (!foregroundColorField) return;

    // Show foreground color only for Maximum Intensity Projection mode
    if (renderMode === RENDER_MODES.MAX_INTENSITY_PROJECTION.value) {
        foregroundColorField.style.opacity = "1";
        // foregroundColorField.style.visibility = "visible";
        foregroundColorField.style.pointerEvents = "auto";
    } else {
        foregroundColorField.style.opacity = "0";
        // foregroundColorField.style.visibility = "hidden";
        foregroundColorField.style.pointerEvents = "none";
    }
}

function loadInput() {
    const backgroundColorInput = document.getElementById("backgroundInput");
    backgroundColor = hexToRgbArray(backgroundColorInput.value);

    const foregroundColorInput = document.getElementById("foregroundInput");
    foregroundColor = hexToRgbArray(foregroundColorInput.value);

    // Populate render mode select dynamically
    populateRenderModeSelect();

    const renderModeSelect = document.getElementById("renderModeSelect");
    renderMode = parseInt(renderModeSelect.value);

    const autoRotateInput = document.getElementById("auto-rotate");
    onAutoRotateChange(autoRotateInput.checked);

    // Update visibility and apply settings immediately
    updateForegroundColorVisibility();
    updateShaderInput({ backgroundColor, foregroundColor, cuttingPlanePosition, cuttingPlaneRotation, renderMode });
}

function resetInputSettings() {
    backgroundColor = [0.0, 0.0, 0.0];
    foregroundColor = [1.0, 1.0, 1.0];
    renderMode = RENDER_MODES.TRANSFER_FUNCTION.value; // Reset to Transfer Function mode

    const backgroundColorInput = document.getElementById("backgroundInput");
    backgroundColorInput.value = rgbArrayToHex(backgroundColor);

    const foregroundColorInput = document.getElementById("foregroundInput");
    foregroundColorInput.value = rgbArrayToHex(foregroundColor);

    // Repopulate and reset render mode select
    populateRenderModeSelect();

    // Update visibility and apply settings immediately
    updateForegroundColorVisibility();
    updateShaderInput({ backgroundColor, foregroundColor, cuttingPlanePosition, cuttingPlaneRotation, renderMode });
}

function updateBackground(color) {
    backgroundColor = hexToRgbArray(color);
    // Apply immediately
    updateShaderInput({ backgroundColor, foregroundColor, cuttingPlanePosition, cuttingPlaneRotation, renderMode });
}

function updateForeground(color) {
    foregroundColor = hexToRgbArray(color);
    // Apply immediately
    updateShaderInput({ backgroundColor, foregroundColor, cuttingPlanePosition, cuttingPlaneRotation, renderMode });
}

function updateCuttingPlane(position, rotation) {
    cuttingPlanePosition = [
        position.x,
        position.y,
        position.z,
    ]
    cuttingPlaneRotation = [
        rotation.x,
        rotation.y,
        rotation.z,
    ];

    // Apply immediately
    updateShaderInput({ backgroundColor, foregroundColor, cuttingPlanePosition, cuttingPlaneRotation, renderMode });
}

function updateRenderMode(mode) {
    renderMode = parseInt(mode);
    // Update visibility and apply immediately
    updateForegroundColorVisibility();
    updateShaderInput({ backgroundColor, foregroundColor, cuttingPlanePosition, cuttingPlaneRotation, renderMode });
}

function rgbArrayToHex(rgb) {
    return rgbToHex(
        Math.round(rgb[0] * 255),
        Math.round(rgb[1] * 255),
        Math.round(rgb[2] * 255)
    );
}

/**
 * 
 * @param {string} hex 
 * @returns {number[]} 
 */
function hexToRgbArray(hex) {
    return rgbToArray(hexToRgb(hex.toLocaleLowerCase()));
}

function rgbToArray(rgb) {
    return [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0];
}

//https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function submitData() {
    updateShaderInput({ backgroundColor, foregroundColor, cuttingPlanePosition, cuttingPlaneRotation, renderMode });
}

function onAutoRotateChange(value) {
    setAutoRotate(value);
}


/**
 * @param {'translate' | 'rotate' | 'none'} planeMode
 */
function updatePlaneMode(planeMode) {
    const translateButton = document.getElementById("translateButton");
    const rotateButton = document.getElementById("rotateButton");
    const visibilityButton = document.getElementById("visibilityButton");

    if (planeMode === 'translate') {
        translateButton.classList.add("active");
        rotateButton.classList.remove("active");
        visibilityButton.classList.remove("active");
    } else if (planeMode === 'rotate') {
        translateButton.classList.remove("active");
        rotateButton.classList.add("active");
        visibilityButton.classList.remove("active");
    } else if (planeMode === 'none') {
        translateButton.classList.remove("active");
        rotateButton.classList.remove("active");
        visibilityButton.classList.add("active");
    }

    updatePlaneControlsMode(planeMode);
}