import CollisionDetector from '../ColDet/CollisionDetector.js';

class MockPod {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getBounds() {
        return {
            x: this.x - this.width/2,
            y: this.y - this.height/2,
            width: this.width,
            height: this.height
        };
    }
}

class MockWall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Test suite for collision detection
export class CollisionTest {
    constructor() {
        this.detector = new CollisionDetector();
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    assertEquals(actual, expected, tolerance = 0.0001) {
        return Math.abs(actual - expected) <= tolerance;
    }

    recordTest(name, passed, details = '') {
        this.results.tests.push({
            name,
            passed,
            details
        });
        if (passed) {
            this.results.passed++;
        } else {
            this.results.failed++;
            console.error(`Test failed: ${name}\n${details}`);
        }
    }

    testHorizontalCollisionSymmetry() {
        // Create a wall in the middle
        const wall = new MockWall(500, 300, 20, 100);
        this.detector.registerCollidable(wall);

        // Test left-to-right collision
        const podFromLeft = new MockPod(490, 350, 20, 20);
        const velocityRight = { x: 5, y: 0 };
        const collisionRight = this.detector.detectCollisions(podFromLeft, velocityRight);

        // Test right-to-left collision
        const podFromRight = new MockPod(530, 350, 20, 20);
        const velocityLeft = { x: -5, y: 0 };
        const collisionLeft = this.detector.detectCollisions(podFromRight, velocityLeft);

        // Compare reflection magnitudes
        const rightReflectionMagnitude = Math.sqrt(
            collisionRight.reflection.x * collisionRight.reflection.x +
            collisionRight.reflection.y * collisionRight.reflection.y
        );

        const leftReflectionMagnitude = Math.sqrt(
            collisionLeft.reflection.x * collisionLeft.reflection.x +
            collisionLeft.reflection.y * collisionLeft.reflection.y
        );

        const symmetryPassed = this.assertEquals(rightReflectionMagnitude, leftReflectionMagnitude);
        this.recordTest(
            'Horizontal Collision Symmetry',
            symmetryPassed,
            `Left-to-right magnitude: ${rightReflectionMagnitude}\nRight-to-left magnitude: ${leftReflectionMagnitude}`
        );

        // Test reflection angles
        const rightAngle = Math.atan2(collisionRight.reflection.y, collisionRight.reflection.x);
        const leftAngle = Math.atan2(collisionLeft.reflection.y, collisionLeft.reflection.x);
        const angleSymmetryPassed = this.assertEquals(Math.abs(rightAngle), Math.abs(leftAngle));
        this.recordTest(
            'Reflection Angle Symmetry',
            angleSymmetryPassed,
            `Left-to-right angle: ${rightAngle}\nRight-to-left angle: ${leftAngle}`
        );
    }

    runAllTests() {
        console.log('Starting collision tests...');
        this.testHorizontalCollisionSymmetry();
        
        console.log('\nTest Results:');
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log('\nDetailed Results:');
        this.results.tests.forEach(test => {
            console.log(`${test.passed ? '✓' : '✗'} ${test.name}`);
            if (!test.passed) {
                console.log(test.details);
            }
        });
    }
}

// Run tests
const tester = new CollisionTest();
tester.runAllTests(); 