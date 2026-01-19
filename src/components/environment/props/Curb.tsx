'use client';

import { useBox } from '@react-three/cannon';

interface CurbProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    args: [number, number, number];
}

export function Curb({ position, rotation = [0, 0, 0], args }: CurbProps) {
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        rotation,
        args,
    }));

    return (
        <mesh ref={ref as any} castShadow receiveShadow>
            <boxGeometry args={args} />
            <meshStandardMaterial color="#666666" roughness={0.8} />
        </mesh>
    );
}
