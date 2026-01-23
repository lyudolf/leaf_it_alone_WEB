'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGameStore } from '@/game/store';
import { TOOL_CONFIG, getRakeConfig, getBlowerConfig } from '@/game/toolConfig';
import * as THREE from 'three';
import { useEffect, useRef, useState, useMemo } from 'react';

interface ToolsProps {
    leafApi: any;
    leafRef: React.RefObject<THREE.InstancedMesh>;
}

// Models must be preloaded or loaded in parent to prevent Suspense on switch
// Models must be preloaded or loaded in parent to prevent Suspense on switch
function HandModel({ active, side = 'right', scene }: { active: boolean; side?: 'left' | 'right'; scene: THREE.Group }) {
    const { camera } = useThree();
    const group = useRef<THREE.Group>(null);
    const clone = useMemo(() => scene.clone(), [scene]);
    const activeDuration = useRef(0);

    useFrame((state, delta) => {
        if (!group.current) return;

        // 1. Pulsing Animation (0.2s loop)
        if (active) {
            activeDuration.current += delta;
        } else {
            activeDuration.current = 0;
        }

        const period = 0.2;
        const progress = (activeDuration.current % period) / period;
        const pulse = Math.sin(progress * Math.PI); // 0 -> 1 -> 0
        const reachAmt = active ? (0.3 * pulse) : 0.0;

        // 2. Position (Preserve exact legacy logic)
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

        const sideMultiplier = side === 'right' ? 1 : -1;
        const offset = new THREE.Vector3()
            .add(forward.clone().multiplyScalar(0.5)) // Distance
            .add(right.clone().multiplyScalar(0.3 * sideMultiplier)) // Side
            .add(up.clone().multiplyScalar(-0.3)); // Down

        const reachVec = forward.clone().multiplyScalar(reachAmt);

        // Bobbing
        const time = state.clock.elapsedTime;
        const bobPhase = side === 'right' ? 0 : Math.PI;
        const bob = up.clone().multiplyScalar(Math.sin(time * 2 + bobPhase) * 0.01);

        const target = camera.position.clone().add(offset).add(reachVec).add(bob);

        group.current.position.lerp(target, delta * 20); // Faster lerp for 0.2s speed
        group.current.quaternion.copy(camera.quaternion);

        // Dynamic tilt based on pulse
        if (active) {
            group.current.rotateX(-0.2 * pulse);
            group.current.rotateZ(-0.2 * sideMultiplier * pulse);
        }
    });

    const scale = side === 'right' ? [0.3, 0.3, 0.3] : [-0.3, 0.3, 0.3];
    const rotation: [number, number, number] = side === 'right'
        ? [250, 80, 0]
        : [250, 90, 0];

    return (
        <group ref={group}>
            <primitive object={clone} scale={scale} rotation={rotation} />
        </group>
    );
}

