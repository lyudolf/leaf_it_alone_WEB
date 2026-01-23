'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import { useGLTF } from '@react-three/drei';
import { ZONES } from '@/spec/zones';

import { SCENES } from '@/spec/scenes';

const LEAF_COUNT = 8000;
const WORLD_SIZE = 200;

// Custom Physics Parameters
const GRAVITY = -9.8;
const FRICTION = 0.9;
const GROUND_Y = 0.02;

interface LeafManagerProps {
    onLeafApiReady: (api: any, ref: React.RefObject<THREE.InstancedMesh>) => void;
}

export function LeafManager({ onLeafApiReady }: LeafManagerProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const customLeafModel = useGameStore(s => s.customLeafModel);
    const leafModelPath = customLeafModel || '/models/leaf2.glb';
    const { scene: leafModel } = useGLTF(leafModelPath);
    const currentStage = useGameStore(s => s.currentStage);

    // Wind state (Stage 4)
    const windVector = useRef(new THREE.Vector3(0, 0, 0));
    const nextWindChange = useRef(0);

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

    const isBlocked = (x: number, z: number, stageIdx: number) => {
        const scene = SCENES[stageIdx];
        if (!scene) return false;

        // House check - minimal exclusion zone (0.5m)
        if (scene.house) {
            const hPos = scene.house.position;
            const hScale = scene.house.scale;
            const halfSize = (2.2 * hScale) / 2 + 0.5;

            // Asymmetric blocking: Extend 2m behind (negative Z)
            const backBias = 2.0;
            const centerZ = hPos[2] - (backBias / 2);
            const halfZ = halfSize + (backBias / 2);

            if (Math.abs(x - hPos[0]) < halfSize && Math.abs(z - centerZ) < halfZ) return true;
        }

        // Tree check - minimal exclusion zone
        for (const tree of scene.trees) {
            const tPos = tree.position;
            const tScale = tree.scale;
            const distSq = (x - tPos[0]) ** 2 + (z - tPos[2]) ** 2;
            const radius = 0.8 * tScale; // Minimal exclusion
            if (distSq < radius * radius) return true;
        }

        return false;
    };

    // Helper to spawn a leaf at a specific range
    const spawnLeaf = (idx: number, minX: number, maxX: number, minZ: number, maxZ: number, isSkyDrop = false) => {
        const dummy = new THREE.Object3D();
        let x = 0, z = 0;
        let found = false;
        let attempts = 0;

        const stageIdx = currentStage - 1;

        while (!found && attempts < 10) {
            x = minX + Math.random() * (maxX - minX);
            z = minZ + Math.random() * (maxZ - minZ);
            if (!isBlocked(x, z, stageIdx)) {
                found = true;
            }
            attempts++;
        }

        const y = isSkyDrop ? (8 + Math.random() * 4) : GROUND_Y;

        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        velocities[idx * 3] = 0;
        velocities[idx * 3 + 1] = isSkyDrop ? -1 : 0;
        velocities[idx * 3 + 2] = 0;

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

        // Spawn leaves for current stage only (for testing)
        if (currentStage === 1) {
            const zone1 = ZONES.zone1;
            for (let i = 0; i < 500; i++) {
                spawnLeaf(i, zone1.minX + 2, zone1.maxX - 2, zone1.minZ + 2, zone1.maxZ - 2);
            }
        } else {
            // If starting at a later stage, spawn only that stage's leaves
            const zone = ZONES[`zone${currentStage}`];
            if (zone) {
                const config = [
                    { start: 0, end: 500 },    // S1
                    { start: 500, end: 1700 }, // S2
                    { start: 1700, end: 4200 },// S3
                    { start: 4200, end: 6200 },// S4
                    { start: 6200, end: 8000 },// S5
                ];
                const { start, end } = config[currentStage - 1];
                const margin = currentStage === 5 ? 0.5 : 2; // Smaller margin for stage 5 (closer to fences)
                for (let i = start; i < end; i++) {
                    spawnLeaf(i, zone.minX + margin, zone.maxX - margin, zone.minZ + margin, zone.maxZ - margin);
                }
            }
        }

        if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
    }, []);

    // Sky Drop logic for new stages
    useEffect(() => {
        if (currentStage > 1) {
            const zone = ZONES[`zone${currentStage}`];
            if (!zone) return;

            // Define spawn pool based on stage
            const config = [
                { start: 0, end: 500 },    // S1
                { start: 500, end: 1700 }, // S2 (+1200)
                { start: 1700, end: 4200 },// S3 (+2500)
                { start: 4200, end: 6200 },// S4 (+2000)
                { start: 6200, end: 8000 },// S5 (+1800)
            ];

            const { start, end } = config[currentStage - 1];

            // Sequential sky drops over 5 seconds
            let currentIdx = start;
            const dropInterval = setInterval(() => {
                const batchSize = Math.ceil((end - start) / 50); // ~50 batches over 5s
                for (let i = 0; i < batchSize && currentIdx < end; i++) {
                    spawnLeaf(currentIdx, zone.minX + 0.5, zone.maxX - 0.5, zone.minZ + 0.5, zone.maxZ - 0.5, true);
                    currentIdx++;
                }
                if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
                if (currentIdx >= end) clearInterval(dropInterval);
            }, 100);

            return () => clearInterval(dropInterval);
        }
    }, [currentStage]);

    // Custom "Fake" Physics Loop
    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const dummy = new THREE.Object3D();
        let needsUpdate = false;
        const dt = Math.min(delta, 0.05);
        const now = state.clock.elapsedTime;

        // Stage 4 Windy Weather
        if (currentStage === 4) {
            if (now > nextWindChange.current) {
                const angle = Math.random() * Math.PI * 2;
                const strength = 1.0 + Math.random() * 2.0;
                windVector.current.set(Math.cos(angle) * strength, 0, Math.sin(angle) * strength);
                nextWindChange.current = now + 20 + Math.random() * 10;
            }
        } else {
            windVector.current.set(0, 0, 0);
        }

        const currentZone = ZONES[`zone${currentStage}`] || ZONES.zone1;
        const frameIndex = Math.floor(now * 60); // approximate frame count (moved up for scope)

        for (let i = 0; i < LEAF_COUNT; i++) {
            const idx = i * 3;
            if (positions[idx + 1] < -100) continue; // Skip collected leaves

            let vx = velocities[idx];
            let vy = velocities[idx + 1];
            let vz = velocities[idx + 2];

            // SPEED OPTIMIZATION: Sleep Check
            // If leaf is on ground, not moving, and no wind -> Skip Physics
            const isGrounded = positions[idx + 1] <= GROUND_Y + 0.001;
            const speedSq = vx * vx + vy * vy + vz * vz;
            const isWindy = windVector.current.lengthSq() > 0.1; // Check if effective wind exists

            if (isGrounded && speedSq < 0.001 && !isWindy) {
                // Ensure completely stopped to prevent micro-drift
                if (speedSq > 0) {
                    velocities[idx] = 0;
                    velocities[idx + 1] = 0;
                    velocities[idx + 2] = 0;
                }
                continue; // SLEEP: Skip everything else
            }

            if (positions[idx + 1] > GROUND_Y) {
                vy += GRAVITY * dt;
                vx += windVector.current.x * dt * 0.5;
                vz += windVector.current.z * dt * 0.5;
            }

            positions[idx] += vx * dt;
            positions[idx + 1] += vy * dt;
            positions[idx + 2] += vz * dt;

            // Zone Containment (Respawn if out of bounds + 0.25 margin)
            // OPTIMIZATION: Check only once per 5 seconds (approx 300 frames) per leaf
            if (i % 300 === frameIndex % 300) {
                const MARGIN = 0.25;
                if (positions[idx] < currentZone.minX - MARGIN ||
                    positions[idx] > currentZone.maxX + MARGIN ||
                    positions[idx + 2] < currentZone.minZ - MARGIN ||
                    positions[idx + 2] > currentZone.maxZ + MARGIN) {

                    // Respawn from sky within zone
                    positions[idx] = currentZone.minX + Math.random() * (currentZone.maxX - currentZone.minX);
                    positions[idx + 2] = currentZone.minZ + Math.random() * (currentZone.maxZ - currentZone.minZ);
                    positions[idx + 1] = 8 + Math.random() * 4; // Sky height

                    velocities[idx] = 0;
                    velocities[idx + 1] = -1; // Initial drop speed
                    velocities[idx + 2] = 0;
                }
            }

            // --- OPTIMIZATION STARTS HERE ---
            // Only perform heavy collision checks (House/Tree) every 3rd frame per leaf
            // We use (i % 3) to distribute the load evenly across frames
            if (i % 3 === frameIndex % 3) {
                // House and Tree Collision Detection
                const scene = SCENES[currentStage - 1];
                if (scene) {
                    // House collision
                    if (scene.house) {
                        const hPos = scene.house.position;
                        const hScale = scene.house.scale;
                        const halfSize = (2.2 * hScale) / 2;

                        // Asymmetric blocking: Extend 2m behind (negative Z)
                        const backBias = 2.0;
                        const centerZ = hPos[2] - (backBias / 2);
                        const halfZ = halfSize + (backBias / 2);

                        // Check collision with biased box
                        if (Math.abs(positions[idx] - hPos[0]) < halfSize &&
                            Math.abs(positions[idx + 2] - centerZ) < halfZ &&
                            positions[idx + 1] < 20.0) { // Extended height blockage (20m) to prevent flying over house

                            // Push leaf out of house (using biased center)
                            const dx = positions[idx] - hPos[0];
                            const dz = positions[idx + 2] - centerZ;

                            if (Math.abs(dx) > Math.abs(dz)) { // Only if relatively closer to side
                                // Push to side
                                positions[idx] = hPos[0] + (dx > 0 ? halfSize : -halfSize);
                                velocities[idx] = 0;
                            } else {
                                // Push to front/back (using biased z-edges)
                                positions[idx + 2] = centerZ + (dz > 0 ? halfZ : -halfZ);
                                velocities[idx + 2] = 0;
                            }
                        }
                    }

                    // Tree collision
                    for (const tree of scene.trees) {
                        const tPos = tree.position;
                        const tScale = tree.scale;
                        const dx = positions[idx] - tPos[0];
                        const dz = positions[idx + 2] - tPos[2];
                        const distSq = dx * dx + dz * dz;
                        const radius = 0.4 * tScale; // Trunk radius

                        if (distSq < radius * radius && positions[idx + 1] < 4 * tScale) {
                            // Push leaf out of tree trunk
                            const dist = Math.sqrt(distSq);
                            if (dist > 0.01) {
                                const pushX = (dx / dist) * radius;
                                const pushZ = (dz / dist) * radius;
                                positions[idx] = tPos[0] + pushX;
                                positions[idx + 2] = tPos[2] + pushZ;
                                // Damping instead of hard stop (better for staggered checks)
                                velocities[idx] *= 0.5;
                                velocities[idx + 2] *= 0.5;
                            }
                        }
                    }
                }
            } // End of staggered check

            // Ground Collision
            if (positions[idx + 1] <= GROUND_Y) {
                positions[idx + 1] = GROUND_Y;
                vy = 0;
                vx *= 0.8;
                vz *= 0.8;
                rotations[idx] *= 0.9;
                rotations[idx + 2] *= 0.9;

                // Snap to zero if very slow (enables sleep next frame)
                if (Math.abs(vx) < 0.05) vx = 0;
                if (Math.abs(vz) < 0.05) vz = 0;
            } else {
                vx *= 0.99;
                vz *= 0.99;
                rotations[idx] += vx * 0.1;
                rotations[idx + 2] += vz * 0.1;
            }

            velocities[idx] = vx;
            velocities[idx + 1] = vy;
            velocities[idx + 2] = vz;

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

    const customApi = useMemo(() => ({
        count: LEAF_COUNT,
        positions: positions,
        velocities: velocities,
        applyImpulse: (index: number, force: [number, number, number]) => {
            const idx = index * 3;
            velocities[idx] += force[0];
            velocities[idx + 1] += force[1];
            velocities[idx + 2] += force[2];
        },
        wakeUp: () => { }
    }), [positions, velocities]);

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
            frustumCulled={false}
        >
            <primitive object={geometry} attach="geometry">
                <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
            </primitive>
            <meshStandardMaterial vertexColors roughness={1} />
        </instancedMesh>
    );
}

useGLTF.preload('/models/leaf2.glb');
