import CollisionDetector from '../ColDet/CollisionDetector.js';
import AudioManager from '../../ambience/audio/AudioManager.js';
import { Pod } from '../../pods/Pod.js';

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

        // Build version (increment this when making changes)
        this.buildVersion = 7;
        
        // Collision tracking
        this.recentCollisions = [];
        this.thrustLocked = false;
        this.thrustLockoutEndTime = 0;
        
        // Bind the loop method
        this.loop = this.loop.bind(this);
        
        // Animation frame ID for cleanup
        this.animationFrameId = null;
    }

    drawBuildVersion() {
        // Save context state
        this.ctx.save();
        
        // Set up text style
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillStyle = '#FF0000';
        
        // Position text at top-left corner inside the canvas
        const text = `Build: ${this.buildVersion}`;
        this.ctx.fillText(text, 10, 25);
        
        // Restore context state
        this.ctx.restore();
    }

    drawDebugBounds(object, color = 'red') {
        const bounds = object.getBounds();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = object instanceof Pod ? 2 : 1;
        this.ctx.strokeRect(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height
        );
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
        // Clear the entire canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.background.draw(this.ctx);
        
        // Check thrust lockout status
        const isLocked = this.checkThrustLockout();
        if (isLocked) {
            // Force thrust off during lockout
            this.pod.isThrusting = false;
        }
        
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

        // Safety check: Ensure pod is not inside any barrier
        for (const barrier of this.barriers) {
            const barrierBounds = barrier.getBounds();
            const podBounds = this.pod.getBounds();
            
            // Check if pod is inside barrier
            if (this.isOverlapping(podBounds, barrierBounds)) {
                // Push pod out of barrier based on its center position relative to barrier
                const podCenterX = podBounds.x + podBounds.width / 2;
                const barrierCenterX = barrierBounds.x + barrierBounds.width / 2;
                
                // Determine which side to push to
                if (podCenterX < barrierCenterX) {
                    // Pod is on left side, push left
                    this.pod.x = barrierBounds.x - podBounds.width - 2;
                } else {
                    // Pod is on right side, push right
                    this.pod.x = barrierBounds.x + barrierBounds.width + 2;
                }
                
                // Stop all movement
                this.pod.velocityX = 0;
                this.pod.velocityY = 0;
                velocity.x = 0;
                velocity.y = 0;
            }
        }

        // Check for collisions before updating position
        const collision = this.collisionDetector.detectCollisions(this.pod, velocity);
        
        if (collision.collided) {
            console.log('Collision detected!', collision);
            
            // Track collision for rapid collision detection
            this.handleRapidCollisions();
            
            // Play wall hit sound with spatial audio
            this.audioManager.playSpatialSound('wallHit', collision.point.x, collision.point.y, {
                volume: Math.min(1.0, Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) / 10),
                playbackRate: 0.8 + (Math.random() * 0.4)
            });
            
            // Apply reflection velocity with increased energy loss for rapid collisions
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            const energyLoss = Math.min(0.4, speed * 0.1); // More energy loss at higher speeds
            const restitution = 0.8 - energyLoss;
            
            this.pod.velocityX = collision.reflection.x * restitution;
            this.pod.velocityY = collision.reflection.y * restitution;
            
            // Get pod bounds for size-aware repositioning
            const podBounds = this.pod.getBounds();
            const podHalfWidth = podBounds.width / 2;
            const podHalfHeight = podBounds.height / 2;
            
            // Position adjustment based on collision normal with safety margin
            const safetyMargin = 2;
            if (collision.normal.x !== 0) {
                // For horizontal collisions
                this.pod.x = collision.point.x + ((podHalfWidth + safetyMargin) * collision.normal.x);
            }
            if (collision.normal.y !== 0) {
                // For vertical collisions
                this.pod.y = collision.point.y + ((podHalfHeight + safetyMargin) * collision.normal.y);
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

        // Draw build version and lockout status if active
        this.drawBuildVersion();
        if (this.thrustLocked) {
            // Draw lockout warning
            this.ctx.save();
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = '#FFA500'; // Orange warning color
            const timeLeft = Math.ceil((this.thrustLockoutEndTime - performance.now()) / 1000);
            this.ctx.fillText(`WARNING: ${timeLeft}s`, 10, 50);
            this.ctx.restore();
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

    // Helper method to check if two AABBs overlap
    isOverlapping(bounds1, bounds2) {
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
    }

    // Track collision and check for lockout
    handleRapidCollisions() {
        const now = performance.now();
        const COLLISION_WINDOW = 2000; // 2 second window for rapid collisions
        const LOCKOUT_DURATION = 1000; // 1 second lockout for 2 hits
        
        // Add current collision time
        this.recentCollisions.push(now);
        
        // Remove collisions outside the window
        this.recentCollisions = this.recentCollisions.filter(time => 
            now - time < COLLISION_WINDOW
        );
        
        // Check for two or more collisions
        if (this.recentCollisions.length >= 2 && !this.thrustLocked) {
            console.log('Two collisions detected - activating warning lockout');
            this.thrustLocked = true;
            this.thrustLockoutEndTime = now + LOCKOUT_DURATION;
            
            // Stop all pod movement
            this.pod.velocityX = 0;
            this.pod.velocityY = 0;
            
            // Disable pod thrusting
            this.pod.isThrusting = false;
            
            // Reset collision counter
            this.recentCollisions = [];
        }
    }

    // Check if thrust is locked
    checkThrustLockout() {
        if (this.thrustLocked) {
            const now = performance.now();
            if (now >= this.thrustLockoutEndTime) {
                console.log('Thrust lockout ended');
                this.thrustLocked = false;
                this.recentCollisions = [];
            }
            return this.thrustLocked;
        }
        return false;
    }
} 