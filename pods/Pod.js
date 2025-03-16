import PodBody from './components/PodBody.js';
import PodCockpit from './components/PodCockpit.js';
import PodThruster from './components/PodThruster.js';
import PodTTail from './components/PodTTail.js';
import { defaultPodConfig } from './configs/podConfigs.js';

export class Pod {
    constructor(canvasWidth, canvasHeight, config = defaultPodConfig) {
        // Store the config
        this.config = config;
        
        // Core pod properties
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.angle = 0;
        this.velocityX = 0;  // Rename vx to velocityX for clarity
        this.velocityY = 0;  // Rename vy to velocityY for clarity
        
        // Movement properties (from config)
        this.maxSpeed = config.maxSpeed;
        this.acceleration = config.acceleration;
        this.rotationalVelocity = 0;
        this.rotationAcceleration = config.rotationAcceleration;
        this.maxRotationalSpeed = config.maxRotationalSpeed;
        this.rotationalDamping = config.rotationalDamping;

        // Visual components
        this.components = [];
        this.initializeComponents(config);

        // Input state
        this.isThrusting = false;
        this.isRotatingLeft = false;
        this.isRotatingRight = false;
    }

    initializeComponents(config) {
        // Add default components with their configurations
        this.addComponent(new PodBody(config.body));
        this.addComponent(new PodCockpit(config.cockpit));
        
        // Add either T-tail or regular thruster based on config
        if (config.ttail) {
            config.ttail.pod = this; // Pass pod reference for rotation enhancement
            this.addComponent(new PodTTail(config.ttail));
        } else {
            this.addComponent(new PodThruster(config.thruster));
        }
    }

    addComponent(component) {
        this.components.push(component);
        return this;
    }

    removeComponent(componentType) {
        this.components = this.components.filter(comp => !(comp instanceof componentType));
        return this;
    }

    update(canvasWidth, canvasHeight) {
        // Apply thrust if active
        if (this.isThrusting) {
            this.velocityX += this.acceleration * Math.sin(this.angle);
            this.velocityY -= this.acceleration * Math.cos(this.angle);
        }

        // Apply rotation if active
        if (this.isRotatingLeft) {
            this.rotationalVelocity = Math.max(
                this.rotationalVelocity - this.rotationAcceleration,
                -this.maxRotationalSpeed
            );
        }
        if (this.isRotatingRight) {
            this.rotationalVelocity = Math.min(
                this.rotationalVelocity + this.rotationAcceleration,
                this.maxRotationalSpeed
            );
        }

        // Limit total velocity
        const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
        if (speed > this.maxSpeed) {
            const scale = this.maxSpeed / speed;
            this.velocityX *= scale;
            this.velocityY *= scale;
        }

        // Update position based on velocity
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Update angle based on rotational velocity
        this.angle += this.rotationalVelocity;

        // Apply rotational damping
        this.rotationalVelocity *= this.rotationalDamping;

        // Apply slight velocity damping
        this.velocityX *= 0.995;
        this.velocityY *= 0.995;

        // Wrap around the edges
        if (this.x < 0) this.x = canvasWidth;
        if (this.x > canvasWidth) this.x = 0;
        if (this.y < 0) this.y = canvasHeight;
        if (this.y > canvasHeight) this.y = 0;

        // Update components
        this.components.forEach(component => {
            if (component.update) {
                component.update(this);
            }
        });
    }

    draw(ctx) {
        // Save the context state
        ctx.save();
        
        // Move to pod's position and rotate
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw all components in order
        this.components.forEach(component => {
            // Each component will handle its own positioning relative to pod center
            component.draw(ctx, this);
        });

        // Restore the context state
        ctx.restore();
    }

    handleInput(key, isKeyDown = true) {
        // Update input state
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

    // Helper method to reconfigure the pod
    reconfigure(config) {
        // Update movement properties
        this.maxSpeed = config.maxSpeed;
        this.acceleration = config.acceleration;
        this.rotationAcceleration = config.rotationAcceleration;
        this.maxRotationalSpeed = config.maxRotationalSpeed;
        this.rotationalDamping = config.rotationalDamping;

        // Clear existing components
        this.components = [];

        // Reinitialize with new config
        this.initializeComponents(config);
    }

    getBounds() {
        // Get the body component for size reference
        const bodyComponent = this.components.find(c => c instanceof PodBody);
        if (!bodyComponent) {
            // Fallback size if no body component found
            return {
                x: this.x - 10,
                y: this.y - 10,
                width: 20,
                height: 20
            };
        }

        // Use the body's actual dimensions
        const width = bodyComponent.width;
        const height = bodyComponent.height;
        
        // Use the larger dimension to create a square bounding box
        const size = Math.max(width, height) * 2; // Multiply by 2 for better collision detection
        
        return {
            x: this.x - size/2,
            y: this.y - size/2,
            width: size,
            height: size
        };
    }
}

export { PodBody, PodCockpit, PodThruster, PodTTail }; 