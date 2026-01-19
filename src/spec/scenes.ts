export interface SceneConfig {
    name: string;
    goal: number;
    goalType?: 'LEAVES' | 'BAGS';
    groundSize: [number, number];
    isExpansion?: boolean;
    house?: { position: [number, number, number]; scale: number };
    trees: { position: [number, number, number]; scale: number }[];
    vents: { position: [number, number, number]; radius: number; strength: number }[];
    curbs?: { position: [number, number, number]; rotation: [number, number, number]; args: [number, number, number] }[];
    planters?: { position: [number, number, number]; rotation: [number, number, number]; args: [number, number, number] }[];
    drains?: { position: [number, number, number] }[];
}

export const SCENES: SceneConfig[] = [
    {
        name: "집 뒤뜰 (The Backyard)",
        goal: 1200,
        goalType: 'LEAVES',
        groundSize: [80, 30],
        house: { position: [-15, 0, -10], scale: 4 },
        trees: [
            { position: [8, 0, -8], scale: 1.2 },
            { position: [10, 0, 5], scale: 1.0 },
            { position: [-8, 0, -5], scale: 1.1 },
            { position: [-10, 0, 10], scale: 0.9 },
        ],
        vents: []
    },
    {
        name: "확장된 가을 정원 (Autumn Expansion)",
        goal: 3,
        goalType: 'BAGS',
        groundSize: [80, 30],
        isExpansion: true,
        house: { position: [-15, 0, -10], scale: 4 },
        trees: [
            // Stage 1 trees (preserved)
            { position: [8, 0, -8], scale: 1.2 },
            { position: [10, 0, 5], scale: 1.0 },
            { position: [-8, 0, -5], scale: 1.1 },
            { position: [-10, 0, 10], scale: 0.9 },
            // Stage 2 new trees
            { position: [25, 0, -5], scale: 1.5 },
            { position: [35, 0, 8], scale: 1.4 },
            { position: [45, 0, -10], scale: 1.2 },
            { position: [55, 0, 5], scale: 1.3 },
        ],
        vents: [
            { position: [40, 0, 0], radius: 4, strength: 20 }
        ],
        curbs: [
            { position: [20, 0.05, 0], rotation: [0, 0, 0], args: [0.2, 0.1, 15] },
            { position: [40, 0.05, 0], rotation: [0, 0, 0], args: [0.2, 0.1, 15] },
        ],
        planters: [
            { position: [25, 0.225, 12], rotation: [0, 0, 0], args: [3.0, 0.45, 1.0] },
            { position: [55, 0.225, -12], rotation: [0, 0, 0], args: [2.0, 0.45, 2.0] },
        ],
        drains: [
            { position: [55, 0.01, 10] },
            { position: [35, 0.01, -12] }
        ]
    }
];
