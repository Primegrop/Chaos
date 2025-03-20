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

    // Calculate reflection vector using normalized vectors
    calculateReflection(velocity, normal) {
        // First normalize the normal vector (ensure it's a unit vector)
        const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        const unitNormal = {
            x: normal.x / normalLength,
            y: normal.y / normalLength
        };

        // Calculate the dot product of velocity and normal
        const dot = velocity.x * unitNormal.x + velocity.y * unitNormal.y;
        
        // Calculate reflection vector: v - 2(v·n)n
        const reflection = {
            x: velocity.x - 2 * dot * unitNormal.x,
            y: velocity.y - 2 * dot * unitNormal.y
        };

        // Apply speed reduction (40% reduction)
        const reductionFactor = 0.6;
        return {
            x: reflection.x * reductionFactor,
            y: reflection.y * reductionFactor
        };
    }

    // Swept AABB collision detection
    detectCollision(moving, velocity, target) {
        const result = new CollisionResult();
        
        // Get bounding boxes
        const mover = moving.getBounds();
        const target_bounds = target.getBounds();
        
        // If moving away from target, no collision possible
        if (velocity.x === 0 && velocity.y === 0) return result;

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
            // Calculate reflection
            const reflection = this.calculateReflection(velocity, collision.normal);
            
            return {
                collided: true,
                point: collision.point,
                normal: collision.normal,
                reflection: reflection,
                time: collision.time
            };
        }

        return { collided: false };
    }
} 