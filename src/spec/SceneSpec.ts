export interface SceneSpec {
    activeObjectId: string;
    intensity: number; // 0.0 to 0.7 (clamped by maxStimulus)
    neutralMode: boolean;
    safety: {
        maxStimulus: number; // typically 0.7
        panicNeutralizeMs: number; // frame-level neutralized
    };
}

export const defaultSceneSpec: SceneSpec = {
    activeObjectId: 'FOG',
    intensity: 0.2,
    neutralMode: true,
    safety: {
        maxStimulus: 0.7,
        panicNeutralizeMs: 16, // approx 1 frame at 60fps
    },
};
