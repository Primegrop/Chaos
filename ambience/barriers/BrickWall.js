import AudioManager from '../audio/AudioManager.js';
import { defaultBrickWallConfig } from './configs/brickWallConfig.js';

export default class BrickWall {
    constructor(x, y, config = defaultBrickWallConfig) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.width = config.width;
        this.height = config.height;
        
        // Center the wall on its position
        this.x -= this.width / 2;
        this.y -= this.height / 2;
        
        // Audio setup
        this.audioManager = new AudioManager();
        this.lastCollisionTime = 0;
        
        // Visual feedback
        this.isColliding = false;
        this.lastCollisionFeedbackTime = 0;
    }

    draw(ctx) {
        const isHit = this.isColliding && 
            Date.now() - this.lastCollisionFeedbackTime < this.config.collisionFeedbackDuration;
        
        // Calculate number of bricks that can fit in the wall
        const totalWidth = this.width;
        const totalHeight = this.height;
        const brickAndMortarSize = this.config.brickSize + this.config.mortarSize;
        
        // Draw the mortar background first
        ctx.fillStyle = isHit ? this.config.hitMortarColor : this.config.mortarColor;
        ctx.fillRect(this.x, this.y, totalWidth, totalHeight);
        
        // Draw the brick pattern
        const brickColor = isHit ? this.config.hitBrickColor : this.config.brickColor;
        ctx.fillStyle = brickColor;
        
        // Calculate brick positions - now in a uniform grid
        for (let y = this.y + this.config.mortarSize; y < this.y + totalHeight - this.config.brickSize; y += brickAndMortarSize) {
            for (let x = this.x + this.config.mortarSize; x < this.x + totalWidth - this.config.brickSize; x += brickAndMortarSize) {
                // Draw individual brick
                ctx.fillRect(
                    x,
                    y,
                    this.config.brickSize,
                    this.config.brickSize
                );
            }
        }
    }

    handleCollision(x, y, velocity) {
        const now = Date.now();
        if (now - this.lastCollisionTime < this.config.collisionCooldown) return;

        // Visual feedback
        this.isColliding = true;
        this.lastCollisionFeedbackTime = now;

        // Play spatial sound based on collision position and velocity
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const volume = Math.min(Math.abs(speed) / this.config.volumeScale, 1);

        if (speed > this.config.minSpeedForSound) {
            this.audioManager.playSpatialSound('wallHit', x, y, {
                volume: volume,
                playbackRate: Math.min(1.0, this.config.basePlaybackRate + (speed / this.config.playbackRateScale))
            });
        }

        this.lastCollisionTime = now;
        
        // Reset collision state after feedback duration
        setTimeout(() => {
            this.isColliding = false;
        }, this.config.collisionFeedbackDuration);
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