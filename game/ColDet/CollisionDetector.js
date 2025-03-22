export class CollisionResult {
    constructor() {
        this.collided = false;
        this.time = 1.0;        // Time of collision (1.0 = no collision)
        this.normal = { x: 0, y: 0 }; // Surface normal at point of collision
        this.point = { x: 0, y: 0 };  // Point of collision
    }
}

export default class CollisionDetector {
    constructor() {
        // Will hold references to collidable objects
        this.collidables = new Set();
    }

    // Register an object that can be collided with
    registerCollidable(object) {
        if (object && typeof object.getBounds === 'function') {
            this.collidables.add(object);
        }
    }

    // Remove an object from collision detection
    unregisterCollidable(object) {
        this.collidables.delete(object);
    }

    // Calculate swept bounds for a rotating object
    calculateSweptBounds(moving, velocity, rotationalVelocity) {
        // Get initial and final angles
        const startAngle = moving.behavior ? moving.behavior.properties.angle : moving.angle;
        const endAngle = startAngle + rotationalVelocity;
        
        // Calculate more steps for faster rotation
        const rotationSpeed = Math.abs(rotationalVelocity);
        const steps = Math.max(
            20, // minimum steps
            Math.ceil(rotationSpeed * 20) // more steps for faster rotation
        );
        
        // Track all points including corners and intermediate positions
        const allPoints = [];
        
        // Add points at regular intervals through the rotation
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const angle = startAngle + (rotationalVelocity * t);
            const corners = this.getRotatedCorners(moving, angle);
            
            // Add velocity-adjusted points
            corners.forEach(point => {
                allPoints.push({
                    x: point.x + (velocity.x * t),
                    y: point.y + (velocity.y * t)
                });
            });
            
            // Add extra points slightly offset from corners for better edge detection
            const offset = 2; // Small offset for edge detection
            corners.forEach(point => {
                allPoints.push({
                    x: point.x + (velocity.x * t) + offset,
                    y: point.y + (velocity.y * t) + offset
                });
                allPoints.push({
                    x: point.x + (velocity.x * t) - offset,
                    y: point.y + (velocity.y * t) - offset
                });
            });
        }
        
        // Calculate bounds with a small safety margin
        const margin = 2;
        const xs = allPoints.map(p => p.x);
        const ys = allPoints.map(p => p.y);
        
