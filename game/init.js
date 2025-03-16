import { Pod } from '../pods/Pod.js';
import Background from '../ambience/background.js';
import MetalFloor from '../ambience/floors/metalFloor.js';
import SandDuneFloor from '../ambience/floors/sandDuneFloor.js';
import { 
    defaultPodConfig, 
    speedPodConfig, 
    heavyPodConfig, 
    agilePodConfig 
} from '../pods/configs/podConfigs.js';
import { MainGameLoop } from './loops/mainLoop.js';

export class GameInitializer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Create floor instances
        this.metalFloor = new MetalFloor();
        this.sandDuneFloor = new SandDuneFloor();
        
        // Create pod with agile configuration by default
        this.pod = new Pod(canvas.width, canvas.height, agilePodConfig);
        this.background = new Background(canvas, this.metalFloor);
        
        // Apply background styles
        this.background.applyStyles();
        
        // Create game loop
        this.gameLoop = new MainGameLoop(canvas, this.background, this.pod);
        
        // Bind methods
        this.setupEventListeners = this.setupEventListeners.bind(this);
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
            this.gameLoop.updateGameObjects(this.background, this.pod);
            this.updateActiveButtons('metalFloor', 'floor-group');
        });

        document.getElementById('sandDunes').addEventListener('click', () => {
            this.background = new Background(this.canvas, this.sandDuneFloor);
            this.background.applyStyles();
            this.gameLoop.updateGameObjects(this.background, this.pod);
            this.updateActiveButtons('sandDunes', 'floor-group');
        });

        // Handle pod configuration switching
        document.getElementById('defaultPod').addEventListener('click', () => {
            this.pod = new Pod(this.canvas.width, this.canvas.height, defaultPodConfig);
            this.gameLoop.updateGameObjects(this.background, this.pod);
            this.updateActiveButtons('defaultPod', 'pod-group');
        });

        document.getElementById('speedPod').addEventListener('click', () => {
            this.pod = new Pod(this.canvas.width, this.canvas.height, speedPodConfig);
            this.gameLoop.updateGameObjects(this.background, this.pod);
            this.updateActiveButtons('speedPod', 'pod-group');
        });

        document.getElementById('heavyPod').addEventListener('click', () => {
            this.pod = new Pod(this.canvas.width, this.canvas.height, heavyPodConfig);
            this.gameLoop.updateGameObjects(this.background, this.pod);
            this.updateActiveButtons('heavyPod', 'pod-group');
        });

        document.getElementById('agilePod').addEventListener('click', () => {
            this.pod = new Pod(this.canvas.width, this.canvas.height, agilePodConfig);
            this.gameLoop.updateGameObjects(this.background, this.pod);
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
        this.setupEventListeners();
        this.gameLoop.start();
    }
} 