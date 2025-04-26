/**
 * VolumeRenderer
 * A shader-based volume raycaster that implements single-pass raycasting with MIP.
 */
class VolumeRenderer extends Shader {
    /**
     * @param {THREE.Data3DTexture} volumeTexture - The 3D texture containing the volume data.
     * @param {THREE.Vector3} cameraPosition - The initial camera position in normalized (0–1) volume space.
     */
    constructor(volumeTexture, cameraPosition, volumeSize) {
        // Load our custom shader files from the shaders folder.
        super("mip_vert", "mip_frag");

        // Set uniforms for the bounding box (assuming normalized coordinates)
        this.setUniform("boxMin", new THREE.Vector3(0, 0, 0));
        this.setUniform("boxMax", new THREE.Vector3(1, 1, 1));
        // Set a reasonable step size (this might need tuning)
        this.setUniform("stepSize", 0.01);
        // Set the initial camera position uniform.
        this.setUniform("cameraPos", cameraPosition);
        // Set the volume texture uniform.
        this.setUniform("volumeTex", volumeTexture);

        this.setUniform("volumeSize", volumeSize);
    }

    /**
     * Updates the camera position uniform. This should be called every frame.
     * @param {THREE.Vector3} cameraPosition - The updated camera position.
     */
    updateCameraPosition(cameraPosition) {
        this.setUniform("cameraPos", cameraPosition);
    }
}
