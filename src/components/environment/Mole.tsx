'use client';

import { useCylinder } from '@react-three/cannon';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface MoleProps {
    position: [number, number, number];
}

export function Mole({ position }: MoleProps) {
    const [isUp, setIsUp] = useState(false);
    const lastToggle = useRef(0);
    const moleRef = useRef<THREE.Group>(null);
    const currentY = useRef(position[1] - 0.5); // Start underground

    // Load mole model
    const { scene } = useGLTF('/models/mole.glb');
    const clonedScene = scene.clone();

    // Enable shadows on the model
    useEffect(() => {
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [clonedScene]);

    // Physics collider (only when mole is up)
    const [ref] = useCylinder(() => ({
        type: 'Static',
        position: [position[0], position[1], position[2]],
        args: [0.3, 0.3, 0.6, 8],
    }));

    useFrame((state) => {
        const now = state.clock.elapsedTime;

        // Toggle mole up/down every 3-5 seconds
        if (now - lastToggle.current > (isUp ? 2 : 3 + Math.random() * 2)) {
            setIsUp(!isUp);
            lastToggle.current = now;
        }

        // Smooth animation
        const targetY = isUp ? position[1] + 0.3 : position[1] - 0.5;
        currentY.current += (targetY - currentY.current) * 0.1;

        if (moleRef.current) {
            moleRef.current.position.y = currentY.current;
        }
    });

    return (
        <group position={position}>
            {/* Mole model */}
            <group ref={moleRef} position={[0, -0.5, 0]}>
                <primitive object={clonedScene} scale={[0.5, 0.5, 0.5]} />
            </group>

            {/* Physics collider */}
            <mesh ref={ref as any} visible={false}>
                <cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />
            </mesh>
        </group>
    );
}

useGLTF.preload('/models/mole.glb');

