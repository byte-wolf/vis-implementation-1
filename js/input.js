// Render modes configuration
const RENDER_MODES = {
    MAX_INTENSITY_PROJECTION: {
        value: 0,
        label: "Maximum Intensity Projection",
    },
    MAX_INTENSITY_PROJECTION_TF: {
        value: 1,
        label: "Maximum Intensity Projection (TF)",
    },
    ACCUMULATIVE: { value: 2, label: "Accumulative (TF)" },
    ACCUMULATIVE_ALPHA_BLENDING: {
        value: 3,
        label: "Accumulative (Experimental) (TF)",
    },
    FIRST_HIT_POSITIONS: { value: 4, label: "First-Hit Positions (TF*)" },
    FIRST_HIT_NORMALS: { value: 5, label: "First-Hit Normals (TF*)" },
    FIRST_HIT_SOLID_COLOR: { value: 6, label: "First-Hit Solid Color (TF*)" },
    PHONG_SHADED: { value: 7, label: "Phong Shaded (TF*)" },
};

let backgroundColor = [0.0, 0.0, 0.0];
let foregroundColor = [1.0, 1.0, 1.0];
let cuttingPlanePosition = [0.0, 0.0, 0.0];
let cuttingPlaneRotation = [0.0, 0.0, 0.0];
let renderMode = RENDER_MODES.PHONG_SHADED.value; // Default to Transfer Function mode
let cuttingPlaneEnabled = false; // Default to disabled
let cuttingPlaneFlipped = false; // Default to not flipped
let lastCuttingPlaneMode = "none"; // Default to disabled cutting plane
let isoFalloffMode = 0; // Default to linear falloff

function populateRenderModeSelect() {
    const select = document.getElementById("renderModeSelect");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    // Add options from configuration
    Object.values(RENDER_MODES).forEach((mode) => {
        const option = document.createElement("option");
        option.value = mode.value.toString();
        option.textContent = mode.label;
        select.appendChild(option);
    });

    // Set default value
    select.value = renderMode.toString();
}

