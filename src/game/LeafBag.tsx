'use client';

import { useBox } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import { useGLTF } from '@react-three/drei';

export function LeafBag({ id, initialPos }: { id: string; initialPos: [number, number, number] }) {
    const { camera } = useThree();
    const isCarried = useGameStore(s => s.carriedBagId === id);

    // Track physics position
    const physicsPos = useRef<[number, number, number]>(initialPos);

    // Load GLB model
    const { scene } = useGLTF('/models/trash_pack.glb');
    const clonedScene = scene.clone();

    // Enable shadows on the model
    useEffect(() => {
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }, [clonedScene]);

    // Physics body
    const [ref, api] = useBox(() => ({
        mass: 5,
        position: initialPos,
        args: [0.4, 0.4, 0.4],
        collisionFilterGroup: 1,
        collisionFilterMask: 37, // Collide with Ground(1), Trees(4), TrashBin(32)
        userData: { bagId: id },
        onCollide: (e) => {
            const otherBody = e.body as any;
            const targetBody = e.target as any;
            const isBin = (obj: any) => obj?.userData?.type === 'bin';

            if (isBin(otherBody) || isBin(targetBody)) {
                useGameStore.getState().removeBag(id, true);
            }
        }
    }));

    // Start with a small upward impulse
    useEffect(() => {
        api.velocity.set(0, 3, 0);
    }, []);

    // Subscribe to position updates
    useEffect(() => {
        const unsubscribe = api.position.subscribe((pos) => {
            physicsPos.current = pos as [number, number, number];
        });
        return unsubscribe;
    }, [api]);

    // Apply continuous tornado force
    useFrame(() => {
        if (isCarried) return;

        // Get tornado position from global state
        const tornadoPos = useGameStore.getState().tornadoPosition;
        if (!tornadoPos) return; // No tornado active

        const bagPos = new THREE.Vector3(physicsPos.current[0], physicsPos.current[1], physicsPos.current[2]);
        const tornadoVec = new THREE.Vector3(tornadoPos[0], tornadoPos[1], tornadoPos[2]);

        const dist = bagPos.distanceTo(tornadoVec);
        const SUCTION_RADIUS = 5;

        if (dist < SUCTION_RADIUS) {
            const toTornado = tornadoVec.clone().sub(bagPos);
            const SUCTION_STRENGTH = 0.5;
            const ORBIT_SPEED = 0.3;

            // Suction
            const suction = toTornado.clone().normalize().multiplyScalar(SUCTION_STRENGTH);
            // Orbit
            const orbit = new THREE.Vector3(-toTornado.z, 0, toTornado.x).normalize().multiplyScalar(ORBIT_SPEED);
            // Lift
            const lift = new THREE.Vector3(0, 0.2, 0);

            const finalForce = suction.add(orbit).add(lift);

            // Apply velocity directly
            api.velocity.set(
                finalForce.x * 10,
                finalForce.y * 10,
                finalForce.z * 10
            );

            // Debug log
            if (Math.random() < 0.01) {
                console.log(`Tornado affecting bag ${id}: dist=${dist.toFixed(1)}m, bagPos=[${bagPos.x.toFixed(1)}, ${bagPos.z.toFixed(1)}], tornadoPos=[${tornadoPos[0].toFixed(1)}, ${tornadoPos[2].toFixed(1)}]`);
            }
        }
    });

    useFrame(() => {
        if (isCarried) {
            const target = new THREE.Vector3(0, 0, -1.2);
            target.applyQuaternion(camera.quaternion);
            target.add(camera.position);

            api.position.set(target.x, target.y, target.z);
            api.velocity.set(0, 0, 0);
            api.angularVelocity.set(0, 0, 0);
        }
    });

    // Handle Throw Impulse
    const bagImpulse = useGameStore(s => s.bagImpulse);
    const clearBagImpulse = useGameStore(s => s.clearBagImpulse);

    useEffect(() => {
        if (bagImpulse && bagImpulse.id === id) {
            api.applyImpulse(bagImpulse.force, [0, 0, 0]);
            clearBagImpulse();
        }
    }, [bagImpulse, id, api, clearBagImpulse]);

    return (
        <group ref={ref as any}>
            {/* GLB Model - Reduced scale */}
            <primitive
                object={clonedScene}
                scale={0.4}
                rotation={[0, 0, 0]}
            />

            {/* Invisible Hit Target for Hand tools (picking up) */}
            <mesh name={`bag-${id}`} visible={false}>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    );
}

// Preload the model
useGLTF.preload('/models/trash_pack.glb');
