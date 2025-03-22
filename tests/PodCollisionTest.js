// Mock AudioManager
class MockAudioManager {
    constructor() {}
    playSpatialSound() {}
}

import { Pod } from '../pods/Pod.js';
import BrickWall from '../ambience/barriers/BrickWall.js';

// Override AudioManager import
window.AudioManager = MockAudioManager;

class PodCollisionTest {
    constructor() {
        // Create canvas for visualization
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Initialize test cases
        this.testCases = [
            this.testAngleCollision45Degrees,
            this.testStraightCollision,
            this.testAngleCollision30Degrees,
            this.testAngleCollision60Degrees
        ];
    }

    runTests() {
        console.log('Starting Pod Collision Tests...');
        this.testCases.forEach((testCase, index) => {
            console.log(`\nRunning Test Case ${index + 1}:`);
            testCase.call(this);
        });
    }

    drawBounds(bounds, color = 'yellow') {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    drawPod(pod) {
        pod.draw(this.ctx);
    }

    clearCanvas() {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    testAngleCollision45Degrees() {
        console.log('Testing 45-degree angle collision...');
        this.clearCanvas();
        
        // Create a pod at a specific position and angle
        const pod = new Pod(800, 600);
        pod.x = 400;
        pod.y = 300;
        pod.angle = Math.PI / 4; // 45 degrees
        
        // Create a wall
        const wall = new BrickWall(500, 200);
        
        // Get pod bounds before and after movement
        const initialBounds = pod.getBounds();
        
        // Draw initial state
        this.drawPod(pod);
        this.drawBounds(initialBounds, 'yellow');
        wall.draw(this.ctx);
        
        // Simulate movement towards wall
        pod.velocityX = 5;
        pod.velocityY = 0;
        pod.update(800, 600);
        
        const afterMovementBounds = pod.getBounds();
        const wallBounds = wall.getBounds();
        
        // Draw after movement
        this.drawBounds(afterMovementBounds, 'red');
        
        console.log('Initial Pod Bounds:', initialBounds);
        console.log('Wall Bounds:', wallBounds);
        console.log('Pod Bounds After Movement:', afterMovementBounds);
        
        const hasCollision = this.checkCollision(afterMovementBounds, wallBounds);
        console.log('Collision Detected:', hasCollision);
        
        const positionCheck = this.checkPodPosition(pod, initialBounds, afterMovementBounds);
        console.log('Position Consistency Check:', positionCheck);
    }

    testAngleCollision30Degrees() {
        console.log('Testing 30-degree angle collision...');
        this.clearCanvas();
        
        const pod = new Pod(800, 600);
        pod.x = 400;
        pod.y = 300;
        pod.angle = Math.PI / 6; // 30 degrees
        
        const wall = new BrickWall(500, 200);
        const initialBounds = pod.getBounds();
        
        this.drawPod(pod);
        this.drawBounds(initialBounds, 'yellow');
        wall.draw(this.ctx);
        
        pod.velocityX = 5;
        pod.velocityY = 0;
        pod.update(800, 600);
        
        const afterMovementBounds = pod.getBounds();
        this.drawBounds(afterMovementBounds, 'green');
        
        console.log('30° Initial Bounds:', initialBounds);
        console.log('30° After Movement:', afterMovementBounds);
    }

    testAngleCollision60Degrees() {
        console.log('Testing 60-degree angle collision...');
        this.clearCanvas();
        
        const pod = new Pod(800, 600);
        pod.x = 400;
        pod.y = 300;
        pod.angle = Math.PI / 3; // 60 degrees
        
        const wall = new BrickWall(500, 200);
        const initialBounds = pod.getBounds();
        
        this.drawPod(pod);
        this.drawBounds(initialBounds, 'yellow');
        wall.draw(this.ctx);
        
        pod.velocityX = 5;
        pod.velocityY = 0;
        pod.update(800, 600);
        
        const afterMovementBounds = pod.getBounds();
        this.drawBounds(afterMovementBounds, 'blue');
        
        console.log('60° Initial Bounds:', initialBounds);
        console.log('60° After Movement:', afterMovementBounds);
    }

    testStraightCollision() {
        console.log('Testing straight-on collision...');
        this.clearCanvas();
        
        const pod = new Pod(800, 600);
        pod.x = 400;
        pod.y = 300;
        pod.angle = 0;
        
        const wall = new BrickWall(500, 200);
        const initialBounds = pod.getBounds();
        
        this.drawPod(pod);
        this.drawBounds(initialBounds, 'yellow');
        wall.draw(this.ctx);
        
        pod.velocityX = 5;
        pod.velocityY = 0;
        pod.update(800, 600);
        
        const afterMovementBounds = pod.getBounds();
        const wallBounds = wall.getBounds();
        
        this.drawBounds(afterMovementBounds, 'purple');
        
        console.log('Initial Pod Bounds:', initialBounds);
        console.log('Wall Bounds:', wallBounds);
        console.log('Pod Bounds After Movement:', afterMovementBounds);
        
        const hasCollision = this.checkCollision(afterMovementBounds, wallBounds);
        console.log('Collision Detected:', hasCollision);
    }

    checkCollision(bounds1, bounds2) {
        return !(bounds1.x + bounds1.width < bounds2.x ||
                bounds1.x > bounds2.x + bounds2.width ||
                bounds1.y + bounds1.height < bounds2.y ||
                bounds1.y > bounds2.y + bounds2.height);
    }

    checkPodPosition(pod, initialBounds, afterBounds) {
        const expectedXChange = pod.velocityX;
        const actualXChange = afterBounds.x - initialBounds.x;
        
        const tolerance = 0.1;
        const isConsistent = Math.abs(expectedXChange - actualXChange) < tolerance;
        
        return {
            isConsistent,
            expectedChange: expectedXChange,
            actualChange: actualXChange,
            difference: Math.abs(expectedXChange - actualXChange)
        };
    }
}

// Run tests
const tester = new PodCollisionTest();
tester.runTests(); 