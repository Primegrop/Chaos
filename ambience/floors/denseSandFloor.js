class DenseSandFloor {
    constructor() {
        // Use game dimensions instead of tile size
        this.width = 1280;  // Game width
        this.height = 720;  // Game height
        this.baseColor = '#d4a76a';      // Base sand color
        this.darkColor = '#b38a5a';      // Shadow color
        this.lightColor = '#e8c396';     // Highlight color
        
        // Pre-render the rippling sand pattern for entire play area
        this.sandPattern = this.createSandPattern();
    }

    createSandPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');

        // Fill with base color
        ctx.fillStyle = this.baseColor;
        ctx.fillRect(0, 0, this.width, this.height);

        // Create ripple pattern
        const rippleData = ctx.createImageData(this.width, this.height);
        const data = rippleData.data;

        // Parameters for the ripple pattern - doubled frequencies
        const frequency1 = 0.03;   // Doubled from 0.015
        const frequency2 = 0.04;   // Doubled from 0.02
        const amplitude = 30;      // Reduced from 40 to scale with frequency

        // Create more seed points for denser pattern
        const seedPoints = [];
        for (let i = 0; i < 24; i++) {  // Doubled from 12
            seedPoints.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                frequency: 0.02 + Math.random() * 0.04  // Doubled frequency range
            });
        }

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let totalHeight = 0;

                // Combine multiple wave sources
                for (const point of seedPoints) {
                    const dx = x - point.x;
                    const dy = y - point.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    totalHeight += Math.sin(distance * point.frequency) / seedPoints.length;
                }

                // Add base waves for variety
                totalHeight += Math.sin(x * frequency1 + y * frequency2) * 0.3;
                totalHeight += Math.sin(y * frequency1 + x * frequency2) * 0.3;

                // Normalize to 0-1 range
                const height = (totalHeight + 1) * 0.5;

                // Convert base color to RGB
                const baseRGB = this.hexToRgb(this.baseColor);
                const darkRGB = this.hexToRgb(this.darkColor);
                const lightRGB = this.hexToRgb(this.lightColor);

                // Index in the image data array
                const i = (y * this.width + x) * 4;

                // Interpolate between dark and light colors based on height
                if (height < 0.5) {
                    // Interpolate between dark and base
                    const factor = height * 2;
                    data[i] = Math.round(darkRGB.r + (baseRGB.r - darkRGB.r) * factor);
                    data[i + 1] = Math.round(darkRGB.g + (baseRGB.g - darkRGB.g) * factor);
                    data[i + 2] = Math.round(darkRGB.b + (baseRGB.b - darkRGB.b) * factor);
                } else {
                    // Interpolate between base and light
                    const factor = (height - 0.5) * 2;
                    data[i] = Math.round(baseRGB.r + (lightRGB.r - baseRGB.r) * factor);
                    data[i + 1] = Math.round(baseRGB.g + (lightRGB.g - baseRGB.g) * factor);
                    data[i + 2] = Math.round(baseRGB.b + (lightRGB.b - baseRGB.b) * factor);
                }
                data[i + 3] = 255; // Alpha channel
            }
        }

        // Apply the ripple pattern
        ctx.putImageData(rippleData, 0, 0);

        // Add subtle noise texture
        const noiseData = ctx.getImageData(0, 0, this.width, this.height);
        const noisePixels = noiseData.data;
        for (let i = 0; i < noisePixels.length; i += 4) {
            const noise = (Math.random() - 0.5) * 6; // Reduced noise for finer detail
            noisePixels[i] = Math.min(255, Math.max(0, noisePixels[i] + noise));
            noisePixels[i + 1] = Math.min(255, Math.max(0, noisePixels[i + 1] + noise));
            noisePixels[i + 2] = Math.min(255, Math.max(0, noisePixels[i + 2] + noise));
        }
        ctx.putImageData(noiseData, 0, 0);

        // Add very subtle blur for antialiasing
        ctx.filter = 'blur(0.3px)';  // Reduced blur for sharper detail
        ctx.drawImage(canvas, 0, 0);

        return canvas;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    drawTile(ctx, x, y) {
        // Draw the entire pattern at once, ignoring tile coordinates
        if (x === 0 && y === 0) {
            ctx.drawImage(this.sandPattern, 0, 0);
        }
    }
}

export default DenseSandFloor; 