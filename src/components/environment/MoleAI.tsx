'use client';

import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';

interface MoleAIProps {
    position: [number, number, number];
    radius: number;
    strength: number;
    interval: number;
    leafApi: any;
    zoneMin: [number, number];
    zoneMax: [number, number];
    scale?: number; // Optional scale for mole model
}

export function MoleAI({ position, radius, strength, interval, leafApi, zoneMin, zoneMax, scale = 1.5 }: MoleAIProps) {
    const { scene: moleScene } = useGLTF('/models/mole.glb');
    const [isBlasting, setIsBlasting] = useState(false);
    const setAirVentActive = useGameStore(s => s.setAirVentActive);
    const triggerPlayerPush = useGameStore(s => s.triggerPlayerPush);

    const moleRef = useRef<THREE.Group>(null);
    const bumpRef = useRef<THREE.Group>(null);
    const holeRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);

    const phase = useRef<'WAIT' | 'HUNTING' | 'READY' | 'BLASTING' | 'DESCENT'>('WAIT');
    const phaseStartTime = useRef(0);
    const hasBlasted = useRef(false);

    const currentPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
    const targetPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));

    useFrame((state) => {
        const now = state.clock.elapsedTime * 1000;

        // [WAIT] 대기 후 HUNTING 시작
        if (phase.current === 'WAIT') {
            if (now - phaseStartTime.current > interval) {
                const cluster = findDensestCluster(leafApi, zoneMin, zoneMax);
                if (cluster) {
                    targetPos.current.copy(cluster);
                    phase.current = 'HUNTING';
                    phaseStartTime.current = now;
                } else {
                    phaseStartTime.current = now;
                }
            }
        }

        // [HUNTING] 목표 지점으로 이동
        if (phase.current === 'HUNTING') {
            const dist = currentPos.current.distanceTo(targetPos.current);
            if (dist < 0.5) {
                phase.current = 'READY';
                phaseStartTime.current = now;
            } else {
                const dir = targetPos.current.clone().sub(currentPos.current).normalize();
                currentPos.current.x += dir.x * 0.05;
                currentPos.current.z += dir.z * 0.05;
            }
        }

        // [READY/BLASTING] 도착 시 즉시 팝업 및 발사
        if (phase.current === 'READY') {
            phase.current = 'BLASTING';
            phaseStartTime.current = now;
            hasBlasted.current = false;
        }

        let currentY = -1.5;

        if (phase.current === 'BLASTING') {
            const elapsed = now - phaseStartTime.current;
            currentY = 0.1;

            if (!hasBlasted.current) {
                hasBlasted.current = true;
                setIsBlasting(true);
                setAirVentActive(true);

                const currentPosArray: [number, number, number] = [currentPos.current.x, currentPos.current.y, currentPos.current.z];
                triggerPlayerPush(currentPosArray, radius, strength);
                if (leafApi) applyVentForce(leafApi, currentPos.current, radius, strength);
            }

            if (elapsed > 500) {
                phase.current = 'DESCENT';
                phaseStartTime.current = now;
                setIsBlasting(false);
                setAirVentActive(false);
            }
        }

        // [DESCENT] 하강
        if (phase.current === 'DESCENT') {
            const elapsed = now - phaseStartTime.current;
            const progress = elapsed / 1500;
            currentY = 0.1 + (-1.5 - 0.1) * Math.min(progress, 1);

            if (elapsed > 1500) {
                phase.current = 'WAIT';
                phaseStartTime.current = now;
            }
        }

        // 시각적 업데이트
        if (moleRef.current) {
            moleRef.current.position.set(currentPos.current.x, currentY, currentPos.current.z);
            const camPos = state.camera.position.clone();
            camPos.y = currentY;
            moleRef.current.lookAt(camPos);
        }

        if (bumpRef.current) {
            const isHunting = phase.current === 'HUNTING';
            bumpRef.current.visible = isHunting;
            if (isHunting) {
                bumpRef.current.position.set(currentPos.current.x, Math.sin(now * 0.01) * 0.05 - 0.05, currentPos.current.z);
            }
        }

        if (holeRef.current) {
            const isHoleVisible = phase.current === 'BLASTING' || phase.current === 'DESCENT';
            holeRef.current.visible = isHoleVisible;
            if (isHoleVisible) {
                holeRef.current.position.set(currentPos.current.x, 0.01, currentPos.current.z);
            }
        }

        if (ringRef.current) {
            ringRef.current.visible = isBlasting;
            if (isBlasting) {
                ringRef.current.position.set(currentPos.current.x, 0.15, currentPos.current.z);
            }
        }
    });

    return (
        <group>
            {/* 이동 중 흙더미 */}
            <group ref={bumpRef} visible={false}>
                <mesh position={[0, -0.1, 0]} scale={[1, 0.4, 1]}>
                    <sphereGeometry args={[0.6, 16, 16]} />
                    <meshStandardMaterial color="#4d3b2f" roughness={1} />
                </mesh>
                <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.9, 32]} />
                    <meshBasicMaterial color="#3d2b1f" transparent opacity={0.3} />
                </mesh>
            </group>

            {/* 구멍 */}
            <mesh ref={holeRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.8, 32]} />
                <meshStandardMaterial color="#3d2b1f" roughness={1} />
            </mesh>

            {/* 두더지 모델 */}
            <group ref={moleRef}>
                <primitive object={moleScene} scale={scale} rotation={[0, 0, 0]} />
            </group>

            {/* 충격파 링 */}
            <mesh ref={ringRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius * 0.8, radius, 32]} />
                <meshBasicMaterial color="#FFD700" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function findDensestCluster(api: any, zoneMin: [number, number], zoneMax: [number, number]): THREE.Vector3 | null {
    if (!api || !api.positions) return null;

    const { positions, count } = api;
    const gridSize = 10;
    const [minX, minZ] = zoneMin;
    const [maxX, maxZ] = zoneMax;

    const width = maxX - minX;
    const depth = maxZ - minZ;

    const grid: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const lx = positions[idx];
        const lz = positions[idx + 2];
        const ly = positions[idx + 1];

        if (ly < -50) continue;

        if (lx >= minX && lx <= maxX && lz >= minZ && lz <= maxZ) {
            const gx = Math.floor(((lx - minX) / width) * gridSize);
            const gz = Math.floor(((lz - minZ) / depth) * gridSize);

            if (gx >= 0 && gx < gridSize && gz >= 0 && gz < gridSize) {
                grid[gx][gz]++;
            }
        }
    }

    let maxLeaves = 0;
    let bestX = 0;
    let bestZ = 0;

    for (let x = 0; x < gridSize; x++) {
        for (let z = 0; z < gridSize; z++) {
            if (grid[x][z] > maxLeaves) {
                maxLeaves = grid[x][z];
                bestX = x;
                bestZ = z;
            }
        }
    }

    if (maxLeaves === 0) return null;

    const worldX = minX + (bestX / gridSize) * width + (width / gridSize / 2);
    const worldZ = minZ + (bestZ / gridSize) * depth + (depth / gridSize / 2);

    return new THREE.Vector3(worldX, 0, worldZ);
}

function applyVentForce(api: any, ventPos: THREE.Vector3, radius: number, strength: number) {
    if (!api || !api.positions) return;

    const { positions, count } = api;
    const radiusSq = radius * radius;

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        if (positions[idx + 1] < -100) continue;

        const lx = positions[idx];
        const ly = positions[idx + 1];
        const lz = positions[idx + 2];

        if (ly > 1.0) continue;

        const dx = lx - ventPos.x;
        const dz = lz - ventPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const ratio = 1 - (dist / radius);

            // console.log(`Mole blast affecting leaf ${i} at dist ${dist.toFixed(2)} with ratio ${ratio.toFixed(2)}`);

            const upForce = strength * Math.pow(ratio, 0.32);
            const outForce = strength * Math.pow(ratio, 0.51);

            const dirX = dx / dist;
            const dirZ = dz / dist;

            api.applyImpulse(i, [
                dirX * outForce + (Math.random() - 0.5) * 1.5,
                upForce,
                dirZ * outForce + (Math.random() - 0.5) * 1.5
            ]);
        }
    }
}

useGLTF.preload('/models/mole.glb');
