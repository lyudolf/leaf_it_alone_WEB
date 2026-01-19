'use client';

import { Canvas } from '@react-three/fiber';
import { Physics, usePlane } from '@react-three/cannon';
import { Suspense, useState } from 'react';
import { LeafManager } from './LeafManager';
import { Tools } from './Tools';
import { Player } from './Player';
import { Sky, PointerLockControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

import { TrashBin } from '@/game/TrashBin';
import { LeafBag } from '@/game/LeafBag';
import { useGameStore } from '@/game/store';
import { SCENES } from '@/spec/scenes';

// Environment Components
import { House } from '@/components/environment/House';
import { Tree } from '@/components/environment/Tree';
import { FenceEnclosure } from '@/components/environment/FenceEnclosure';
import { AirVent } from '@/components/environment/AirVent';
import { Curb } from '@/components/environment/props/Curb';
import { Planter } from '@/components/environment/props/Planter';
import { Drain } from '@/components/environment/props/Drain';

interface GroundProps {
    sceneConfig: any;
}

function Ground({ sceneConfig }: GroundProps) {
    const size = sceneConfig.groundSize || [40, 30];
    // Center logic: if maxX is 60 and minX is -20, center is (60-20)/2 = 20
    const centerX = size[0] === 80 ? 20 : 0;

    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [centerX, 0, 0],
        material: { friction: 0.1 }
    }));

    return (
        <mesh ref={ref as any} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[centerX, 0, 0]}>
            <planeGeometry args={size} />
            <meshStandardMaterial color="#4a7c38" roughness={1} />
        </mesh>
    );
}

export function GameScene() {
    const [leafApi, setLeafApi] = useState<any>(null);
    const [leafRef, setLeafRef] = useState<React.RefObject<THREE.InstancedMesh> | null>(null);
    const bags = useGameStore(s => s.bags);
    const stageCleared = useGameStore(s => s.stageCleared);
    const nextStage = useGameStore(s => s.nextStage);
    const currentStage = useGameStore(s => s.currentStage);

    // Current Scene Config
    const sceneConfig = SCENES[Math.min(currentStage - 1, SCENES.length - 1)];

    const handleLeafApiReady = (api: any, ref: React.RefObject<THREE.InstancedMesh>) => {
        if (!leafApi) setLeafApi(api);
        if (!leafRef) setLeafRef(ref);
    };

    return (
        <div className="w-full h-screen bg-sky-200 relative">
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
                <Suspense fallback={null}>
                    {/* Lighting & Environment */}
                    <Environment background files="/skybox/equirectangular-jpg_14880663.jpg" />
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
                        <Ground sceneConfig={sceneConfig} />

                        {/* Environment - Dynamic Layout based on SceneConfig */}
                        {sceneConfig.house && (
                            <House position={sceneConfig.house.position} scale={sceneConfig.house.scale} />
                        )}

                        {sceneConfig.trees.map((tree, i) => (
                            <Tree key={`tree-${currentStage}-${i}`} position={tree.position} scale={tree.scale} />
                        ))}

                        {/* Fence Enclosure - Grid-aligned 2m modules */}
                        <FenceEnclosure />

                        {/* Air Vents (Interactive) */}
                        {leafApi && sceneConfig.vents.map((vent, i) => (
                            <AirVent
                                key={`vent-${currentStage}-${i}`}
                                position={vent.position}
                                radius={vent.radius}
                                strength={vent.strength}
                                interval={4000}
                                leafApi={leafApi}
                            />
                        ))}

                        {/* Stage 2 Props: Curbs, Planters, Drains */}
                        {sceneConfig.curbs?.map((curb, i) => (
                            <Curb key={`curb-${currentStage}-${i}`} position={curb.position} rotation={curb.rotation} args={curb.args} />
                        ))}
                        {sceneConfig.planters?.map((planter, i) => (
                            <Planter key={`planter-${currentStage}-${i}`} position={planter.position} rotation={planter.rotation} args={planter.args} />
                        ))}
                        {sceneConfig.drains?.map((drain, i) => (
                            <Drain key={`drain-${currentStage}-${i}`} position={drain.position} />
                        ))}

                        {/* Trash Bin(s) */}
                        <TrashBin position={[15, 0, 12]} />
                        {sceneConfig.isExpansion && (
                            <TrashBin position={[55, 0, 12]} />
                        )}

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

            {/* Stage Clear Overlay */}
            {stageCleared && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 animate-in fade-in duration-500 pointer-events-auto">
                    <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 text-center shadow-2xl">
                        <h1 className="text-6xl font-bold text-yellow-400 mb-4 drop-shadow-lg">STAGE CLEARED!</h1>
                        <p className="text-2xl text-white mb-2">{sceneConfig.name}</p>
                        <p className="text-lg text-white/70 mb-8">{currentStage}단계를 완료했습니다.</p>
                        <button
                            onClick={() => nextStage()}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 px-12 rounded-full text-2xl transition-all hover:scale-110 active:scale-95 shadow-xl pointer-events-auto"
                        >
                            {currentStage === 1 ? "다른 구역 오픈!" : "다음 씬으로 이동"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
