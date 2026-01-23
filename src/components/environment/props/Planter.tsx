'use client';

import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

interface PlanterProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    args?: [number, number, number];
    bounceStrength?: number;
}

export function Planter({
    position,
    rotation = [0, 0, 0],
    args = [2.2, 0.8, 2.2],
    bounceStrength = 7
}: PlanterProps) {
    const lastBounceTime = useRef(0);

    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        rotation,
        args,
        material: {
            restitution: 1.5, // High bounce
            friction: 0.3
        }
    }));

    // Trampoline bounce detection
    useFrame((state) => {
        const playerPos = state.camera.position;

        // Check if player is near planter top
        const dx = playerPos.x - position[0];
        const dz = playerPos.z - position[2];
        const distance = Math.sqrt(dx * dx + dz * dz);

        const now = Date.now();
        const isOnTop = distance < args[0] / 2 &&
            playerPos.y > position[1] + args[1] - 0.5 &&
            playerPos.y < position[1] + args[1] + 2;

        if (isOnTop && now - lastBounceTime.current > 500) {
            lastBounceTime.current = now;

            // Dispatch event for player to apply upward impulse
            window.dispatchEvent(new CustomEvent('trampoline-bounce', {
                detail: { strength: bounceStrength }
            }));
        }
    });

    return (
        <group position={position} rotation={rotation}>
            {/* Box Mesh - Now with trampoline visual hint */}
            <mesh ref={ref as any} castShadow receiveShadow>
                <boxGeometry args={args} />
                <meshStandardMaterial color="#3d2b1f" roughness={1} />
            </mesh>

            {/* Inner Dirt (visual only) - Changed to red to indicate trampoline */}
            <mesh position={[0, args[1] / 2 + 0.01, 0]}>
                <boxGeometry args={[args[0] - 0.1, 0.02, args[2] - 0.1]} />
                <meshStandardMaterial color="#cc0000" emissive="#330000" emissiveIntensity={0.3} />
            </mesh>
        </group>
    );
}
