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
        // Get the canvas element
        this.canvas = document.getElementById('gameCanvas');
        
        // Set fixed game dimensions
        this.GAME_WIDTH = 800;
        this.GAME_HEIGHT = 600;
        
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
        
        // Create pod with default config
        this.pod = new Pod(this.GAME_WIDTH, this.GAME_HEIGHT, defaultPodConfig);
        
        // Create game loop
        this.gameLoop = new MainGameLoop(
            this.canvas,
            this.background,
            this.pod,
            [],  // No barriers for now
            true // Debug mode on
        );
        
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
            this.pod = new Pod(this.canvas.width, this.canvas.height, defaultPodConfig);
            this.gameLoop.updateGameObjects(this.background, this.pod, [this.brickWall]);
            this.updateActiveButtons('defaultPod', 'pod-group');
        });

        document.getElementById('speedPod').addEventListener('click', () => {
            this.pod = new Pod(this.canvas.width, this.canvas.height, speedPodConfig);
            this.gameLoop.updateGameObjects(this.background, this.pod, [this.brickWall]);
            this.updateActiveButtons('speedPod', 'pod-group');
        });

        document.getElementById('heavyPod').addEventListener('click', () => {
            this.pod = new Pod(this.canvas.width, this.canvas.height, heavyPodConfig);
            this.gameLoop.updateGameObjects(this.background, this.pod, [this.brickWall]);
            this.updateActiveButtons('heavyPod', 'pod-group');
        });

        document.getElementById('agilePod').addEventListener('click', () => {
            this.pod = new Pod(this.canvas.width, this.canvas.height, agilePodConfig);
            this.gameLoop.updateGameObjects(this.background, this.pod, [this.brickWall]);
            this.updateActiveButtons('agilePod', 'pod-group');
        });

        // Set up keyboard input handling
        document.addEventListener('keydown', (event) => {
            this.pod.handleInput(event.key, true);
        });

        document.addEventListener('keyup', (event) => {
            this.pod.handleInput(event.key, false);
        });
    }

    start() {
        this.gameLoop.start();
    }
} 