'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import { createLeafGeometry } from '@/utils/leafGeometry';

const LEAF_COUNT = 10000;
const WORLD_SIZE = 40;

// Custom Physics Parameters
const GRAVITY = -9.8;
const FRICTION = 0.9; // Air resistance/ground friction (0.9 = stops quickly)
const GROUND_Y = 0.02;

interface LeafManagerProps {
    onLeafApiReady: (api: any, ref: React.RefObject<THREE.InstancedMesh>) => void;
}

export function LeafManager({ onLeafApiReady }: LeafManagerProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const geometry = useMemo(() => {
        const geom = createLeafGeometry();
        geom.scale(0.15, 0.15, 0.15); // Keep small scale
        return geom;
    }, []);

    // Physics State Arrays (SoA - Structure of Arrays for performance)
    const positions = useMemo(() => new Float32Array(LEAF_COUNT * 3), []);
    const velocities = useMemo(() => new Float32Array(LEAF_COUNT * 3), []);
    const rotations = useMemo(() => new Float32Array(LEAF_COUNT * 3), []);

    // Initialize Leaves
    useEffect(() => {
        const dummy = new THREE.Object3D();

        for (let i = 0; i < LEAF_COUNT; i++) {
            // Random Position
            const x = (Math.random() - 0.5) * WORLD_SIZE;
            const y = 5 + Math.random() * 20; // Start high up
            const z = (Math.random() - 0.5) * WORLD_SIZE;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Random Rotation (Start mostly flat)
            rotations[i * 3] = (Math.random() - 0.5) * 0.5;      // Slight X tilt
            rotations[i * 3 + 1] = Math.random() * Math.PI * 2;  // Full Y spin
            rotations[i * 3 + 2] = (Math.random() - 0.5) * 0.5;  // Slight Z tilt

            // Update Mesh Matrix
            dummy.position.set(x, y, z);
            dummy.rotation.set(rotations[i * 3], rotations[i * 3 + 1], rotations[i * 3 + 2]);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current!.instanceMatrix.needsUpdate = true;
    }, []);

    // Custom "Fake" Physics Loop
    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const dummy = new THREE.Object3D();
        let needsUpdate = false;

        // Optimize: Small delta cap to prevent explosion on lag
        const dt = Math.min(delta, 0.05);

        for (let i = 0; i < LEAF_COUNT; i++) {
            const idx = i * 3;
            let vx = velocities[idx];
            let vy = velocities[idx + 1];
            let vz = velocities[idx + 2];

            // Skip if sleeping (very low velocity and on ground)
            if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01 && Math.abs(vz) < 0.01 && positions[idx + 1] <= GROUND_Y + 0.01) {
                continue;
            }

            // Apply Gravity
            if (positions[idx + 1] > GROUND_Y) {
                vy += GRAVITY * dt;
            }

            // Apply Velocity
            positions[idx] += vx * dt;
            positions[idx + 1] += vy * dt;
            positions[idx + 2] += vz * dt;

            // Ground Collision
            if (positions[idx + 1] <= GROUND_Y) {
                positions[idx + 1] = GROUND_Y;
                vy = 0;

                // Strong ground friction
                vx *= 0.8;
                vz *= 0.8;

                // Flatten rotation on ground
                // Smoothly interpolate towards flat orientation (X-axis 90 deg or 0 depending on geometry)
                // Our procedural geometry is rotated X 90, so local 0,0,0 is flat.
                // But let's just damping rotation to 0,0,0 (flat) when on ground
                rotations[idx] *= 0.9;     // Dampen X tilt
                rotations[idx + 2] *= 0.9; // Dampen Z tilt
                // Y rotation (spin) can stay
            } else {
                // Air resistance
                vx *= 0.98;
                vz *= 0.98;

                // Add some tumble in air
                rotations[idx] += vx * 0.1;
                rotations[idx + 2] += vz * 0.1;
            }

            // Store Updated Velocity
            velocities[idx] = vx;
            velocities[idx + 1] = vy;
            velocities[idx + 2] = vz;

            // Update Instance Matrix
            dummy.position.set(positions[idx], positions[idx + 1], positions[idx + 2]);
            dummy.rotation.set(rotations[idx], rotations[idx + 1], rotations[idx + 2]);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);

            needsUpdate = true;
        }

        if (needsUpdate) {
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    // Custom API for Tools to interact with raw data
    // This replaces the Cannon.js API
    const customApi = useMemo(() => ({
        count: LEAF_COUNT,
        positions: positions,
        velocities: velocities,
        // Helper to apply force to a specific leaf
        applyImpulse: (index: number, force: [number, number, number]) => {
            const idx = index * 3;
            velocities[idx] += force[0];
            velocities[idx + 1] += force[1];
            velocities[idx + 2] += force[2];
            // "Wake up" logic is implicit: if velocity > 0, the loop processes it
        },
        wakeUp: () => { } // No-op, handled by velocity check
    }), [positions, velocities]);

    // Expose API
    useEffect(() => {
        if (onLeafApiReady && meshRef.current) {
            onLeafApiReady(customApi, meshRef);
        }
    }, [customApi, onLeafApiReady]);

    const colors = useMemo(() => {
        const array = new Float32Array(LEAF_COUNT * 3);
        const color = new THREE.Color();
        for (let i = 0; i < LEAF_COUNT; i++) {
            const r = Math.random();
            if (r > 0.6) color.setHex(0xd4af37);
            else if (r > 0.3) color.setHex(0xc04000);
            else color.setHex(0x8b4513);
            color.toArray(array, i * 3);
        }
        return array;
    }, []);

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, undefined, LEAF_COUNT]}
            frustumCulled={false} // Prevent culling issues with custom moved instances
        >
            <primitive object={geometry} attach="geometry">
                <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
            </primitive>
            <meshStandardMaterial vertexColors roughness={1} />
        </instancedMesh>
    );
}