function RakeModel({ active, scene }: { active: boolean; scene: THREE.Group }) {
    const { camera } = useThree();
    const group = useRef<THREE.Group>(null);
    const clone = useMemo(() => scene.clone(), [scene]);
    const cycle = useRef(0);

    useFrame((state, delta) => {
        if (!group.current) return;

        // Position: Bottom Right
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

        const offset = new THREE.Vector3()
            .add(forward.clone().multiplyScalar(2))
            .add(right.clone().multiplyScalar(0.5))
            .add(up.clone().multiplyScalar(0));

        let animOffset = new THREE.Vector3();
        let animRot = 0;

        if (active) {
            // Raking Cycle: Play once per click
            if (cycle.current < 1) {
                cycle.current += delta * 2.5; // Speed
                if (cycle.current > 1) cycle.current = 1; // Clamp at end
            }

            const t = cycle.current;

            if (t < 0.4) {
                // Extend
                animOffset.add(forward.clone().multiplyScalar(t * 1.5)); // push out
                animRot = -t * 0.5; // tilt up slightly
            } else if (t < 0.6) {
                // Down (Dig)
                animOffset.add(forward.clone().multiplyScalar(0.6));
                animOffset.add(up.clone().multiplyScalar(-(t - 0.4)));
                animRot = 0.5; // tilt down
            } else {
                // Pull back
                const pull = 1 - (t - 0.6) / 0.4; // 1 -> 0
                animOffset.add(forward.clone().multiplyScalar(pull * 0.6));
                animRot = -0.2;
            }
        } else {
            // Reset when released
            cycle.current = 0;
            const time = state.clock.elapsedTime;
            animOffset.add(up.clone().multiplyScalar(Math.sin(time * 1.5) * 0.02));
        }

        const target = camera.position.clone().add(offset).add(animOffset);

        group.current.position.lerp(target, delta * 20);
        group.current.quaternion.copy(camera.quaternion);
        group.current.rotateX(animRot);
    });

    return (
        <group ref={group}>
            <primitive object={clone} scale={1} rotation={[90, 135, 0]} />
        </group>
    );
}

function BlowerModel({ active }: { active: boolean }) {
    const { camera } = useThree();
    const group = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!group.current) return;

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

        const offset = new THREE.Vector3()
            .add(forward.clone().multiplyScalar(0.4))
            .add(right.clone().multiplyScalar(0.3))
            .add(up.clone().multiplyScalar(-0.3));

        const time = state.clock.elapsedTime;

        // Idle bob
        let bob = up.clone().multiplyScalar(Math.sin(time) * 0.01);

        // Active Vibration/Recoil
        if (active) {
            const shake = new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            );
            bob.add(shake);
            // Recoil
            bob.add(forward.clone().multiplyScalar(-0.05));
        }

        const target = camera.position.clone().add(offset).add(bob);

        group.current.position.lerp(target, delta * 10);
        group.current.quaternion.copy(camera.quaternion);
    });

    return (
        <group ref={group}>
            {/* Body */}
            <mesh position={[0, 0, 0.1]} castShadow>
                <boxGeometry args={[0.15, 0.2, 0.3]} />
                <meshStandardMaterial color="#ef4444" /> {/* Red Body */}
            </mesh>
            {/* Handle */}
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[0.05, 0.1, 0.2]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            {/* Nozzle */}
            <mesh position={[0, 0, -0.3]} rotation={[1.57, 0, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.06, 0.5, 16]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
        </group>
    );
}

