import CollisionDetector from '../ColDet/CollisionDetector.js';
import AudioManager from '../../ambience/audio/AudioManager.js';
import { Pod } from '../../pods/Pod.js';
import { calculateSimpleReflection, drawReflectionDebug } from '../VeloReflect/collisionReflectCalc.js';
import { calculateVectorReflection } from '../VeloReflect/collisionReflectCalc.js';

export class MainGameLoop {
    constructor(canvas, background, pod, barriers = [], debugMode = true) {
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
        this.debugMode = debugMode;

        // Build version (increment this when making changes)
        this.buildVersion = 19;  // Moved build version to static overlay
        
        // Create build version overlay
        this.createBuildVersionOverlay();
        
        // Collision tracking
        this.recentCollisions = [];
        this.thrustLocked = false;
        this.thrustLockoutEndTime = 0;
        
        // Bind the loop method
        this.loop = this.loop.bind(this);
        
        // Animation frame ID for cleanup
        this.animationFrameId = null;
    }

    createBuildVersionOverlay() {
        // Create overlay div if it doesn't exist
        let overlay = document.getElementById('buildVersionOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'buildVersionOverlay';
            
            // Style the overlay
            overlay.style.position = 'fixed';
            overlay.style.top = '10px';
            overlay.style.left = '10px';
            overlay.style.color = '#FF0000';
            overlay.style.fontFamily = 'Arial, sans-serif';
            overlay.style.fontSize = '20px';
            overlay.style.fontWeight = 'bold';
            overlay.style.zIndex = '1000';
            overlay.style.pointerEvents = 'none'; // Make it non-interactive
            
            // Set the build version text
            overlay.textContent = `Build: ${this.buildVersion}`;
            
            // Add it to the document body
            document.body.appendChild(overlay);
        } else {
            // Update existing overlay
            overlay.textContent = `Build: ${this.buildVersion}`;
        }
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
            
            // Handle collision
            this.handleCollision(collision, this.pod);
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

        // Draw lockout warning if active
        if (this.thrustLocked) {
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

    handleCollision(result, pod) {
        if (!result.collided) return;

        // Get current velocity
        const velocity = {
            x: pod.velocityX,
            y: pod.velocityY
        };

        // Calculate reflection with energy loss based on speed
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const energyLoss = Math.min(0.4, speed * 0.1); // More energy loss at higher speeds
        const restitution = 0.8 - energyLoss;

        // Calculate reflected velocity
        const reflection = calculateVectorReflection(velocity, result.normal, restitution);
        
        // Apply reflected velocity
        pod.velocityX = reflection.x;
        pod.velocityY = reflection.y;

        // Minimal position adjustment to prevent sticking
        const safetyMargin = 2;
        if (result.normal.x !== 0) {
            pod.x += result.normal.x * safetyMargin;
        }
        if (result.normal.y !== 0) {
            pod.y += result.normal.y * safetyMargin;
        }

        // Debug visualization
        if (this.debugMode) {
            console.log('Collision response:', {
                originalVelocity: velocity,
                reflectedVelocity: reflection,
                normal: result.normal,
                restitution: restitution
            });

            drawReflectionDebug(this.ctx, result.point, velocity, reflection);
        }
    }
} 