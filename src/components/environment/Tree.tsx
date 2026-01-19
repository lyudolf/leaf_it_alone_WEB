'use client';

import { useCylinder, useSphere } from '@react-three/cannon';

interface TreeProps {
    position: [number, number, number];
    scale?: number;
}

export function Tree({ position, scale = 1 }: TreeProps) {
    // Trunk collision (relative to group position)
    const [trunkRef] = useCylinder(() => ({
        type: 'Static',
        position: [position[0], position[1] + 2 * scale, position[2]], // Absolute position
        args: [0.3 * scale, 0.4 * scale, 4 * scale, 8],
    }));

    // Foliage collision (relative to group position)
    const [foliageRef] = useSphere(() => ({
        type: 'Static',
        position: [position[0], position[1] + 5 * scale, position[2]], // Absolute position
        args: [2 * scale],
    }));

    return (
        <group>
            {/* Trunk */}
            <mesh ref={trunkRef as any} castShadow receiveShadow position={position}>
                <cylinderGeometry args={[0.3 * scale, 0.4 * scale, 4 * scale, 8]} />
                <meshStandardMaterial color="#654321" roughness={0.9} />
            </mesh>

            {/* Foliage */}
            <mesh ref={foliageRef as any} castShadow receiveShadow position={[position[0], position[1] + 5 * scale, position[2]]}>
                <sphereGeometry args={[2 * scale, 16, 16]} />
                <meshStandardMaterial color="#2D5016" roughness={0.8} />
            </mesh>
        </group>
    );
}
