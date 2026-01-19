'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/game/store';
import { TOOL_CONFIG } from '@/game/toolConfig';
import * as THREE from 'three';
import { useEffect, useRef, useState, useMemo } from 'react';

interface ToolsProps {
    leafApi: any;
    leafRef: React.RefObject<THREE.InstancedMesh>;
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

    // Raycaster for interaction (Hand tool)
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const { camera, scene } = useThree();
    const toolPosition = useRef(new THREE.Vector3());

    const [isMouseDown, setIsMouseDown] = useState(false);
    const [clicked, setClicked] = useState(false);
    const lastTickTime = useRef(0);

    // Simple ground plane for interaction raycasting
    const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);

    useEffect(() => {
        const handleDown = () => {
            setIsMouseDown(true);
            if (currentTool === 'HAND' || currentTool === 'RAKE') {
                setClicked(true);
            }
        };
        const handleUp = () => setIsMouseDown(false);

        const handleMouseDown = (e: MouseEvent) => {
            setIsMouseDown(true); // Keep this for RAKE/BLOWER visual feedback
            if (currentTool === 'RAKE') {
                setClicked(true); // Keep this for RAKE
            }

            // Throw Bag (Right Click)
            if (e.button === 2 && currentTool === 'HAND' && carriedBagId) {
                // Calc throw direction
                const throwDir = new THREE.Vector3(0, 0, -1);
                throwDir.applyQuaternion(camera.quaternion);
                throwDir.normalize();

                // Add some upward force
                throwDir.multiplyScalar(75); // Forward force (3x boost)
                throwDir.y += 24; // Upward arc (3x boost)

                // Trigger impulse and drop
                useGameStore.getState().triggerBagImpulse(carriedBagId, [throwDir.x, throwDir.y, throwDir.z]);
                setCarriedBag(null);
                return;
            }

            if (e.button !== 0) return; // Ignore other buttons for standard interaction

            // HAND Interactions
            if (currentTool === 'HAND') {
                // 1. Check for Bags (Carrying)
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                // Intersect objects in scene. Optimize by filtering?
                // For MVP, intersecting scene.children is risky (too many leaves).
                // Better: find objects with name starting with 'bag-'
                const candidates = scene.children.filter(obj => obj.name.startsWith('bag-') || (obj.children[0] && obj.children[0].name.startsWith('bag-')));
                // Note: R3F groups might wrap the mesh.

                // Let's assume naive raycast against specific layer or iterate bags from store

                // actually, we can just look for names in the intersect result of the whole scene
                // but limit distance.
                const intersects = raycaster.intersectObjects(scene.children, true);

                // Find first valid hit
                const hit = intersects.find(i => i.distance < 3 && i.object.name.startsWith('bag-'));

                if (hit) {
                    const bagId = hit.object.name.replace('bag-', '');
                    if (!carriedBagId) {
                        setCarriedBag(bagId); // Pick up
                    }
                    return; // Handled bag, don't pick leaf
                }

                // If holding a bag, drop it
                if (carriedBagId) {
                    setCarriedBag(null);
                    return;
                }

                // 2. Pick Leaves (if not carrying)
                // Existing logic...
                if (!leafApi) return;

                const { positions } = leafApi;
                const p = new THREE.Vector3();
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                const ray = raycaster.ray;

                let closestIdx = -1;
                let closestDist = 4.5; // Increased reach for better UX

                // Optimization: Only check nearby?
                // Given 10k leaves, linear scan is expensive every click?
                // Previous logic did linear scan. We'll stick to it or rely on spatial grid if available.
                // Reusing the linear scan for now.

                for (let i = 0; i < leafApi.count; i++) {
                    p.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                    // Check distance to player/camera first to prune
                    if (p.distanceTo(camera.position) > 4) continue;

                    // Ray distance
                    // Closest point on ray
                    const pointOnRay = new THREE.Vector3();
                    ray.closestPointToPoint(p, pointOnRay);
                    const dist = p.distanceTo(pointOnRay);

                    if (dist < 0.5 && p.distanceTo(camera.position) < closestDist) {
                        closestDist = p.distanceTo(camera.position);
                        closestIdx = i;
                    }
                }

                if (closestIdx !== -1) {
                    // Pick up specific amount
                    // We need to remove multiple leaves?
                    // MVP: Just remove ONE visual leaf but add 'pickAmount' to score.
                    // Ideally we remove 'pickAmount' leaves nearby.

                    // Let's implement multi-removal.
                    const targetIndices = [closestIdx];

                    if (pickAmount > 1) {
                        // Find neighbors
                        const centerP = new THREE.Vector3(positions[closestIdx * 3], positions[closestIdx * 3 + 1], positions[closestIdx * 3 + 2]);
                        for (let i = 0; i < leafApi.count; i++) {
                            if (i === closestIdx) continue;
                            if (targetIndices.length >= pickAmount) break;

                            p.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                            if (p.distanceTo(centerP) < 1.0) {
                                targetIndices.push(i);
                            }
                        }
                    }

                    // Remove them
                    targetIndices.forEach(idx => {
                        // Move to underworld
                        positions[idx * 3 + 1] = -1000;
                        leafApi.velocities[idx * 3 + 1] = 0;
                        // Force visual update to hide it immediately
                        const dummy = new THREE.Object3D();
                        dummy.position.set(0, -1000, 0);
                        dummy.scale.set(0, 0, 0);
                        dummy.updateMatrix();
                        leafRef.current.setMatrixAt(idx, dummy.matrix);
                    });
                    if (leafRef.current) {
                        leafRef.current.instanceMatrix.needsUpdate = true;
                    }

                    // Add score
                    addLeaf(targetIndices.length); // Actual collected count

                    // Check for Bag Spawn
                    // We need to check the CURRENT score in store (synchronously if possible, or assume state is fresh)
                    const currentScore = useGameStore.getState().score;
                    if (currentScore >= 100) {
                        // Spawn Bag in front of player
                        const spawnPos = new THREE.Vector3(0, 0, -1.2);
                        spawnPos.applyQuaternion(camera.quaternion);
                        spawnPos.add(camera.position);
                        spawnPos.y = Math.max(0.5, spawnPos.y); // Keep above ground

                        createBag([spawnPos.x, spawnPos.y, spawnPos.z]);
                    }
                }
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            setIsMouseDown(false);
            setClicked(false); // Reset clicked for RAKE
            if (currentTool === 'HAND' && carriedBagId) {
                setCarriedBag(null); // Drop on release
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && currentTool === 'HAND' && carriedBagId) {
                // Throw Bag
                // Calc throw direction
                const throwDir = new THREE.Vector3(0, 0, -1);
                throwDir.applyQuaternion(camera.quaternion);
                throwDir.normalize();

                // Add some upward force
                throwDir.multiplyScalar(8); // Forward force
                throwDir.y += 3; // Upward arc

                // Trigger impulse and drop
                useGameStore.getState().triggerBagImpulse(carriedBagId, [throwDir.x, throwDir.y, throwDir.z]);
                setCarriedBag(null);
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault(); // Block browser menu
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('contextmenu', handleContextMenu);

        // Remove spacebar listener
        // window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [currentTool, leafApi, camera, scene, pickAmount, carriedBagId, addLeaf, createBag, setCarriedBag, leafRef]);

    useFrame((state, delta) => {
        // Raycast to Ground Plane for tool position
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const hitPoint = new THREE.Vector3();
        const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint);

        if (hit) {
            toolPosition.current.copy(hitPoint);
        } else {
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            toolPosition.current.copy(camera.position).add(forward.multiplyScalar(5));
        }

        // HAND tool logic is now primarily in the useEffect for mousedown
        // The old HAND logic for picking up a single leaf is replaced by the new useEffect logic.
        // The `clicked` state is no longer used for HAND.

        if (currentTool === 'RAKE' && clicked) {
            applyRakeForces(leafApi, toolPosition.current, camera, TOOL_CONFIG.RAKE);
            setClicked(false);
            return;
        }

        if (currentTool === 'BLOWER' && isMouseDown) {
            const now = state.clock.elapsedTime * 1000;
            const config = TOOL_CONFIG.BLOWER;

            if (now - lastTickTime.current < config.tickInterval) return;
            lastTickTime.current = now;

            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            forward.y = 0; forward.normalize();
            const blowerPos = camera.position.clone().add(forward.multiplyScalar(config.distance));

            applyBlowerForces(leafApi, blowerPos, camera, config);
        }

        if (currentTool === 'VACUUM' && isMouseDown) {
            const now = state.clock.elapsedTime * 1000;
            const config = TOOL_CONFIG.VACUUM;

            if (now - lastTickTime.current < config.tickInterval) return;
            lastTickTime.current = now;

            applyVacuumCollector(leafApi, leafRef, camera, config, addLeaf, createBag);
        }
    });

    // Show visual colliders for testing tools
    const config = (TOOL_CONFIG as any)[currentTool];
    if (!config) return null;

    return (
        <>
            <mesh position={toolPosition.current}>
                <sphereGeometry args={[config.range, 32, 32]} />
                <meshBasicMaterial
                    color={currentTool === 'RAKE' ? '#ff8800' : currentTool === 'VACUUM' ? '#ff00ff' : '#00ddff'}
                    wireframe
                    opacity={isMouseDown ? 0.3 : 0.1}
                    transparent
                />
            </mesh>

            {currentTool === 'VACUUM' && (
                <mesh position={camera.position.clone().add(new THREE.Vector3(0, -0.5, 0))}>
                    <sphereGeometry args={[config.collectRadius, 16, 16]} />
                    <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
                </mesh>
            )}
        </>
    );
}

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
