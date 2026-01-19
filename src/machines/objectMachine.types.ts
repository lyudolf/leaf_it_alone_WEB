export type ObjectState =
    | 'idle'
    | 'aroused'
    | 'regulating'
    | 'release'
    | 'rest';

export interface ObjectContext {
    intensity: number;
    wind: { x: number; y: number };
    holdProgress: number; // 0 to 1
    maxStimulus: number;
    neutralMode: boolean;
}

export type ObjectEvent =
    | { type: 'TICK'; dt: number }
    | { type: 'SET_INTENSITY'; value: number }
    | { type: 'DRAG_WIND'; x: number; y: number }
    | { type: 'HOLD_START' }
    | { type: 'HOLD_PROGRESS'; p: number }
    | { type: 'HOLD_DONE' }
    | { type: 'PANIC' }
    | { type: 'RESET' }
    | { type: 'TOGGLE_NEUTRAL' };
