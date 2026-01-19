'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMachine } from '@xstate/react';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { fogMachine } from '@/machines/fogMachine';
import { FogCloud } from '../objects/FogCloud';
import { SceneSpec } from '@/spec/SceneSpec';

interface ObjectStageProps {
    spec: SceneSpec;
    onStateUpdate?: (state: any) => void;
}

export function ObjectStage({ spec, onStateUpdate }: ObjectStageProps) {
    return (
        <div className="w-full h-full bg-slate-950 cursor-crosshair touch-none overflow-hidden relative">
            <Canvas shadows camera={{ position: [0, 0, 10], fov: 45 }}>
                <color attach="background" args={['#020617']} />
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <StageInternal spec={spec} onStateUpdate={onStateUpdate} />
            </Canvas>
        </div>
    );
}

function StageInternal({ spec, onStateUpdate }: ObjectStageProps) {
    const [state, send] = useMachine(fogMachine);
    const { gl, size } = useThree();
    const dragStart = useRef<[number, number] | null>(null);

    // Sync spec changes
    useEffect(() => {
        if (spec.intensity !== undefined) {
            send({ type: 'SET_INTENSITY', value: spec.intensity });
        }
        if (spec.neutralMode !== undefined && state.context.neutralMode !== spec.neutralMode) {
            send({ type: 'TOGGLE_NEUTRAL' });
        }
    }, [spec.intensity, spec.neutralMode, send]);

    // Handle panic / reset via external spec if needed? 
    // For now, let's assume the UI calls the machine directly or we sync here.

    useFrame((_, delta) => {
        send({ type: 'TICK', dt: delta });
        if (onStateUpdate) onStateUpdate(state);
    });

    const handlePointerDown = (e: THREE.Event & PointerEvent) => {
        dragStart.current = [e.clientX, e.clientY];
        send({ type: 'HOLD_START' });
    };

    const handlePointerUp = () => {
        dragStart.current = null;
        send({ type: 'HOLD_DONE' });
        // If not completed, machine might need to stay or reset. 
        // Our machine has 'always' transition for progress >= 1.
        // If we release early, we should probably send RESET or just wait.
        if (state.value === 'regulating' && state.context.holdProgress < 1) {
            send({ type: 'RESET' });
        }
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!dragStart.current) return;

        const dx = e.clientX - dragStart.current[0];
        const dy = e.clientY - dragStart.current[1];

        // Normalize to [-1..1] using 180px threshold
        const threshold = 180;
        const windX = Math.max(-1, Math.min(1, dx / threshold));
        const windY = Math.max(-1, Math.min(1, -dy / threshold)); // Invert Y for screen space

        send({ type: 'DRAG_WIND', x: windX, y: windY });
    };

    // Attach native move listener for window-wide drag tracking
    useEffect(() => {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [state.value, state.context.holdProgress]); // Re-bind if needed, but mostly static

    return (
        <group
            onPointerDown={handlePointerDown as any}
        >
            <FogCloud
                intensity={state.context.intensity}
                wind={state.context.wind}
                neutralMode={state.context.neutralMode}
                holdProgress={state.context.holdProgress}
                isReleasing={state.value === 'release'}
            />
        </group>
    );
}
