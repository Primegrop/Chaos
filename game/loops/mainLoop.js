import CollisionDetector from '../ColDet/CollisionDetector.js';
import AudioManager from '../../ambience/audio/AudioManager.js';

export class MainGameLoop {
    constructor(canvas, background, pod, barriers = []) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.background = background;
        this.pod = pod;
        this.barriers = barriers;
        
        // Initialize collision detector
        this.collisionDetector = new CollisionDetector();
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        
        // Register all barriers for collision detection
        for (const barrier of barriers) {
            this.collisionDetector.registerCollidable(barrier);
        }
        
        // Debug mode
        this.debugMode = true;
        
        // Bind the loop method
        this.loop = this.loop.bind(this);
        
        // Animation frame ID for cleanup
        this.animationFrameId = null;
    }

    drawDebugBounds(object, color = 'red') {
        const bounds = object.getBounds();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    start() {
        this.loop();
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    loop() {
        // Draw background
        this.background.draw(this.ctx);
        
        // Draw barriers
        for (const barrier of this.barriers) {
            barrier.draw(this.ctx);
            if (this.debugMode) {
                this.drawDebugBounds(barrier, 'blue');
            }
        }
        
        // Get pod's current velocity
        const velocity = {
            x: this.pod.velocityX,
            y: this.pod.velocityY
        };

        // Check for collisions before updating position
        const collision = this.collisionDetector.detectCollisions(this.pod, velocity);
        
        if (collision.collided) {
            console.log('Collision detected!', collision);
            
            // Play wall hit sound with spatial audio
            this.audioManager.playSpatialSound('wallHit', collision.point.x, collision.point.y, {
                volume: Math.min(1.0, Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) / 10),
                playbackRate: 0.8 + (Math.random() * 0.4) // Random pitch between 0.8 and 1.2
            });
            
            // Apply reflection velocity with some energy loss
            this.pod.velocityX = collision.reflection.x * 0.8; // 20% energy loss
            this.pod.velocityY = collision.reflection.y * 0.8;
            
            // Get pod bounds for size-aware repositioning
            const podBounds = this.pod.getBounds();
            const podHalfWidth = podBounds.width / 2;
            const podHalfHeight = podBounds.height / 2;
            
            // Adjust position based on collision normal to prevent penetration
            if (collision.normal.x !== 0) {
                // Horizontal collision
                this.pod.x = collision.point.x + (collision.normal.x * podHalfWidth);
            }
            if (collision.normal.y !== 0) {
                // Vertical collision
                this.pod.y = collision.point.y + (collision.normal.y * podHalfHeight);
            }

            if (this.debugMode) {
                // Draw collision point
                this.ctx.fillStyle = 'red';
                this.ctx.beginPath();
                this.ctx.arc(collision.point.x, collision.point.y, 5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw reflection vector
                this.ctx.strokeStyle = 'green';
                this.ctx.beginPath();
                this.ctx.moveTo(collision.point.x, collision.point.y);
                this.ctx.lineTo(
                    collision.point.x + collision.reflection.x * 20,
                    collision.point.y + collision.reflection.y * 20
                );
                this.ctx.stroke();
            }
        }
        
        // Update and draw pod
        this.pod.update(this.canvas.width, this.canvas.height);
        this.pod.draw(this.ctx);
        
        // Draw pod bounds in debug mode
        if (this.debugMode) {
            this.drawDebugBounds(this.pod, 'red');
            
            // Draw velocity vector
            this.ctx.strokeStyle = 'yellow';
            this.ctx.beginPath();
            this.ctx.moveTo(this.pod.x, this.pod.y);
            this.ctx.lineTo(
                this.pod.x + this.pod.velocityX * 10,
                this.pod.y + this.pod.velocityY * 10
            );
            this.ctx.stroke();
        }
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    // Method to update game objects
    updateGameObjects(background, pod, barriers = this.barriers) {
        this.background = background;
        this.pod = pod;
        this.barriers = barriers;
        
        // Update collision detector with new barriers
        this.collisionDetector = new CollisionDetector();
        for (const barrier of barriers) {
            this.collisionDetector.registerCollidable(barrier);
        }
    }
} 