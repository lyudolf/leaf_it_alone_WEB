'use client';

import { useGLTF } from '@react-three/drei';
import { useCylinder } from '@react-three/cannon';

interface TreeProps {
    position: [number, number, number];
    scale?: number;
}

export function Tree({ position, scale = 1 }: TreeProps) {
    const { scene } = useGLTF('/models/tree.glb');

    // Collision Radius Logic
    const collisionRadius = scale >= 5 ? 1.5 : 0.7;

    // Trunk collision (relative to group position) - keep approximately same size for physics
    const [trunkRef] = useCylinder(() => ({
        type: 'Static',
        position: [position[0], position[1] + 2 * scale, position[2]],
        args: [collisionRadius, collisionRadius, 4 * scale, 8],
        collisionFilterGroup: 4, // Separate group for Trees
    }));

    return (
        <group position={position} scale={scale}>
            {/* Physics Body (Invisible) */}
            <mesh ref={trunkRef as any} visible={false}>
                <cylinderGeometry args={[0.5, 0.6, 4, 8]} />
            </mesh>

            {/* Visual Model */}
            <primitive object={scene.clone()} />
        </group>
    );
}

useGLTF.preload('/models/tree.glb');
