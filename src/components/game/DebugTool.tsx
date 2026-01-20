'use client';

import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function DebugTool() {
    const { camera } = useThree();
    const [cornerA, setCornerA] = useState<[number, number] | null>(null);
    const [cornerB, setCornerB] = useState<[number, number] | null>(null);
    const [selectedZone, setSelectedZone] = useState(1);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const x = camera.position.x;
            const z = camera.position.z;

            // Z: Current pos
            if (e.code === 'KeyZ') {
                console.log(`[Pos] X: ${x.toFixed(2)}, Z: ${z.toFixed(2)}`);
            }

            // X: Corner A
            if (e.code === 'KeyX') {
                setCornerA([x, z]);
                console.log(`[A] X: ${x.toFixed(2)}, Z: ${z.toFixed(2)}`);
            }

            // C: Corner B
            if (e.code === 'KeyC') {
                setCornerB([x, z]);
                console.log(`[B] X: ${x.toFixed(2)}, Z: ${z.toFixed(2)}`);
            }

            // 1-5: Select Zone
            if (e.code.startsWith('Digit') && e.code.length === 6) {
                const zone = parseInt(e.code.slice(-1));
                if (zone >= 1 && zone <= 5) {
                    setSelectedZone(zone);
                    console.log(`[Debug] Target Zone: ${zone}`);
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [camera]);

    useEffect(() => {
        if (cornerA && cornerB) {
            const minX = Math.min(cornerA[0], cornerB[0]);
            const maxX = Math.max(cornerA[0], cornerB[0]);
            const minZ = Math.min(cornerA[1], cornerB[1]);
            const maxZ = Math.max(cornerA[1], cornerB[1]);

            console.log(`\n--- ZONE ${selectedZone} AABB ---`);
            console.log(`zone${selectedZone}: { minX: ${minX.toFixed(2)}, maxX: ${maxX.toFixed(2)}, minZ: ${minZ.toFixed(2)}, maxZ: ${maxZ.toFixed(2)} },`);

            // Note: In a real environment, this might trigger a server-side write.
            // For now, we output to console for copy-paste to zones.ts.
            setCornerA(null);
            setCornerB(null);
        }
    }, [cornerA, cornerB, selectedZone]);

    return null; // Side-effect only tool
}
