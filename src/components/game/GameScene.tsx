'use client';

import { Canvas } from '@react-three/fiber';
import { Physics, usePlane } from '@react-three/cannon';
import { Suspense, useState } from 'react';
import { LeafManager } from './LeafManager';
import { Tools } from './Tools';
import { Player } from './Player';
import { Sky, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

import { TrashBin } from '@/game/TrashBin';
import { LeafBag } from '@/game/LeafBag';
import { useGameStore } from '@/game/store';

function Ground() {
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0, 0],
        material: { friction: 0.1 }
    }));
    return (
        <mesh ref={ref as any} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#5c8d45" roughness={0.8} />
        </mesh>
    );
}

export function GameScene() {
    const [leafApi, setLeafApi] = useState<any>(null);
    const [leafRef, setLeafRef] = useState<React.RefObject<THREE.InstancedMesh> | null>(null);
    const bags = useGameStore(s => s.bags);

    const handleLeafApiReady = (api: any, ref: React.RefObject<THREE.InstancedMesh>) => {
        if (!leafApi) setLeafApi(api);
        if (!leafRef) setLeafRef(ref);
    };

    return (
        <div className="w-full h-screen bg-sky-200">
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
                <Suspense fallback={null}>
                    {/* Lighting & Environment */}
                    <Sky sunPosition={[100, 20, 100]} />
                    <ambientLight intensity={0.5} />
                    <directionalLight
                        position={[10, 20, 10]}
                        intensity={1.5}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-left={-50}
                        shadow-camera-right={50}
                        shadow-camera-top={50}
                        shadow-camera-bottom={-50}
                    />

                    <Physics
                        gravity={[0, -9.81, 0]}
                        stepSize={1 / 60}
                        iterations={5}
                        allowSleep={false}
                        defaultContactMaterial={{ friction: 0.9, restitution: 0 }}
                    >
                        <Ground />
                        <TrashBin position={[5, 0.6, 5]} />

                        <LeafManager onLeafApiReady={handleLeafApiReady} />

                        {bags.map(bag => (
                            <LeafBag key={bag.id} id={bag.id} initialPos={bag.position} />
                        ))}

                        {leafApi && leafRef && <Tools leafApi={leafApi} leafRef={leafRef} />}
                        <Player />
                    </Physics>
                    <PointerLockControls />
                </Suspense>
            </Canvas>
        </div>
    );
}
