// Base Pod class that handles core functionality
class Pod {
    constructor(canvasWidth, canvasHeight, config = {}) {
        // Core pod properties
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
        
        // Movement properties (can be overridden by config)
        this.maxSpeed = config.maxSpeed || 5;
        this.acceleration = config.acceleration || 0.1;
        this.rotationalVelocity = 0;
        this.rotationAcceleration = config.rotationAcceleration || 0.005;
        this.maxRotationalSpeed = config.maxRotationalSpeed || 0.1;
        this.rotationalDamping = config.rotationalDamping || 0.99;

        // Visual components (can be added/removed via decorators)
        this.components = [];
    }

    addComponent(component) {
        this.components.push(component);
        return this; // Allow chaining
    }

    removeComponent(componentType) {
        this.components = this.components.filter(comp => !(comp instanceof componentType));
        return this; // Allow chaining
    }

    update(canvasWidth, canvasHeight) {
        // Update position based on velocity
        this.x += this.vx;
        this.y += this.vy;

        // Update angle based on rotational velocity
        this.angle += this.rotationalVelocity;

        // Apply rotational damping
        this.rotationalVelocity *= this.rotationalDamping;

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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw all components in order
        this.components.forEach(component => component.draw(ctx, this));

        ctx.restore();
    }

    handleInput(key) {
        switch (key) {
            case 'ArrowUp':
                this.vx += this.acceleration * Math.sin(this.angle);
                this.vy -= this.acceleration * Math.cos(this.angle);
                break;
            case 'ArrowDown':
                this.vx -= this.acceleration * Math.sin(this.angle);
                this.vy += this.acceleration * Math.cos(this.angle);
                break;
            case 'ArrowLeft':
                this.rotationalVelocity = Math.max(
                    this.rotationalVelocity - this.rotationAcceleration,
                    -this.maxRotationalSpeed
                );
                break;
            case 'ArrowRight':
                this.rotationalVelocity = Math.min(
                    this.rotationalVelocity + this.rotationAcceleration,
                    this.maxRotationalSpeed
                );
                break;
        }

        // Allow components to handle input
        this.components.forEach(component => {
            if (component.handleInput) {
                component.handleInput(key, this);
            }
        });
    }
}

// Component Decorators
class PodBody {
    constructor(config = {}) {
        this.width = config.width || 15;
        this.height = config.height || 40;
        this.color = config.color || '#F0E68C';
    }

    draw(ctx, pod) {
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width, this.height, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class PodCockpit {
    constructor(config = {}) {
        this.radius = config.radius || 10;
        this.color = config.color || 'blue';
        this.yOffset = config.yOffset || -20;
    }

    draw(ctx, pod) {
        ctx.beginPath();
        ctx.arc(0, this.yOffset, this.radius, 0, Math.PI, true);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class PodThruster {
    constructor(config = {}) {
        this.width = config.width || 10;
        this.height = config.height || 20;
        this.color = config.color || 'gray';
        this.yOffset = config.yOffset || 35;
    }

    draw(ctx, pod) {
        ctx.beginPath();
        ctx.rect(-this.width/2, this.yOffset, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// Factory function to create a default pod configuration
function createDefaultPod(canvasWidth, canvasHeight, config = {}) {
    return new Pod(canvasWidth, canvasHeight, config)
        .addComponent(new PodBody(config.body))
        .addComponent(new PodCockpit(config.cockpit))
        .addComponent(new PodThruster(config.thruster));
}

export { Pod, PodBody, PodCockpit, PodThruster, createDefaultPod }; 
export default Pod; 