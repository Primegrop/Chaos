import PodComponent from './PodComponent.js';

class PodTTail extends PodComponent {
    constructor(config = {}) {
        super(config);
        this.width = config.width || 10;
        this.height = config.height || 24;  // 20% longer than default thruster
        this.crossWidth = config.crossWidth || 20; // Width of the T cross part
        this.crossHeight = config.crossHeight || 8; // Height of the T cross part
        this.color = config.color || 'gray';
        this.yOffset = config.yOffset || 35;

        // Apply rotation enhancement to the pod
        if (config.pod) {
            config.pod.rotationAcceleration *= 1.2;
            config.pod.maxRotationalSpeed *= 1.1;
        }
    }

    draw(ctx, pod) {
        // No need for translation or rotation here - the Pod class handles that
        
        // Draw vertical part of T
        ctx.beginPath();
        ctx.rect(-this.width/2, this.yOffset, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw horizontal part of T
        ctx.beginPath();
        ctx.rect(-this.crossWidth/2, 
                this.yOffset + this.height - this.crossHeight, 
                this.crossWidth, 
                this.crossHeight);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add some detail lines for visual interest
        ctx.beginPath();
        ctx.moveTo(-this.crossWidth/2, this.yOffset + this.height - this.crossHeight/2);
        ctx.lineTo(this.crossWidth/2, this.yOffset + this.height - this.crossHeight/2);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw main thrust effect when active
        if (pod.isThrusting) {
            this.drawMainThrustEffect(ctx);
        }

        // Draw rotation thrust effects
        if (pod.isRotatingLeft) {
            this.drawRotationThrustEffect(ctx, 'left'); // Left thrust for left rotation
        }
        if (pod.isRotatingRight) {
            this.drawRotationThrustEffect(ctx, 'right'); // Right thrust for right rotation
        }
    }

    drawMainThrustEffect(ctx) {
        // Main thrust from vertical part
        const gradient = ctx.createLinearGradient(
            0, this.yOffset + this.height,
            0, this.yOffset + this.height + this.height * 0.8
        );
        gradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 100, 50, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

        ctx.beginPath();
        ctx.moveTo(-this.width/2, this.yOffset + this.height);
        ctx.lineTo(this.width/2, this.yOffset + this.height);
        ctx.lineTo(0, this.yOffset + this.height + this.height * 0.8);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    drawRotationThrustEffect(ctx, side) {
        const thrustLength = this.crossHeight * 2;  // Increased length for visibility
        const thrustWidth = this.crossHeight * 0.8;
        const xPos = side === 'left' ? -this.crossWidth/2 : this.crossWidth/2;
        const xDirection = side === 'left' ? -1 : 1;
        const yPos = this.yOffset + this.height - this.crossHeight/2;

        // Create gradient for side thrust
        const thrustGradient = ctx.createLinearGradient(
            xPos, yPos,
            xPos + xDirection * thrustLength, yPos
        );
        thrustGradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
        thrustGradient.addColorStop(0.6, 'rgba(255, 100, 50, 0.4)');
        thrustGradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

        // Draw side thrust flame
        ctx.beginPath();
        if (side === 'left') {
            ctx.moveTo(xPos, yPos - thrustWidth/2);
            ctx.lineTo(xPos - thrustLength, yPos);
            ctx.lineTo(xPos, yPos + thrustWidth/2);
        } else {
            ctx.moveTo(xPos, yPos - thrustWidth/2);
            ctx.lineTo(xPos + thrustLength, yPos);
            ctx.lineTo(xPos, yPos + thrustWidth/2);
        }
        ctx.closePath();
        
        ctx.fillStyle = thrustGradient;
        ctx.fill();
    }
}

export default PodTTail; 