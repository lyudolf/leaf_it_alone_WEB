'use client';

import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/game/store';
import * as THREE from 'three';

interface ThunderProps {
    leafApi: any;
}

export function Thunder({ leafApi }: ThunderProps) {
    const { scene } = useThree();
    const currentStage = useGameStore(s => s.currentStage);
    const [bolts, setBolts] = useState<{ id: number; pos: [number, number, number]; opacity: number }[]>([]);

    // Burst Logic
    useEffect(() => {
        if (currentStage !== 5) return;

        const explodeLeaves = (center: [number, number, number]) => {
            if (!leafApi) return;
            const { count, positions } = leafApi;
            const radius = 5; // Explosion radius
            const force = 30; // Explosion force

            const p = new THREE.Vector3();
            const c = new THREE.Vector3(center[0], center[1], center[2]);

            for (let i = 0; i < count; i++) {
                p.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                const dist = p.distanceTo(c);

                if (dist < radius) {
                    // Direction away from center + Up
                    const dir = p.clone().sub(c).normalize();
                    dir.y = 0.5 + Math.random(); // Always pop up
                    dir.normalize().multiplyScalar(force * (1 - dist / radius));

                    leafApi.applyImpulse(i, [dir.x, dir.y, dir.z]);
                }
            }
        };

        const strike = () => {
            // 1. Random Position in Stage 5 (X: 105~135, Z: -12~12)
            const x = 105 + Math.random() * 30;
            const z = -12 + Math.random() * 24;
            const pos: [number, number, number] = [x, 0, z];

            // 2. Visual Bolt
            const id = Date.now() + Math.random();
            setBolts(prev => [...prev, { id, pos, opacity: 1.0 }]);

            // Remove visual after short time
            setTimeout(() => {
                setBolts(prev => prev.filter(b => b.id !== id));
            }, 300); // 0.3s visual duration

            // 3. Leaf Physics Explosion
            explodeLeaves(pos);
        };

        let intervalId: NodeJS.Timeout;

        const triggerBurst = () => {
            // 5 Strikes, rapid succession
            [0, 200, 400, 600, 800].forEach((delay) => {
                setTimeout(() => {
                    strike();
                }, delay);
            });
        };

        // Interval: 10 seconds
        intervalId = setInterval(triggerBurst, 10000);

        // Initial delayed burst
        setTimeout(triggerBurst, 2000);

        return () => clearInterval(intervalId);
    }, [currentStage, leafApi]);

    // Only render in Stage 5
    if (currentStage !== 5) return null;

    return (
        <>
            {/* Render Bolts */}
            {bolts.map(bolt => (
                <group key={bolt.id} position={bolt.pos}>
                    {/* Main Bolt Cylinder */}
                    <mesh position={[0, 10, 0]}>
                        <cylinderGeometry args={[0.2, 0.2, 20, 8]} />
                        <meshBasicMaterial color="#aaddff" transparent opacity={bolt.opacity} />
                    </mesh>

                    {/* Impact Flash */}
                    <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[2, 16]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={bolt.opacity * 0.8} />
                    </mesh>

                    {/* Light Source for shadows/illumination */}
                    <pointLight position={[0, 5, 0]} intensity={20} distance={15} color="#aaddff" />
                </group>
            ))}

            {/* Global Flash if any bolt exists */}
            {bolts.length > 0 && (
                <directionalLight
                    position={[120, 50, 0]}
                    intensity={2}
                    color="#ffffff"
                />
            )}
        </>
    );
}
