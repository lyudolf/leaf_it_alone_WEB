'use client';

import { Canvas } from '@react-three/fiber';
import { Physics, usePlane, useBox } from '@react-three/cannon';
import { Suspense, useState, useEffect } from 'react';
import { LeafManager } from './LeafManager';
import { Tools } from './Tools';
import { Player } from './Player';
import { Sky, PointerLockControls, Environment, useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { TrashBin } from '@/game/TrashBin';
import { LeafBag } from '@/game/LeafBag';
import { useGameStore } from '@/game/store';
import { SCENES } from '@/spec/scenes';
import { DebugTool } from './DebugTool';

// Environment Components
import { House } from '@/components/environment/House';
import { Tree } from '@/components/environment/Tree';
import { FenceEnclosure } from '@/components/environment/FenceEnclosure';
import { AirVent } from '@/components/environment/AirVent';
import { Curb } from '@/components/environment/props/Curb';
import { Planter } from '@/components/environment/props/Planter';
import { Drain } from '@/components/environment/props/Drain';
import { Tornado } from '@/components/game/Tornado';
import { Thunder } from '@/components/game/Thunder';
import { StageGate } from '@/game/StageGate';
import { Mole } from '@/components/environment/Mole';
import { MoleAI } from '@/components/environment/MoleAI';
import { MoleSniper } from '@/components/environment/MoleSniper';
import { HipSH } from '@/components/environment/props/HipSH';
import { PotatoSH } from '@/components/environment/props/PotatoSH';
import { CarrotSH } from '@/components/environment/props/CarrotSH';
import { TomatoSH } from '@/components/environment/props/TomatoSH';
import { GraphicsController } from '@/components/game/GraphicsController';
import { PerfMonitor } from '@/components/game/PerfMonitor';


import { ZONES } from '@/spec/zones';




// ... imports ...

function Ground() {
    const currentStage = useGameStore(s => s.currentStage);
    const zone = ZONES[`zone${currentStage}`] || ZONES.zone1;

    const centerX = (zone.minX + zone.maxX) / 2;
    const centerZ = (zone.minZ + zone.maxZ) / 2;
    const width = zone.maxX - zone.minX;
    const depth = zone.maxZ - zone.minZ;

    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [centerX, 0, centerZ],
        material: { friction: 0.1 }
    }));

    return (
        <mesh ref={ref as any} rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[centerX, 0, centerZ]}>
            <planeGeometry args={[width, depth]} />
            <meshStandardMaterial
                color="#8f6a40"
                roughness={0.9}
                metalness={0}
            />
        </mesh>
    );
}

function InvisibleWall({ position, args }: { position: [number, number, number], args: [number, number, number] }) {
    useBox(() => ({
        type: 'Static',
        position,
        args
    }));
    return (
        <mesh position={position} visible={false}>
            <boxGeometry args={args} />
            <meshBasicMaterial color="red" wireframe />
        </mesh>
    );
}

import { BagManager } from '@/game/BagManager';