export function Tools({ leafApi, leafRef }: ToolsProps) {
    // Get store values
    const {
        currentTool,
        upgrades,
        addLeaf,
        pickAmount,
        createBag,
        setCarriedBag,
        carriedBagId,
        score
    } = useGameStore();

    // Preload/Load models here so they are ready before unconditional render
    const handGLTF = useGLTF('/models/hand.glb');
    const rakeGLTF = useGLTF('/models/rake.glb');

    // Raycaster for interaction (Hand tool)
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const { camera, scene, clock } = useThree();
    const toolPosition = useRef(new THREE.Vector3());

    const [isMouseDown, setIsMouseDown] = useState(false);
    const [clicked, setClicked] = useState(false);
    const lastTickTime = useRef(0);

    // Simple ground plane for interaction raycasting
    const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (e.button !== 0 && e.button !== 2) return;

            // Right Click: Throw Bag
            if (e.button === 2) {
                if (currentTool === 'HAND' && carriedBagId) {
                    const throwDir = new THREE.Vector3(0, 0, -1);
                    throwDir.applyQuaternion(camera.quaternion);
                    throwDir.normalize();
                    throwDir.multiplyScalar(75);
                    throwDir.y += 24;
                    useGameStore.getState().triggerBagImpulse(carriedBagId, [throwDir.x, throwDir.y, throwDir.z]);
                    setCarriedBag(null);
                }
                return;
            }

            // Left Click
            setIsMouseDown(true);

            // Force immediate execution in next frame loop
            // By setting lastTickTime to 0, the check (now - lastTickTime > 500) will pass immediately
            // But we need to handle "first click" logic vs "holding" logic if needed.
            // Actually, setting it to -5000 ensures it runs immediately.
            lastTickTime.current = 0;

            // For RAKE visualization
            if (currentTool === 'RAKE') {
                setClicked(true);
            }

            // HAND Bag Pickup Check (Priority over leaves)
            if (currentTool === 'HAND') {
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                const intersects = raycaster.intersectObjects(scene.children, true);
                const hit = intersects.find(i => i.distance < 5 && i.object.name.startsWith('bag-'));

                if (hit) {
                    const bagId = hit.object.name.replace('bag-', '');
                    if (!carriedBagId) {
                        setCarriedBag(bagId);
                        setIsMouseDown(false); // Don't continue to leaf logic
                        return;
                    }
                }

                if (carriedBagId) {
                    setCarriedBag(null);
                    setIsMouseDown(false); // Drop action done
                    return;
                }
            }
        };

        const handleMouseUp = () => {
            setIsMouseDown(false);
            setClicked(false);
        };

        const handleContextMenu = (e: MouseEvent) => e.preventDefault();

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [currentTool, camera, scene, carriedBagId, setCarriedBag]);

    // Unified interaction handler for Tools
    const handleInteraction = (currentTick: number) => {
        // HAND Interactions
        if (currentTool === 'HAND') {
            // 1. Check for Bags (Carrying) - Only on fresh clicks, not continuous
            // This is handled in handleMouseDown separately.

            // 2. Pick Leaves
            if (!leafApi) return;

            const { positions } = leafApi;
            const p = new THREE.Vector3();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            const ray = raycaster.ray;

            let closestIdx = -1;
            let closestDist = 4.5; // Reach

            for (let i = 0; i < leafApi.count; i++) {
                p.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                if (p.distanceTo(camera.position) > 5) continue; // Optimization

                // Closest point on ray
                const pointOnRay = new THREE.Vector3();
                ray.closestPointToPoint(p, pointOnRay);
                const period = 0.2;
                const dist = p.distanceTo(pointOnRay);

                if (dist < 0.8 && p.distanceTo(camera.position) < closestDist) {
                    closestDist = p.distanceTo(camera.position);
                    closestIdx = i;
                }
            }

            if (closestIdx !== -1) {
                const targetIndices = [closestIdx];
                if (pickAmount > 1) {
                    const centerP = new THREE.Vector3(positions[closestIdx * 3], positions[closestIdx * 3 + 1], positions[closestIdx * 3 + 2]);
                    const pickupRadius = pickAmount >= 100 ? 2.5 : 1.0;

                    for (let i = 0; i < leafApi.count; i++) {
                        if (i === closestIdx) continue;
                        if (targetIndices.length >= pickAmount) break;
                        p.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                        if (p.distanceTo(centerP) < pickupRadius) {
                            targetIndices.push(i);
                        }
                    }
                }

                targetIndices.forEach(idx => {
                    positions[idx * 3 + 1] = -1000;
                    const dummy = new THREE.Object3D();
                    dummy.position.set(0, -1000, 0);
                    dummy.updateMatrix();
                    leafRef.current?.setMatrixAt(idx, dummy.matrix);
                });
                if (leafRef.current) leafRef.current.instanceMatrix.needsUpdate = true;

                addLeaf(targetIndices.length);

                const currentScore = useGameStore.getState().score;
                if (currentScore >= 100) {
                    const spawnPos = new THREE.Vector3(0, 0, -1.0);
                    spawnPos.applyQuaternion(camera.quaternion);
                    spawnPos.add(camera.position);
                    spawnPos.y = Math.max(0.5, spawnPos.y);

                    const bagId = Math.random().toString(36).substr(2, 9);
                    createBag([spawnPos.x, spawnPos.y, spawnPos.z], bagId);
                    setCarriedBag(bagId);
                    useGameStore.getState().triggerBagTutorial();
                }
            }
        }

        if (currentTool === 'RAKE') {
            const rakeConfig = getRakeConfig(upgrades.rakeRange) as any;
            applyRakeForces(leafApi, toolPosition.current, camera, rakeConfig);
            setClicked(true); // Trigger visual animation
            setTimeout(() => setClicked(false), 200); // Quick reset
        }
    };

    useFrame((state, delta) => {
        // Raycast to Ground Plane for tool position
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hitPoint = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint);

        if (hit) {
            const dist = hitPoint.distanceTo(camera.position);
            const MAX_REACH = 6.0;
            if (dist > MAX_REACH) {
                const dir = hitPoint.sub(camera.position).normalize();
                toolPosition.current.copy(camera.position).add(dir.multiplyScalar(MAX_REACH));
            } else {
                toolPosition.current.copy(hitPoint);
            }
        } else {
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            toolPosition.current.copy(camera.position).add(forward.multiplyScalar(4));
        }

        const now = state.clock.elapsedTime * 1000;

        // Continuous Interaction Logic
        if (isMouseDown) {
            if (currentTool === 'HAND' || currentTool === 'RAKE') {
                // 200ms interval for HAND/RAKE
                if (now - lastTickTime.current > 200) {
                    handleInteraction(now);
                    lastTickTime.current = now;
                }
            }

            if (currentTool === 'BLOWER') {
                const blowerConfig = getBlowerConfig(upgrades.blowerRange) as any;
                if (now - lastTickTime.current > blowerConfig.tickInterval) { // Faster interval for blower
                    lastTickTime.current = now;
                    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                    forward.y = 0; forward.normalize();
                    const blowerPos = camera.position.clone().add(forward.multiplyScalar(blowerConfig.distance));
                    applyBlowerForces(leafApi, blowerPos, camera, blowerConfig);
                }
            }

            if (currentTool === 'VACUUM') {
                const config = TOOL_CONFIG.VACUUM;
                if (now - lastTickTime.current > config.tickInterval) {
                    lastTickTime.current = now;
                    applyVacuumCollector(leafApi, leafRef, camera, config, addLeaf, createBag);
                }
            }
        }
    });

    const showDualHands = pickAmount >= 10;
    const time = clock.elapsedTime;
    const cycle = (time * 5) % 2;
    const rightActive = isMouseDown && (!showDualHands || cycle < 1);
    const leftActive = isMouseDown && showDualHands && cycle >= 1;

    return (
        <>
            {currentTool === 'HAND' && (
                <>
                    <HandModel active={rightActive} side="right" scene={handGLTF.scene} />
                    {showDualHands && <HandModel active={leftActive} side="left" scene={handGLTF.scene} />}
                </>
            )}
            {currentTool === 'RAKE' && <RakeModel active={isMouseDown} scene={rakeGLTF.scene} />}
            {currentTool === 'BLOWER' && <BlowerModel active={isMouseDown} />}
        </>
    );
}

