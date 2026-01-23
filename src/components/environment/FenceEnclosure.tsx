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
import { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';

function CeilingLid({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        args,
        visible: false // Invisible physics body
    }));

    return (
        <mesh ref={ref as any} visible={false}>
            <boxGeometry args={args} />
            <meshBasicMaterial color="red" wireframe opacity={0.5} transparent />
        </mesh>
    );
}

const FENCE_MODULE_LENGTH = 2; // meters (actual fence.glb unit length)
const FENCE_OVERLAP = 0.4;
const PLACEMENT_STEP = FENCE_MODULE_LENGTH - FENCE_OVERLAP; // 1.6m

interface FenceModuleProps {
    position: [number, number, number];
    rotation: number; // Y-axis rotation in radians
    // extraHeight removed - purely internal now
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
    const collisionOffset = 0.3;
    const offsetX = Math.sin(rotation) * collisionOffset;
    const offsetZ = Math.cos(rotation) * collisionOffset;

    // Hardcoded Physics Height for invisible wall
    // Visuals will be normal (~4m), Physics will be 24m
    const PHYSICS_HEIGHT = 24.0;

    const [ref] = useBox(() => ({
        type: 'Static',
        // Center of physics box (half up from 0)
        // Note: useBox position is center of mass.
        // We want bottom to be at position.y (0).
        // So center y = position.y + PHYSICS_HEIGHT / 2.
        position: [position[0] + offsetX, position[1] + PHYSICS_HEIGHT / 2, position[2] + offsetZ],
        // Thickness 2.0 to block objects
        args: [FENCE_MODULE_LENGTH, PHYSICS_HEIGHT, 0.2],
        rotation: [0, rotation, 0],
    }));

    return (
        <group>
            <primitive
                object={clonedScene}
                position={position}
                rotation={[0, rotation, 0]}
                // Visual Scale fixed to standard height
                scale={[1, 2, 1]}
            />
            {/* Debug Collision box */}
            <mesh ref={ref as any} visible={false}>
                <boxGeometry args={[FENCE_MODULE_LENGTH, PHYSICS_HEIGHT, 0.2]} />
                <meshBasicMaterial color="red" opacity={0.3} transparent wireframe />
            </mesh>
        </group>
    );
}

interface DynamicGateProps {
    x: number;
    stage: number;
    rotation: number;
    minZ: number;
    maxZ: number;
    FENCE_MODULE_LENGTH: number;
    PLACEMENT_STEP: number;
}

function DynamicGate({ x, stage, rotation, minZ, maxZ, FENCE_MODULE_LENGTH, PLACEMENT_STEP }: DynamicGateProps) {
    const currentStage = useGameStore(s => s.currentStage);
    const [isClosed, setIsClosed] = useState(true);
    const wasInside = useRef(false);

    useFrame((state) => {
        const playerX = state.camera.position.x;
        if (currentStage < stage) {
            if (!isClosed) setIsClosed(true);
            return;
        }
        if (currentStage > stage) {
            if (!isClosed) setIsClosed(true);
            return;
        }
        const threshold = x + 5;
        const isInside = playerX > threshold;
        if (isInside) {
            if (!isClosed) setIsClosed(true);
            wasInside.current = true;
        } else {
            if (wasInside.current) {
                if (!isClosed) setIsClosed(true);
            } else {
                if (isClosed) setIsClosed(false);
            }
        }
    });

    if (!isClosed) return null;

    const fences = [];
    for (let z = minZ; z <= maxZ + 0.1; z += PLACEMENT_STEP) { // Fix: Fill gaps
        const isCenter = z > -2.5 && z < 2.5;
        if (isCenter) {
            fences.push(
                <FenceModule key={`gate-${stage}-${z}`} position={[x, 0, z]} rotation={rotation} />
            );
        }
    }

    return <group>{fences}</group>;
}

export function FenceEnclosure() {
    const currentStage = useGameStore(s => s.currentStage);
    const fences: React.ReactNode[] = [];

    const minX = -15;
    const maxX = 135;
    const minZ = -12;
    const maxZ = 12;

    // 1. NORTH WALL (Z = 12)
    for (let x = minX; x < maxX; x += PLACEMENT_STEP) {
        fences.push(<FenceModule key={`N-${x}`} position={[x + FENCE_MODULE_LENGTH / 2, 0, maxZ]} rotation={Math.PI} />);
    }

    // 2. SOUTH WALL (Z = -12)
    for (let x = minX; x < maxX; x += PLACEMENT_STEP) {
        fences.push(<FenceModule key={`S-${x}`} position={[x + FENCE_MODULE_LENGTH / 2, 0, minZ]} rotation={0} />);
    }

    // 3. WEST WALL (X = -15) - Start
    for (let z = minZ; z <= maxZ + 0.1; z += PLACEMENT_STEP) { // +0.1 for float tolerance
        fences.push(<FenceModule key={`W-${z}`} position={[minX, 0, z]} rotation={-Math.PI / 2} />);
    }

    // 4. EAST WALL (X = 135) - End (Stage 5 End)
    for (let z = minZ; z <= maxZ + 0.1; z += PLACEMENT_STEP) {
        fences.push(<FenceModule key={`E-${z}`} position={[maxX, 0, z]} rotation={Math.PI / 2} />);
    }

    // 5. INNER BARRIERS (Gates)
    const gatePositions = [
        { x: 15, stage: 2 },
        { x: 45, stage: 3 },
        { x: 75, stage: 4 },
        { x: 105, stage: 5 }
    ];

    return (
        <group>
            {fences}
            {/* Divider Walls (Non-Gate parts) */}
            {gatePositions.map(gate => {
                const wallParts = [];

                for (let z = minZ; z <= maxZ + 0.1; z += PLACEMENT_STEP) { // Fix: Fill gaps
                    const isCenter = z > -2.5 && z < 2.5;
                    if (!isCenter) {
                        wallParts.push(<FenceModule key={`div-${gate.x}-${z}`} position={[gate.x, 0, z]} rotation={Math.PI / 2} />);
                    }
                }
                return <group key={`divider-${gate.x}`}>{wallParts}</group>;
            })}

            {/* Dynamic Gates (Center parts) */}
            {gatePositions.map(gate => (
                <DynamicGate
                    key={`dgate-${gate.stage}`}
                    x={gate.x}
                    stage={gate.stage}
                    rotation={Math.PI / 2}
                    minZ={minZ}
                    maxZ={maxZ}
                    FENCE_MODULE_LENGTH={FENCE_MODULE_LENGTH}
                    PLACEMENT_STEP={PLACEMENT_STEP}
                />
            ))}

            {/* Global Ceiling for All Stages (1-5) */}
            {/* Area: X[-15, 135], Z[-12, 12]. Center X=60, Z=0. Width=150, Depth=24. Height=24 */}
            {/* Thicken ceiling to 5m to prevent tunneling. Widen to 30m/160m to overlap walls. */}
            <CeilingLid position={[60, 26.5, 0]} args={[160, 5, 30]} />
        </group>
    );
}

// Preload
useGLTF.preload('/models/fence.glb');
