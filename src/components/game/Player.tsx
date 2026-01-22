'use client';

import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';

const SPEED = 5;
const SPRINT_SPEED = 8;
const JUMP_FORCE = 5;

export function Player() {
    const { camera } = useThree();
    // Removed currentStage subscription to prevent potential re-mounting issues during transition
    const [ref, api] = useSphere(() => ({
        mass: 1,
        type: 'Dynamic',
        position: [0, 0.6, 0], // Stage 1 Spawn (0.6 center - 0.5 radius = 0.1 gap)
        fixedRotation: true,
        args: [0.5], // Radius
        material: { friction: 0, restitution: 0 },
        linearDamping: 0.5,
        collisionFilterGroup: 1,
        collisionFilterMask: 5 // Collides with Default (1) and Trees (4)
    }));

    // Subscribe to Position and Velocity
    const velocity = useRef([0, 0, 0]);
    const position = useRef([0, 0, 0]);
    const pushVelocity = useRef(new THREE.Vector3(0, 0, 0));
    const lastProcessedBlast = useRef(0);

    useEffect(() => {
        const unsubVel = api.velocity.subscribe((v) => (velocity.current = v));
        const unsubPos = api.position.subscribe((p) => (position.current = p));
        return () => {
            unsubVel();
            unsubPos();
        };
    }, [api.velocity, api.position]);

    const input = useRef({
        forward: false,
        backward: false,
        left: false,
        right: false,
        sprint: false,
        jump: false
    });
    const setTool = useGameStore(s => s.setTool);
    const playerPushEvent = useGameStore(s => s.playerPushEvent);
    const canJump = useRef(true); // Track if player is on ground

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Digit1') setTool('HAND');
            if (e.code === 'Digit2') {
                if (useGameStore.getState().unlockedTools.includes('RAKE')) setTool('RAKE');
            }
            if (e.code === 'Digit3') {
                if (useGameStore.getState().unlockedTools.includes('BLOWER')) setTool('BLOWER');
            }
            // if (e.code === 'Digit4') setTool('VACUUM'); // Testing mode: always allowed

            if (e.code === 'KeyE') {
                if (useGameStore.getState().isIntroOpen) {
                    useGameStore.getState().closeIntro();
                    return;
                }
                if (useGameStore.getState().isTutorialOpen) {
                    useGameStore.getState().closeTutorial();
                    return;
                }
                if (useGameStore.getState().isStageTutorialOpen) {
                    useGameStore.getState().closeStageTutorial();
                    return;
                }
                if (useGameStore.getState().isBagTutorialOpen) {
                    useGameStore.getState().closeBagTutorial();
                    return;
                }
            }

            // Block other inputs if intro/tutorial is open
            if (useGameStore.getState().isIntroOpen || useGameStore.getState().isBagTutorialOpen) return;

            if (e.code === 'KeyI') useGameStore.getState().toggleInventory();
            if (e.code === 'KeyU') useGameStore.getState().toggleShop();
            if (e.code === 'KeyP') useGameStore.getState().toggleHelp();

            // Movement inputs
            switch (e.code) {
                case 'KeyW': input.current.forward = true; break;
                case 'KeyS': input.current.backward = true; break;
                case 'KeyA': input.current.left = true; break;
                case 'KeyD': input.current.right = true; break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    input.current.sprint = true;
                    break;
                case 'Space':
                    e.preventDefault(); // Prevent page scroll
                    console.log('[Player] Space pressed, canJump:', canJump.current, 'position Y:', position.current[1]);
                    if (canJump.current) {
                        input.current.jump = true;
                    }
                    break;
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': input.current.forward = false; break;
                case 'KeyS': input.current.backward = false; break;
                case 'KeyA': input.current.left = false; break;
                case 'KeyD': input.current.right = false; break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    input.current.sprint = false;
                    break;
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

        // Check for new Air Vent blast
        if (playerPushEvent && playerPushEvent.timestamp > lastProcessedBlast.current) {
            lastProcessedBlast.current = playerPushEvent.timestamp;

            const pPos = new THREE.Vector3(position.current[0], position.current[1], position.current[2]);
            const ventPos = new THREE.Vector3(...playerPushEvent.pos);
            const dist = pPos.distanceTo(ventPos);

            if (dist < playerPushEvent.radius) {
                const ratio = 1 - dist / playerPushEvent.radius;

                // New targets:
                // Center (0m) -> Up: 3, Out: 20
                // Middle (2m) -> Up: 2, Out: 10 (ratio 0.5)
                // Calculated: 3 * 0.5^0.585 ≈ 2, 20 * 0.5^1.0 = 10
                const upwardForce = 3 * Math.pow(ratio, 0.585);
                const outwardForce = 20 * ratio;

                const dir = pPos.clone().sub(ventPos);
                dir.y = 0;
                dir.normalize();

                // additive impulse to current push velocity
                pushVelocity.current.x += dir.x * outwardForce;
                pushVelocity.current.y += upwardForce;
                pushVelocity.current.z += dir.z * outwardForce;
            }
        }

        // Check if on ground (height-based - player rests at ~0.35)
        const isOnGround = position.current[1] <= 0.5;
        canJump.current = isOnGround;

        // 1. Calculate Movement Vector (Relative to Camera View)
        const forwardDir = new THREE.Vector3();
        camera.getWorldDirection(forwardDir);
        forwardDir.y = 0;
        forwardDir.normalize();

        const rightDir = new THREE.Vector3();
        rightDir.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();

        const moveDir = new THREE.Vector3(0, 0, 0);
        const { forward, backward, left, right, sprint, jump } = input.current;

        if (forward) moveDir.add(forwardDir);
        if (backward) moveDir.sub(forwardDir);
        if (right) moveDir.add(rightDir);
        if (left) moveDir.sub(rightDir);

        if (moveDir.lengthSq() > 0) moveDir.normalize();

        // 2. Prepare Final Velocity
        const currentSpeed = sprint ? SPRINT_SPEED : SPEED;
        const targetMoveVel = moveDir.multiplyScalar(currentSpeed);

        // Add decaying push velocity
        targetMoveVel.x += pushVelocity.current.x;
        targetMoveVel.z += pushVelocity.current.z;

        // Use current Y velocity unless jumping
        let finalVelocityY = velocity.current[1] + pushVelocity.current.y;

        if (jump && isOnGround) {
            finalVelocityY = JUMP_FORCE;
            input.current.jump = false;
        }

        // 3. Apply consolidated velocity (Prevention of race conditions)
        api.velocity.set(targetMoveVel.x, finalVelocityY, targetMoveVel.z);

        // 4. Decay push velocity
        pushVelocity.current.multiplyScalar(0.9);
        if (pushVelocity.current.lengthSq() < 0.001) pushVelocity.current.set(0, 0, 0);

        // 5. Sync Camera Position to Physics Body Position
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