// Logic Components (Separated to avoid cluttering main render)

function applyVacuumCollector(
    api: any,
    ref: React.RefObject<THREE.InstancedMesh>,
    camera: THREE.Camera,
    config: typeof TOOL_CONFIG.VACUUM,
    onCollect: (n: number) => void,
    createBag: (pos: [number, number, number]) => void
) {
    const count = api.count;
    const positions = api.positions;
    const rangeSq = config.range * config.range;
    const collectSq = config.collectRadius * config.collectRadius;
    const playerPos = camera.position;

    let collectedCount = 0;

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        if (positions[idx + 1] < -100) continue;

        const lx = positions[idx];
        const ly = positions[idx + 1];
        const lz = positions[idx + 2];

        // Calc vector from leaf to player
        const dx = playerPos.x - lx;
        const dy = playerPos.y - ly;
        const dz = playerPos.z - lz;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < rangeSq) {
            if (distSq < collectSq) {
                // Collect!
                positions[idx + 1] = -1000;
                api.velocities[idx * 3 + 1] = 0;

                const dummy = new THREE.Object3D();
                dummy.position.set(0, -1000, 0);
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                if (ref.current) ref.current.setMatrixAt(i, dummy.matrix);

                collectedCount++;
            } else {
                // Pull towards player
                const dist = Math.sqrt(distSq);
                const dir = new THREE.Vector3(dx, dy, dz).normalize();
                const strength = config.strength * (1 - dist / config.range) * 0.2;

                api.applyImpulse(i, [
                    dir.x * strength,
                    dir.y * strength + 0.1, // Slight lift
                    dir.z * strength
                ]);
            }
        }
    }

    if (collectedCount > 0) {
        if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
        onCollect(collectedCount);

        // Auto-Bagging Check (Vacuum tool special)
        const currentScore = useGameStore.getState().score;
        if (currentScore >= 100) {
            const spawnPos = new THREE.Vector3(0, 0, -1.2);
            spawnPos.applyQuaternion(camera.quaternion);
            spawnPos.add(camera.position);
            spawnPos.y = Math.max(0.5, spawnPos.y);

            createBag([spawnPos.x, spawnPos.y, spawnPos.z]);
        }
    }
}

