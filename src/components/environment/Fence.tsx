'use client';

import { useBox } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface FenceProps {
    start: [number, number, number];
    end: [number, number, number];
    height?: number;
    segments?: number;
}

export function Fence({ start, end, height = 1.5, segments = 10 }: FenceProps) {
    // Load GLB model
    const { scene } = useGLTF('/models/fence.glb');

    const posts = useMemo(() => {
        const result: [number, number, number][] = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = start[0] + (end[0] - start[0]) * t;
            const y = start[1] + (end[1] - start[1]) * t;
            const z = start[2] + (end[2] - start[2]) * t;
            result.push([x, y, z]);
        }
        return result;
    }, [start, end, segments]);

    // Single collision box for entire fence line
    const centerX = (start[0] + end[0]) / 2;
    const centerY = height / 2;
    const centerZ = (start[2] + end[2]) / 2;

    const length = Math.sqrt(
        Math.pow(end[0] - start[0], 2) +
        Math.pow(end[2] - start[2], 2)
    );

    const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);

    const [ref] = useBox(() => ({
        type: 'Static',
        position: [centerX, centerY, centerZ],
        args: [length, height, 0.1],
        rotation: [0, angle, 0],
    }));

    // Calculate fence line angle for rotation
    const fenceAngle = Math.atan2(end[2] - start[2], end[0] - start[0]);

    return (
        <group>
            {/* Visual fence posts using GLB model */}
            {posts.map((pos, i) => {
                const clonedScene = scene.clone();

                // Enable shadows
                clonedScene.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.geometry) {
                            child.geometry.computeVertexNormals();
                        }
                    }
                });

                return (
                    <primitive
                        key={i}
                        object={clonedScene}
                        position={pos}
                        rotation={[0, fenceAngle, 0]}
                        scale={1}
                    />
                );
            })}

            {/* Invisible collision box for entire fence */}
            <mesh ref={ref as any} visible={false}>
                <boxGeometry args={[length, height, 0.1]} />
            </mesh>
        </group>
    );
}

// Preload the model
useGLTF.preload('/models/fence.glb');
