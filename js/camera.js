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
 * Camera that orbits around a centered object. Only uses mouse input!
 *
 * @author Manuela Waldner
 */

class OrbitCamera {
    constructor(camera, targetPos, radius, domElement){
        this.camera = camera;
        this.targetPos = targetPos;
        this.camera.lookAt(this.targetPos);
        this.radius = radius;
        this.minRadius = radius / 2;
        this.maxRadius = radius * 2;
        this.phi = 0;
        this.theta = 0;

        this.pointerPos = new THREE.Vector2(0, 0);
        this.drag = false;
        this.autoRotate= false;
        this.autoRotateSpeed = 0.5;

        this.isRenderScheduled = false;

        this.controlsEnabled = true;

        this.domElement = domElement;
        this.domElement.addEventListener('pointerdown', event => this.#onMouseDown(event), false);
        this.domElement.addEventListener('pointerup', event => this.#onMouseUp(event), false);
        this.domElement.addEventListener('pointermove', event => this.#onMouseMove(event), false);
        this.domElement.addEventListener('wheel', event => this.#onMouseWheel(event), false);
        // catch mouse-up outside the browser window
        window.addEventListener('pointerup', event => this.#onMouseUp(event));

        this.camera.up.set(0, 0, -1);
        this.#updateCamera(0, 0, 0);
    }

    update(){
        if(this.autoRotate && !this.drag){
            this.#updateCamera(0.5, 0, 0);
            this.#scheduleRender();
        }
    }

    setAutoRotate(autoRotate) {
        this.autoRotate = autoRotate;
        if (autoRotate && !this.drag) {
            this.#scheduleRender();
        }
    }

    /**
     * Enables or disables the camera's drag and wheel controls.
     * @param {boolean} enabled - True to enable controls, false to disable.
     */
    setEnabled(enabled) { // <<< ADDED FUNCTION
        this.controlsEnabled = !!enabled; // Coerce to boolean
        if (!this.controlsEnabled) {
            // If disabling while dragging, reset drag state
            if (this.drag) {
                this.drag = false;
                this.domElement.style.cursor = 'grab'; // Reset cursor
                if (this.autoRotate) {
                    this.#scheduleRender(); // May want to resume auto-rotate if it was interrupted
                }
            }
        }
    }

    /**
     * Checks if the controls are currently enabled.
     * @returns {boolean} True if controls are enabled, false otherwise.
     */
    isEnabled() { // <<< ADDED FUNCTION (optional getter)
        return this.controlsEnabled;
    }

    #scheduleRender() {
        if (!this.isRenderScheduled) {
            this.isRenderScheduled = true;
            requestAnimationFrame(() => {
                this.isRenderScheduled = false;
                paint();
            });
        }
    }

    #updateCamera(dx, dy, dz) {
        this.phi += dx / 100.0;
        this.theta += dy / 100.0;
        this.radius += dz / 10.0;

        const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
        this.theta = clamp(this.theta, -Math.PI / 2.0, Math.PI / 2.0);
        this.radius = clamp(this.radius, this.minRadius, this.maxRadius);

        this.camera.position.x = -this.radius * Math.cos(this.theta)* Math.sin(this.phi);
        this.camera.position.y = -this.radius * Math.cos(this.theta) * Math.cos(this.phi);
        this.camera.position.z = this.radius * Math.sin(this.theta);

        this.camera.lookAt(this.targetPos);
        
        //requestAnimationFrame(paint);
    }

    #onMouseDown(event){
        if (!this.controlsEnabled) return; 
        
        event.preventDefault(); // no scrolling!
        let that = this;

        switch(event.button){
            // left mouse button only
            case 0:
                that.drag = true;
                that.pointerPos.x = event.clientX;
                that.pointerPos.y = event.clientY;
                this.domElement.style.cursor = 'grabbing';
                break;
        }
    }

    #onMouseUp(event){
        switch(event.button){
            case 0:
                this.drag = false;
                this.domElement.style.cursor = 'grab';
                if(this.autoRotate) {
                    this.#scheduleRender();
                }
                break;
        }
    }

    #onMouseMove(event){
        let that = this;
        if(that.drag && this.controlsEnabled){
            let newPointerPos = new THREE.Vector2(event.clientX, event.clientY);
            let pointerDiff = new THREE.Vector2().subVectors(that.pointerPos, newPointerPos);
            that.pointerPos = newPointerPos;
            that.#updateCamera(pointerDiff.x, pointerDiff.y, 0);
            that.#scheduleRender();
        }

    }

    #onMouseWheel(event){
        if (!this.controlsEnabled) return; 
        
        event.preventDefault();
        this.#updateCamera(0, 0, -event.wheelDelta);
        this.#scheduleRender();
    }

    dispose() {
        this.domElement.removeEventListener('pointerdown', this.#onMouseDown);
        this.domElement.removeEventListener('pointermove', this.#onMouseMove);
        this.domElement.removeEventListener('wheel', this.#onMouseWheel);
        window.removeEventListener('pointerup', this.#onMouseUp);
        this.domElement.removeEventListener('pointerleave', this.#onMouseUp);
    }
}