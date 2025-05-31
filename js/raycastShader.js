class RaycastShader extends Shader {
    constructor(vertexProgram, fragmentProgram) {
        super(vertexProgram, fragmentProgram);

        this.setUniform("uVolumeTexture", null);
        this.setUniform("uVolumeSize", new THREE.Vector3(1, 1, 1));
        this.setUniform("uCameraPosition", new THREE.Vector3());

        // --- Render Mode Uniform ---
        this.setUniform("uRenderMode", 1);

        // --- Cutting Plane Uniforms ---
        this.setUniform("uCuttingPlaneEnabled", 0); // Default to disabled
        this.setUniform("uCuttingPlanePosition", new THREE.Vector3(0.0, 0.0, 0.0));
        this.setUniform("uCuttingPlaneRotation", new THREE.Vector3(0.0, 0.0, 0.0));

        // --- Transfer Function Uniforms ---
        const MAX_ISO_POINTS_JS = 4;
        this.setUniform("uNumIsoPoints", 0);
        this.setUniform("uIsoValues", new Array(MAX_ISO_POINTS_JS).fill(1.0));
        this.setUniform("uIsoOpacities", new Array(MAX_ISO_POINTS_JS).fill(1.0));
        this.setUniform("uIsoColors", new Array(MAX_ISO_POINTS_JS).fill(new THREE.Vector3(0.0, 0.0, 0.0)));
        this.setUniform("uIsoRange", 0.05);
    }
}
