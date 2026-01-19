'use client';

import { useBox } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';

interface HouseProps {
    position: [number, number, number];
    scale?: number;
}

export function House({ position, scale = 1 }: HouseProps) {
    // Load GLB model
    const { scene } = useGLTF('/models/house.glb');

    // Clone the scene to allow multiple instances if needed
    const clonedScene = scene.clone();

    // Enable shadows and smooth shading on all meshes in the model
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

    // Physics collision box for player and leaves
    // House size refined to match visual footprint better
    const houseSize: [number, number, number] = [2.2 * scale, 2.0 * scale, 2.2 * scale];
    const [ref] = useBox(() => ({
        type: 'Static',
        position: [position[0], position[1] + (houseSize[1] / 2), position[2]],
        args: houseSize,
    }));

    return (
        <group position={position}>
            {/* GLB Model */}
            <primitive object={clonedScene} scale={scale} />

            {/* Invisible collision box */}
            <mesh ref={ref as any} visible={false}>
                <boxGeometry args={houseSize} />
                <meshBasicMaterial color="blue" opacity={0.3} transparent wireframe />
            </mesh>
        </group>
    );
}

// Preload the model for better performance
useGLTF.preload('/models/house.glb');
