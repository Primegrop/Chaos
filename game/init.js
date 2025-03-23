import { Pod } from '../pods/Pod.js';
import Background from '../ambience/background.js';
import MetalFloor from '../ambience/floors/metalFloor.js';
import SandDuneFloor from '../ambience/floors/sandDuneFloor.js';
import DenseSandFloor from '../ambience/floors/denseSandFloor.js';
import BrickWall from '../ambience/barriers/BrickWall.js';
import { 
    defaultPodConfig, 
    speedPodConfig, 
    heavyPodConfig, 
    agilePodConfig 
} from '../pods/configs/podConfigs.js';
import { MainGameLoop } from './loops/mainLoop.js';

export class GameInitializer {
    constructor() {
        // Set up game dimensions as class properties
        this.GAME_WIDTH = 1280;
        this.GAME_HEIGHT = 720;
        
        // Get the canvas element
        this.canvas = document.getElementById('gameCanvas');
        
        // Set canvas size
        this.canvas.width = this.GAME_WIDTH;
        this.canvas.height = this.GAME_HEIGHT;
        
        // Initialize floor types
        this.metalFloor = new MetalFloor();
        this.sandDuneFloor = new SandDuneFloor();
        this.denseSandFloor = new DenseSandFloor();
        
        // Create background with initial floor type (metal)
        this.background = new Background(this.canvas, this.metalFloor);
        this.background.applyStyles();
        
        // Initialize pod on the left side, facing left
        this.pod = new Pod(this.GAME_WIDTH, this.GAME_HEIGHT, defaultPodConfig);
        this.pod.behavior.setPosition(this.GAME_WIDTH * 0.2, this.GAME_HEIGHT * 0.5);  // 20% from left, vertically centered
        this.pod.behavior.properties.angle = Math.PI;  // Face left
        
        // Create brick wall in the center
        this.brickWall = new BrickWall(this.GAME_WIDTH * 0.5, this.GAME_HEIGHT * 0.5);  // Centered position
        
        // Initialize game loop with all required parameters
        this.gameLoop = new MainGameLoop(
            this.canvas,
            this.background,
            this.pod,
            [this.brickWall],  // Pass barriers array
            true  // Debug mode on
        );
        
        // Ensure the brick wall is registered for collision detection
        this.gameLoop.collisionDetector.registerCollidable(this.brickWall);
        
        // Start the game loop
        this.gameLoop.start();
        
        // Set up keyboard event listeners
        this.setupEventListeners();
    }

    updateActiveButtons(clickedId, groupClass) {
        document.querySelectorAll(`.${groupClass}`).forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(clickedId).classList.add('active');
    }

    setupEventListeners() {
        // Handle floor switching
        document.getElementById('metalFloor').addEventListener('click', () => {
            this.background = new Background(this.canvas, this.metalFloor);
            this.background.applyStyles();
            this.gameLoop.updateGameObjects(this.background, this.pod, [this.brickWall]);
            this.updateActiveButtons('metalFloor', 'floor-group');
        });

        document.getElementById('sandDunes').addEventListener('click', () => {
            this.background = new Background(this.canvas, this.sandDuneFloor);
            this.background.applyStyles();
            this.gameLoop.updateGameObjects(this.background, this.pod, [this.brickWall]);
            this.updateActiveButtons('sandDunes', 'floor-group');
        });

        document.getElementById('denseSand').addEventListener('click', () => {
            this.background = new Background(this.canvas, this.denseSandFloor);
            this.background.applyStyles();
            this.gameLoop.updateGameObjects(this.background, this.pod, [this.brickWall]);
            this.updateActiveButtons('denseSand', 'floor-group');
        });

        // Handle pod configuration switching
        document.getElementById('defaultPod').addEventListener('click', () => {
            this.changePodType('defaultPod');
        });

        document.getElementById('speedPod').addEventListener('click', () => {
            this.changePodType('speedPod');
        });

        document.getElementById('heavyPod').addEventListener('click', () => {
            this.changePodType('heavyPod');
        });

        document.getElementById('agilePod').addEventListener('click', () => {
            this.changePodType('agilePod');
        });

        // Set up keyboard input handling
        document.addEventListener('keydown', (event) => {
            this.pod.handleInput(event.key, true);
        });

        document.addEventListener('keyup', (event) => {
            this.pod.handleInput(event.key, false);
        });
    }

    changePodType(type) {
        let config;
        switch (type) {
            case 'defaultPod':
                config = defaultPodConfig;
                break;
            case 'speedPod':
                config = speedPodConfig;
                break;
            case 'heavyPod':
                config = heavyPodConfig;
                break;
            case 'agilePod':
                config = agilePodConfig;
                break;
        }
        
        // Create new pod with the selected config
        this.pod = new Pod(this.canvas.width, this.canvas.height, config);
        // Position on left side, facing left
        this.pod.behavior.setPosition(this.GAME_WIDTH * 0.2, this.GAME_HEIGHT * 0.5);
        this.pod.behavior.properties.angle = Math.PI;
        
        // Update game objects and ensure collision detection is maintained
        this.gameLoop.updateGameObjects(this.background, this.pod, [this.brickWall]);
        this.gameLoop.collisionDetector.registerCollidable(this.brickWall);
        
        // Update active button
        this.updateActiveButtons(type, 'pod-group');
    }

    start() {
        this.gameLoop.start();
    }
} 