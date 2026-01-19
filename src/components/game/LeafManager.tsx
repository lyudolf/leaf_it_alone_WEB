'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import { useGLTF } from '@react-three/drei';

const LEAF_COUNT = 5000;
const WORLD_SIZE = 80;

// Custom Physics Parameters
const GRAVITY = -9.8;
const FRICTION = 0.9; // Air resistance/ground friction (0.9 = stops quickly)
const GROUND_Y = 0.02;

interface LeafManagerProps {
    onLeafApiReady: (api: any, ref: React.RefObject<THREE.InstancedMesh>) => void;
}

export function LeafManager({ onLeafApiReady }: LeafManagerProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { scene: leafModel } = useGLTF('/models/leaf2.glb');
    const currentStage = useGameStore(s => s.currentStage);

    const geometry = useMemo<THREE.BufferGeometry | null>(() => {
        let foundGeom: THREE.BufferGeometry | null = null;
        leafModel.traverse((child) => {
            if (child instanceof THREE.Mesh && !foundGeom) {
                foundGeom = child.geometry.clone();
            }
        });

        if (foundGeom) {
            const g = foundGeom as THREE.BufferGeometry;
            g.scale(0.2, 0.2, 0.2);
            g.rotateX(Math.PI / 2);
        }
        return foundGeom;
    }, [leafModel]);

    // Physics State Arrays
    const positions = useMemo(() => new Float32Array(LEAF_COUNT * 3), []);
    const velocities = useMemo(() => new Float32Array(LEAF_COUNT * 3), []);
    const rotations = useMemo(() => new Float32Array(LEAF_COUNT * 3), []);

    // Helper to spawn a leaf at a specific range
    const spawnLeaf = (idx: number, minX: number, maxX: number) => {
        const dummy = new THREE.Object3D();
        const x = minX + Math.random() * (maxX - minX);
        const z = -13 + Math.random() * 26;
        const y = 5 + Math.random() * 10;

        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        rotations[idx * 3] = (Math.random() - 0.5) * 0.5;
        rotations[idx * 3 + 1] = Math.random() * Math.PI * 2;
        rotations[idx * 3 + 2] = (Math.random() - 0.5) * 0.5;

        dummy.position.set(x, y, z);
        dummy.rotation.set(rotations[idx * 3], rotations[idx * 3 + 1], rotations[idx * 3 + 2]);
        dummy.updateMatrix();
        meshRef.current?.setMatrixAt(idx, dummy.matrix);
    };

    // Initialize: Hide all leaves initially
    useEffect(() => {
        const dummy = new THREE.Object3D();
        dummy.position.set(0, -1000, 0);
        dummy.updateMatrix();

        for (let i = 0; i < LEAF_COUNT; i++) {
            positions[i * 3 + 1] = -1000;
            meshRef.current?.setMatrixAt(i, dummy.matrix);
        }

        // Spawn Stage 1 Leaves (0 - 1199)
        for (let i = 0; i < 1200; i++) {
            spawnLeaf(i, -18, 18);
        }

        if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
    }, []);

    // Stage 2 Expansion Spawn
    useEffect(() => {
        if (currentStage === 2) {
            console.log('[LeafManager] Spawning Stage 2 leaves...');
            // Spawn additional 3000 leaves (1200 - 4199) in the new area (X > 20)
            for (let i = 1200; i < 4200; i++) {
                spawnLeaf(i, 22, 58);
            }
            if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [currentStage]);

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

            // Fence Boundary Clamping (prevent leaves from escaping)
            // Stage 1: X[-19.5, 19.5]
            // Stage 2: X[20.2, 59.5] -> This keeps Stage 2 leaves in Area 2
            const FENCE_MIN_X = currentStage === 1 ? -19.5 : 20.2;
            const FENCE_MAX_X = currentStage === 1 ? 19.5 : 59.5;
            const FENCE_MIN_Z = -14.5;
            const FENCE_MAX_Z = 14.5;

            if (positions[idx] < FENCE_MIN_X) {
                positions[idx] = FENCE_MIN_X;
                velocities[idx] = 0;
            } else if (positions[idx] > FENCE_MAX_X) {
                positions[idx] = FENCE_MAX_X;
                velocities[idx] = 0;
            }

            if (positions[idx + 2] < FENCE_MIN_Z) {
                positions[idx + 2] = FENCE_MIN_Z;
                velocities[idx + 2] = 0;
            } else if (positions[idx + 2] > FENCE_MAX_Z) {
                positions[idx + 2] = FENCE_MAX_Z;
                velocities[idx + 2] = 0;
            }

            // House Boundary (prevent leaves from entering house)
            // House at [-15, 0, -10], scale 4, size ~8.8m x 8.8m (2.2 * 4)
            const HOUSE_MIN_X = -19.4;
            const HOUSE_MAX_X = -10.6;
            const HOUSE_MIN_Z = -14.4;
            const HOUSE_MAX_Z = -5.6;

            const isInHouse = positions[idx] >= HOUSE_MIN_X && positions[idx] <= HOUSE_MAX_X &&
                positions[idx + 2] >= HOUSE_MIN_Z && positions[idx + 2] <= HOUSE_MAX_Z;

            if (isInHouse) {
                // Push leaf out to nearest edge
                const distToLeft = Math.abs(positions[idx] - HOUSE_MIN_X);
                const distToRight = Math.abs(positions[idx] - HOUSE_MAX_X);
                const distToFront = Math.abs(positions[idx + 2] - HOUSE_MIN_Z);
                const distToBack = Math.abs(positions[idx + 2] - HOUSE_MAX_Z);

                const minDist = Math.min(distToLeft, distToRight, distToFront, distToBack);

                if (minDist === distToLeft) {
                    positions[idx] = HOUSE_MIN_X - 0.1;
                    velocities[idx] = 0;
                } else if (minDist === distToRight) {
                    positions[idx] = HOUSE_MAX_X + 0.1;
                    velocities[idx] = 0;
                } else if (minDist === distToFront) {
                    positions[idx + 2] = HOUSE_MIN_Z - 0.1;
                    velocities[idx + 2] = 0;
                } else {
                    positions[idx + 2] = HOUSE_MAX_Z + 0.1;
                    velocities[idx + 2] = 0;
                }
            }

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
            onLeafApiReady(customApi, meshRef as React.RefObject<THREE.InstancedMesh>);
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

    if (!geometry) return null;

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

// Preload the model
useGLTF.preload('/models/leaf2.glb');
