import { createMachine, assign } from 'xstate';
import { ObjectContext, ObjectEvent } from './objectMachine.types';

export const fogMachine = createMachine({
    id: 'fogMachine',
    initial: 'idle',
    context: {
        intensity: 0.2,
        wind: { x: 0, y: 0 },
        holdProgress: 0,
        maxStimulus: 0.7,
        neutralMode: true,
    } as ObjectContext,
    states: {
        idle: {
            on: {
                TICK: {
                    target: 'aroused',
                },
                HOLD_START: 'regulating',
                SET_INTENSITY: {
                    actions: assign({
                        intensity: ({ event }) => Math.min(event.value, 0.7)
                    })
                }
            }
        },
        aroused: {
            on: {
                TICK: {
                    actions: assign({
                        intensity: ({ context, event }) => {
                            const rate = 0.05; // intensity per second
                            return Math.min(context.intensity + rate * event.dt, context.maxStimulus);
                        }
                    })
                },
                HOLD_START: 'regulating',
                SET_INTENSITY: {
                    actions: assign({
                        intensity: ({ event }) => Math.min(event.value, 0.7)
                    })
                }
            }
        },
        regulating: {
            on: {
                TICK: {
                    actions: assign({
                        holdProgress: ({ context, event }) => {
                            const holdMs = 1200;
                            const progressInc = (event.dt * 1000) / holdMs;
                            return Math.min(context.holdProgress + progressInc, 1);
                        }
                    })
                },
                HOLD_DONE: 'release',
                HOLD_START: undefined, // stay in regulating
                RESET: 'idle'
            },
            always: [
                {
                    target: 'release',
                    guard: ({ context }) => context.holdProgress >= 1
                }
            ]
        },
        release: {
            entry: assign({
                intensity: ({ context }) => context.intensity * 0.35,
                holdProgress: 0
            }),
            after: {
                800: 'rest'
            }
        },
        rest: {
            after: {
                2000: 'idle'
            }
        }
    },
    on: {
        PANIC: {
            target: '.idle',
            actions: assign({
                intensity: 0,
                wind: { x: 0, y: 0 },
                holdProgress: 0
            })
        },
        RESET: {
            target: '.idle',
            actions: assign({
                intensity: 0.2,
                wind: { x: 0, y: 0 },
                holdProgress: 0
            })
        },
        DRAG_WIND: {
            actions: assign({
                wind: ({ event }) => ({ x: event.x, y: event.y })
            })
        },
        TOGGLE_NEUTRAL: {
            actions: assign({
                neutralMode: ({ context }) => !context.neutralMode
            })
        }
    }
});
