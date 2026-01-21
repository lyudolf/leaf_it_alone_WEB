export interface SceneConfig {
    name: string;
    goal: number;
    goalType?: 'LEAVES' | 'BAGS';
    groundSize: [number, number];
    trashBins: { position: [number, number, number]; scale?: number; rotation?: [number, number, number] }[];
    house?: { position: [number, number, number]; scale: number };
    trees: { position: [number, number, number]; scale: number }[];
    vents: { position: [number, number, number]; radius: number; strength: number }[];
    curbs?: { position: [number, number, number]; rotation: [number, number, number]; length: number }[];
    planters?: { position: [number, number, number]; rotation: [number, number, number] }[];
    drains?: { position: [number, number, number]; radius: number }[];
    moles?: { position: [number, number, number] }[];
}

export const SCENES: SceneConfig[] = [
    {
        name: "Stage 1: 평화로운 마당 (The Backyard)",
        goal: 500,
        goalType: 'LEAVES',
        groundSize: [30, 24],
        trashBins: [{ position: [12, 0, 9] }],
        house: { position: [-12, 0, -8], scale: 3.5 },
        trees: [
            { position: [5, 0, -6], scale: 1.0 },
            { position: [-5, 0, 8], scale: 1.2 },
            { position: [8, 0, 9], scale: 0.7 },
        ],
        vents: []
    },
    {
        name: "Stage 2: 확장된 정원 (Garden Extension)",
        goal: 1200,
        goalType: 'LEAVES',
        groundSize: [30, 24],
        trashBins: [{ position: [42, 0, 9] }],
        house: { position: [18, 0, -8], scale: 3.5 },
        trees: [
            { position: [25, 0, -7], scale: 1.5 },
            { position: [35, 0, 6], scale: 1.1 },
            { position: [42, 0, -4], scale: 1.4 },
        ],
        vents: [{ position: [30, 0, 0], radius: 3, strength: 15 }],
        planters: [{ position: [25, 0, -9], rotation: [0, 0, 0] }],

    },
    {
        name: "Stage 3: 공원의 시작 (Park Entrance)",
        goal: 2500,
        goalType: 'LEAVES',
        groundSize: [30, 24],
        trashBins: [{ position: [72, 0, 9] }],
        house: { position: [48, 0, -8], scale: 3.5 },
        trees: [
            { position: [60, 0, -4], scale: 1.8 },
            { position: [50, 0, 8], scale: 1.5 },  // Moved from [70,0,8] to avoid blocking trash bin
        ],
        vents: [{ position: [60, 0, 4], radius: 3, strength: 15 }]
    },
    {
        name: "Stage 4: 바람 부는 광장 (Windy Plaza)",
        goal: 2000,
        goalType: 'LEAVES', // Changed from BAGS to LEAVES
        groundSize: [30, 24],
        trashBins: [
            { position: [78, 0, 9] },   // Top Left (moved from bottom-left to avoid house)
            { position: [102, 0, 9] }   // Top Right
        ],
        house: { position: [78, 0, -8], scale: 3.5 },
        trees: [{ position: [90, 0, -11], scale: 2.2 }],  // Moved to back edge center
        vents: [{ position: [85, 0, -4], radius: 4, strength: 18 }],
        drains: [{ position: [103, 0, -10], radius: 1.0 }] // Bottom-right corner (away from bins/house)
    },
    {
        name: "Stage 5: 토네이도 경보 (Tornado Zone)",
        goal: 1800,
        goalType: 'LEAVES', // Changed from BAGS to LEAVES
        groundSize: [30, 24],
        trashBins: [
            { position: [108, 0, 9], scale: 0.5, rotation: [0, Math.PI, 0] }, // Top Left - Moved away from house
            { position: [132, 0, 9], scale: 0.5, rotation: [0, Math.PI, 0] }  // Top Right - Smaller & Rotated
        ],
        house: { position: [108, 0, -8], scale: 3.5 },
        trees: [], // No trees in Stage 5
        vents: [{ position: [115, 0, 0], radius: 5, strength: 20 }],
        drains: [{ position: [120, 0, 0], radius: 1.0 }] // Center of Stage 5
    }
];
