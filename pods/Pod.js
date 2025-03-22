import PodBody from './components/PodBody.js';
import PodCockpit from './components/PodCockpit.js';
import PodThruster from './components/PodThruster.js';
import PodTTail from './components/PodTTail.js';
import { PodFuselage } from './components/PodFuselage.js';
import { defaultPodConfig } from './configs/podConfigs.js';
import { PodBehavior } from './PodBehavior.js';

// Make sure PodThruster is available in the Pod class scope
const PodThrusterClass = PodThruster;

export class Pod {
    constructor(canvasWidth, canvasHeight, config = defaultPodConfig) {
        // Store the config
        this.config = config;
        
        // Create behavior controller
        this.behavior = new PodBehavior(config);
        this.behavior.setPosition(canvasWidth / 2, canvasHeight / 2);

        // Visual components
        this.components = [];
        this.initializeComponents(config);
    }

    // Proxy properties for component compatibility
    get isThrusting() {
        return this.behavior.getState().isThrusting;
    }

    set isThrusting(value) {
        this.behavior.isThrusting = value;
    }

    get isRotatingLeft() {
        return this.behavior.getState().isRotatingLeft;
    }

    set isRotatingLeft(value) {
        this.behavior.isRotatingLeft = value;
    }

    get isRotatingRight() {
        return this.behavior.getState().isRotatingRight;
    }

    set isRotatingRight(value) {
        this.behavior.isRotatingRight = value;
    }

    get velocityX() {
        return this.behavior.getState().velocityX;
    }

    set velocityX(value) {
        this.behavior.velocityX = value;
    }

    get velocityY() {
        return this.behavior.getState().velocityY;
    }

    set velocityY(value) {
        this.behavior.velocityY = value;
    }

    get rotationalVelocity() {
        return this.behavior.getState().rotationalVelocity;
    }

    set rotationalVelocity(value) {
        this.behavior.rotationalVelocity = value;
    }

    get x() {
        return this.behavior.getPosition().x;
    }

    set x(value) {
        const pos = this.behavior.getPosition();
        this.behavior.setPosition(value, pos.y);
    }

    get y() {
        return this.behavior.getPosition().y;
    }

    set y(value) {
        const pos = this.behavior.getPosition();
        this.behavior.setPosition(pos.x, value);
    }

    get angle() {
        return this.behavior.getPosition().angle;
    }

    set angle(value) {
        this.behavior.properties.angle = value;
    }

    initializeComponents(config) {
        // Add default components with their configurations
        this.addComponent(new PodBody(config.body));
        this.addComponent(new PodCockpit(config.cockpit));
        
        // Add fuselage
        this.addComponent(new PodFuselage(config.fuselage || {}));
        
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
        // Update behavior
        this.behavior.update(canvasWidth, canvasHeight);

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
        
        const position = this.behavior.getPosition();
        
        // Move to pod's position and rotate
        ctx.translate(position.x, position.y);
        ctx.rotate(position.angle);

        // Draw all components in order
        this.components.forEach(component => {
            component.draw(ctx, this);
        });

        // Restore the context state
        ctx.restore();
    }

    handleInput(key, isKeyDown = true) {
        this.behavior.handleInput(key, isKeyDown);
    }

    // Helper method to reconfigure the pod
    reconfigure(config) {
        // Update behavior
        this.behavior.reconfigure(config);

        // Clear existing components
        this.components = [];

        // Reinitialize with new config
        this.initializeComponents(config);
    }

    getBounds() {
        const position = this.behavior.getPosition();
        const size = 112; // Round up to nearest number divisible by 4 for easy centering

        // Calculate rotated bounds
        const cos = Math.cos(position.angle);
        const sin = Math.sin(position.angle);

        // Calculate corners of the square
        const corners = [
            {x: -size/2, y: -size/2},
            {x: size/2, y: -size/2},
            {x: size/2, y: size/2},
            {x: -size/2, y: size/2}
        ].map(point => ({
            x: position.x + (point.x * cos - point.y * sin),
            y: position.y + (point.x * sin + point.y * cos)
        }));

        // Find the bounds of the rotated square
        const xs = corners.map(p => p.x);
        const ys = corners.map(p => p.y);

        return {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys)
        };
    }
}

// Export all necessary classes
export { PodBody, PodCockpit, PodThruster, PodTTail }; 