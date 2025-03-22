import CollisionDetector from '../ColDet/CollisionDetector.js';
import { CollisionHandler } from '../ColDet/CollisionHandler.js';
import AudioManager from '../../ambience/audio/AudioManager.js';
import { Pod } from '../../pods/Pod.js';
import { calculateSimpleReflection, drawReflectionDebug } from '../VeloReflect/collisionReflectCalc.js';
import { calculateVectorReflection } from '../VeloReflect/collisionReflectCalc.js';

export class MainGameLoop {
    constructor(canvas, background, pod, barriers = [], debugMode = true) {
        // Main game canvas
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Create and set up background canvas
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = canvas.width;
        this.bgCanvas.height = canvas.height;
        this.bgCtx = this.bgCanvas.getContext('2d');
        
        // Create and set up barriers canvas
        this.barriersCanvas = document.createElement('canvas');
        this.barriersCanvas.width = canvas.width;
        this.barriersCanvas.height = canvas.height;
        this.barriersCtx = this.barriersCanvas.getContext('2d');
        
        // Draw background once
        this.background = background;
        this.background.draw(this.bgCtx);
        
        this.pod = pod;
        this.barriers = barriers;
        
        // Draw barriers once
        this.preRenderBarriers();
        
        // Initialize collision systems
        this.collisionDetector = new CollisionDetector();
        this.collisionHandler = new CollisionHandler(this.collisionDetector);
        
        // Initialize audio manager
        this.audioManager = new AudioManager();
        
        // Register all barriers for collision detection
        for (const barrier of barriers) {
            this.collisionDetector.registerCollidable(barrier);
        }

        // Check and adjust initial pod position if inside any barrier
        const podBounds = this.pod.getBounds();
        for (const barrier of barriers) {
            const barrierBounds = barrier.getBounds();
            if (this.collisionHandler.isOverlapping(podBounds, barrierBounds)) {
                // Move pod to center of screen
                this.pod.x = canvas.width / 2;
                this.pod.y = canvas.height / 2;
                
                // Check if center position is safe
                const centerPodBounds = this.pod.getBounds();
                if (this.collisionHandler.isOverlapping(centerPodBounds, barrierBounds)) {
                    // If center isn't safe, try left side of screen
                    this.pod.x = 100;
                    this.pod.y = canvas.height / 2;
                }
                break;
            }
        }
        
        // Debug mode
        this.debugMode = debugMode;

        // Build version (increment this when making changes)
        this.buildVersion = 34;  // Added pre-rendered barriers canvas for performance optimization
        
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

    drawDebugBounds(object, color = 'red', context = this.ctx) {
        const bounds = object.getBounds();
        context.strokeStyle = color;
        context.lineWidth = object instanceof Pod ? 2 : 1;
        context.strokeRect(
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
        // Clear the game canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the pre-rendered background
        this.ctx.drawImage(this.bgCanvas, 0, 0);
        
        // Draw the pre-rendered barriers
        this.ctx.drawImage(this.barriersCanvas, 0, 0);
        
        // Check thrust lockout status
        const isLocked = this.checkThrustLockout();
        if (isLocked) {
            // Force thrust off during lockout
            this.pod.isThrusting = false;
        }
        
        // Store current state
        const startX = this.pod.x;
        const startY = this.pod.y;
        const startAngle = this.pod.angle;
        
        // Calculate total movement
        const totalDX = this.pod.velocityX;
        const totalDY = this.pod.velocityY;
        const totalDAngle = this.pod.rotationalVelocity;

        // Check for collisions along movement path
        const { collision, safePosition } = this.collisionHandler.checkCollisionPath(
            this.pod,
            startX,
            startY,
            startAngle,
            totalDX,
            totalDY,
            totalDAngle
        );

        if (collision) {
            console.log('Collision detected');
            
            // Move pod to safe position
            this.pod.x = safePosition.x;
            this.pod.y = safePosition.y;
            this.pod.angle = safePosition.angle;
            
            // Track collision for rapid collision detection
            this.handleRapidCollisions();
            
            // Play wall hit sound with spatial audio
            this.audioManager.playSpatialSound('wallHit', collision.point.x, collision.point.y, {
                volume: Math.min(1.0, Math.sqrt(totalDX * totalDX + totalDY * totalDY) / 10),
                playbackRate: 0.8 + (Math.random() * 0.4)
            });
            
            // Handle collision response
            this.collisionHandler.handleCollision(collision, this.pod, this.debugMode, this.ctx);
        } else {
            // No collision, apply full movement
            this.pod.update(this.canvas.width, this.canvas.height);
        }
        
        // Draw pod
        this.pod.draw(this.ctx);
        
        // Draw debug visualization
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

            // Draw sub-step points
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            const debugPoints = this.collisionHandler.getDebugPoints(
                startX, startY, totalDX, totalDY, totalDAngle,
                Math.max(1, Math.ceil(Math.sqrt(totalDX * totalDX + totalDY * totalDY)))
            );
            debugPoints.forEach(point => {
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        // Draw lockout warning if active
        if (this.thrustLocked) {
            this.ctx.save();
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = '#FFA500';
            const timeLeft = Math.ceil((this.thrustLockoutEndTime - performance.now()) / 1000);
            this.ctx.fillText(`WARNING: ${timeLeft}s`, 10, 50);
            this.ctx.restore();
        }
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    // Method to update game objects
    updateGameObjects(background, pod, barriers = this.barriers) {
        // Update and re-render background if it changed
        if (background !== this.background) {
            this.background = background;
            this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
            this.background.draw(this.bgCtx);
        }
        
        this.pod = pod;
        
        // Update and re-render barriers if they changed
        if (barriers !== this.barriers) {
            this.barriers = barriers;
            this.preRenderBarriers();
            
            // Update collision detector with new barriers
            this.collisionDetector = new CollisionDetector();
            for (const barrier of barriers) {
                this.collisionDetector.registerCollidable(barrier);
            }
        }
    }

    // Pre-render barriers to their own canvas
    preRenderBarriers() {
        this.barriersCtx.clearRect(0, 0, this.barriersCanvas.width, this.barriersCanvas.height);
        for (const barrier of this.barriers) {
            barrier.draw(this.barriersCtx);
            if (this.debugMode) {
                this.drawDebugBounds(barrier, 'blue', this.barriersCtx);
            }
        }
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