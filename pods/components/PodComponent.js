// Base class for all pod components
class PodComponent {
    constructor(config = {}) {
        this.config = config;
    }

    // Virtual methods that can be overridden by child classes
    update(pod) {
        // Default implementation does nothing
    }

    draw(ctx, pod) {
        // Must be implemented by child classes
        throw new Error('draw method must be implemented');
    }

    handleInput(key, pod) {
        // Default implementation does nothing
    }
}

export default PodComponent; 