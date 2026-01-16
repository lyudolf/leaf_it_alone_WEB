'use client';

import { useBox } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';

export function LeafBag({ id, initialPos }: { id: string; initialPos: [number, number, number] }) {
    const { camera } = useThree();
    const isCarried = useGameStore(s => s.carriedBagId === id);

    // Physics body
    const [ref, api] = useBox(() => ({
        mass: 5,
        position: initialPos,
        args: [0.6, 0.8, 0.6],
        material: { friction: 0.5, restitution: 0.2 },
        // If carried, we might want to change type to Static or Kinematic to prevent fighting?
        // But updating position every frame usually overrides dynamic forces enough for "holding".
        // Better: ensure it doesn't sleep while held.
    }));

    // Start with a small upward impulse
    useEffect(() => {
        api.velocity.set(0, 3, 0);
    }, [api]);

    useFrame(() => {
        if (isCarried) {
            // Lerp target: 1.2m in front of camera
            const target = new THREE.Vector3(0, 0, -1.2);
            target.applyQuaternion(camera.quaternion);
            target.add(camera.position);

            // Force position (holding)
            api.position.set(target.x, target.y, target.z);

            // Zero velocity to prevent accumulation
            api.velocity.set(0, 0, 0);

            // Face player's yaw
            // const ry = camera.rotation.y;
            // api.rotation.set(0, ry, 0); 
            // (Rotation sync is optional but looks nicer)

            // To prevent physics freakout, reset angular velocity too
            api.angularVelocity.set(0, 0, 0);
        }
    });

    return (
        <mesh ref={ref as any} castShadow receiveShadow name={`bag-${id}`}>
            <boxGeometry args={[0.6, 0.8, 0.6]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} /> {/* Brown paper bag */}

            {/* Bag details */}
            <group position={[0, -0.2, 0]}>
                <mesh position={[0, 0, 0.31]}>
                    <planeGeometry args={[0.4, 0.4]} />
                    <meshStandardMaterial color="#EEE" />
                </mesh>
                {/* Fake text lines */}
                <mesh position={[0, 0.05, 0.32]}>
                    <planeGeometry args={[0.2, 0.05]} />
                    <meshBasicMaterial color="#333" />
                </mesh>
                <mesh position={[0, -0.05, 0.32]}>
                    <planeGeometry args={[0.2, 0.05]} />
                    <meshBasicMaterial color="#333" />
                </mesh>
            </group>
        </mesh>
    );
}
