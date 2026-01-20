export interface ZoneAABB {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
}

export const ZONES: Record<string, ZoneAABB> = {
    zone1: { minX: -15, maxX: 15, minZ: -12, maxZ: 12 },
    zone2: { minX: 15, maxX: 45, minZ: -12, maxZ: 12 },
    zone3: { minX: 45, maxX: 75, minZ: -12, maxZ: 12 },
    zone4: { minX: 75, maxX: 105, minZ: -12, maxZ: 12 },
    zone5: { minX: 105, maxX: 135, minZ: -12, maxZ: 12 },
};
