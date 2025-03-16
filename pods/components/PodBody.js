import PodComponent from './PodComponent.js';

export class PodBody extends PodComponent {
    constructor(config) {
        super(config);
        this.width = config.width || 15;
        this.height = config.height || 40;
        this.color = config.color || '#F0E68C';
        this.yOffset = config.yOffset || 0;
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

export default PodBody; 