        return {
            x: Math.min(...xs) - margin,
            y: Math.min(...ys) - margin,
            width: Math.max(...xs) - Math.min(...xs) + (margin * 2),
            height: Math.max(...ys) - Math.min(...ys) + (margin * 2)
        };
    }

    calculateRotatedBounds(moving, angle) {
        const size = 96; // Same size as in Pod.getBounds()
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const corners = this.getRotatedCorners(moving, angle);
        
        const xs = corners.map(p => p.x);
        const ys = corners.map(p => p.y);
        
        return {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys)
        };
    }

    getRotatedCorners(moving, angle) {
        // Get the actual bounds size from the object if available
        const bounds = moving.getBounds();
        const size = Math.max(bounds.width, bounds.height);
        
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        // Get position from behavior if available
        const position = moving.behavior ? 
            moving.behavior.getPosition() : 
            { x: moving.x, y: moving.y };
        
        return [
            {x: -size/2, y: -size/2},
            {x: size/2, y: -size/2},
            {x: size/2, y: size/2},
            {x: -size/2, y: size/2}
        ].map(point => ({
            x: position.x + (point.x * cos - point.y * sin),
            y: position.y + (point.x * sin + point.y * cos)
        }));
    }

    // Modified main collision detection method to use swept bounds
    detectCollision(moving, velocity, target) {
        const result = new CollisionResult();
        
        // Get rotational velocity from behavior if available
        const rotationalVelocity = moving.behavior ? 
            moving.behavior.properties.rotationalVelocity : 
            moving.rotationalVelocity;
        
        // Get swept bounds if object is rotating
        const useSweptBounds = rotationalVelocity && Math.abs(rotationalVelocity) > 0.01;
        const mover = useSweptBounds ? 
            this.calculateSweptBounds(moving, velocity, rotationalVelocity) :
            moving.getBounds();
            
        const target_bounds = target.getBounds();
        
        // Early exit if no movement
        if (velocity.x === 0 && velocity.y === 0 && (!rotationalVelocity || Math.abs(rotationalVelocity) < 0.01)) {
            return result;
        }

        // Calculate entry and exit times for X axis
        let xInvEntry, xInvExit;
        if (velocity.x > 0) {
            xInvEntry = target_bounds.x - (mover.x + mover.width);
            xInvExit = (target_bounds.x + target_bounds.width) - mover.x;
        } else {
            xInvEntry = (target_bounds.x + target_bounds.width) - mover.x;
            xInvExit = target_bounds.x - (mover.x + mover.width);
        }

        // Calculate entry and exit times for Y axis
        let yInvEntry, yInvExit;
        if (velocity.y > 0) {
            yInvEntry = target_bounds.y - (mover.y + mover.height);
            yInvExit = (target_bounds.y + target_bounds.height) - mover.y;
        } else {
            yInvEntry = (target_bounds.y + target_bounds.height) - mover.y;
            yInvExit = target_bounds.y - (mover.y + mover.height);
        }

        // Calculate entry times
        let xEntry = velocity.x !== 0 ? xInvEntry / velocity.x : (xInvEntry > 0 ? Infinity : -Infinity);
        let xExit = velocity.x !== 0 ? xInvExit / velocity.x : (xInvExit > 0 ? Infinity : -Infinity);
        let yEntry = velocity.y !== 0 ? yInvEntry / velocity.y : (yInvEntry > 0 ? Infinity : -Infinity);
        let yExit = velocity.y !== 0 ? yInvExit / velocity.y : (yInvExit > 0 ? Infinity : -Infinity);

        // Find earliest/latest entry times
        const entryTime = Math.max(xEntry, yEntry);
        const exitTime = Math.min(xExit, yExit);

        // Check if collision occurred
        if (entryTime > exitTime || entryTime > 1 || entryTime < 0) {
            return result;
        }

        result.collided = true;
        result.time = entryTime;

        // Calculate normal of collided surface and collision point
        if (xEntry > yEntry) {
            // Horizontal collision
            if (velocity.x > 0) {
                result.normal.x = -1;  // Hit right side of wall, normal points left
                result.point.x = target_bounds.x;
            } else {
                result.normal.x = 1;   // Hit left side of wall, normal points right
                result.point.x = target_bounds.x + target_bounds.width;
            }
            result.normal.y = 0;
            result.point.y = mover.y + velocity.y * entryTime;
        } else {
            // Vertical collision
            if (velocity.y > 0) {
                result.normal.y = -1;  // Hit bottom, normal points up
                result.point.y = target_bounds.y;
            } else {
                result.normal.y = 1;   // Hit top, normal points down
                result.point.y = target_bounds.y + target_bounds.height;
            }
            result.normal.x = 0;
            result.point.x = mover.x + velocity.x * entryTime;
        }

        return result;
    }

    // Detailed collision detection method (currently unused)
    detectDetailedCollision(moving, velocity, target) {
        const result = new CollisionResult();
        
        // Get bounding boxes
        const mover = moving.getBounds();
        const target_bounds = target.getBounds();
        
        // First do broad phase collision check
        const broadResult = this.detectCollision(moving, velocity, target);
        if (!broadResult.collided) return result;

        // If we have detailed bounds, use them for precise collision
        if (moving.getDetailedBounds) {
            // Get detailed bounds at the potential collision time
            const detailedBoxes = moving.getDetailedBounds();
            let earliestTime = 1.0;
            let closestCollision = null;

            // Check each detailed box for collision
            for (const box of detailedBoxes) {
                const boxResult = this.detectCollision(box, velocity, target);
                if (boxResult.collided && boxResult.time < earliestTime) {
                    earliestTime = boxResult.time;
                    closestCollision = boxResult;
                }
            }

            // If we found a detailed collision, use it
            if (closestCollision) {
                result.collided = true;
                result.time = closestCollision.time;
                result.normal = closestCollision.normal;
                result.point = closestCollision.point;
            }
        }

        return result;
    }

    // Main collision detection and response method
    detectCollisions(object, velocity) {
        let shortestTime = 1.0;
        let collision = null;

        // Check collision with each collidable
        for (const collidable of this.collidables) {
            if (collidable === object) continue;

            const result = this.detectCollision(object, velocity, collidable);
            if (result.collided && result.time < shortestTime) {
                shortestTime = result.time;
                collision = result;
            }
        }

        if (collision) {
            return {
                collided: true,
                point: collision.point,
                normal: collision.normal,
                time: collision.time
            };
        }

        return { collided: false };
    }
} 