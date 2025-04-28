let stepSize = 1.0;
let backgroundColor = [0.0, 0.0, 0.0];
let foregroundColor = [1.0, 1.0, 1.0];

function loadInput() {
    const stepSizeInput = document.getElementById("stepSizeInput");
    const stepSizeValueLabel = document.getElementById("stepSizeValue");

    stepSizeInput.value = stepSize.toFixed(2);
    stepSizeValueLabel.value = stepSize.toFixed(2);

    const backgroundColorInput = document.getElementById("backgroundInput");
    backgroundColor = hexToRgbArray(backgroundColorInput.value);

    const foregroundColorInput = document.getElementById("foregroundInput");
    foregroundColor = hexToRgbArray(foregroundColorInput.value);

    const autoRotateInput = document.getElementById("auto-rotate");
    onAutoRotateChange(autoRotateInput.checked)

    submitData();
}

function resetInputSettings() {
    stepSize = 1.0;
    backgroundColor = [0.0, 0.0, 0.0];
    foregroundColor = [1.0, 1.0, 1.0];

    const stepSizeInput = document.getElementById("stepSizeInput");
    const stepSizeValueLabel = document.getElementById("stepSizeValue");

    stepSizeInput.value = stepSize.toFixed(2);
    stepSizeValueLabel.value = stepSize.toFixed(2);

    const backgroundColorInput = document.getElementById("backgroundInput");
    backgroundColorInput.value = rgbArrayToHex(backgroundColor);

    const foregroundColorInput = document.getElementById("foregroundInput");
    foregroundColorInput.value = rgbArrayToHex(foregroundColor);

    submitData();
}

function updateStepSize(size) {
    const stepSizeInput = document.getElementById("stepSizeInput");
    const stepSizeValueLabel = document.getElementById("stepSizeValue");

    stepSize = parseFloat(size);
    stepSizeInput.value = stepSize;
    stepSizeValueLabel.value = stepSize;
}

function updateBackground(color) {
    backgroundColor = hexToRgbArray(color);
}

function updateForeground(color) {
    foregroundColor = hexToRgbArray(color);
}

function rgbArrayToHex(rgb) {
    return rgbToHex(
        Math.round(rgb[0] * 255),
        Math.round(rgb[1] * 255),
        Math.round(rgb[2] * 255)
    );
}

function hexToRgbArray(hex) {
    return rgbToArray(hexToRgb(hex));
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
    console.log("Step size set to " + stepSize.toFixed(2));
    console.log("Background color set to " + backgroundColor);
    console.log("Foreground color set to " + foregroundColor);

    updateShaderInput({ stepSize, backgroundColor, foregroundColor });
}

function onAutoRotateChange(value) {
    console.log("Auto-rotate set to " + value);
    setAutoRotate(value);
}