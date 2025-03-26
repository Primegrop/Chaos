import CollisionDetector from '../ColDet/CollisionDetector.js';
import { CollisionHandler } from '../ColDet/CollisionHandler.js';
import AudioManager from '../../ambience/audio/AudioManager.js';
import { Pod } from '../../pods/Pod.js';
import { calculateSimpleReflection, drawReflectionDebug } from '../VeloReflect/collisionReflectCalc.js';
import { calculateVectorReflection } from '../VeloReflect/collisionReflectCalc.js';
import BrickWall from '../../ambience/barriers/BrickWall.js';
import buildInfo from '../../metaData/buildInfo.js';

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
        this.isRecordingDebug = false;
        
        // Get build version from metadata
        this.buildVersion = buildInfo.buildVersion;
        
        // Create build version overlay
        this.buildVersionOverlay = document.createElement('div');
        this.buildVersionOverlay.style.position = 'absolute';
        this.buildVersionOverlay.style.top = '10px';
        this.buildVersionOverlay.style.left = '10px';
        this.buildVersionOverlay.style.color = 'white';
        this.buildVersionOverlay.style.fontFamily = 'monospace';
        this.buildVersionOverlay.style.fontSize = '12px';
        this.buildVersionOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.buildVersionOverlay.style.padding = '5px';
        this.buildVersionOverlay.style.borderRadius = '3px';
        this.buildVersionOverlay.textContent = `Build: ${this.buildVersion}`;
        document.body.appendChild(this.buildVersionOverlay);
        
        // Create debug control overlay
        this.createDebugControls();
        
        // Thrust lockout tracking
        this.thrustLocked = false;
        this.thrustLockoutEndTime = 0;
        
        // Bind methods
        this.loop = this.loop.bind(this);
        this.checkThrustLockout = this.checkThrustLockout.bind(this);
        
        // Animation frame ID for cleanup
        this.animationFrameId = null;

        this.debug = false;
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
        // Draw main bounds
        const bounds = object.getBounds();
        context.strokeStyle = color;
        context.lineWidth = object instanceof Pod ? 2 : 1;
        context.strokeRect(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height
        );

        // Draw detailed bounds if available
        if (object.getDetailedBounds && this.debugMode) {
            const detailedBounds = object.getDetailedBounds();
            detailedBounds.forEach((box, index) => {
                context.strokeStyle = `hsl(${(index * 60) % 360}, 100%, 50%)`; // Different color for each component
                context.strokeRect(
                    box.x,
                    box.y,
                    box.width,
                    box.height
                );
            });
        }
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

    /**
     * Clears the canvas and draws all static objects in the Arena.
     * This includes the background and any static barriers.
     * These objects are pre-rendered for performance and only need to be redrawn
     * when the base scene changes.
     */
    renderBaseScene() {
        // Clear the game canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.drawImage(this.bgCanvas, 0, 0);
        
        // Draw barriers
        this.ctx.drawImage(this.barriersCanvas, 0, 0);
    }

    detectCollisionWithBarriers(position, velocity) {
        for (const barrier of this.barriers) {
            const collisionResult = this.collisionDetector.detectCollision(
                this.pod,
                { x: velocity.velocityX, y: velocity.velocityY },
                barrier
            );

            if (collisionResult.collided) {
                return { barrier, collisionResult };
            }
        }
        return null;
    }

    handleCollisionResponse(position, velocity, collisionResult, barrier) {
        const speed = Math.sqrt(velocity.velocityX ** 2 + velocity.velocityY ** 2);
        const HIGH_SPEED_THRESHOLD = 3;
        const LOCKOUT_DURATION = 3000; // 3 seconds in milliseconds
        const normal = collisionResult.normal;
        
        if (speed > HIGH_SPEED_THRESHOLD) {
            // High speed collision: reflect and lock thrust
            const reflection = calculateVectorReflection(
                { x: velocity.velocityX, y: velocity.velocityY },
                normal,
                0.8 // Fixed restitution for high-speed collisions
            );
            
            this.pod.behavior.properties.setVelocity(reflection.x, reflection.y);
            
            // Lock thrust for 3 seconds
            this.thrustLocked = true;
            this.thrustLockoutEndTime = performance.now() + LOCKOUT_DURATION;
            this.pod.behavior.isThrusting = false;
            
            console.log(`High speed collision (${speed.toFixed(2)}) - Reflecting and locking thrust for 3s`);
        } else {
            // Low speed collision: zero out appropriate velocity component
            const currentVelocity = this.pod.behavior.getState();
            
            if (Math.abs(normal.x) > Math.abs(normal.y)) {
                // Vertical wall - zero out horizontal velocity
                this.pod.behavior.properties.setVelocity(0, currentVelocity.velocityY);
                console.log('Low speed collision with vertical wall - zeroing horizontal velocity');
            } else {
                // Horizontal wall - zero out vertical velocity
                this.pod.behavior.properties.setVelocity(currentVelocity.velocityX, 0);
                console.log('Low speed collision with horizontal wall - zeroing vertical velocity');
            }
        }

        // Always push pod away from collision point to prevent sticking
        const pushDistance = 10; // Increased from 5 to 10 for better separation
        const newX = position.x + normal.x * pushDistance;
        const newY = position.y + normal.y * pushDistance;
        
        // Verify the new position is safe
        const testBounds = {
            x: this.pod.getBounds().x + normal.x * pushDistance,
            y: this.pod.getBounds().y + normal.y * pushDistance,
            width: this.pod.getBounds().width,
            height: this.pod.getBounds().height
        };
        
        let isSafe = true;
        for (const b of this.barriers) {
            if (this.collisionHandler.isOverlapping(testBounds, b.getBounds())) {
                isSafe = false;
                break;
            }
        }
        
        if (isSafe) {
            this.pod.behavior.setPosition(newX, newY);
        } else {
            // If not safe, try a larger push
            const emergencyPush = 20;
            this.pod.behavior.setPosition(
                position.x + normal.x * emergencyPush,
                position.y + normal.y * emergencyPush
            );
        }

        // Notify barrier of collision for visual/audio feedback
        barrier.handleCollision(position.x, position.y, velocity);
    }

    checkThrustLockout() {
        const now = performance.now();
        if (this.thrustLocked && now >= this.thrustLockoutEndTime) {
            console.log('Thrust lockout ended');
            this.thrustLocked = false;
            this.thrustLockoutEndTime = 0;
        }
    }

    loop() {
        // Render the base scene
        this.renderBaseScene();
        
        // Get current pod state
        const position = this.pod.behavior.getPosition();
        const velocity = this.pod.behavior.getState();
        
        // Calculate intended movement
        const dt = 1/60; // Assuming 60fps
        const intendedX = position.x + velocity.velocityX * dt;
        const intendedY = position.y + velocity.velocityY * dt;
        
        // Use continuous collision detection with multiple steps
        const STEPS = 4; // Check 4 points along the movement path
        let finalX = position.x;
        let finalY = position.y;
        let hadCollision = false;
        
        for (let i = 1; i <= STEPS; i++) {
            const t = i / STEPS;
            const checkX = position.x + (intendedX - position.x) * t;
            const checkY = position.y + (intendedY - position.y) * t;
            
            // Check for collision at this step
            const stepVelocity = {
                velocityX: velocity.velocityX * (1 - (i-1)/STEPS),
                velocityY: velocity.velocityY * (1 - (i-1)/STEPS)
            };
            
            const collision = this.detectCollisionWithBarriers(
                { x: checkX, y: checkY, angle: position.angle },
                stepVelocity
            );
            
            if (collision) {
                hadCollision = true;
                // Handle collision response based on speed
                this.handleCollisionResponse(
                    { x: checkX, y: checkY },
                    stepVelocity,
                    collision.collisionResult,
                    collision.barrier
                );
                break;
            } else {
                finalX = checkX;
                finalY = checkY;
            }
        }
        
        if (!hadCollision) {
            // No collision found, safe to update normally
            this.pod.update(this.canvas.width, this.canvas.height);
        }
        
        // Draw pod
        this.pod.draw(this.ctx);
        
        // Draw debug visualizations
        this.drawDebugVisualizations(position, velocity);
        
        // Check thrust lockout
        this.checkThrustLockout();
        
        // Request next frame
        this.animationFrameId = requestAnimationFrame(() => this.loop());
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

    drawDebugVisualizations(position, velocity) {
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
    }
} 