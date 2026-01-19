'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

interface FogCloudProps {
    intensity: number;
    wind: { x: number; y: number };
    neutralMode: boolean;
    holdProgress: number;
    isReleasing: boolean;
}

const BLOB_COUNT = 50;

export function FogCloud({
    intensity,
    wind,
    neutralMode,
    holdProgress,
    isReleasing
}: FogCloudProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Initial random offsets for each blob
    const blobData = useMemo(() => {
        const data = [];
        for (let i = 0; i < BLOB_COUNT; i++) {
            data.push({
                offset: new THREE.Vector3(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 4
                ),
                speed: Math.random() * 0.5 + 0.5,
                phase: Math.random() * Math.PI * 2,
                size: Math.random() * 0.5 + 0.5
            });
        }
        return data;
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.elapsedTime;

        // Tuning parameters based on intensity
        const pull = intensity * 2; // Pull towards center
        const wobble = intensity * 1.5; // Wobble magnitude
        const drift = 3.0; // Wind influence

        // Neutral mode softens the edges/motion
        const softenFactor = neutralMode ? 0.6 : 1.0;

        for (let i = 0; i < BLOB_COUNT; i++) {
            const data = blobData[i];

            // 1. Base position with oscillation
            const x = data.offset.x + Math.sin(time * data.speed + data.phase) * wobble * softenFactor;
            const y = data.offset.y + Math.cos(time * data.speed + data.phase * 0.7) * wobble * softenFactor;
            const z = data.offset.z;

            const pos = new THREE.Vector3(x, y, z);

            // 2. Pull towards center (intensity increases density)
            pos.lerp(new THREE.Vector3(0, 0, 0), pull * 0.1);

            // 3. Apply wind drift
            pos.x += wind.x * drift;
            pos.y += wind.y * drift;

            // 4. Update instance matrix
            dummy.position.copy(pos);
            const s = data.size * (1 + intensity * 0.5) * softenFactor;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;

        // Update material properties (opacity)
        if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
            meshRef.current.material.opacity = THREE.MathUtils.lerp(
                meshRef.current.material.opacity,
                0.1 + intensity * 0.5,
                0.1
            );
            // Visual feedback for RELEASE
            if (isReleasing) {
                meshRef.current.material.color.set('#60a5fa'); // Calm blue
            } else {
                meshRef.current.material.color.set(neutralMode ? '#f8fafc' : '#cbd5e1');
            }
        }
    });

    return (
        <group>
            <instancedMesh ref={meshRef} args={[undefined, undefined, BLOB_COUNT]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial
                    transparent
                    opacity={0.2}
                    depthWrite={false}
                    roughness={0.1}
                    metalness={0.1}
                    color="#f8fafc"
                />
            </instancedMesh>

            {/* Regulatory Progress Ring */}
            {holdProgress > 0 && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
                    <ringGeometry args={[holdProgress * 5, holdProgress * 5 + 0.1, 64]} />
                    <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
                </mesh>
            )}
        </group>
    );
}
