class SandDuneFloor {
    constructor() {
        // Use game dimensions instead of tile size
        this.width = 1280;  // Game width
        this.height = 720;  // Game height
        this.baseColor = '#d4a76a';      // Base sand color
        this.darkColor = '#b38a5a';      // Shadow color
        this.lightColor = '#e8c396';     // Highlight color
        this.vegetationColor = '#7a8850'; // More muted vegetation color
        
        // Pre-render the rippling sand pattern for entire play area
        this.sandPattern = this.createSandPattern();
    }

    createVegetationPattern(ctx, x, y, size) {
        // More subtle vegetation with less transparency variation
        const alpha = Math.random() * 0.2 + 0.5; // Random transparency between 0.5 and 0.7
        
        // Create a small cluster of 1-2 dots for more subtle appearance
        const dots = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < dots; i++) {
            const dotSize = (Math.random() * 0.3 + 0.7) * size; // Slight size variation
            const offsetX = (Math.random() - 0.5) * size;
            const offsetY = (Math.random() - 0.5) * size;
            
            // Subtle shadow
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.2})`;
            ctx.beginPath();
            ctx.arc(x + offsetX + 0.5, y + offsetY + 0.5, dotSize, 0, Math.PI * 2);
            ctx.fill();

            // Main vegetation dot
            ctx.fillStyle = `rgba(122, 136, 80, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, dotSize, 0, Math.PI * 2);
            ctx.fill();

            // Subtle highlight
            ctx.fillStyle = `rgba(150, 165, 100, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(x + offsetX - dotSize/4, y + offsetY - dotSize/4, dotSize/3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    createSandPattern() {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        const ctx = canvas.getContext('2d');

        // Create ripple pattern
        const rippleData = ctx.createImageData(this.width, this.height);
        const data = rippleData.data;
        const heightMap = new Array(this.width * this.height);

        // Parameters for the ripple pattern
        const frequency1 = 0.015;
        const frequency2 = 0.02;
        const amplitude = 40;

        // Create wave seed points
        const seedPoints = [];
        for (let i = 0; i < 12; i++) {
            seedPoints.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                frequency: 0.01 + Math.random() * 0.02
            });
        }

        // Generate height map and sand pattern
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let totalHeight = 0;

                for (const point of seedPoints) {
                    const dx = x - point.x;
                    const dy = y - point.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    totalHeight += Math.sin(distance * point.frequency) / seedPoints.length;
                }

                totalHeight += Math.sin(x * frequency1 + y * frequency2) * 0.3;
                totalHeight += Math.sin(y * frequency1 + x * frequency2) * 0.3;

                const height = (totalHeight + 1) * 0.5;
                heightMap[y * this.width + x] = height;

                const baseRGB = this.hexToRgb(this.baseColor);
                const darkRGB = this.hexToRgb(this.darkColor);
                const lightRGB = this.hexToRgb(this.lightColor);

                const i = (y * this.width + x) * 4;

                if (height < 0.5) {
                    const factor = height * 2;
                    data[i] = Math.round(darkRGB.r + (baseRGB.r - darkRGB.r) * factor);
                    data[i + 1] = Math.round(darkRGB.g + (baseRGB.g - darkRGB.g) * factor);
                    data[i + 2] = Math.round(darkRGB.b + (baseRGB.b - darkRGB.b) * factor);
                } else {
                    const factor = (height - 0.5) * 2;
                    data[i] = Math.round(baseRGB.r + (lightRGB.r - baseRGB.r) * factor);
                    data[i + 1] = Math.round(baseRGB.g + (lightRGB.g - baseRGB.g) * factor);
                    data[i + 2] = Math.round(baseRGB.b + (lightRGB.b - baseRGB.b) * factor);
                }
                data[i + 3] = 255;
            }
        }

        // Apply the base sand pattern
        ctx.putImageData(rippleData, 0, 0);

        // Add subtle noise texture
        const noiseData = ctx.getImageData(0, 0, this.width, this.height);
        const noisePixels = noiseData.data;
        for (let i = 0; i < noisePixels.length; i += 4) {
            const noise = (Math.random() - 0.5) * 8;
            noisePixels[i] = Math.min(255, Math.max(0, noisePixels[i] + noise));
            noisePixels[i + 1] = Math.min(255, Math.max(0, noisePixels[i + 1] + noise));
            noisePixels[i + 2] = Math.min(255, Math.max(0, noisePixels[i + 2] + noise));
        }
        ctx.putImageData(noiseData, 0, 0);

        // Create a temporary canvas for the blurred background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        // Clear original canvas
        ctx.clearRect(0, 0, this.width, this.height);

        // Draw blurred background
        ctx.filter = 'blur(0.5px)';
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.filter = 'none';  // Reset filter

        // Create cluster centers for vegetation
        const clusterCenters = [];
        const numClusters = 25; // Number of main vegetation clusters
        for (let i = 0; i < numClusters; i++) {
            clusterCenters.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 60 + 40 // Random cluster radius between 40-100 pixels
            });
        }

        // Create vegetation points with clustering
        const vegetationPoints = [];
        const pointsPerCluster = 20; // Points per cluster
        const randomPoints = 100;    // Additional random points

        // Add clustered points
        clusterCenters.forEach(center => {
            for (let i = 0; i < pointsPerCluster; i++) {
                // Use gaussian-like distribution for natural clustering
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * Math.random() * center.radius; // Square for more central density
                vegetationPoints.push({
                    x: center.x + Math.cos(angle) * distance,
                    y: center.y + Math.sin(angle) * distance
                });
            }
        });

        // Add random points for variety
        for (let i = 0; i < randomPoints; i++) {
            vegetationPoints.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height
            });
        }

        // Add vegetation in lower areas
        for (const point of vegetationPoints) {
            const x = Math.floor(point.x);
            const y = Math.floor(point.y);
            
            // Make sure point is within canvas bounds
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                const height = heightMap[y * this.width + x];
                
                // Adjusted height threshold for more natural distribution
                if (height < 0.5 && height > 0.15) { // Wider height range for placement
                    const size = 2.25; // Fixed size (half of metal floor rivet size)
                    this.createVegetationPattern(ctx, x, y, size);
                }
            }
        }

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

export default SandDuneFloor; 