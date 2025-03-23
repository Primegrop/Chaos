import CollisionDetector from '../ColDet/CollisionDetector.js';
import { CollisionHandler } from '../ColDet/CollisionHandler.js';
import AudioManager from '../../ambience/audio/AudioManager.js';
import { Pod } from '../../pods/Pod.js';
import { calculateSimpleReflection, drawReflectionDebug } from '../VeloReflect/collisionReflectCalc.js';
import { calculateVectorReflection } from '../VeloReflect/collisionReflectCalc.js';

export class MainGameLoop {
    constructor(canvas, background, pod, barriers = [], debugMode = true) {
        // Make game loop globally accessible
        window.gameLoop = this;
        
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
        this.isRecordingDebug = false; // Add recording state
        
        // Build number (incremented for uniform brick pattern)
        this.buildVersion = 115;
        
        // Create build version overlay
        this.createBuildVersionOverlay();
        
        // Create debug control overlay
        this.createDebugControls();
        
        // Collision tracking and thrust lockout
        this.recentCollisions = [];
        this.thrustLocked = false;
        this.thrustLockoutEndTime = 0;
        this.lastCollisionTime = 0;
        this.lockoutStartTime = 0; // For tracking lockout duration
        
        // Bind methods
        this.loop = this.loop.bind(this);
        this.handleRapidCollisions = this.handleRapidCollisions.bind(this);
        this.checkThrustLockout = this.checkThrustLockout.bind(this);
        
        // Animation frame ID for cleanup
        this.animationFrameId = null;

        this.debug = false;
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

    createDebugControls() {
        // Create debug controls container
        let controls = document.getElementById('debugControls');
        if (!controls) {
            controls = document.createElement('div');
            controls.id = 'debugControls';
            
            // Style the controls
            controls.style.position = 'fixed';
            controls.style.top = '40px'; // Below build version
            controls.style.left = '10px';
            controls.style.zIndex = '1000';
            controls.style.display = 'flex';
            controls.style.gap = '10px';
            
            // Create start recording button
            const startBtn = document.createElement('button');
            startBtn.textContent = '🔴 Start Recording';
            startBtn.style.padding = '5px 10px';
            startBtn.style.backgroundColor = '#fff';
            startBtn.style.border = '1px solid #000';
            startBtn.style.borderRadius = '4px';
            startBtn.onclick = () => {
                this.isRecordingDebug = true;
                startBtn.style.backgroundColor = '#ffcccc';
                stopBtn.style.backgroundColor = '#fff';
                console.clear(); // Clear previous logs
                console.log('=== Debug Recording Started ===');
            };
            
            // Create stop recording button
            const stopBtn = document.createElement('button');
            stopBtn.textContent = '⏹ Stop Recording';
            stopBtn.style.padding = '5px 10px';
            stopBtn.style.backgroundColor = '#fff';
            stopBtn.style.border = '1px solid #000';
            stopBtn.style.borderRadius = '4px';
            stopBtn.onclick = () => {
                this.isRecordingDebug = false;
                startBtn.style.backgroundColor = '#fff';
                stopBtn.style.backgroundColor = '#cccccc';
                console.log('=== Debug Recording Stopped ===');
            };
            
            controls.appendChild(startBtn);
            controls.appendChild(stopBtn);
            document.body.appendChild(controls);
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

        // Draw the pre-rendered background and barriers
        this.ctx.drawImage(this.bgCanvas, 0, 0);
        this.ctx.drawImage(this.barriersCanvas, 0, 0);
        
        // Get current pod state and log it
        const position = this.pod.behavior.getPosition();
        const velocity = this.pod.behavior.getState();
        
        this.debugLog('Pre-update Pod State:', {
            position: { x: position.x, y: position.y },
            velocity: { x: velocity.velocityX, y: velocity.velocityY }
        });

        // First update pod normally
        this.pod.update(this.canvas.width, this.canvas.height);
        
        // Log post-update state
        const postUpdate = {
            position: this.pod.behavior.getPosition(),
            velocity: this.pod.behavior.getState()
        };
        this.debugLog('Post-update Pod State:', postUpdate);
        
        // Then check for collisions
        for (const barrier of this.barriers) {
            const barrierBounds = barrier.getBounds();
            const podBounds = this.pod.getBounds();

            this.debugLog('Collision Check:', {
                podBounds,
                barrierBounds,
                isOverlapping: this.collisionHandler.isOverlapping(podBounds, barrierBounds)
            });

            if (this.collisionHandler.isOverlapping(podBounds, barrierBounds)) {
                this.debugLog('COLLISION DETECTED!');
                
                // Calculate collision normal from barrier to pod
                const barrierCenterX = barrierBounds.x + barrierBounds.width / 2;
                const barrierCenterY = barrierBounds.y + barrierBounds.height / 2;
                const podCenterX = position.x;
                const podCenterY = position.y;
                
                const dx = podCenterX - barrierCenterX;
                const dy = podCenterY - barrierCenterY;
                const length = Math.sqrt(dx * dx + dy * dy);
                const normal = {
                    x: dx / length,
                    y: dy / length
                };

                this.debugLog('Collision Details:', {
                    podCenter: { x: podCenterX, y: podCenterY },
                    barrierCenter: { x: barrierCenterX, y: barrierCenterY },
                    normal
                });

                // Calculate reflection
                const speed = Math.sqrt(velocity.velocityX ** 2 + velocity.velocityY ** 2);
                const restitution = Math.min(0.8, 0.5 + (speed * 0.1));
                
                const reflection = calculateVectorReflection(
                    { x: velocity.velocityX, y: velocity.velocityY },
                    normal,
                    restitution
                );

                this.debugLog('Reflection Calculation:', {
                    incomingVelocity: { x: velocity.velocityX, y: velocity.velocityY },
                    normal,
                    restitution,
                    reflection
                });

                // Store pre-reflection state
                const preReflectionState = {
                    position: { ...this.pod.behavior.getPosition() },
                    velocity: { ...this.pod.behavior.getState() }
                };

                // Apply reflection velocity
                this.pod.behavior.properties.setVelocity(reflection.x, reflection.y);
                
                // Move pod just outside collision
                const pushDistance = 1; // Minimal push to prevent sticking
                this.pod.behavior.setPosition(
                    position.x + normal.x * pushDistance,
                    position.y + normal.y * pushDistance
                );

                // Log post-reflection state
                const postReflectionState = {
                    position: this.pod.behavior.getPosition(),
                    velocity: this.pod.behavior.getState()
                };

                this.debugLog('Collision Response:', {
                    before: preReflectionState,
                    after: postReflectionState
                });

                // Notify barrier of collision
                barrier.handleCollision(podCenterX, podCenterY, velocity);
                
                // Track collision for rapid collision detection
                this.handleRapidCollisions();
                break;
            }
        }
        
        // Draw pod
        this.pod.draw(this.ctx);
        
        // Enhanced debug visualization
        if (this.debugMode) {
            // Draw pod bounds
            this.drawDebugBounds(this.pod, 'red');
            
            // Draw pod center point
            this.ctx.fillStyle = 'red';
            this.ctx.beginPath();
            this.ctx.arc(position.x, position.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw velocity vector if moving
            if (velocity.velocityX !== 0 || velocity.velocityY !== 0) {
                // Draw current velocity vector
                this.ctx.strokeStyle = 'yellow';
                this.ctx.beginPath();
                this.ctx.moveTo(position.x, position.y);
                this.ctx.lineTo(
                    position.x + velocity.velocityX * 10,
                    position.y + velocity.velocityY * 10
                );
                this.ctx.stroke();
            }

            // Draw barrier centers and normals during collision
            for (const barrier of this.barriers) {
                const barrierBounds = barrier.getBounds();
                const barrierCenterX = barrierBounds.x + barrierBounds.width / 2;
                const barrierCenterY = barrierBounds.y + barrierBounds.height / 2;
                
                // Draw barrier center
                this.ctx.fillStyle = 'blue';
                this.ctx.beginPath();
                this.ctx.arc(barrierCenterX, barrierCenterY, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
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
                // Draw debug bounds for barriers
                const bounds = barrier.getBounds();
                this.barriersCtx.strokeStyle = 'blue';
                this.barriersCtx.lineWidth = 2;
                this.barriersCtx.strokeRect(
                    bounds.x,
                    bounds.y,
                    bounds.width,
                    bounds.height
                );
            }
        }
    }

    // Track collision and check for lockout
    handleRapidCollisions() {
        const now = performance.now();
        const COLLISION_WINDOW = 2000; // 2 second window for rapid collisions
        const LOCKOUT_DURATION = 2000; // 2 second lockout for 2 hits
        
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
            this.lockoutStartTime = now;
            
            // Stop all pod movement
            if (this.pod.behavior) {
                this.pod.behavior.properties.setVelocity(0, 0);
                this.pod.behavior.isThrusting = false;
            } else {
                this.pod.velocityX = 0;
                this.pod.velocityY = 0;
                this.pod.isThrusting = false;
            }
            
            // Reset collision counter
            this.recentCollisions = [];
        }
    }

    // Check if thrust is locked
    checkThrustLockout() {
        if (this.thrustLocked) {
            const now = performance.now();
            const elapsedTime = now - this.lockoutStartTime;
            
            if (now >= this.thrustLockoutEndTime) {
                console.log(`Thrust lockout ended after ${elapsedTime}ms`);
                this.thrustLocked = false;
                this.recentCollisions = [];
                this.lockoutStartTime = 0;
            } else {
                console.log(`Thrust still locked - ${elapsedTime}ms elapsed, ${this.thrustLockoutEndTime - now}ms remaining`);
            }
            return this.thrustLocked;
        }
        return false;
    }

    // Modify the logging function to only log when recording is enabled
    debugLog(message, data) {
        if (this.debugMode && this.isRecordingDebug) {
            if (data) {
                console.log(message, JSON.stringify(data, null, 2));
            } else {
                console.log(message);
            }
        }
    }
} 