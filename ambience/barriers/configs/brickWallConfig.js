export const defaultBrickWallConfig = {
    // Wall dimensions
    width: 200,
    height: 12,
    
    // Brick pattern
    brickSize: 4,        // Size of each brick (4x4 pixels)
    mortarSize: 1,       // Size of the mortar/separator between bricks
    
    // Colors
    brickColor: '#8B4513',       // Base brick color
    mortarColor: '#4A4A4A',      // Color of the mortar/separator
    
    // Collision feedback
    hitBrickColor: '#CD853F',    // Brick color when hit
    hitMortarColor: '#696969',   // Mortar color when hit
    
    // Collision timing
    collisionCooldown: 100,              // Minimum time between collision sounds (ms)
    collisionFeedbackDuration: 100,      // How long the hit effect lasts (ms)
    
    // Audio
    minSpeedForSound: 5,         // Minimum speed required to play collision sound
    volumeScale: 10,             // Divisor for speed to calculate volume
    basePlaybackRate: 0.8,       // Base playback rate for collision sound
    playbackRateScale: 40        // Divisor for speed to calculate additional playback rate
}; 