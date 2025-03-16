export class MainGameLoop {
    constructor(canvas, background, pod) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.background = background;
        this.pod = pod;
        
        // Bind the loop method
        this.loop = this.loop.bind(this);
        
        // Animation frame ID for cleanup
        this.animationFrameId = null;
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
        // Draw background
        this.background.draw(this.ctx);
        
        // Update and draw pod
        this.pod.update(this.canvas.width, this.canvas.height);
        this.pod.draw(this.ctx);
        
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    // Method to update game objects
    updateGameObjects(background, pod) {
        this.background = background;
        this.pod = pod;
    }
} 