function applyRakeForces(
    api: any,
    toolPos: THREE.Vector3,
    camera: THREE.Camera,
    config: typeof TOOL_CONFIG.RAKE
) {
    const toPlayer = new THREE.Vector3(0, 0, 1);
    toPlayer.applyQuaternion(camera.quaternion);
    toPlayer.y = 0;
    toPlayer.normalize();

    const count = api.count;
    const positions = api.positions;
    const rangeSq = config.range * config.range;

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        if (positions[idx + 1] < -100) continue;

        const lx = positions[idx];
        const ly = positions[idx + 1];
        const lz = positions[idx + 2];

        if (ly > 1.0) continue;

        const dx = lx - toolPos.x;
        const dz = lz - toolPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < rangeSq) {
            const dist = Math.sqrt(distSq);
            const falloff = 1 - (dist / config.range);
            const strength = config.scrapeStrength * falloff * 0.5;

            api.applyImpulse(i, [
                toPlayer.x * strength,
                0.2,
                toPlayer.z * strength
            ]);
        }
    }
}

function applyBlowerForces(
    api: any,
    toolPos: THREE.Vector3,
    camera: THREE.Camera,
    config: typeof TOOL_CONFIG.BLOWER
) {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const coneAngleRad = (config.coneAngle * Math.PI) / 180;
    const count = api.count;
    const positions = api.positions;
    const rangeSq = config.range * config.range;

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        if (positions[idx + 1] < -100) continue;

        const lx = positions[idx];
        const lz = positions[idx + 2];

        const dx = lx - toolPos.x;
        const dz = lz - toolPos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < rangeSq) {
            const leafDir = new THREE.Vector3(dx, 0, dz).normalize();
            const angle = forward.angleTo(leafDir);

            if (angle <= coneAngleRad) {
                const dist = Math.sqrt(distSq);
                const falloff = Math.pow(1 - (dist / config.range), config.falloffExponent);
                const strength = config.blowStrength * falloff * 0.5;

                api.applyImpulse(i, [
                    forward.x * strength + (Math.random() - 0.5) * strength * 0.5,
                    0.1 + Math.random() * 0.2, // lift
                    forward.z * strength + (Math.random() - 0.5) * strength * 0.5
                ]);
            }
        }
    }
}

// Preload models to avoid suspense on tool switch
useGLTF.preload('/models/hand.glb');
useGLTF.preload('/models/lake.glb');
