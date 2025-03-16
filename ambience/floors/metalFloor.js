class MetalFloor {
    constructor() {
        this.tileSize = 160;
        this.rivetSize = 4.5;
        this.rivetOffset = 8;
    }

    drawRivet(ctx, x, y) {
        // Add slight blur effect for anti-aliasing
        ctx.shadowBlur = 1;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';

        // Main rivet circle with smoother gradient
        const rivetGradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, this.rivetSize
        );
        rivetGradient.addColorStop(0, '#B8B8B8');
        rivetGradient.addColorStop(0.8, '#A0A0A0');
        rivetGradient.addColorStop(1, '#909090');
        
        ctx.beginPath();
        ctx.arc(x, y, this.rivetSize, 0, Math.PI * 2);
        ctx.fillStyle = rivetGradient;
        ctx.fill();

        // Highlight (top-left) with transparency for smoothness
        ctx.beginPath();
        ctx.arc(x - this.rivetSize/3, y - this.rivetSize/3, this.rivetSize/2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        // Shadow (bottom-right) with transparency for smoothness
        ctx.beginPath();
        ctx.arc(x + this.rivetSize/3, y + this.rivetSize/3, this.rivetSize/2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(80, 80, 80, 0.6)';
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    drawTile(ctx, x, y) {
        // Square background
        ctx.fillStyle = '#B8B8B8';
        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        // Add metallic shading effect with reflection
        const mainGradient = ctx.createLinearGradient(x, y, x + this.tileSize, y + this.tileSize);
        mainGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        mainGradient.addColorStop(0.3, 'rgba(128, 128, 128, 0.1)');
        mainGradient.addColorStop(0.7, 'rgba(128, 128, 128, 0.1)');
        mainGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = mainGradient;
        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        // Add diagonal reflection strip
        const reflectionGradient = ctx.createLinearGradient(
            x, y,
            x + this.tileSize * 0.7, y + this.tileSize * 0.7
        );
        reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
        reflectionGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
        reflectionGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        reflectionGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
        reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        // Draw subtle edge highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + this.tileSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + this.tileSize, y);
        ctx.stroke();

        // Draw subtle edge shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x + this.tileSize, y);
        ctx.lineTo(x + this.tileSize, y + this.tileSize);
        ctx.lineTo(x, y + this.tileSize);
        ctx.stroke();

        // Draw rivets in corners
        this.drawRivet(ctx, x + this.rivetOffset, y + this.rivetOffset); // Top-left
        this.drawRivet(ctx, x + this.tileSize - this.rivetOffset, y + this.rivetOffset); // Top-right
        this.drawRivet(ctx, x + this.rivetOffset, y + this.tileSize - this.rivetOffset); // Bottom-left
        this.drawRivet(ctx, x + this.tileSize - this.rivetOffset, y + this.tileSize - this.rivetOffset); // Bottom-right
    }
}

export default MetalFloor; 