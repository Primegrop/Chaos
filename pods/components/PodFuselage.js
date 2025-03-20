import PodComponent from './PodComponent.js';

export class PodFuselage extends PodComponent {
    constructor(config) {
        super(config);
        this.width = config.width || 8;  // 8 pixels thickness
        this.height = config.height || 30; // Length of the connecting piece
        this.color = config.color || '#808080'; // Default gray color
        this.yOffset = config.yOffset || 15; // Position between body and thruster
    }

    draw(ctx, pod) {
        ctx.save();
        
        // Draw main fuselage piece
        ctx.beginPath();
        ctx.rect(-this.width/2, this.yOffset, this.width, this.height);

        // Create gradient for 3D pipe effect
        const gradient = ctx.createLinearGradient(
            -this.width/2, 0,
            this.width/2, 0
        );
        
        // Convert base color to RGB for manipulation
        const baseColor = this.getRGBFromHex(this.color);
        const highlightColor = this.adjustColor(baseColor, 40);
        const shadowColor = this.adjustColor(baseColor, -40);
        
        // Add gradient stops for cylindrical effect
        gradient.addColorStop(0, shadowColor);
        gradient.addColorStop(0.3, this.color);
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, shadowColor);
        
        ctx.fillStyle = gradient;
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

        ctx.restore();
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