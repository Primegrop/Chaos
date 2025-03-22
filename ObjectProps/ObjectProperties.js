export class ObjectProperties {
    constructor(config = {}) {
        // Position properties
        this._x = config.x || 0;
        this._y = config.y || 0;
        
        // Velocity properties
        this._velocityX = config.velocityX || 0;
        this._velocityY = config.velocityY || 0;
        this._maxSpeed = config.maxSpeed || 5;
        this._acceleration = config.acceleration || 0.2;
        
        // Rotation properties
        this._angle = config.angle || 0;
        this._rotationalVelocity = config.rotationalVelocity || 0;
        this._rotationAcceleration = config.rotationAcceleration || 0.003;
        this._maxRotationalSpeed = config.maxRotationalSpeed || 0.1;
        this._rotationalDamping = config.rotationalDamping || 0.95;

        // Damping properties
        this._velocityDamping = config.velocityDamping || 0.995;
    }

    // Position getters and setters
    get x() { return this._x; }
    set x(value) { this._x = value; }

    get y() { return this._y; }
    set y(value) { this._y = value; }

    // Velocity getters and setters
    get velocityX() { return this._velocityX; }
    set velocityX(value) { this._velocityX = value; }

    get velocityY() { return this._velocityY; }
    set velocityY(value) { this._velocityY = value; }

    get maxSpeed() { return this._maxSpeed; }
    set maxSpeed(value) { this._maxSpeed = value; }

    get acceleration() { return this._acceleration; }
    set acceleration(value) { this._acceleration = value; }

    // Rotation getters and setters
    get angle() { return this._angle; }
    set angle(value) { this._angle = value; }

    get rotationalVelocity() { return this._rotationalVelocity; }
    set rotationalVelocity(value) { this._rotationalVelocity = value; }

    get rotationAcceleration() { return this._rotationAcceleration; }
    set rotationAcceleration(value) { this._rotationAcceleration = value; }

    get maxRotationalSpeed() { return this._maxRotationalSpeed; }
    set maxRotationalSpeed(value) { this._maxRotationalSpeed = value; }

    get rotationalDamping() { return this._rotationalDamping; }
    set rotationalDamping(value) { this._rotationalDamping = value; }

    // Damping getters and setters
    get velocityDamping() { return this._velocityDamping; }
    set velocityDamping(value) { this._velocityDamping = value; }

    // Utility methods
    setPosition(x, y) {
        this._x = x;
        this._y = y;
    }

    getPosition() {
        return { x: this._x, y: this._y, angle: this._angle };
    }

    setVelocity(vx, vy) {
        this._velocityX = vx;
        this._velocityY = vy;
    }

    getVelocity() {
        return { x: this._velocityX, y: this._velocityY };
    }

    // Core update methods
    update(canvasWidth, canvasHeight) {
        this._updatePosition(canvasWidth, canvasHeight);
        this._limitVelocity();
        this._updateRotation();
        this._applyDamping();
    }

    // Movement methods
    applyForce(force, angle) {
        this._velocityX += force * Math.sin(angle);
        this._velocityY -= force * Math.cos(angle);
    }

    applyRotationalForce(force) {
        this._rotationalVelocity = Math.min(
            Math.max(
                this._rotationalVelocity + force,
                -this._maxRotationalSpeed
            ),
            this._maxRotationalSpeed
        );
    }

    // Private update methods
    _updatePosition(canvasWidth, canvasHeight) {
        this._x += this._velocityX;
        this._y += this._velocityY;

        // Wraparound logic
        if (this._x < 0) this._x = canvasWidth;
        if (this._x > canvasWidth) this._x = 0;
        if (this._y < 0) this._y = canvasHeight;
        if (this._y > canvasHeight) this._y = 0;
    }

    _limitVelocity() {
        const speed = Math.sqrt(this._velocityX * this._velocityX + this._velocityY * this._velocityY);
        if (speed > this._maxSpeed) {
            const scale = this._maxSpeed / speed;
            this._velocityX *= scale;
            this._velocityY *= scale;
        }
    }

    _updateRotation() {
        this._angle += this._rotationalVelocity;
        this._rotationalVelocity *= this._rotationalDamping;
    }

    _applyDamping() {
        this._velocityX *= this._velocityDamping;
        this._velocityY *= this._velocityDamping;
    }

    // Configuration
    configure(config) {
        // Update all configurable properties
        if (config.maxSpeed !== undefined) this._maxSpeed = config.maxSpeed;
        if (config.acceleration !== undefined) this._acceleration = config.acceleration;
        if (config.rotationAcceleration !== undefined) this._rotationAcceleration = config.rotationAcceleration;
        if (config.maxRotationalSpeed !== undefined) this._maxRotationalSpeed = config.maxRotationalSpeed;
        if (config.rotationalDamping !== undefined) this._rotationalDamping = config.rotationalDamping;
        if (config.velocityDamping !== undefined) this._velocityDamping = config.velocityDamping;
    }
} 