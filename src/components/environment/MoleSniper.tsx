'use client';

/**
 * MoleSniper.tsx
 * Stage 5 AI-powered mole that uses ONNX model to predict optimal scatter locations.
 * Fires every 10 seconds, targeting player's forward cone within distance constraints.
 */

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import {
    loadModel,
    isModelLoaded,
    predict,
    buildDensityMap,
    cellToWorld,
    BOUNDS_X,
    BOUNDS_Z,
    GRID_COLS,
    GRID_ROWS
} from '@/game/MoleSniperBrain';

interface MoleSniperProps {
    leafApi: {
        count: number;
        positions: Float32Array;
        applyImpulse?: (index: number, impulse: [number, number, number]) => void;
    };
}

const COOLDOWN_MS = 10000; // 10 seconds
const SCATTER_RADIUS = 2.2; // meters
const SCATTER_FORCE = 25;
const DENSITY_UPDATE_INTERVAL = 300; // ms (~3Hz)

export function MoleSniper({ leafApi }: MoleSniperProps) {
    const { camera } = useThree();
    const currentStage = useGameStore(s => s.currentStage);

    const [modelLoaded, setModelLoaded] = useState(false);
    const [lastTarget, setLastTarget] = useState<[number, number] | null>(null);
    const [nextFireIn, setNextFireIn] = useState(COOLDOWN_MS);

    const densityMapRef = useRef<Float32Array>(new Float32Array(GRID_COLS * GRID_ROWS));
    const lastDensityUpdate = useRef(0);
    const lastFireTime = useRef(Date.now() + 2000); // Initial delay
    const visualEffectRef = useRef<{ pos: [number, number, number]; time: number } | null>(null);

    // Only active in Stage 5
    if (currentStage !== 5) return null;

    // Load ONNX model on mount
    useEffect(() => {
        loadModel().then(success => {
            setModelLoaded(success);
        });
    }, []);

    // Main update loop
    useFrame((state, delta) => {
        const now = Date.now();

        // Update density map at low frequency
        if (now - lastDensityUpdate.current > DENSITY_UPDATE_INTERVAL) {
            densityMapRef.current = buildDensityMap(leafApi.positions, leafApi.count);
            lastDensityUpdate.current = now;
        }

        // Update countdown
        const timeUntilFire = Math.max(0, COOLDOWN_MS - (now - lastFireTime.current));
        setNextFireIn(timeUntilFire);

        // Fire check
        if (now - lastFireTime.current >= COOLDOWN_MS) {
            fire();
            lastFireTime.current = now;
        }

        // Decay visual effect
        if (visualEffectRef.current && now - visualEffectRef.current.time > 500) {
            visualEffectRef.current = null;
        }
    });

    const fire = async () => {
        // Get player position and direction
        const playerPos: [number, number] = [camera.position.x, camera.position.z];

        // Get forward direction from camera
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        const playerDir: [number, number] = [forward.x, forward.z];

        // Normalize direction
        const len = Math.sqrt(playerDir[0] ** 2 + playerDir[1] ** 2);
        if (len > 0.01) {
            playerDir[0] /= len;
            playerDir[1] /= len;
        }

        // Predict target
        const result = await predict(densityMapRef.current, playerPos, playerDir);
        const [targetX, targetZ] = result.worldPos;

        console.log(`[MoleSniper] Fire! Target: (${targetX.toFixed(1)}, ${targetZ.toFixed(1)}) | ONNX: ${result.usedONNX}`);

        // Apply scatter effect
        scatterLeaves(targetX, targetZ);

        // Update state for UI/debug
        setLastTarget([targetX, targetZ]);
        visualEffectRef.current = { pos: [targetX, 0.1, targetZ], time: Date.now() };
    };

    const scatterLeaves = (centerX: number, centerZ: number) => {
        if (!leafApi.applyImpulse) {
            // Fallback: direct coordinate manipulation
            scatterLeavesDirect(centerX, centerZ);
            return;
        }

        const center = new THREE.Vector3(centerX, 0, centerZ);

        for (let i = 0; i < leafApi.count; i++) {
            const x = leafApi.positions[i * 3];
            const y = leafApi.positions[i * 3 + 1];
            const z = leafApi.positions[i * 3 + 2];

            // Skip collected
            if (y < -100) continue;

            const leafPos = new THREE.Vector3(x, y, z);
            const dist = leafPos.distanceTo(center);

            if (dist < SCATTER_RADIUS) {
                // Direction away from center + up
                const dir = leafPos.clone().sub(center).normalize();
                dir.y = 0.8 + Math.random() * 0.4;
                dir.normalize();

                const force = SCATTER_FORCE * (1 - dist / SCATTER_RADIUS);
                leafApi.applyImpulse(i, [dir.x * force, dir.y * force, dir.z * force]);
            }
        }
    };

    const scatterLeavesDirect = (centerX: number, centerZ: number) => {
        // Direct coordinate displacement (fallback if no physics API)
        for (let i = 0; i < leafApi.count; i++) {
            const x = leafApi.positions[i * 3];
            const y = leafApi.positions[i * 3 + 1];
            const z = leafApi.positions[i * 3 + 2];

            if (y < -100) continue;

            const dx = x - centerX;
            const dz = z - centerZ;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < SCATTER_RADIUS && dist > 0.1) {
                const force = SCATTER_FORCE * 0.3 * (1 - dist / SCATTER_RADIUS);
                const dirX = dx / dist;
                const dirZ = dz / dist;

                leafApi.positions[i * 3] += dirX * force * 0.5;
                leafApi.positions[i * 3 + 1] += 2 + Math.random() * 3;
                leafApi.positions[i * 3 + 2] += dirZ * force * 0.5;
            }
        }
    };

    return (
        <>
            {/* Visual effect at target location */}
            {visualEffectRef.current && (
                <group position={visualEffectRef.current.pos}>
                    {/* Ground burst circle */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.5, SCATTER_RADIUS, 16]} />
                        <meshBasicMaterial color="#ff6600" transparent opacity={0.6} side={THREE.DoubleSide} />
                    </mesh>

                    {/* Center glow */}
                    <mesh>
                        <sphereGeometry args={[0.3, 8, 8]} />
                        <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
                    </mesh>

                    {/* Light */}
                    <pointLight color="#ff6600" intensity={5} distance={5} />
                </group>
            )}

            {/* Debug: Show model status (hidden in production) */}
            {/* Uncomment for debugging:
            <Html position={[120, 5, 0]}>
                <div style={{ background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px', fontSize: '12px' }}>
                    Model: {modelLoaded ? 'ONNX' : 'Fallback'}<br/>
                    Next Fire: {(nextFireIn / 1000).toFixed(1)}s<br/>
                    Last Target: {lastTarget ? `(${lastTarget[0].toFixed(0)}, ${lastTarget[1].toFixed(0)})` : 'None'}
                </div>
            </Html>
            */}
        </>
    );
}
