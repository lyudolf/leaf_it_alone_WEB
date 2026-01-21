/**
 * Tool Configuration System
 * Centralized tuning parameters for Hand, Rake, and Blower mechanics
 */

export const TOOL_CONFIG = {
    HAND: {
        range: 50,             // Raycast range for click collection
        collectRadius: 1,      // Radius around click point
    },
    RAKE: {
        range: 3,              // Scraping range
        distance: 2,           // Closer to player (rake in hand)
        scrapeStrength: 15,    // Horizontal scraping force
        scrapeAngle: 45,       // Degrees of arc for scraping motion (unused)
        tickInterval: 50,      // Apply force every N milliseconds
    },
    BLOWER: {
        range: 5,              // Cone range (units)
        distance: 3,           // Forward distance from camera (units)
        coneAngle: 45,         // Half-angle of cone in degrees (45° = 90° total cone)
        blowStrength: 5,       // Strong push force magnitude
        falloffExponent: 1.5,  // Distance-based strength falloff (higher = stronger near/weaker far)
        minPushDistance: 5,    // Minimum distance leaves should travel (for feel)
        tickInterval: 50,      // Apply force every N milliseconds
    },
    VACUUM: {
        range: 25,             // Suction range (current stage area)
        collectRadius: 1.5,    // Automatic collection radius
        strength: 20,          // Pull strength
        tickInterval: 50,
    },
    PERFORMANCE: {
        maxActiveLeaves: 300,  // Max leaves to apply physics to
        activationRadius: 25,  // Radius around player for active physics (units)
    }
} as const;

export type ToolType = 'HAND' | 'RAKE' | 'BLOWER' | 'VACUUM';

/**
 * Get Rake configuration based on upgrade level (1-4)
 */
export function getRakeConfig(upgradeLevel: number) {
    const level = Math.max(1, Math.min(4, upgradeLevel));
    return {
        range: TOOL_CONFIG.RAKE.range + (level - 1) * 1.5, // 3, 4.5, 6, 7.5
        distance: TOOL_CONFIG.RAKE.distance,
        scrapeStrength: TOOL_CONFIG.RAKE.scrapeStrength + (level - 1) * 5, // 15, 20, 25, 30
        scrapeAngle: TOOL_CONFIG.RAKE.scrapeAngle,
        tickInterval: TOOL_CONFIG.RAKE.tickInterval,
    };
}

/**
 * Get Blower configuration based on upgrade level (1-4)
 */
export function getBlowerConfig(upgradeLevel: number) {
    const level = Math.max(1, Math.min(4, upgradeLevel));
    return {
        range: TOOL_CONFIG.BLOWER.range + (level - 1) * 2, // 5, 7, 9, 11
        distance: TOOL_CONFIG.BLOWER.distance,
        coneAngle: TOOL_CONFIG.BLOWER.coneAngle,
        blowStrength: TOOL_CONFIG.BLOWER.blowStrength + (level - 1) * 2, // 5, 7, 9, 11
        falloffExponent: TOOL_CONFIG.BLOWER.falloffExponent,
        minPushDistance: TOOL_CONFIG.BLOWER.minPushDistance,
        tickInterval: TOOL_CONFIG.BLOWER.tickInterval,
    };
}
