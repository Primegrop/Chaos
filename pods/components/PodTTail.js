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
        // Draw vertical part of T with 3D effect
        ctx.beginPath();
        ctx.rect(-this.width/2, this.yOffset, this.width, this.height);
        
        // Create gradient for vertical part
        const verticalGradient = ctx.createLinearGradient(
            -this.width/2, 0,
            this.width/2, 0
        );
        
        // Convert base color to RGB for manipulation
        const baseColor = this.getRGBFromHex(this.color);
        const highlightColor = this.adjustColor(baseColor, 40);
        const shadowColor = this.adjustColor(baseColor, -40);
        
        // Add gradient stops for cylindrical effect
        verticalGradient.addColorStop(0, shadowColor);
        verticalGradient.addColorStop(0.3, this.color);
        verticalGradient.addColorStop(0.7, this.color);
        verticalGradient.addColorStop(1, shadowColor);
        
        ctx.fillStyle = verticalGradient;
        ctx.fill();

        // Add vertical highlight reflection
        ctx.beginPath();
        ctx.rect(
            -this.width/2, 
            this.yOffset, 
            this.width/6, 
            this.height
        );
        const vertHighlightGradient = ctx.createLinearGradient(
            -this.width/2, 0,
            -this.width/3, 0
        );
        vertHighlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        vertHighlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = vertHighlightGradient;
        ctx.fill();

        // Draw horizontal part of T with 3D effect
        ctx.beginPath();
        ctx.rect(-this.crossWidth/2, 
                this.yOffset + this.height - this.crossHeight, 
                this.crossWidth, 
                this.crossHeight);
        
        // Create gradient for horizontal part
        const horizGradient = ctx.createLinearGradient(
            0, this.yOffset + this.height - this.crossHeight,
            0, this.yOffset + this.height
        );
        
        // Add gradient stops for cylindrical effect
        horizGradient.addColorStop(0, highlightColor);
        horizGradient.addColorStop(0.4, this.color);
        horizGradient.addColorStop(0.6, this.color);
        horizGradient.addColorStop(1, shadowColor);
        
        ctx.fillStyle = horizGradient;
        ctx.fill();

        // Add horizontal highlight reflection
        ctx.beginPath();
        ctx.rect(
            -this.crossWidth/2,
            this.yOffset + this.height - this.crossHeight,
            this.crossWidth,
            this.crossHeight/3
        );
        const horizHighlightGradient = ctx.createLinearGradient(
            0, this.yOffset + this.height - this.crossHeight,
            0, this.yOffset + this.height - this.crossHeight * 0.7
        );
        horizHighlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        horizHighlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = horizHighlightGradient;
        ctx.fill();

        // Draw main thrust effect when active
        if (pod.isThrusting) {
            this.drawMainThrustEffect(ctx);
        }

        // Draw rotation thrust effects
        if (pod.isRotatingLeft) {
            this.drawRotationThrustEffect(ctx, 'left');
        }
        if (pod.isRotatingRight) {
            this.drawRotationThrustEffect(ctx, 'right');
        }
    }

    // Helper function to convert hex color to RGB
    getRGBFromHex(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Helper function to adjust color brightness
    adjustColor(color, amount) {
        const clamp = (val) => Math.min(255, Math.max(0, val));
        return `rgb(${clamp(color.r + amount)}, ${clamp(color.g + amount)}, ${clamp(color.b + amount)})`;
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
        const thrustLength = this.crossHeight * 2;
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