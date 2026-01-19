export interface ObjectConfig {
    id: string;
    label: string;
    triggers: string[];
    behaviors: string[];
    success_criteria: string[];
    params: Record<string, any>;
    safety_overrides?: Record<string, any>;
}

export const objectPack: ObjectConfig[] = [
    {
        id: 'FOG',
        label: 'Fog',
        triggers: ['HOLD', 'DRAG'],
        behaviors: ['arousal_increase', 'wind_flow'],
        success_criteria: ['hold_1200ms'],
        params: {
            holdMs: 1200,
            arousalRate: 0.05,
            releaseDrop: 0.35,
            pullMax: 0.8,
            wobbleMax: 0.5,
            opacityRange: [0.1, 0.6],
            windStrength: 2.5
        }
    },
    {
        id: 'RING',
        label: 'Ring',
        triggers: ['EXPAND', 'CONTRACT'],
        behaviors: ['pulse'],
        success_criteria: ['resonance'],
        params: {}
    },
    { id: 'DOOR', label: 'Door', triggers: [], behaviors: [], success_criteria: [], params: {} },
    { id: 'MIRROR', label: 'Mirror', triggers: [], behaviors: [], success_criteria: [], params: {} },
    { id: 'THREAD', label: 'Thread', triggers: [], behaviors: [], success_criteria: [], params: {} },
    { id: 'SHADOW', label: 'Shadow', triggers: [], behaviors: [], success_criteria: [], params: {} },
    { id: 'CAGE', label: 'Cage', triggers: [], behaviors: [], success_criteria: [], params: {} },
    { id: 'LANTERN', label: 'Lantern (Anchor)', triggers: [], behaviors: [], success_criteria: [], params: {} },
];
