import AudioManager from '../audio/AudioManager.js';

export default class BrickWall {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;  // Increased width for better visibility
        this.height = 200;  // Height of the wall
        
        // Center the wall on its position
        this.x -= this.width / 2;
        this.y -= this.height / 2;
        
        // Brick pattern configuration
        this.brickHeight = 20;
        this.brickWidth = 40;
        this.mortarSize = 2;
        
        // Audio setup
        this.audioManager = new AudioManager();
        this.lastCollisionTime = 0;
        this.collisionCooldown = 100;
        
        // Visual feedback
        this.isColliding = false;
        this.collisionFeedbackDuration = 100;
        this.lastCollisionFeedbackTime = 0;
    }

    draw(ctx) {
        const isHit = this.isColliding && Date.now() - this.lastCollisionFeedbackTime < this.collisionFeedbackDuration;
        
        // Draw brick pattern
        for (let y = this.y; y < this.y + this.height; y += this.brickHeight) {
            // Alternate brick offset for each row
            const rowOffset = Math.floor((y - this.y) / this.brickHeight) % 2 === 0 ? 0 : this.brickWidth / 2;
            
            for (let x = this.x - rowOffset; x < this.x + this.width + this.brickWidth/2; x += this.brickWidth) {
                // Draw mortar (darker color)
                ctx.fillStyle = isHit ? '#696969' : '#4A4A4A';
                ctx.fillRect(x, y, this.brickWidth, this.brickHeight);
                
                // Draw brick (slightly smaller than space to create mortar effect)
                const brickColor = isHit ? '#CD853F' : '#8B4513';
                const shadowColor = isHit ? '#A0522D' : '#6B3211';
                const highlightColor = isHit ? '#DEB887' : '#A0522D';
                
                // Main brick face
                ctx.fillStyle = brickColor;
                ctx.fillRect(
                    x + this.mortarSize, 
                    y + this.mortarSize, 
                    this.brickWidth - this.mortarSize * 2, 
                    this.brickHeight - this.mortarSize * 2
                );
                
                // 3D effect - top highlight
                ctx.fillStyle = highlightColor;
                ctx.beginPath();
                ctx.moveTo(x + this.mortarSize, y + this.mortarSize);
                ctx.lineTo(x + this.brickWidth - this.mortarSize, y + this.mortarSize);
                ctx.lineTo(x + this.brickWidth - this.mortarSize * 2, y + this.mortarSize * 2);
                ctx.lineTo(x + this.mortarSize * 2, y + this.mortarSize * 2);
                ctx.fill();
                
                // 3D effect - right shadow
                ctx.fillStyle = shadowColor;
                ctx.beginPath();
                ctx.moveTo(x + this.brickWidth - this.mortarSize, y + this.mortarSize);
                ctx.lineTo(x + this.brickWidth - this.mortarSize, y + this.brickHeight - this.mortarSize);
                ctx.lineTo(x + this.brickWidth - this.mortarSize * 2, y + this.brickHeight - this.mortarSize * 2);
                ctx.lineTo(x + this.brickWidth - this.mortarSize * 2, y + this.mortarSize * 2);
                ctx.fill();
            }
        }
    }

    handleCollision(x, y, velocity) {
        const now = Date.now();
        if (now - this.lastCollisionTime < this.collisionCooldown) return;

        // Visual feedback
        this.isColliding = true;
        this.lastCollisionFeedbackTime = now;

        // Play spatial sound based on collision position and velocity
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const volume = Math.min(Math.abs(speed) / 10, 1);

        if (speed > 5) {
            this.audioManager.playSpatialSound('wallHit', x, y, {
                volume: volume,
                playbackRate: Math.min(1.0, 0.8 + (speed / 40))  // Reduced speed influence and capped at 1.0
            });
        }

        this.lastCollisionTime = now;
        
        // Reset collision state after feedback duration
        setTimeout(() => {
            this.isColliding = false;
        }, this.collisionFeedbackDuration);
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