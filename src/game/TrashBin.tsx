'use client';

import { useBox } from '@react-three/cannon';
import { useGameStore } from '@/game/store';

export function TrashBin({ position }: { position: [number, number, number] }) {
    const removeBag = useGameStore(s => s.removeBag);

    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        args: [1, 1.2, 1],
        onCollide: (e) => {
            // Check if colliding with a bag
            // The object name is usually available in e.body.name if set in ThreeJS, 
            // but Cannon might not propagate it directly to the local event object structure seamlessly in all versions.
            // Using userData is safer, but R3F cannon binds the mesh.

            // Try to get the mesh name
            const hitObject = e.body as any; // Cannon body
            // e.target is this body. e.body is the OTHER body.

            // NOTE: @react-three/cannon's onCollide event usually exposes 'body' which is the cannon body.
            // Mapping back to the THREE mesh or ID is tricky without user data.
            // However, we gave the mesh a name `bag-${id}`.

            // Simplest hack: The Bag component itself can have an onCollide with the Bin?
            // No, multiple bags. Bin is one.

            // Let's look at the name.
            if (hitObject && hitObject.name && hitObject.name.startsWith('bag-')) {
                const bagId = hitObject.name.replace('bag-', '');
                removeBag(bagId, true);
            }
        }
    }));

    return (
        <group ref={ref as any} position={position}>
            {/* Visuals */}
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
                <boxGeometry args={[1, 1.2, 1]} />
                <meshStandardMaterial color="#2d3748" />
            </mesh>
            <mesh position={[0, 0, 0.51]}>
                <planeGeometry args={[0.6, 0.6]} />
                <meshStandardMaterial color="#48bb78" /> {/* Green Sell Areas */}
            </mesh>
            {/* Open top visual */}
            <mesh position={[0, 0.61, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.8, 0.8]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    );
}
