'use client';

import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';

const SPEED = 5;

export function Player() {
    const { camera } = useThree();
    const [ref, api] = useSphere(() => ({
        mass: 1,
        type: 'Dynamic',
        position: [0, 1, 0],
        fixedRotation: true,
        args: [0.35], // Radius
        material: { friction: 0, restitution: 0 }
    }));

    // Subscribe to Position and Velocity
    const velocity = useRef([0, 0, 0]);
    const position = useRef([0, 0, 0]);

    useEffect(() => {
        const unsubVel = api.velocity.subscribe((v) => (velocity.current = v));
        const unsubPos = api.position.subscribe((p) => (position.current = p));
        return () => {
            unsubVel();
            unsubPos();
        };
    }, [api.velocity, api.position]);

    const input = useRef({ forward: false, backward: false, left: false, right: false });
    const { setTool } = useGameStore();

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Digit1') setTool('HAND');
            if (e.code === 'Digit2') setTool('RAKE');
            if (e.code === 'Digit3') setTool('BLOWER');

            if (e.code === 'KeyI') useGameStore.getState().toggleInventory();
            if (e.code === 'KeyU') useGameStore.getState().toggleShop();

            // Store interactions only
            switch (e.code) {
                case 'KeyW': input.current.forward = true; break;
                case 'KeyS': input.current.backward = true; break;
                case 'KeyA': input.current.left = true; break;
                case 'KeyD': input.current.right = true; break;
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': input.current.forward = false; break;
                case 'KeyS': input.current.backward = false; break;
                case 'KeyA': input.current.left = false; break;
                case 'KeyD': input.current.right = false; break;
            }
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [setTool]);

    useFrame((state, delta) => {
        if (!ref.current) return;

        // 1. Calculate Movement Vector (Relative to Camera View)
        const forwardDir = new THREE.Vector3();
        camera.getWorldDirection(forwardDir);
        forwardDir.y = 0;
        forwardDir.normalize();

        const rightDir = new THREE.Vector3();
        rightDir.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();

        const moveDir = new THREE.Vector3(0, 0, 0);
        const { forward, backward, left, right } = input.current;

        if (forward) moveDir.add(forwardDir);
        if (backward) moveDir.sub(forwardDir);
        if (right) moveDir.add(rightDir);
        if (left) moveDir.sub(rightDir);

        if (moveDir.lengthSq() > 0) moveDir.normalize();

        // 2. Apply Velocity to Physics Body
        const targetVel = moveDir.multiplyScalar(SPEED);
        api.velocity.set(targetVel.x, velocity.current[1], targetVel.z);

        // 3. Sync Camera Position to Physics Body Position
        // Must use the subscribed position to guarantee sync with physics world
        camera.position.set(
            position.current[0],
            position.current[1] + 1.6, // Eye height
            position.current[2]
        );
    });

    return (
        <mesh ref={ref as any}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} visible={false} />
        </mesh>
    );
}
