import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import { useGLTF } from '@react-three/drei';

interface AirVentProps {
    position: [number, number, number];
    radius?: number;
    strength?: number;
    interval?: number; // ms between blasts
    leafApi?: any;
}

export function AirVent({
    position,
    radius = 3,
    strength = 15,
    interval = 5000,
    leafApi
}: AirVentProps) {
    const [isBlasting, setIsBlasting] = useState(false);
    const { scene } = useThree();
    const setAirVentActive = useGameStore(s => s.setAirVentActive);
    const triggerPlayerPush = useGameStore(s => s.triggerPlayerPush);

    // State references
    const moleRef = useRef<THREE.Group>(null);
    const bumpRef = useRef<THREE.Group>(null);
    const holeRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);

    const currentPos = useRef(new THREE.Vector3(...position));
    const targetPos = useRef(new THREE.Vector3(...position));
    const phase = useRef<'HUNTING' | 'READY' | 'BLASTING' | 'DESCENT' | 'WAIT'>('WAIT');
    const phaseStartTime = useRef(0);
    const hasBlasted = useRef(false);

    // Load mole model
    const { scene: moleModel } = useGLTF('/models/mole.glb');
    const moleScene = useMemo(() => moleModel.clone(), [moleModel]);

    const currentStage = useGameStore(s => s.currentStage);

    useFrame((state) => {
        const now = state.clock.elapsedTime * 1000;

        // --- 1. 상태 제어 로직 ---
        // 2단계가 아니면 두더지 비활성화
        if (currentStage !== 2) {
            if (moleRef.current) moleRef.current.visible = false;
            if (bumpRef.current) bumpRef.current.visible = false;
            if (holeRef.current) holeRef.current.visible = false;
            if (ringRef.current) ringRef.current.visible = false;
            return;
        }

        if (moleRef.current) moleRef.current.visible = true;

        // [WAIT] 3초 대기 후 새로운 타겟 탐색
        if (phase.current === 'WAIT') {
            if (now - phaseStartTime.current > 3000) {
                // 낙엽 뭉치 찾기
                const bestTarget = findDensestCluster(leafApi);
                if (bestTarget) {
                    targetPos.current.copy(bestTarget);
                    phase.current = 'HUNTING';
                } else {
                    phaseStartTime.current = now; // 찾을 때까지 대기
                }
            }
        }

        // [HUNTING] 땅속에서 타겟으로 이동
        if (phase.current === 'HUNTING') {
            const dist = new THREE.Vector2(currentPos.current.x, currentPos.current.z)
                .distanceTo(new THREE.Vector2(targetPos.current.x, targetPos.current.z));

            if (dist < 0.5) {
                phase.current = 'READY';
                phaseStartTime.current = now;
            } else {
                // 부드러운 이동 (동물적인 느낌)
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
            currentY = 0.1; // 고점 고정

            if (!hasBlasted.current) {
                hasBlasted.current = true;
                setIsBlasting(true);
                setAirVentActive(true);

                // 현재 이동한 위치에서 물리 효과 발생
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

        // [DESCENT] 1.5초간 하강
        if (phase.current === 'DESCENT') {
            const elapsed = now - phaseStartTime.current;
            const progress = elapsed / 1500;
            currentY = 0.1 + (-1.5 - 0.1) * Math.min(progress, 1);

            if (elapsed > 1500) {
                phase.current = 'WAIT';
                phaseStartTime.current = now;
            }
        }

        // --- 2. 시각적 업데이트 (Imperative) ---
        // 두더지 위치/회전
        if (moleRef.current) {
            moleRef.current.position.set(currentPos.current.x, currentY, currentPos.current.z);

            // 유저 바라보기 (이동 중에도 유지)
            const camPos = state.camera.position.clone();
            camPos.y = currentY;
            moleRef.current.lookAt(camPos);
        }

        // 이동 중 흙더미 (HUNTING 중에만 표시)
        if (bumpRef.current) {
            const isHunting = phase.current === 'HUNTING';
            bumpRef.current.visible = isHunting;
            if (isHunting) {
                bumpRef.current.position.set(currentPos.current.x, Math.sin(now * 0.01) * 0.05 - 0.05, currentPos.current.z);
            }
        }

        // 땅굴 구멍 (BLASTING, DESCENT 중에만 표시)
        if (holeRef.current) {
            const isHoleVisible = phase.current === 'BLASTING' || phase.current === 'DESCENT';
            holeRef.current.visible = isHoleVisible;
            if (isHoleVisible) {
                holeRef.current.position.set(currentPos.current.x, 0.01, currentPos.current.z);
            }
        }

        // 충격파 링
        if (ringRef.current) {
            ringRef.current.visible = isBlasting;
            if (isBlasting) {
                ringRef.current.position.set(currentPos.current.x, 0.15, currentPos.current.z);
            }
        }
    });

    return (
        <group>
            {/* 1. 이동 중 솟구친 흙더미 (Ref로 제어) */}
            <group ref={bumpRef} visible={false}>
                {/* 꿈틀거리는 메인 흙더미 */}
                <mesh position={[0, -0.1, 0]} scale={[1, 0.4, 1]}>
                    <sphereGeometry args={[0.6, 16, 16]} />
                    <meshStandardMaterial color="#4d3b2f" roughness={1} />
                </mesh>
                {/* 주변의 미세한 흔적 */}
                <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.9, 32]} />
                    <meshBasicMaterial color="#3d2b1f" transparent opacity={0.3} />
                </mesh>
            </group>

            {/* 2. 구멍 (Ref로 제어) */}
            <mesh ref={holeRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.8, 32]} />
                <meshStandardMaterial color="#3d2b1f" roughness={1} />
            </mesh>

            {/* 3. 두더지 모델 */}
            <group ref={moleRef}>
                <primitive
                    object={moleScene}
                    scale={0.5}
                    rotation={[0, 0, 0]}
                />
            </group>

            {/* 4. 충격파 링 (Ref로 제어) */}
            <mesh ref={ringRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius * 0.8, radius, 32]} />
                <meshBasicMaterial
                    color="#FFD700"
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

