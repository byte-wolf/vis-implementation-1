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
let renderMode = RENDER_MODES.PHONG_SHADED.value;
let backgroundColor = [0.0, 0.0, 0.0];
let foregroundColor = [1.0, 1.0, 1.0];
let cuttingPlanePosition = [0.0, 0.0, 0.0];
let cuttingPlaneRotation = [0.0, 0.0, 0.0];
let cuttingPlaneEnabled = false;
let cuttingPlaneFlipped = false;
let lastCuttingPlaneMode = "none";
let isoFalloffMode = 0;

/**
 * Load the input settings from the DOM.
 */
function loadInput() {
    populateRenderModeSelect();

    renderMode = parseInt(document.getElementById("renderModeSelect").value);

    backgroundColor = hexToRgbArray(document.getElementById("backgroundInput").value);

    foregroundColor = hexToRgbArray(document.getElementById("foregroundInput").value);

    onAutoRotateChange(document.getElementById("auto-rotate").checked);

    cuttingPlaneEnabled = document.getElementById("cutting-plane-enabled").checked;

    cuttingPlaneFlipped = document.getElementById("cutting-plane-flipped").checked;

    updateYAxisScale(parseFloat(document.getElementById("scaleValue").value));

    updateIsoRange(parseFloat(document.getElementById("isoRangeValue").value));

    updateIsoFalloffMode(parseInt(document.querySelector("input[name='isoFalloffMode']:checked").value));

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

/**
 * Reset all input settings.
 */
function resetInputSettings() {
    backgroundColor = [0.0, 0.0, 0.0];
    foregroundColor = [1.0, 1.0, 1.0];
    renderMode = RENDER_MODES.ACCUMULATIVE.value;
    cuttingPlaneEnabled = false;
    lastCuttingPlaneMode = "none";

    const backgroundColorInput = document.getElementById("backgroundInput");
    backgroundColorInput.value = rgbArrayToHex(backgroundColor);

    const foregroundColorInput = document.getElementById("foregroundInput");
    foregroundColorInput.value = rgbArrayToHex(foregroundColor);

    const cuttingPlaneEnabledInput = document.getElementById(
        "cutting-plane-enabled"
    );
    cuttingPlaneEnabledInput.checked = cuttingPlaneEnabled;

    populateRenderModeSelect();
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

/**
 * Populate the render mode select with predefined options.
 */
function populateRenderModeSelect() {
    const select = document.getElementById("renderModeSelect");
    if (!select) return;

    select.innerHTML = "";

    Object.values(RENDER_MODES).forEach((mode) => {
        const option = document.createElement("option");
        option.value = mode.value.toString();
        option.textContent = mode.label;
        select.appendChild(option);
    });

    select.value = renderMode.toString();
}

/**
 * Update the foreground color input visibility.
 */
function updateForegroundColorVisibility() {
    const foregroundColorField = document.getElementById(
        "foregroundColorField"
    );
    if (!foregroundColorField) return;

    if (renderMode === RENDER_MODES.MAX_INTENSITY_PROJECTION.value) {
        foregroundColorField.style.opacity = "1";
        foregroundColorField.style.pointerEvents = "auto";
    } else {
        foregroundColorField.style.opacity = "0";
        foregroundColorField.style.pointerEvents = "none";
    }
}

/**
 * Update the cutting plane controls visibility.
 */
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

/**
 * Update the render mode.
 * @param {number} mode - The render mode to update to.
 */
function updateRenderMode(mode) {
    renderMode = parseInt(mode);

    updateForegroundColorVisibility();
    updateCuttingPlaneControlsVisibility();
    updateIsoControlsVisibility();
    updateShaderInput({ renderMode });
}

/**
 * Update the background color.
 * @param {string} color - The color to update the background to.
 */
function updateBackground(color) {
    backgroundColor = hexToRgbArray(color);
    updateShaderInput({ backgroundColor });
}

/**
 * Update the foreground color.
 * @param {string} color - The color to update the foreground to.
 */
function updateForeground(color) {
    foregroundColor = hexToRgbArray(color);
    updateShaderInput({ foregroundColor });
}

/**
 * Update the auto rotate.
 * @param {boolean} value - Whether to auto rotate the camera.
 */
function onAutoRotateChange(value) {
    setAutoRotate(value);
}

/**
 * @param {'translate' | 'rotate' | 'none'} planeMode
 */
function updatePlaneMode(planeMode) {
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

/**
 * Update cutting plane properties.
 * @param {THREE.Vector3} position - The position of the cutting plane.
 * @param {THREE.Vector3} rotation - The rotation of the cutting plane.
 */
function updateCuttingPlane(position, rotation) {
    cuttingPlanePosition = [position.x, position.y, position.z];
    cuttingPlaneRotation = [rotation.x, rotation.y, rotation.z];

    updateShaderInput({ cuttingPlanePosition, cuttingPlaneRotation });
}

/**
 * Update the cutting plane enabled state.
 * @param {boolean} enabled - Whether to enable the cutting plane.
 */
function onCuttingPlaneEnabledChange(enabled) {
    cuttingPlaneEnabled = enabled;

    if (enabled) {
        updatePlaneControlsMode(lastCuttingPlaneMode);

        if (typeof planeControlsObject !== "undefined" && planeControlsObject) {
            const planeNormal = planeControlsObject.getWorldDirection(
                new THREE.Vector3()
            );
            updateCuttingPlane(planeControlsObject.position, planeNormal);
        }
    } else {
        updatePlaneControlsMode("none");
    }

    updateCuttingPlaneControlsVisibility();
    updateHistogram();
    updateShaderInput({ cuttingPlaneEnabled });
}

/**
 * Update the cutting plane flipped state.
 * @param {boolean} flipped - Whether to flip the cutting plane.
 */
function onCuttingPlaneFlippedChange(flipped) {
    cuttingPlaneFlipped = flipped;
    updateHistogram();
    updateShaderInput({ cuttingPlaneFlipped, cuttingPlaneRotation });
}

/**
 * Update the iso falloff mode.
 * @param {number} value - The value to update the iso falloff mode to.
 */
function updateIsoFalloffMode(value) {
    isoFalloffMode = parseInt(value);

    updateShaderInput({ isoFalloffMode });
    updateRangeIndicators();
}

/**
 * Get the cutting plane properties.
 * @returns {{enabled: boolean, flipped: boolean}} The cutting plane properties.
 */
function getCuttingPlaneProps() {
    return {
        enabled: cuttingPlaneEnabled,
        flipped: cuttingPlaneFlipped,
    };
}

/**
 * Check if the render mode has an iso range.
 * @param {number} renderModeValue - The render mode value to check.
 * @returns {boolean} True if the render mode has an iso range, false otherwise.
 */
function hasIsoRange(renderModeValue) {
    return renderModeValue >= 1 && renderModeValue <= 3;
}

/**
 * Update the iso controls visibility.
 */
function updateIsoControlsVisibility() {
    const isoRangeControlsVisible = hasIsoRange(renderMode);

    const isoRangeInput = document.getElementById("isoRangeInput");
    const isoRangeField = isoRangeInput
        ? isoRangeInput.closest(".input-field")
        : null;

    let isoFalloffField = null;
    const isoFalloffInputs = document.querySelectorAll(
        'input[name="isoFalloffMode"]'
    );
    if (isoFalloffInputs.length > 0) {
        isoFalloffField = isoFalloffInputs[0].closest(".input-field");
    }

    if (isoRangeControlsVisible) {
        if (isoRangeField) {
            isoRangeField.classList.remove("tf-star-hidden");
            isoRangeField.classList.add("tf-star-visible");
        }

        if (isoFalloffField) {
            isoFalloffField.classList.remove("tf-star-hidden");
            isoFalloffField.classList.add("tf-star-visible");
        }
    } else {
        if (isoRangeField) {
            isoRangeField.classList.add("tf-star-hidden");
            isoRangeField.classList.remove("tf-star-visible");
        }

        if (isoFalloffField) {
            isoFalloffField.classList.add("tf-star-hidden");
            isoFalloffField.classList.remove("tf-star-visible");
        }
    }

    rangeIndicatorsVisible = isoRangeControlsVisible;
    updateRangeIndicators();
}

/**
 * Convert an RGB array to a hex string.
 * @param {number[]} rgb - The RGB array to convert.
 * @returns {string} The hex string.
 */
function rgbArrayToHex(rgb) {
    return rgbToHex(
        Math.round(rgb[0] * 255),
        Math.round(rgb[1] * 255),
        Math.round(rgb[2] * 255)
    );
}

/**
 * Convert a hex string to an RGB array.
 * @param {string} hex - The hex string to convert.
 * @returns {number[]} The RGB array.
 */
function hexToRgbArray(hex) {
    return rgbToArray(hexToRgb(hex.toLocaleLowerCase()));
}

/**
 * Convert an RGB object to an array.
 * @param {Object} rgb - The RGB object to convert.
 * @returns {number[]} The RGB array.
 */
function rgbToArray(rgb) {
    return [rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0];
}

/**
 * Convert a hex string to an RGB object.
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * @param {string} hex - The hex string to convert.
 * @returns {Object} The RGB object.
 */
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

/**
 * Convert a component to a hex string.
 * @param {number} c - The component to convert.
 * @returns {string} The hex string.
 */
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

/**
 * Convert an RGB value to a hex string.
 * @param {number} r - The red value.
 * @param {number} g - The green value.
 * @param {number} b - The blue value.
 * @returns {string} The hex string.
 */
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
