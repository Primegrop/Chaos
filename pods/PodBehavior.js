import { ObjectProperties } from '../ObjectProps/ObjectProperties.js';

export class PodBehavior {
    constructor(config = {}) {
        // Create the physical properties handler with initial position
        this.properties = new ObjectProperties({
            ...config,
            x: config.x || 0,
            y: config.y || 0,
            angle: config.angle || 0
        });
        
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
        const position = this.properties.getPosition();
        const velocity = this.properties.getVelocity();
        return {
            isThrusting: this.isThrusting,
            isRotatingLeft: this.isRotatingLeft,
            isRotatingRight: this.isRotatingRight,
            x: position.x,
            y: position.y,
            angle: position.angle,
            velocityX: velocity.x,
            velocityY: velocity.y,
            rotationalVelocity: this.properties.rotationalVelocity
        };
    }

    // Configuration
    reconfigure(config) {
        this.properties.configure(config);
    }
} 