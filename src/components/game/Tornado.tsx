'use client';

import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import { useGLTF } from '@react-three/drei';

const SPAWN_INTERVAL = 60; // 60s
const LIFE_TIME = 12; // 12s
const SUCTION_RADIUS = 4;
const SUCTION_STRENGTH = 1.5;
const ORBIT_RADIUS = 1.2;
const ORBIT_SPEED = 3.0;
const SCATTER_STRENGTH = 5.0;

export function Tornado() {
    const currentStage = useGameStore(s => s.currentStage);
    const bags = useGameStore(s => s.bags);
    const triggerBagImpulse = useGameStore(s => s.triggerBagImpulse);
    const carriedBagId = useGameStore(s => s.carriedBagId);

    const tornadoRef = useRef<THREE.Group>(null);
    const position = useRef(new THREE.Vector3(120, 0, 0));
    const setTornadoPosition = useGameStore(s => s.setTornadoPosition);

    // Load tornado model
    const { scene } = useGLTF('/models/tornado.glb');
    const clonedScene = scene.clone();

    // Enable shadows on the model
    useEffect(() => {
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                }
            }
        });
    }, [clonedScene]);

    useFrame((state, delta) => {
        if (currentStage !== 5) {
            setTornadoPosition(null);
            return;
        }

        const now = state.clock.elapsedTime;

        // Move tornado around the zone
        const angle = now * 0.3;
        const radius = 10;
        const tornadoX = 120 + Math.cos(angle) * radius;
        const tornadoZ = Math.sin(angle) * radius;
        position.current.set(tornadoX, 0, tornadoZ);

        // Update global state so LeafBag can use the same position
        setTornadoPosition([tornadoX, 0, tornadoZ]);

        // Visual swirl animation
        if (tornadoRef.current) {
            tornadoRef.current.position.copy(position.current);
            tornadoRef.current.rotation.y += delta * 5;
        }

        // Physics logic: Influence bags
        bags.forEach(bag => {
            if (bag.id === carriedBagId) return; // Don't suck carried bags

            const bagPos = new THREE.Vector3(bag.position[0], bag.position[1], bag.position[2]);
            const dist = bagPos.distanceTo(position.current);

            if (dist < SUCTION_RADIUS) {
                const toTornado = position.current.clone().sub(bagPos);

                // 1. Suction toward center
                const suction = toTornado.clone().normalize().multiplyScalar(SUCTION_STRENGTH * delta);

                // 2. Orbit (perpendicular)
                const orbit = new THREE.Vector3(-toTornado.z, 0, toTornado.x).normalize().multiplyScalar(ORBIT_SPEED * delta);

                // 3. Upward lift
                const lift = new THREE.Vector3(0, 0.5 * delta, 0);

                const finalForce = suction.add(orbit).add(lift);
                triggerBagImpulse(bag.id, [finalForce.x, finalForce.y, finalForce.z]);
            }
        });
    });

    if (currentStage !== 5) return null;

    return (
        <group ref={tornadoRef}>
            <primitive object={clonedScene} scale={[2, 2, 2]} />
            <pointLight position={[0, 3, 0]} intensity={2} color="cyan" />
        </group>
    );
}

useGLTF.preload('/models/tornado.glb');
