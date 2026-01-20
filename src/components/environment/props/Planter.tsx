'use client';

import { useBox } from '@react-three/cannon';

interface PlanterProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    args?: [number, number, number];
}

export function Planter({ position, rotation = [0, 0, 0], args = [2.2, 0.8, 2.2] }: PlanterProps) {
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        rotation,
        args,
    }));

    return (
        <group position={position} rotation={rotation}>
            {/* Box Mesh */}
            <mesh ref={ref as any} castShadow receiveShadow>
                <boxGeometry args={args} />
                <meshStandardMaterial color="#3d2b1f" roughness={1} />
            </mesh>

            {/* Inner Dirt (visual only) */}
            <mesh position={[0, args[1] / 2 + 0.01, 0]}>
                <boxGeometry args={[args[0] - 0.1, 0.02, args[2] - 0.1]} />
                <meshStandardMaterial color="#221100" />
            </mesh>
        </group>
    );
}
