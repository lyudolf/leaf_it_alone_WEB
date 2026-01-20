'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from './store';

interface StageGateProps {
    targetStage: number; // The stage this gate unlocks (e.g., 2)
    position: [number, number, number];
}

export function StageGate({ targetStage, position }: StageGateProps) {
    const { camera } = useThree();
    const currentStage = useGameStore(s => s.currentStage);
    const stageCleared = useGameStore(s => s.stageCleared);
    const nextStage = useGameStore(s => s.nextStage);
    const setInteractionPrompt = useGameStore(s => s.setInteractionPrompt);

    const [isPromptActive, setIsPromptActive] = useState(false);
    const isUnlocked = currentStage >= targetStage;
    const isNearby = useRef(false);

    // This gate is only interactive if we are in the stage immediately preceding targetStage
    const isInteractive = currentStage === targetStage - 1;

    useEffect(() => {
        if (!isInteractive || isUnlocked) {
            setInteractionPrompt(null);
            setIsPromptActive(false);
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyE' && isNearby.current && stageCleared) {
                // Trigger loading screen
                useGameStore.getState().setStageLoading(true);

                // Wait for loading screen to appear (100ms)
                setTimeout(() => {
                    nextStage();
                    setInteractionPrompt(null);
                }, 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isInteractive, isUnlocked, stageCleared, nextStage, setInteractionPrompt]);

    useFrame(() => {
        if (!isInteractive || isUnlocked) return;

        const dist = camera.position.distanceTo(new THREE.Vector3(...position));
        const nearby = dist < 4;
        isNearby.current = nearby;

        if (nearby) {
            if (stageCleared) {
                setInteractionPrompt(`${targetStage}단계를 해금하려면 E키를 누르세요`);
            } else {
                const goal = useGameStore.getState().totalLeavesInStage;
                const current = useGameStore.getState().totalCollected;
                setInteractionPrompt(`다음 단계로 가려면 낙엽을 더 모으세요 (${current}/${goal})`);
            }
            setIsPromptActive(true);
        } else if (isPromptActive) {
            setInteractionPrompt(null);
            setIsPromptActive(false);
        }
    });

    if (isUnlocked) return null;

    return (
        <group position={position}>
            {/* Visual Gate / Barrier */}
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[0.2, 3, 5]} />
                <meshStandardMaterial
                    color={stageCleared ? "#4ade80" : "#ef4444"}
                    transparent
                    opacity={0.6}
                />
            </mesh>

            {/* Glow effect if ready */}
            {stageCleared && (
                <pointLight position={[0, 2, 0]} intensity={2} color="#4ade80" distance={5} />
            )}
        </group>
    );
}
