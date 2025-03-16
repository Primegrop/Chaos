import AudioManager from '../audio/AudioManager.js';

export default class BrickWall {
    constructor(x, y, configFile) {
        this.x = x;
        this.y = y;
        this.configFile = configFile;
        
        // Brick dimensions
        this.brickSize = 4;     // Square bricks (4x4)
        this.mortarSize = 1;    // Minimal mortar size
        
        // Colors - enhanced for 3D effect
        this.brickColor = '#8B4513';          // Base brick color
        this.mortarColor = '#A8A8A8';         // Mortar color
        this.shadowColor = 'rgba(0, 0, 0, 0.6)';  // Darker shadow for depth
        this.highlightColor = 'rgba(255, 255, 255, 0.2)'; // Brighter highlight
        this.depthColor = 'rgba(0, 0, 0, 0.8)';  // Deep shadow for wall depth
        
        // Wall configuration
        this.wallConfig = [];
        this.loadConfig();

        // Audio setup
        this.audioManager = new AudioManager();
        this.lastCollisionTime = 0;
        this.collisionCooldown = 100; // Milliseconds between collision sounds
    }

    async loadConfig() {
        try {
            const response = await fetch(this.configFile);
            const config = await response.json();
            this.wallConfig = config.walls || [];
        } catch (error) {
            console.error('Error loading wall configuration:', error);
            this.wallConfig = [];
        }
    }

    drawVerticalBrick(ctx, x, y) {
        // Draw mortar
        ctx.fillStyle = this.mortarColor;
        ctx.fillRect(x - this.mortarSize, y - this.mortarSize,
                    this.brickSize + this.mortarSize * 2,
                    this.brickSize + this.mortarSize * 2);

        // Draw brick base
        ctx.fillStyle = this.brickColor;
        ctx.fillRect(x, y, this.brickSize, this.brickSize);

        // Add highlight at the top
        ctx.fillStyle = this.highlightColor;
        ctx.fillRect(x, y, this.brickSize, 1);

        // Add shadow at the bottom
        ctx.fillStyle = this.shadowColor;
        ctx.fillRect(x, y + this.brickSize - 1, this.brickSize, 1);

        // Add right edge shadow for depth
        ctx.fillStyle = this.shadowColor;
        ctx.fillRect(x + this.brickSize - 1, y, 1, this.brickSize);

        // Add depth shadow
        ctx.fillStyle = this.depthColor;
        ctx.fillRect(x + this.brickSize, y, 2, this.brickSize);
    }

    drawHorizontalBrick(ctx, x, y) {
        // Similar to vertical but with horizontal depth shadow
        this.drawVerticalBrick(ctx, x, y);
        
        // Replace vertical depth shadow with horizontal one
        ctx.fillStyle = this.depthColor;
        ctx.fillRect(x, y + this.brickSize, this.brickSize, 2);
    }

    draw(ctx) {
        // Draw each wall segment based on configuration
        for (const wall of this.wallConfig) {
            const startX = this.x + (wall.x || 0) * (this.brickSize + this.mortarSize);
            const startY = this.y + (wall.y || 0) * (this.brickSize + this.mortarSize);
            
            for (let i = 0; i < wall.length; i++) {
                const x = startX + (wall.direction === 'horizontal' ? i * (this.brickSize + this.mortarSize) : 0);
                const y = startY + (wall.direction === 'vertical' ? i * (this.brickSize + this.mortarSize) : 0);
                
                if (wall.direction === 'vertical') {
                    this.drawVerticalBrick(ctx, x, y);
                } else {
                    this.drawHorizontalBrick(ctx, x, y);
                }
            }
        }
    }

    handleCollision(x, y, velocity) {
        const now = Date.now();
        if (now - this.lastCollisionTime < this.collisionCooldown) return;

        // Play spatial sound based on collision position and velocity
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const volume = Math.min(Math.abs(speed) / 10, 1); // Normalize speed to volume

        if (speed > 5) {
            // Hard impact
            this.audioManager.playSpatialSound('wallHit', x, y, {
                volume: volume,
                playbackRate: 0.8 + (speed / 20)
            });
        } else {
            // Soft scrape
            this.audioManager.playSpatialSound('wallScrape', x, y, {
                volume: volume * 0.5,
                playbackRate: 0.5 + (speed / 10)
            });
        }

        this.lastCollisionTime = now;
    }

    // Update containsPoint to include collision handling
    containsPoint(x, y, velocity = { x: 0, y: 0 }) {
        for (const wall of this.wallConfig) {
            const startX = this.x + (wall.x || 0) * (this.brickSize + this.mortarSize);
            const startY = this.y + (wall.y || 0) * (this.brickSize + this.mortarSize);
            const length = wall.length * (this.brickSize + this.mortarSize);
            
            let collision = false;
            if (wall.direction === 'vertical') {
                collision = x >= startX && x <= startX + this.brickSize &&
                          y >= startY && y <= startY + length;
            } else {
                collision = x >= startX && x <= startX + length &&
                          y >= startY && y <= startY + this.brickSize;
            }

            if (collision) {
                this.handleCollision(x, y, velocity);
                return true;
            }
        }
        return false;
    }

    getBounds() {
        // Calculate the bounds of the entire wall structure
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const wall of this.wallConfig) {
            const startX = this.x + (wall.x || 0) * (this.brickSize + this.mortarSize);
            const startY = this.y + (wall.y || 0) * (this.brickSize + this.mortarSize);
            const length = wall.length * (this.brickSize + this.mortarSize);

            if (wall.direction === 'vertical') {
                minX = Math.min(minX, startX - this.mortarSize);
                maxX = Math.max(maxX, startX + this.brickSize + this.mortarSize);
                minY = Math.min(minY, startY - this.mortarSize);
                maxY = Math.max(maxY, startY + length + this.mortarSize);
            } else {
                minX = Math.min(minX, startX - this.mortarSize);
                maxX = Math.max(maxX, startX + length + this.mortarSize);
                minY = Math.min(minY, startY - this.mortarSize);
                maxY = Math.max(maxY, startY + this.brickSize + this.mortarSize);
            }
        }

        // Add a small buffer for more reliable collision detection
        const buffer = 2;
        return {
            x: minX - buffer,
            y: minY - buffer,
            width: (maxX - minX) + buffer * 2,
            height: (maxY - minY) + buffer * 2
        };
    }
} 