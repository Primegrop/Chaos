// Default pod configuration
export const defaultPodConfig = {
    // Physical properties
    maxSpeed: 2.5,
    acceleration: 0.025,
    rotationAcceleration: 0.0002,
    maxRotationalSpeed: 0.05,
    rotationalDamping: 0.995,
    velocityDamping: 0.995,
    
    // Visual components configuration
    body: {
        width: 12,
        height: 16,
        color: '#F0E68C'
    },
    cockpit: {
        radius: 6,
        color: '#4169E1',  // Royal Blue
        highlightColor: '#000000',  // Black
        yOffset: -10
    },
    fuselage: {
        color: '#DAA520'  // Goldenrod
    },
    thruster: {
        color: '#CD853F',  // Peru
        flameColor: '#FF4500'  // OrangeRed
    }
};

// Speed-focused configuration
export const speedPodConfig = {
    // Physical properties
    maxSpeed: 4,
    acceleration: 0.035,
    rotationAcceleration: 0.00015,
    maxRotationalSpeed: 0.04,
    rotationalDamping: 0.997,
    velocityDamping: 0.997,
    
    // Visual components configuration
    body: {
        width: 10,
        height: 18,
        color: '#ff4444'
    },
    cockpit: {
        radius: 5,
        color: '#000000',  // Black
        highlightColor: '#C0C0C0',  // Silver
        yOffset: -9
    },
    fuselage: {
        color: '#8B0000'  // Dark Red
    },
    thruster: {
        color: '#B22222',  // FireBrick
        flameColor: '#FFD700'  // Gold
    }
};

// Heavy pod configuration
export const heavyPodConfig = {
    // Physical properties
    maxSpeed: 2,
    acceleration: 0.015,
    rotationAcceleration: 0.0001,
    maxRotationalSpeed: 0.025,
    rotationalDamping: 0.998,
    velocityDamping: 0.99,
    
    // Visual components configuration
    body: {
        width: 14,
        height: 14,
        color: '#666666'
    },
    cockpit: {
        radius: 7,
        color: '#8B4513',  // Saddle Brown
        highlightColor: '#000000',  // Black
        yOffset: -11
    },
    fuselage: {
        color: '#4A4A4A'  // Darker Gray
    },
    thruster: {
        color: '#696969',  // Dim Gray
        flameColor: '#4682B4'  // Steel Blue
    }
};

// Agile pod configuration
export const agilePodConfig = {
    // Physical properties
    maxSpeed: 3,
    acceleration: 0.03,
    rotationAcceleration: 0.00025,
    maxRotationalSpeed: 0.06,
    rotationalDamping: 0.993,
    velocityDamping: 0.993,
    
    // Visual components configuration
    body: {
        width: 11,
        height: 15,
        color: '#4488ff'
    },
    cockpit: {
        radius: 6,
        color: '#32CD32',  // Lime Green
        highlightColor: '#FFD700',  // Gold/Yellow
        yOffset: -10
    },
    fuselage: {
        color: '#1E90FF'  // Dodger Blue
    },
    ttail: {
        width: 10,
        height: 24,
        crossWidth: 20,
        crossHeight: 8,
        color: '#4169E1',  // Royal Blue
        yOffset: 35
    },
    thruster: {
        color: '#4169E1',  // Royal Blue
        flameColor: '#7FFF00'  // Chartreuse
    }
}; 