export function GameScene() {
    const [leafApi, setLeafApi] = useState<any>(null);
    const [leafRef, setLeafRef] = useState<React.RefObject<THREE.InstancedMesh> | null>(null);
    const currentStage = useGameStore(s => s.currentStage);
    const customSkybox = useGameStore(s => s.customSkybox);

    useEffect(() => {
        // Ensure window has focus for controls
        window.focus();
    }, []);

    // Current Scene Config
    const sceneConfig = SCENES[Math.min(currentStage - 1, SCENES.length - 1)];
    const skyboxPath = customSkybox || '/skybox/equirectangular-jpg_14880663.jpg';

    const handleLeafApiReady = (api: any, ref: React.RefObject<THREE.InstancedMesh>) => {
        if (!leafApi) setLeafApi(api);
        if (!leafRef) setLeafRef(ref);
    };

    return (
        <div className="w-full h-screen bg-sky-200 relative">
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
                {/* Lighting & Environment - Stable */}
                <Environment background files={skyboxPath} />
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                />
                <GraphicsController />
                <PerfMonitor />

                <Physics
                    gravity={[0, -9.81, 0]}
                    stepSize={1 / 60}
                    iterations={5}
                    allowSleep={false}
                    defaultContactMaterial={{ friction: 0.9, restitution: 0 }}
                >
                    <Suspense fallback={null}>
                        <Ground key={`ground-${currentStage}`} />

                        {/* Environment - Dynamic Layout based on SceneConfig */}
                        {sceneConfig.house && (
                            <>
                                <House
                                    key={`house-${currentStage}`}
                                    position={sceneConfig.house.position}
                                    scale={sceneConfig.house.scale}
                                    extraHeight={currentStage === 5 ? 20 : 0}
                                />
                                {/* Invisible Wall behind house (Prevent Player/Leaves going back) */}
                                <InvisibleWall
                                    position={[sceneConfig.house.position[0], 10, sceneConfig.house.position[2] - 3.5]}
                                    args={[15, 20, 1]}
                                />

                                {/* Hip_SH Model next to House (Relative Offset: x+4.5, consistent across stages) */}
                                <HipSH
                                    key={`hipsh-${currentStage}`}
                                    position={[sceneConfig.house.position[0] + 4.5, 0, sceneConfig.house.position[2]]}
                                    scale={1.5}
                                    rotation={[0, -Math.PI / 4, 0]}
                                />
                            </>
                        )}

                        {/* Potato_SH (AI Helper) - Spawns at Center if Unlocked */}
                        {useGameStore(s => s.unlockedPotato) && (() => {
                            const zone = ZONES[`zone${currentStage}`] || ZONES.zone1;
                            const cx = (zone.minX + zone.maxX) / 2;
                            const cz = (zone.minZ + zone.maxZ) / 2;
                            return (
                                <PotatoSH
                                    key={`potatosh-${currentStage}`}
                                    position={[cx - 2, 1, cz]}
                                />
                            );
                        })()}

                        {/* Carrot_SH (AI Helper) - Spawns when Unlocked */}
                        {useGameStore(s => s.unlockedCarrot) && (() => {
                            const zone = ZONES[`zone${currentStage}`] || ZONES.zone1;
                            const cx = (zone.minX + zone.maxX) / 2;
                            const cz = (zone.minZ + zone.maxZ) / 2;
                            return (
                                <CarrotSH
                                    key={`carrotsh-${currentStage}`}
                                    position={[cx, 1, cz]}
                                />
                            );
                        })()}

                        {/* Tomato_SH (AI Helper) - Spawns when Unlocked */}
                        {useGameStore(s => s.unlockedTomato) && (() => {
                            const zone = ZONES[`zone${currentStage}`] || ZONES.zone1;
                            const cx = (zone.minX + zone.maxX) / 2;
                            const cz = (zone.minZ + zone.maxZ) / 2;
                            return (
                                <TomatoSH
                                    key={`tomatosh-${currentStage}`}
                                    position={[cx + 2, 1, cz]}
                                />
                            );
                        })()}


                        {sceneConfig.trees.map((tree, i) => (
                            <Tree key={`tree-${currentStage}-${i}`} position={tree.position} scale={tree.scale} />
                        ))}

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

                        <Tornado />
                        {leafApi && <Thunder leafApi={leafApi} />}

                        {sceneConfig.curbs?.map((curb: any, i: number) => (
                            <Curb key={`curb-${i}`} position={curb.position} rotation={curb.rotation} length={curb.length} />
                        ))}
                        {sceneConfig.planters?.map((planter: any, i: number) => (
                            <Planter key={`planter-${i}`} position={planter.position} rotation={planter.rotation} />
                        ))}
                        {sceneConfig.drains?.map((drain: any, i: number) => (
                            <Drain key={`drain-${i}`} position={drain.position} radius={drain.radius} leafApi={leafApi} leafRef={leafRef} />
                        ))}

                        {currentStage === 3 && leafApi && (
                            <MoleAI
                                position={[60, 0, 0]}
                                radius={5}
                                strength={5}
                                interval={8000}
                                leafApi={leafApi}
                                zoneMin={[45, -12]}
                                zoneMax={[75, 12]}
                                scale={0.5}
                            />
                        )}
                        {currentStage === 4 && leafApi && (
                            <MoleAI
                                position={[90, 0, 0]}
                                radius={5}
                                strength={8}
                                interval={8000}
                                leafApi={leafApi}
                                zoneMin={[75, -12]}
                                zoneMax={[105, 12]}
                                scale={1.5}
                            />
                        )}
                        {currentStage === 5 && leafApi && (
                            <>
                                <MoleSniper leafApi={leafApi} />
                                <MoleAI
                                    position={[120, 0, 0]}
                                    radius={5}
                                    strength={8}
                                    interval={7000}
                                    leafApi={leafApi}
                                    zoneMin={[105, -12]}
                                    zoneMax={[135, 12]}
                                    scale={1.5}
                                />
                            </>
                        )}

                        {/* Trash Bin(s) */}
                        {sceneConfig.trashBins?.map((bin: any, i: number) => (
                            <TrashBin key={`bin-${currentStage}-${i}`} position={bin.position} scale={bin.scale} rotation={bin.rotation} />
                        ))}

                        <LeafManager onLeafApiReady={handleLeafApiReady} />
                        <BagManager />
                    </Suspense>

                    {/* Player & Tools - Should never unmount during stage change */}
                    <Suspense fallback={null}>
                        {leafApi && leafRef && <Tools leafApi={leafApi} leafRef={leafRef} />}
                    </Suspense>
                    <Player />

                    {/* Stage Transition Gates */}
                    <StageGate targetStage={2} position={[15, 0, 0]} />
                    <StageGate targetStage={3} position={[45, 0, 0]} />
                    <StageGate targetStage={4} position={[75, 0, 0]} />
                    <StageGate targetStage={5} position={[105, 0, 0]} />
                    <StageGate targetStage={6} position={[135, 0, 0]} /> {/* Final gate for ending video */}
                </Physics>
                <PointerLockControls />
                <DebugTool />
            </Canvas>
        </div >
    );
}
