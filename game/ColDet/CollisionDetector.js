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

    // Calculate reflection vector
    calculateReflection(velocity, normal) {
        const dot = velocity.x * normal.x + velocity.y * normal.y;
        return {
            x: velocity.x - 2 * dot * normal.x,
            y: velocity.y - 2 * dot * normal.y
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
        let xEntry = xInvEntry / velocity.x;
        let xExit = xInvExit / velocity.x;
        let yEntry = yInvEntry / velocity.y;
        let yExit = yInvExit / velocity.y;

        // Swap entry/exit times if necessary
        if (velocity.x === 0) {
            xEntry = -Infinity;
            xExit = Infinity;
        }
        if (velocity.y === 0) {
            yEntry = -Infinity;
            yExit = Infinity;
        }

        // Find earliest/latest entry times
        const entryTime = Math.max(xEntry, yEntry);
        const exitTime = Math.min(xExit, yExit);

        // Check if collision occurred
        if (entryTime > exitTime || xEntry < 0 && yEntry < 0 || xEntry > 1 || yEntry > 1) {
            return result;
        }

        result.collided = true;
        result.time = entryTime;

        // Calculate normal of collided surface
        if (xEntry > yEntry) {
            result.normal.x = xInvEntry < 0 ? 1 : -1;
        } else {
            result.normal.y = yInvEntry < 0 ? 1 : -1;
        }

        // Calculate collision point
        result.point.x = mover.x + velocity.x * entryTime;
        result.point.y = mover.y + velocity.y * entryTime;

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