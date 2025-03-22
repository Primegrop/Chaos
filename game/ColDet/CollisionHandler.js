import { calculateVectorReflection, drawReflectionDebug } from '../VeloReflect/collisionReflectCalc.js';

export class CollisionHandler {
    constructor(collisionDetector) {
        this.collisionDetector = collisionDetector;
    }

    // Helper method to check if two AABBs overlap
    isOverlapping(bounds1, bounds2) {
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
    }

    // Check for collisions along a movement path
    checkCollisionPath(object, startX, startY, startAngle, totalDX, totalDY, totalDAngle) {
        // Calculate number of sub-steps based on movement and rotation speed
        const speed = Math.sqrt(totalDX * totalDX + totalDY * totalDY);
        const rotationSpeed = Math.abs(totalDAngle);
        const steps = Math.max(
            1,
            Math.ceil(speed),        // One step per pixel of movement
            Math.ceil(rotationSpeed * 30)  // More steps for faster rotation
        );

        // Get full velocity for collision checks
        const velocity = { x: totalDX, y: totalDY };

        // Store original position
        const originalX = object.x;
        const originalY = object.y;
        const originalAngle = object.angle;

        let collision = null;
        let collisionStep = -1;

        // Check each sub-step for collisions
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            
            // Move object to intermediate position
            object.x = startX + totalDX * t;
            object.y = startY + totalDY * t;
            object.angle = startAngle + totalDAngle * t;

            // Check for collision at this step using full velocity
            const result = this.collisionDetector.detectCollisions(object, velocity);
            if (result.collided) {
                collision = result;
                collisionStep = i;
                break;
            }
        }

        // Restore original position
        object.x = originalX;
        object.y = originalY;
        object.angle = originalAngle;

        if (collision) {
            // Calculate position just before collision
            const t = Math.max(0, (collisionStep - 1) / steps);
            return {
                collision,
                safePosition: {
                    x: startX + totalDX * t,
                    y: startY + totalDY * t,
                    angle: startAngle + totalDAngle * t
                }
            };
        }

        return { collision: null, safePosition: null };
    }

    // Handle collision response
    handleCollision(result, object, debugMode = false, ctx = null) {
        if (!result.collided) return;

        // Get current velocity
        const velocity = {
            x: object.velocityX,
            y: object.velocityY
        };

        // Calculate reflection with energy loss based on speed
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const energyLoss = Math.min(0.4, speed * 0.1); // More energy loss at higher speeds
        const restitution = 0.8 - energyLoss;

        // Calculate reflected velocity
        const reflection = calculateVectorReflection(velocity, result.normal, restitution);
        
        // Apply reflected velocity
        object.velocityX = reflection.x;
        object.velocityY = reflection.y;

        // Minimal position adjustment to prevent sticking
        const safetyMargin = 2;
        if (result.normal.x !== 0) {
            object.x += result.normal.x * safetyMargin;
        }
        if (result.normal.y !== 0) {
            object.y += result.normal.y * safetyMargin;
        }

        // Debug visualization
        if (debugMode && ctx) {
            console.log('Collision response:', {
                originalVelocity: velocity,
                reflectedVelocity: reflection,
                normal: result.normal,
                restitution: restitution
            });

            drawReflectionDebug(ctx, result.point, velocity, reflection);
        }

        return reflection;
    }

    // Get debug visualization points for collision path
    getDebugPoints(startX, startY, totalDX, totalDY, totalDAngle, steps) {
        const points = [];
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: startX + totalDX * t,
                y: startY + totalDY * t
            });
        }
        return points;
    }
} 