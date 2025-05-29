class RaycastShader extends Shader {
    constructor(vertexProgram, fragmentProgram) {
        super(vertexProgram, fragmentProgram);

        this.setUniform("uVolumeTexture", null);
        this.setUniform("uVolumeSize", new THREE.Vector3(1, 1, 1));
        this.setUniform("uCameraPosition", new THREE.Vector3());
    }
}
