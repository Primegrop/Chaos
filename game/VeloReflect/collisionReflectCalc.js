// Simple component-based reflection calculation
export function calculateSimpleReflection(velocity, normal, restitution = 0.8) {
    // Simple reflection by reversing components based on collision normal
    if (normal.x !== 0) {
        // For horizontal collisions
        return {
            x: -velocity.x * restitution,  // Reverse x velocity
            y: velocity.y * restitution    // Keep y but reduce it
        };
    } else {
        // For vertical collisions
        return {
            x: velocity.x * restitution,   // Keep x but reduce it
            y: -velocity.y * restitution   // Reverse y velocity
        };
    }
}

// Vector-based reflection calculation using proper physics
export function calculateVectorReflection(velocity, normal, restitution = 0.8) {
    // First normalize the normal vector to ensure it's a unit vector
    const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    const unitNormal = {
        x: normal.x / normalLength,
        y: normal.y / normalLength
    };

    // Calculate the dot product of velocity and normal
    const dot = velocity.x * unitNormal.x + velocity.y * unitNormal.y;
    
    // Calculate reflection vector using the formula: v - 2(v·n)n
    // This is the standard physics reflection formula
    return {
        x: (velocity.x - 2 * dot * unitNormal.x) * restitution,
        y: (velocity.y - 2 * dot * unitNormal.y) * restitution
    };
}

// Debug helper to visualize the reflection
export function drawReflectionDebug(ctx, collisionPoint, velocity, reflectedVelocity) {
    // Draw original velocity vector (yellow)
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(collisionPoint.x, collisionPoint.y);
    ctx.lineTo(
        collisionPoint.x + velocity.x * 20,
        collisionPoint.y + velocity.y * 20
    );
    ctx.stroke();

    // Draw reflected velocity vector (green)
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(collisionPoint.x, collisionPoint.y);
    ctx.lineTo(
        collisionPoint.x + reflectedVelocity.x * 20,
        collisionPoint.y + reflectedVelocity.y * 20
    );
    ctx.stroke();

    // Draw collision point (red)
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(collisionPoint.x, collisionPoint.y, 4, 0, Math.PI * 2);
    ctx.fill();
} 