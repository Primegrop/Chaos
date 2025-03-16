class Background {
    constructor(canvas, floorType) {
        this.canvas = canvas;
        this.borderColor = 'lime';
        this.borderWidth = 5;
        this.floor = floorType;
    }

    applyStyles() {
        this.canvas.style.border = `${this.borderWidth}px solid ${this.borderColor}`;
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
    }

    draw(ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw floor pattern
        const tileSize = this.floor.tileSize;
        for (let y = 0; y < this.canvas.height; y += tileSize) {
            for (let x = 0; x < this.canvas.width; x += tileSize) {
                this.floor.drawTile(ctx, x, y);
            }
        }
    }
}

export default Background; 