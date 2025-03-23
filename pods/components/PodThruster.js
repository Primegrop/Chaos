import PodComponent from './PodComponent.js';

class PodThruster extends PodComponent {
    constructor(config) {
        super(config);
        this.width = config.width || 10;
        this.height = config.height || 20;
        this.color = config.color || 'gray';
        this.yOffset = config.yOffset || 35;
    }

    draw(ctx, pod) {
        // Draw main thruster pipe
        ctx.beginPath();
        ctx.rect(-this.width/2, this.yOffset, this.width, this.height);

        // Create gradient for 3D pipe effect
        const pipeGradient = ctx.createLinearGradient(
            -this.width/2, 0,
            this.width/2, 0
        );
        
        // Convert base color to RGB for manipulation
        const baseColor = this.getRGBFromHex(this.color);
        const highlightColor = this.adjustColor(baseColor, 40);
        const shadowColor = this.adjustColor(baseColor, -40);
        
        // Add gradient stops for cylindrical effect
        pipeGradient.addColorStop(0, shadowColor);
        pipeGradient.addColorStop(0.3, this.color);
        pipeGradient.addColorStop(0.7, this.color);
        pipeGradient.addColorStop(1, shadowColor);
        
        ctx.fillStyle = pipeGradient;
        ctx.fill();

        // Add highlight reflection
        ctx.beginPath();
        ctx.rect(
            -this.width/2, 
            this.yOffset, 
            this.width/6, 
            this.height
        );
        const highlightGradient = ctx.createLinearGradient(
            -this.width/2, 0,
            -this.width/3, 0
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.fill();

        // Add rim effect at top and bottom
        this.drawRim(ctx, this.yOffset);
        this.drawRim(ctx, this.yOffset + this.height);

        // Check for thrust lockout
        const mainLoop = window.gameLoop;
        const thrustLocked = mainLoop && mainLoop.checkThrustLockout();

        // Draw main thrust effect if active and not locked
        if (pod.isThrusting && !thrustLocked) {
            this.drawThrustEffect(ctx);
        }

        // Draw rotation thrust effects if active and not locked
        if (pod.isRotatingLeft && !thrustLocked) {
            this.drawRotationThrustEffect(ctx, 'left');
        }
        if (pod.isRotatingRight && !thrustLocked) {
            this.drawRotationThrustEffect(ctx, 'right');
        }
    }

    drawRim(ctx, y) {
        // Draw rim ellipse
        ctx.beginPath();
        ctx.ellipse(0, y, this.width/2, this.width/6, 0, 0, Math.PI * 2);
        
        // Create gradient for rim
        const rimGradient = ctx.createLinearGradient(
            -this.width/2, y,
            this.width/2, y
        );
        const baseColor = this.getRGBFromHex(this.color);
        rimGradient.addColorStop(0, this.adjustColor(baseColor, -30));
        rimGradient.addColorStop(0.5, this.adjustColor(baseColor, 20));
        rimGradient.addColorStop(1, this.adjustColor(baseColor, -30));
        
        ctx.fillStyle = rimGradient;
        ctx.fill();
        
        // Add rim highlight
        ctx.beginPath();
        ctx.ellipse(0, y, this.width/2, this.width/6, 0, Math.PI, Math.PI * 2);
        const rimHighlight = ctx.createLinearGradient(
            -this.width/2, y,
            this.width/2, y
        );
        rimHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        rimHighlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        rimHighlight.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        ctx.fillStyle = rimHighlight;
        ctx.fill();
    }

    drawThrustEffect(ctx) {
        const thrustLength = this.height * 0.8;
        const maxWidth = this.width * 1.2;
        
        // Create gradient for thrust
        const thrustGradient = ctx.createLinearGradient(
            0, this.yOffset + this.height,
            0, this.yOffset + this.height + thrustLength
        );
        thrustGradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
        thrustGradient.addColorStop(0.6, 'rgba(255, 100, 50, 0.4)');
        thrustGradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

        // Draw thrust flame
        ctx.beginPath();
        ctx.moveTo(-this.width/2, this.yOffset + this.height);
        ctx.lineTo(this.width/2, this.yOffset + this.height);
        ctx.lineTo(maxWidth/2, this.yOffset + this.height + thrustLength);
        ctx.lineTo(-maxWidth/2, this.yOffset + this.height + thrustLength);
        ctx.closePath();
        
        ctx.fillStyle = thrustGradient;
        ctx.fill();
    }

    drawRotationThrustEffect(ctx, direction) {
        const thrustLength = this.height * 0.4;
        const thrustWidth = this.width * 0.6;
        const xOffset = direction === 'left' ? -this.width/2 : this.width/2;
        
        // Create gradient for side thrust
        const thrustGradient = ctx.createLinearGradient(
            xOffset,
            this.yOffset + this.height,
            xOffset + (direction === 'left' ? -thrustWidth : thrustWidth),
            this.yOffset + this.height
        );
        thrustGradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
        thrustGradient.addColorStop(0.6, 'rgba(255, 100, 50, 0.4)');
        thrustGradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

        // Draw side thrust flame
        ctx.beginPath();
        if (direction === 'left') {
            ctx.moveTo(xOffset, this.yOffset + this.height - thrustWidth/2);
            ctx.lineTo(xOffset - thrustLength, this.yOffset + this.height);
            ctx.lineTo(xOffset, this.yOffset + this.height + thrustWidth/2);
        } else {
            ctx.moveTo(xOffset, this.yOffset + this.height - thrustWidth/2);
            ctx.lineTo(xOffset + thrustLength, this.yOffset + this.height);
            ctx.lineTo(xOffset, this.yOffset + this.height + thrustWidth/2);
        }
        ctx.closePath();
        
        ctx.fillStyle = thrustGradient;
        ctx.fill();
    }

    // Helper function to convert hex color to RGB
    getRGBFromHex(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 128, g: 128, b: 128}; // Default to gray if invalid hex
    }

    // Helper function to adjust color brightness
    adjustColor(color, amount) {
        const clamp = (val) => Math.min(255, Math.max(0, val));
        return `rgb(${clamp(color.r + amount)}, ${clamp(color.g + amount)}, ${clamp(color.b + amount)})`;
    }
}

export default PodThruster; 