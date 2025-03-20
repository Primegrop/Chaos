import AudioManager from '../audio/AudioManager.js';

export default class BrickWall {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 10;  // Width of the wall
        this.height = 200;  // Height of the wall
        
        // Audio setup
        this.audioManager = new AudioManager();
        this.lastCollisionTime = 0;
        this.collisionCooldown = 100; // Milliseconds between collision sounds
    }

    draw(ctx) {
        ctx.fillStyle = '#8B4513';  // Brown color
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    handleCollision(x, y, velocity) {
        const now = Date.now();
        if (now - this.lastCollisionTime < this.collisionCooldown) return;

        // Play spatial sound based on collision position and velocity
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const volume = Math.min(Math.abs(speed) / 10, 1);

        if (speed > 5) {
            this.audioManager.playSpatialSound('wallHit', x, y, {
                volume: volume,
                playbackRate: 0.8 + (speed / 20)
            });
        }

        this.lastCollisionTime = now;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
} 