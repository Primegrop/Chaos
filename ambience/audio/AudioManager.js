export default class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.loadSounds();
    }

    async loadSounds() {
        // Load and store common sound effects
        await this.loadSound('wallHit', '/ambience/audio/sounds/wallHit.mp3');
        await this.loadSound('wallScrape', '/ambience/audio/sounds/wallScrape.mp3');
    }

    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
        } catch (error) {
            console.error(`Error loading sound ${name}:`, error);
        }
    }

    playSound(name, options = {}) {
        const sound = this.sounds.get(name);
        if (!sound) return;

        // Create audio nodes
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        
        // Connect nodes
        source.buffer = sound;
        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        // Apply options
        gainNode.gain.value = options.volume || 1;
        source.playbackRate.value = options.playbackRate || 1;

        // Play the sound
        source.start(0);
        
        return source;
    }

    playSpatialSound(name, x, y, options = {}) {
        const sound = this.sounds.get(name);
        if (!sound) return;

        // Create audio nodes
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        const panNode = this.context.createStereoPanner();

        // Connect nodes
        source.buffer = sound;
        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.context.destination);

        // Calculate pan based on x position (-1 to 1)
        const normalizedX = (x / window.innerWidth) * 2 - 1;
        panNode.pan.value = normalizedX;

        // Calculate volume based on y position
        const normalizedY = 1 - (y / window.innerHeight);
        gainNode.gain.value = (options.volume || 1) * normalizedY;

        // Apply other options
        source.playbackRate.value = options.playbackRate || 1;

        // Play the sound
        source.start(0);
        
        return source;
    }
} 