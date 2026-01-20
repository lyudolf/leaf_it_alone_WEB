'use client';

import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/game/store';
import { useRef } from 'react';
import * as THREE from 'three';

interface DrainProps {
    position: [number, number, number];
    radius?: number;
    leafApi?: any;
    leafRef?: React.RefObject<THREE.InstancedMesh> | null;
}

export function Drain({ position, radius = 0.75, leafApi, leafRef }: DrainProps) {
    const addLeaf = useGameStore(s => s.addLeaf);
    const moneyMultiplier = useGameStore(s => s.moneyMultiplier);
    const lastCollectTime = useRef(0);
    const dummy = useRef(new THREE.Object3D());

    // Collect leaves within radius every frame
    useFrame((state) => {
        if (!leafApi || !leafApi.positions || !leafRef?.current) return;

        const now = state.clock.elapsedTime;
        // Throttle to collect every 0.1 seconds
        if (now - lastCollectTime.current < 0.1) return;
        lastCollectTime.current = now;

        const { positions, count } = leafApi;
        const radiusSq = radius * radius;
        let collected = 0;
        const collectedIndices: number[] = [];

        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const ly = positions[idx + 1];

            // Skip already collected leaves
            if (ly < -100) continue;

            const lx = positions[idx];
            const lz = positions[idx + 2];

            // Check if leaf is within drain radius and on ground
            const dx = lx - position[0];
            const dz = lz - position[2];
            const distSq = dx * dx + dz * dz;

            if (distSq < radiusSq && ly < 0.5) {
                // Remove leaf logic (move underground)
                positions[idx + 1] = -1000;
                collectedIndices.push(i);
                collected++;
            }
        }

        if (collected > 0) {
            // Direct visual update: Hide collected leaves immediately
            dummy.current.position.set(0, -1000, 0);
            dummy.current.scale.set(0, 0, 0); // Also scale to 0 to be sure
            dummy.current.updateMatrix();

            for (const index of collectedIndices) {
                leafRef.current.setMatrixAt(index, dummy.current.matrix);
            }
            leafRef.current.instanceMatrix.needsUpdate = true;

            // Add to collection count
            addLeaf(collected);

            // Convert to money (1 leaf = 1 coin * multiplier)
            const earnedMoney = Math.floor(collected * moneyMultiplier);
            useGameStore.setState((state) => ({ money: state.money + earnedMoney }));
        }
    });

    return (
        <group position={position}>
            {/* Visual: Circular Grill */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[radius, 32]} />
                <meshStandardMaterial color="#333333" roughness={0.5} />
            </mesh>

            {/* Inner Grill Lines */}
            {[...Array(8)].map((_, i) => (
                <mesh key={i} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, (i / 8) * Math.PI]}>
                    <planeGeometry args={[1.4, 0.05]} />
                    <meshStandardMaterial color="#111111" />
                </mesh>
            ))}

            {/* Glowing Indicator Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[radius * 0.9, radius, 32]} />
                <meshStandardMaterial
                    color="#44ff88"
                    emissive="#44ff88"
                    emissiveIntensity={2}
                    transparent
                    opacity={0.5}
                />
            </mesh>
        </group>
    );
}
