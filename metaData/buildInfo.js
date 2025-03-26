/**
 * Build information and metadata for the Chaos Arena game.
 * This file centralizes build-related information that can be imported by other modules.
 */

export const buildInfo = {
    // Current build version of the game
    buildVersion: 136,
    
    // Build date (will be useful for future metadata)
    buildDate: new Date().toISOString(),
    
    // Build description (can be updated with each version)
    description: "Fixed collision handling with proper speed-based responses and safety checks"
};

export default buildInfo; 