/**
 * 2단계 구역(X: 20~60)에서 낙엽이 가장 많이 뭉쳐있는 그리드 중심 좌표를 반환합니다.
 */
function findDensestCluster(api: any): THREE.Vector3 | null {
    if (!api || !api.positions) return null;

    const { positions, count } = api;
    const gridSize = 10;
    // 2단계 구역 정의
    const minX = 20;
    const maxX = 60;
    const minZ = -14;
    const maxZ = 14;

    const width = maxX - minX;
    const depth = maxZ - minZ;

    const grid: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const lx = positions[idx];
        const lz = positions[idx + 2];
        const ly = positions[idx + 1];

        if (ly < -50) continue;

        // 2단계 구역 내부 낙엽만 체크
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

    // 2단계 구역의 실제 좌표로 변환
    const worldX = minX + (bestX / gridSize) * width + (width / gridSize / 2);
    const worldZ = minZ + (bestZ / gridSize) * depth + (depth / gridSize / 2);

    return new THREE.Vector3(worldX, 0, worldZ);
}

function applyVentForce(
    api: any,
    ventPos: THREE.Vector3,
    radius: number,
    strength: number
) {
    if (!api || !api.positions) return;

    const { positions, count } = api;
    const radiusSq = radius * radius;

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        if (positions[idx + 1] < -100) continue; // Skip removed leaves

        const lx = positions[idx];
        const ly = positions[idx + 1];
        const lz = positions[idx + 2];

        // Only affect leaves on the ground
        if (ly > 1.0) continue;

        const dx = lx - ventPos.x;
        const dz = lz - ventPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const ratio = 1 - (dist / radius);

            const upForce = 10 * Math.pow(ratio, 0.32);
            const outForce = 10 * Math.pow(ratio, 0.51);

            // Calculate radial direction (outward from center)
            const dirX = dx / dist;
            const dirZ = dz / dist;

            // Apply hemispherical impulse
            api.applyImpulse(i, [
                dirX * outForce + (Math.random() - 0.5) * 1.5,
                upForce,
                dirZ * outForce + (Math.random() - 0.5) * 1.5
            ]);
        }
    }
}
