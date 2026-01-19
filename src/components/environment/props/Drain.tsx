'use client';

import { useCylinder } from '@react-three/cannon';
import { useGameStore } from '@/game/store';

interface DrainProps {
    position: [number, number, number];
}

export function Drain({ position }: DrainProps) {
    const deliverBagToDrain = useGameStore(s => s.deliverBagToDrain);

    // Trigger collider to detect bags
    const [ref] = useCylinder(() => ({
        isTrigger: true,
        args: [0.75, 0.75, 1, 8], // Radius 0.75m, Height 1m
        position,
        onCollide: (e) => {
            const other = e.body as any;
            const bagId = other?.userData?.bagId;
            if (bagId) {
                console.log('Drain received bag:', bagId);
                deliverBagToDrain(bagId);
            }
        }
    }));

    return (
        <group position={position}>
            {/* Visual: Circular Grill */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[0.75, 32]} />
                <meshStandardMaterial color="#333333" roughness={0.5} />
            </mesh>

            {/* Inner Grill Lines */}
            {[...Array(8)].map((_, i) => (
                <mesh key={i} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, (i / 8) * Math.PI]}>
                    <planeGeometry args={[1.4, 0.05]} />
                    <meshStandardMaterial color="#111111" />
                </mesh>
            ))}

            {/* Glowing Indicator Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[0.7, 0.8, 32]} />
                <meshStandardMaterial
                    color="#44ff88"
                    emissive="#44ff88"
                    emissiveIntensity={2}
                    transparent
                    opacity={0.5}
                />
            </mesh>

            {/* Invisible trigger collider */}
            <mesh ref={ref as any} visible={false}>
                <cylinderGeometry args={[0.75, 0.75, 1, 8]} />
            </mesh>
        </group>
    );
}
