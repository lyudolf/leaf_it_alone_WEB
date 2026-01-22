'use client';

import { useBox } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';

interface TrashBinProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
}

export function TrashBin({ position, rotation = [0, 0, 0], scale = 1 }: TrashBinProps) {
    const removeBag = useGameStore(s => s.removeBag);

    // Load GLB model
    const { scene } = useGLTF('/models/trash_bin.glb');
    const clonedScene = scene.clone();


    // Enable shadows and smooth shading on all meshes
    useEffect(() => {
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Enable smooth shading to remove flat polygon look
                if (child.geometry) {
                    child.geometry.computeVertexNormals();
                }
            }
        });
    }, [clonedScene]);


    // Physics collision box
    const binHeight = 2.5 * scale; // Increased height for easier tosses
    const [ref] = useBox(() => ({
        type: 'Static',
        position: [position[0], position[1] + binHeight / 2, position[2]],
        rotation: rotation,
        args: [1.5 * scale, binHeight, 1.5 * scale], // Slightly larger for easier hit
        collisionFilterGroup: 32, // Dedicated group for checking collisions specifically
        userData: { type: 'bin' }, // Tag for collision detection
        onCollide: (e) => {
            const other = e.body as any;
            // Check if what hit us is a bag
            const bagId = other?.userData?.bagId;
            if (bagId) {
                console.log('Bin hit by bag:', bagId);
                useGameStore.getState().removeBag(bagId, true);
            }
        }
    }));

    return (
        <group position={position} rotation={new THREE.Euler(...rotation)}>
            {/* GLB Model */}
            <primitive object={clonedScene} scale={scale} />

            {/* Invisible collision box */}
            <mesh ref={ref as any} visible={false}>
                <boxGeometry args={[1.5 * scale, binHeight, 1.5 * scale]} />
            </mesh>
        </group>
    );
}

// Preload the model
useGLTF.preload('/models/trash_bin.glb');
