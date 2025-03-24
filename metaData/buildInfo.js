/**
 * Build information and metadata for the Chaos Arena game.
 * This file centralizes build-related information that can be imported by other modules.
 */

export const buildInfo = {
    // Current build version of the game
    buildVersion: 126,
    
    // Build date (will be useful for future metadata)
    buildDate: new Date().toISOString(),
    
    // Build description (can be updated with each version)
    description: "Refactored game loop with improved collision handling and debug visualization"
};

export default buildInfo; 