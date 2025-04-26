let stepSize = 1.0;

addEventListener("load", () => {
    const stepSizeInput = document.getElementById("stepSizeInput");
    const stepSizeValueLabel = document.getElementById("stepSizeValue");

    stepSizeInput.value = stepSize.toFixed(2);
    stepSizeValueLabel.value = stepSize.toFixed(2);
});

function updateStepSize(size) {
    const stepSizeInput = document.getElementById("stepSizeInput");
    const stepSizeValueLabel = document.getElementById("stepSizeValue");

    stepSize = parseFloat(size);
    stepSizeInput.value = stepSize;
    stepSizeValueLabel.value = stepSize;
}

function submitData() {
    console.log("Step size set to " + stepSize.toFixed(2));

    updateShaderInput({ stepSize: stepSize });
}
