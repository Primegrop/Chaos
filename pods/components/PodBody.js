import PodComponent from './PodComponent.js';

export class PodBody extends PodComponent {
    constructor(config) {
        super(config);
        this.width = config.width || 20;
        this.height = config.height || 30;
        this.color = config.color || '#888888';
        this.yOffset = config.yOffset || 0;
        this.lastPulseTime = 0;
        this.pulseIntensity = 0;
    }

    draw(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Create main body shape
        ctx.beginPath();
        ctx.ellipse(0, this.yOffset, this.width, this.height, 0, 0, Math.PI * 2);
        
        // Create gradient for 3D effect
        const gradient = ctx.createLinearGradient(-this.width, this.yOffset, this.width, this.yOffset);
        
        // Convert base color to RGB for manipulation
        const baseColor = this.getRGBFromHex(this.color);
        
        // Create lighter and darker versions of the base color
        const highlightColor = this.adjustColor(baseColor, 40);
        const shadowColor = this.adjustColor(baseColor, -40);
        const midToneColor = this.adjustColor(baseColor, -20);
        
        // Add gradient stops
        gradient.addColorStop(0, shadowColor);
        gradient.addColorStop(0.3, midToneColor);
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(0.7, midToneColor);
        gradient.addColorStop(1, shadowColor);

        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add highlight reflection
        ctx.beginPath();
        ctx.ellipse(
            -this.width * 0.2,
            this.yOffset - this.height * 0.3,
            this.width * 0.3,
            this.height * 0.4,
            Math.PI / 4,
            0,
            Math.PI * 2
        );
        const highlightGradient = ctx.createRadialGradient(
            -this.width * 0.2, this.yOffset - this.height * 0.3, 0,
            -this.width * 0.2, this.yOffset - this.height * 0.3, this.width * 0.3
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.fill();

        // Add shadow at the bottom
        ctx.beginPath();
        ctx.ellipse(0, this.yOffset + this.height * 0.3, this.width * 0.8, this.height * 0.3, 0, 0, Math.PI * 2);
        const shadowGradient = ctx.createRadialGradient(
            0, this.yOffset + this.height * 0.3, 0,
            0, this.yOffset + this.height * 0.3, this.width
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.fill();

        // Check for thrust lockout
        const mainLoop = window.gameLoop;
        const thrustLocked = mainLoop && mainLoop.checkThrustLockout();

        if (thrustLocked) {
            this.drawLightningEffect(ctx);
        }

        ctx.restore();
    }

    drawLightningEffect(ctx) {
        const now = performance.now();
        // Update pulse intensity
        if (now - this.lastPulseTime > 16) { // ~60fps
            this.pulseIntensity = Math.sin(now / 200) * 0.5 + 0.5; // Oscillate between 0 and 1
            this.lastPulseTime = now;
        }

        ctx.save();
        
        // Draw lightning around the perimeter
        const numPoints = 12; // Number of points around the ellipse
        const angleStep = (Math.PI * 2) / numPoints;
        
        for (let i = 0; i < numPoints; i++) {
            const startAngle = i * angleStep;
            const endAngle = ((i + 1) % numPoints) * angleStep;
            
            // Calculate start and end points on the ellipse
            const startX = Math.cos(startAngle) * this.width;
            const startY = this.yOffset + Math.sin(startAngle) * this.height;
            const endX = Math.cos(endAngle) * this.width;
            const endY = this.yOffset + Math.sin(endAngle) * this.height;
            
            // Draw lightning segment between these points
            this.drawLightningSegment(ctx, 
                startX, startY, 
                endX, endY, 
                this.pulseIntensity
            );
        }

        ctx.restore();
    }

    drawLightningSegment(ctx, startX, startY, endX, endY, intensity) {
        const segments = 3; // Number of segments in each lightning bolt
        const dx = endX - startX;
        const dy = endY - startY;
        const segmentLength = Math.sqrt(dx * dx + dy * dy) / segments;
        const perpDistance = segmentLength * 0.3; // Maximum perpendicular deviation
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        // Create intermediate points with random perpendicular offset
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const baseX = startX + dx * t;
            const baseY = startY + dy * t;
            
            // Calculate perpendicular vector
            const perpX = -dy / Math.sqrt(dx * dx + dy * dy);
            const perpY = dx / Math.sqrt(dx * dx + dy * dy);
            
            // Add random offset in perpendicular direction
            const offset = (Math.random() - 0.5) * perpDistance;
            const pointX = baseX + perpX * offset;
            const pointY = baseY + perpY * offset;
            
            ctx.lineTo(pointX, pointY);
        }
        
        ctx.lineTo(endX, endY);

        // Style for the lightning
        ctx.strokeStyle = `rgba(255, 255, 0, ${0.3 + intensity * 0.7})`; // Yellow with pulsing opacity
        ctx.lineWidth = 1 + intensity * 1.5; // Thinner lines for perimeter
        ctx.stroke();

        // Add glow effect
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + intensity * 0.3})`; // White glow
        ctx.lineWidth = 2 + intensity * 2;
        ctx.stroke();
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
}

export default PodBody; 