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
    PERFORMANCE: {
        maxActiveLeaves: 300,  // Max leaves to apply physics to
        activationRadius: 25,  // Radius around player for active physics (units)
    }
} as const;

export type ToolType = 'HAND' | 'RAKE' | 'BLOWER';