function updateForegroundColorVisibility() {
    const foregroundColorField = document.getElementById(
        "foregroundColorField"
    );
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

function updateCuttingPlaneControlsVisibility() {
    const cuttingPlaneButtons = document.querySelector(
        ".cutting-plane-buttons"
    );
    const controlLabel = document.querySelector(".control-section-label");
    const cuttingPlaneFlippedField = document.getElementById(
        "cutting-plane-flipped"
    ).parentElement;

    if (!cuttingPlaneButtons || !controlLabel || !cuttingPlaneFlippedField)
        return;

    // Show cutting plane controls only when cutting plane is enabled
    if (cuttingPlaneEnabled) {
        cuttingPlaneButtons.style.opacity = "1";
        cuttingPlaneButtons.style.visibility = "visible";
        cuttingPlaneButtons.style.pointerEvents = "auto";
        controlLabel.style.opacity = "1";
        controlLabel.style.visibility = "visible";
        cuttingPlaneFlippedField.style.opacity = "1";
        cuttingPlaneFlippedField.style.visibility = "visible";
        cuttingPlaneFlippedField.style.pointerEvents = "auto";
    } else {
        cuttingPlaneButtons.style.opacity = "0";
        cuttingPlaneButtons.style.visibility = "hidden";
        cuttingPlaneButtons.style.pointerEvents = "none";
        controlLabel.style.opacity = "0";
        controlLabel.style.visibility = "hidden";
        cuttingPlaneFlippedField.style.opacity = "0";
        cuttingPlaneFlippedField.style.visibility = "hidden";
        cuttingPlaneFlippedField.style.pointerEvents = "none";
    }
}

function loadInput() {
    populateRenderModeSelect();

    const backgroundColorInput = document.getElementById("backgroundInput");
    backgroundColor = hexToRgbArray(backgroundColorInput.value);

    const foregroundColorInput = document.getElementById("foregroundInput");
    foregroundColor = hexToRgbArray(foregroundColorInput.value);

    const renderModeSelect = document.getElementById("renderModeSelect");
    renderMode = parseInt(renderModeSelect.value);

    const cuttingPlaneEnabledInput = document.getElementById(
        "cutting-plane-enabled"
    );
    cuttingPlaneEnabled = cuttingPlaneEnabledInput.checked;

    const cuttingPlaneFlippedInput = document.getElementById(
        "cutting-plane-flipped"
    );
    cuttingPlaneFlipped = cuttingPlaneFlippedInput.checked;

    const autoRotateInput = document.getElementById("auto-rotate");
    onAutoRotateChange(autoRotateInput.checked);

    const isoSurfaceRangeInput = document.getElementById("isoRangeValue");
    updateIsoRange(parseFloat(isoSurfaceRangeInput.value));

    const isoFalloffModeInput = document.querySelector(
        "input[name='isoFalloffMode']:checked"
    );
    updateIsoFalloffMode(parseInt(isoFalloffModeInput.value));

    // Update visibility and apply settings immediately
    updateForegroundColorVisibility();
    updateCuttingPlaneControlsVisibility();
    updateIsoControlsVisibility();
    updateShaderInput({
        backgroundColor,
        foregroundColor,
        cuttingPlanePosition,
        cuttingPlaneRotation,
        renderMode,
        cuttingPlaneEnabled,
        cuttingPlaneFlipped,
        isoFalloffMode,
    });
}

function resetInputSettings() {
    backgroundColor = [0.0, 0.0, 0.0];
    foregroundColor = [1.0, 1.0, 1.0];
    renderMode = RENDER_MODES.ACCUMULATIVE.value; // Reset to Transfer Function mode
    cuttingPlaneEnabled = false; // Reset to disabled
    lastCuttingPlaneMode = "none"; // Reset to none mode

    const backgroundColorInput = document.getElementById("backgroundInput");
    backgroundColorInput.value = rgbArrayToHex(backgroundColor);

    const foregroundColorInput = document.getElementById("foregroundInput");
    foregroundColorInput.value = rgbArrayToHex(foregroundColor);

    const cuttingPlaneEnabledInput = document.getElementById(
        "cutting-plane-enabled"
    );
    cuttingPlaneEnabledInput.checked = cuttingPlaneEnabled;

    // Repopulate and reset render mode select
    populateRenderModeSelect();

    // Update visibility and apply settings immediately
    updateForegroundColorVisibility();
    updateCuttingPlaneControlsVisibility();
    updateIsoControlsVisibility();
    updateShaderInput({
        backgroundColor,
        foregroundColor,
        cuttingPlanePosition,
        cuttingPlaneRotation,
        renderMode,
        cuttingPlaneEnabled,
        cuttingPlaneFlipped,
        isoFalloffMode,
    });
}

function updateBackground(color) {
    backgroundColor = hexToRgbArray(color);
    updateShaderInput({ backgroundColor });
}

function updateForeground(color) {
    foregroundColor = hexToRgbArray(color);
    updateShaderInput({ foregroundColor });
}

function updateCuttingPlane(position, rotation) {
    cuttingPlanePosition = [position.x, position.y, position.z];
    cuttingPlaneRotation = [rotation.x, rotation.y, rotation.z];

    updateShaderInput({ cuttingPlanePosition, cuttingPlaneRotation });
}

function updateRenderMode(mode) {
    renderMode = parseInt(mode);
    // Update visibility and apply immediately
    updateForegroundColorVisibility();
    updateCuttingPlaneControlsVisibility();
    updateIsoControlsVisibility();
    updateShaderInput({ renderMode });
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

function onAutoRotateChange(value) {
    setAutoRotate(value);
}

function onCuttingPlaneEnabledChange(enabled) {
    cuttingPlaneEnabled = enabled;

    if (enabled) {
        // When enabling, restore the last cutting plane mode
        updatePlaneControlsMode(lastCuttingPlaneMode);

        // Initialize the cutting plane position and rotation from the planeControlsObject
        // This ensures the cutting plane is visible immediately when enabled
        if (typeof planeControlsObject !== "undefined" && planeControlsObject) {
            const planeNormal = planeControlsObject.getWorldDirection(
                new THREE.Vector3()
            );
            updateCuttingPlane(planeControlsObject.position, planeNormal);
        }
    } else {
        // When disabling, set to 'none' mode
        updatePlaneControlsMode("none");
    }

    // Update visibility and apply immediately
    updateCuttingPlaneControlsVisibility();
    updateHistogram();
    updateShaderInput({ cuttingPlaneEnabled });
}

function onCuttingPlaneFlippedChange(flipped) {
    cuttingPlaneFlipped = flipped;
    updateHistogram();
    updateShaderInput({ cuttingPlaneFlipped, cuttingPlaneRotation });
}

/**
 * @param {'translate' | 'rotate' | 'none'} planeMode
 */
function updatePlaneMode(planeMode) {
    // Save the mode only if cutting plane is currently enabled (user interaction)
    if (cuttingPlaneEnabled) {
        lastCuttingPlaneMode = planeMode;
    }

    const translateButton = document.getElementById("translateButton");
    const rotateButton = document.getElementById("rotateButton");
    const visibilityButton = document.getElementById("visibilityButton");

    if (planeMode === "translate") {
        translateButton.classList.add("active");
        rotateButton.classList.remove("active");
        visibilityButton.classList.remove("active");
    } else if (planeMode === "rotate") {
        translateButton.classList.remove("active");
        rotateButton.classList.add("active");
        visibilityButton.classList.remove("active");
    } else if (planeMode === "none") {
        translateButton.classList.remove("active");
        rotateButton.classList.remove("active");
        visibilityButton.classList.add("active");
    }

    updatePlaneControlsMode(planeMode);
}

function updateIsoFalloffMode(value) {
    isoFalloffMode = parseInt(value);

    updateShaderInput({ isoFalloffMode });
    updateRangeIndicators();
}

function getCuttingPlaneProps() {
    return {
        enabled: cuttingPlaneEnabled,
        flipped: cuttingPlaneFlipped,
    };
}

function isTFStarMode(renderModeValue) {
    // TF* modes are: FIRST_HIT_POSITIONS (4), FIRST_HIT_NORMALS (5), FIRST_HIT_SOLID_COLOR (6), PHONG_SHADED (7)
    return renderModeValue >= 4 && renderModeValue <= 7;
}

function updateIsoControlsVisibility() {
    const isTFStar = isTFStarMode(renderMode);

    // Get iso range controls
    const isoRangeInput = document.getElementById("isoRangeInput");
    const isoRangeValue = document.getElementById("isoRangeValue");
    const isoRangeField = isoRangeInput
        ? isoRangeInput.closest(".input-field")
        : null;

    // Get iso falloff mode controls - find the parent input-field by looking for radio buttons
    let isoFalloffField = null;
    const isoFalloffInputs = document.querySelectorAll(
        'input[name="isoFalloffMode"]'
    );
    if (isoFalloffInputs.length > 0) {
        isoFalloffField = isoFalloffInputs[0].closest(".input-field");
    }

    if (isTFStar) {
        // Hide controls for TF* modes
        if (isoRangeField) {
            isoRangeField.classList.add("tf-star-hidden");
            isoRangeField.classList.remove("tf-star-visible");
        }

        if (isoFalloffField) {
            isoFalloffField.classList.add("tf-star-hidden");
            isoFalloffField.classList.remove("tf-star-visible");
        }
    } else {
        // Show controls for non-TF* modes
        if (isoRangeField) {
            isoRangeField.classList.remove("tf-star-hidden");
            isoRangeField.classList.add("tf-star-visible");
        }

        if (isoFalloffField) {
            isoFalloffField.classList.remove("tf-star-hidden");
            isoFalloffField.classList.add("tf-star-visible");
        }
    }

    rangeIndicatorsVisible = !isTFStar;
    updateRangeIndicators();
}
