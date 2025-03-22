import { ObjectProperties } from '../ObjectProps/ObjectProperties.js';

export class PodBehavior {
    constructor(config = {}) {
        // Create the physical properties handler
        this.properties = new ObjectProperties(config);
        
        // Input state (specific to pod behavior)
        this.isThrusting = false;
        this.isRotatingLeft = false;
        this.isRotatingRight = false;
    }

    handleInput(key, isKeyDown = true) {
        switch (key) {
            case 'ArrowUp':
                this.isThrusting = isKeyDown;
                break;
            case 'ArrowLeft':
                this.isRotatingLeft = isKeyDown;
                break;
            case 'ArrowRight':
                this.isRotatingRight = isKeyDown;
                break;
        }
    }

    update(canvasWidth, canvasHeight) {
        // Apply thrust if active
        if (this.isThrusting) {
            this.properties.applyForce(this.properties.acceleration, this.properties.angle);
        }

        // Apply rotation if active
        if (this.isRotatingLeft) {
            this.properties.applyRotationalForce(-this.properties.rotationAcceleration);
        }
        if (this.isRotatingRight) {
            this.properties.applyRotationalForce(this.properties.rotationAcceleration);
        }

        // Update physical properties
        this.properties.update(canvasWidth, canvasHeight);
    }

    // Proxy methods to maintain compatibility
    getPosition() {
        return this.properties.getPosition();
    }

    setPosition(x, y) {
        this.properties.setPosition(x, y);
    }

    getState() {
        return {
            isThrusting: this.isThrusting,
            isRotatingLeft: this.isRotatingLeft,
            isRotatingRight: this.isRotatingRight,
            ...this.properties.getPosition(),
            ...this.properties.getVelocity(),
            rotationalVelocity: this.properties.rotationalVelocity
        };
    }

    // Configuration
    reconfigure(config) {
        this.properties.configure(config);
    }
} 