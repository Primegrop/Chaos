// Default pod configuration
export const defaultPodConfig = {
    // Movement properties
    maxSpeed: 5,
    acceleration: 0.1,
    rotationAcceleration: 0.005,
    maxRotationalSpeed: 0.1,
    rotationalDamping: 0.99,
    
    // Component-specific properties
    body: {
        width: 15,
        height: 40,
        color: '#F0E68C'
    },
    cockpit: {
        radius: 10,
        color: 'blue',
        yOffset: -20
    },
    thruster: {
        width: 10,
        height: 20,
        color: 'gray',
        yOffset: 35
    }
};

// Speed-focused configuration
export const speedPodConfig = {
    ...defaultPodConfig,
    maxSpeed: 8,
    acceleration: 0.15,
    rotationAcceleration: 0.008,
    maxRotationalSpeed: 0.15,
    body: {
        ...defaultPodConfig.body,
        width: 12,  // Thinner for speed
        height: 45, // Longer for speed
        color: '#ff4444'  // Red color scheme
    },
    thruster: {
        ...defaultPodConfig.thruster,
        width: 8,   // Smaller thruster
        height: 25, // Longer thruster
        color: '#cc0000'
    }
};

// Heavy pod configuration
export const heavyPodConfig = {
    ...defaultPodConfig,
    maxSpeed: 4,
    acceleration: 0.08,
    rotationAcceleration: 0.004,
    maxRotationalSpeed: 0.08,
    body: {
        ...defaultPodConfig.body,
        width: 20,  // Wider for tank-like appearance
        height: 35, // Shorter but stockier
        color: '#666666'  // Dark gray color scheme
    },
    cockpit: {
        ...defaultPodConfig.cockpit,
        radius: 12,
        color: '#333333',
        yOffset: -17
    },
    thruster: {
        ...defaultPodConfig.thruster,
        width: 14,
        height: 18,
        color: '#444444'
    }
};

// Agile pod configuration with T-tail
export const agilePodConfig = {
    ...defaultPodConfig,
    maxSpeed: 6,
    acceleration: 0.12,
    rotationAcceleration: 0.006,  // Base rotation, will be enhanced by T-tail
    maxRotationalSpeed: 0.12,     // Base max rotation, will be enhanced by T-tail
    rotationalDamping: 0.98,
    body: {
        ...defaultPodConfig.body,
        width: 14,
        height: 38,
        color: '#4488ff'  // Blue color scheme
    },
    cockpit: {
        ...defaultPodConfig.cockpit,
        color: '#001133',
        yOffset: -19
    },
    ttail: {
        width: 10,
        height: 24,
        crossWidth: 20,
        crossHeight: 8,
        color: '#2244aa',
        yOffset: 35
    }
}; 