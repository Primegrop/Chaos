class EnergyFloor {
    constructor() {
        this.tileSize = 60; // Adjusted for better coverage
        this.baseColor = '#1a1a2e'; // Dark blue base
        this.glowColor = '#00ff8855'; // Cyan glow with transparency
        this.pulseSpeed = 0.001; // Speed of the pulsing effect
        this.timestamp = 0;
        
        // Hexagon measurements
        this.width = this.tileSize * 2;           // Width of hexagon
        this.height = Math.sqrt(3) * this.tileSize; // Height of hexagon
        this.horizontalSpacing = this.width * 3/4;  // Distance between columns
        this.verticalSpacing = this.height;         // Distance between rows
    }

    drawHexagon(ctx, x, y) {
        // Calculate points for perfect hexagon
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) - Math.PI / 6; // Start at top center
            points.push({
                x: x + this.tileSize * Math.cos(angle),
                y: y + this.tileSize * Math.sin(angle)
            });
        }
        
        // Calculate pulse effect (0 to 1)
        const pulse = (Math.sin(this.timestamp * this.pulseSpeed) + 1) / 2;
        
        // Draw hexagon path
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();

        // Fill hexagon with gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.tileSize);
        gradient.addColorStop(0, this.baseColor);
        gradient.addColorStop(0.7, '#2a2a4e');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw energy pattern
        ctx.save();
        ctx.clip();
        
        // Draw energy lines
        const lineGradient = ctx.createLinearGradient(x - this.tileSize, y - this.tileSize, 
                                                     x + this.tileSize, y + this.tileSize);
        lineGradient.addColorStop(0, 'transparent');
        lineGradient.addColorStop(0.5, `rgba(0, 255, 136, ${0.2 + pulse * 0.2})`);
        lineGradient.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        
        // Draw multiple lines with varying angles
        for (let i = 0; i < 3; i++) {
            const offset = (i - 1) * 15; // Reduced offset for smaller tiles
            ctx.beginPath();
            ctx.moveTo(x - this.tileSize, y + offset);
            ctx.lineTo(x + this.tileSize, y + this.tileSize + offset);
            ctx.stroke();
        }
        
        ctx.restore();

        // Draw glowing edge
        ctx.strokeStyle = `rgba(0, 255, 136, ${0.3 + pulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add inner glow
        ctx.strokeStyle = `rgba(0, 255, 136, ${0.1 + pulse * 0.1})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        this.timestamp++;
    }

    drawTile(ctx, x, y) {
        // Calculate grid position
        const col = Math.floor(x / this.horizontalSpacing);
        const row = Math.floor(y / this.verticalSpacing);
        
        // Calculate actual pixel position
        const xPos = col * this.horizontalSpacing;
        const yPos = row * this.verticalSpacing + (col % 2 ? this.verticalSpacing / 2 : 0);
        
        // Only draw if the hexagon will be visible
        if (xPos + this.width >= 0 && 
            xPos - this.width <= ctx.canvas.width && 
            yPos + this.height >= 0 && 
            yPos - this.height <= ctx.canvas.height) {
            this.drawHexagon(ctx, xPos, yPos);
        }
    }
}

export default EnergyFloor; 