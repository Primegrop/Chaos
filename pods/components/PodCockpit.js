import PodComponent from './PodComponent.js';

export class PodCockpit extends PodComponent {
    constructor(config) {
        super(config);
        this.radius = config.radius || 10;
        this.color = config.color || 'blue';
        this.highlightColor = config.highlightColor || '#808080';  // Default to gray if not specified
        this.yOffset = config.yOffset || -20;
        
        // Panel dimensions
        this.panelWidth = this.radius * 0.8;
        this.panelHeight = this.radius * 1.2;
        this.panelSpacing = this.radius * 0.6;
    }

    draw(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Draw main cockpit shape
        ctx.beginPath();
        ctx.arc(0, this.yOffset, this.radius, 0, Math.PI, true);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add metallic border using highlightColor
        ctx.strokeStyle = this.highlightColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw panel separators with highlightColor
        ctx.beginPath();
        // Left separator (at -30% from center at bottom, -45% at top)
        ctx.moveTo(-this.radius * 0.30, this.yOffset);  // Bottom point
        ctx.lineTo(-this.radius * 0.45, this.yOffset - this.radius);  // Top point
        
        // Right separator (at +30% from center at bottom, +45% at top)
        ctx.moveTo(this.radius * 0.30, this.yOffset);  // Bottom point
        ctx.lineTo(this.radius * 0.45, this.yOffset - this.radius);  // Top point
        
        ctx.strokeStyle = this.highlightColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add glass reflection effect with reduced opacity for dark cockpits
        const gradient = ctx.createLinearGradient(
            0, this.yOffset - this.radius,
            0, this.yOffset
        );
        const isBlack = this.color.toLowerCase() === '#000000';
        const reflectionOpacity = isBlack ? 0.15 : 0.2;  // Reduced opacity for black cockpits
        
        gradient.addColorStop(0, `rgba(255, 255, 255, ${reflectionOpacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(0, this.yOffset, this.radius, 0, Math.PI, true);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    drawPanel(ctx, xOffset, yOffset, angleOffset) {
        ctx.save();
        ctx.translate(xOffset, yOffset);
        ctx.rotate(angleOffset);

        // Create panel shape
        ctx.beginPath();
        ctx.ellipse(0, 0, this.panelWidth, this.panelHeight, 0, 0, Math.PI * 2);

        // Base glass color with transparency
        const baseColor = this.getRGBFromHex(this.color);
        ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.6)`;
        ctx.fill();

        // Add metallic frame
        ctx.strokeStyle = this.adjustColor(baseColor, -30);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add glass reflection
        ctx.beginPath();
        ctx.ellipse(
            -this.panelWidth * 0.2,
            -this.panelHeight * 0.3,
            this.panelWidth * 0.4,
            this.panelHeight * 0.5,
            Math.PI / 4,
            0,
            Math.PI * 2
        );
        
        // Create reflection gradient
        const reflection = ctx.createRadialGradient(
            -this.panelWidth * 0.2, -this.panelHeight * 0.3, 0,
            -this.panelWidth * 0.2, -this.panelHeight * 0.3, this.panelWidth * 0.4
        );
        reflection.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        reflection.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
        reflection.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = reflection;
        ctx.fill();

        // Add subtle inner shadow
        ctx.beginPath();
        ctx.ellipse(0, 0, this.panelWidth, this.panelHeight, 0, 0, Math.PI * 2);
        const innerShadow = ctx.createRadialGradient(
            0, 0, this.panelWidth * 0.7,
            0, 0, this.panelWidth
        );
        innerShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
        innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        ctx.fillStyle = innerShadow;
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
        } : {r: 0, g: 0, b: 255}; // Default to blue if invalid hex
    }

    // Helper function to adjust color brightness
    adjustColor(color, amount) {
        const clamp = (val) => Math.min(255, Math.max(0, val));
        return `rgb(${clamp(color.r + amount)}, ${clamp(color.g + amount)}, ${clamp(color.b + amount)})`;
    }
}

export default PodCockpit; 