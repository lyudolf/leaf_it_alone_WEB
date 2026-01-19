/**
 * FENCE ENCLOSURE SPECIFICATION
 * 
 * Requirements:
 * - Fence module length: 1m (measured from fence.glb model)
 * - Yard boundary: X[-20, 20], Z[-15, 15] = 40m × 30m rectangle
 * - Grid-aligned placement: all fences placed at 1m intervals
 * - Zero overlap, zero gaps
 * 
 * Layout:
 * - North wall (Z=15): 40 modules from X=-20 to X=20
 * - South wall (Z=-15): 40 modules from X=-20 to X=20
 * - West wall (X=-20): 29 modules from Z=-14 to Z=14 (corners excluded)
 * - East wall (X=20): 29 modules from Z=-14 to Z=14 (corners excluded)
 * 
 * Total: 138 fence modules
 */

'use client';

import { useGLTF } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import { useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';

const FENCE_MODULE_LENGTH = 1; // meters (actual fence.glb unit length)

interface FenceModuleProps {
    position: [number, number, number];
    rotation: number; // Y-axis rotation in radians
}

function FenceModule({ position, rotation }: FenceModuleProps) {
    const { scene } = useGLTF('/models/fence.glb');
    const clonedScene = scene.clone();

    // Enable shadows and smooth shading
    useEffect(() => {
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.geometry) {
                    child.geometry.computeVertexNormals();
                }
            }
        });
    }, [clonedScene]);

    // Collision box for this fence module
    // NOTE: Offset collision box slightly backward (toward outside) to match fence model pivot
    const collisionOffset = 0.3; // meters, adjust based on fence.glb pivot point
    const offsetX = Math.sin(rotation) * collisionOffset;
    const offsetZ = Math.cos(rotation) * collisionOffset;
    // Fence height: Increased to 4.0 to prevent bags from flying over
    const FENCE_HEIGHT = 4.0;

    const [ref] = useBox(() => ({
        type: 'Static',
        position: [position[0] + offsetX, position[1] + FENCE_HEIGHT / 2, position[2] + offsetZ],
        args: [FENCE_MODULE_LENGTH, FENCE_HEIGHT, 0.15], // Reduced depth from 0.2 to 0.15
        rotation: [0, rotation, 0],
    }));

    return (
        <group>
            <primitive
                object={clonedScene}
                position={position}
                rotation={[0, rotation, 0]}
                scale={[1, 2, 1]}
            />
            {/* Collision box - set visible={true} to debug alignment */}
            <mesh ref={ref as any} visible={false}>
                <boxGeometry args={[FENCE_MODULE_LENGTH, FENCE_HEIGHT, 0.15]} />
                <meshBasicMaterial color="red" opacity={0.3} transparent wireframe />
            </mesh>
        </group>
    );
}

export function FenceEnclosure() {
    const currentStage = useGameStore(s => s.currentStage);
    const fences: FenceModuleProps[] = [];

    // Permanent Global Dimensions
    const minX = -20;
    const maxX = 60;
    const minZ = -15;
    const maxZ = 15;

    const width = maxX - minX;
    const depth = maxZ - minZ;

    // 1. NORTH WALL (Z = 15)
    for (let i = 0; i < width; i++) {
        fences.push({
            position: [minX + i * FENCE_MODULE_LENGTH + FENCE_MODULE_LENGTH / 2, 0, maxZ],
            rotation: Math.PI,
        });
    }

    // 2. SOUTH WALL (Z = -15)
    for (let i = 0; i < width; i++) {
        fences.push({
            position: [minX + i * FENCE_MODULE_LENGTH + FENCE_MODULE_LENGTH / 2, 0, minZ],
            rotation: 0,
        });
    }

    // 3. WEST WALL (X = -20)
    for (let i = 1; i < depth; i++) {
        fences.push({
            position: [minX, 0, minZ + i * FENCE_MODULE_LENGTH],
            rotation: -Math.PI / 2,
        });
    }

    // 4. EAST WALL (X = 60)
    for (let i = 1; i < depth; i++) {
        fences.push({
            position: [maxX, 0, minZ + i * FENCE_MODULE_LENGTH],
            rotation: Math.PI / 2,
        });
    }

    // 5. INNER BARRIER (X = 20) - The "Gate"
    for (let i = 1; i < depth; i++) {
        const z = minZ + i * FENCE_MODULE_LENGTH;

        // Gate logic: in Stage 2, leave an opening in the middle (e.g., 4m wide)
        const isCenter = z > -2.5 && z < 2.5;
        if (currentStage === 2 && isCenter) continue;

        fences.push({
            position: [20, 0, z],
            rotation: Math.PI / 2, // Facing west
        });
    }

    return (
        <group>
            {fences.map((fence, i) => (
                <FenceModule key={`${currentStage}-${i}`} position={fence.position} rotation={fence.rotation} />
            ))}
        </group>
    );
}

// Preload
useGLTF.preload('/models/fence.glb');
