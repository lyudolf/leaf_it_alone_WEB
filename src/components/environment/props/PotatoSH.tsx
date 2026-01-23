import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import { SCENES } from '@/spec/scenes';

type PotatoState = 'IDLE' | 'MOVING_TO_BAG' | 'CARRYING_BAG';

export function PotatoSH({ position }: { position: [number, number, number] }) {
    const { scene, animations } = useGLTF('/models/Potato_SH.glb');

    // Game Store
    const bags = useGameStore(s => s.bags);
    const removeBag = useGameStore(s => s.removeBag);
    const aiSellBag = useGameStore(s => (s as any).aiSellBag);
    const currentStage = useGameStore(s => s.currentStage);

    // Local State
    const [state, setState] = useState<PotatoState>('IDLE');
    const [targetBagId, setTargetBagId] = useState<string | null>(null);
    const [heldBagValue, setHeldBagValue] = useState<number>(0);

    // Physics
    const [ref, api] = useBox(() => ({
        mass: 50,
        fixedRotation: true,
        position,
        args: [1, 2, 1],
        material: { friction: 0.0, restitution: 0 },
        collisionFilterGroup: 2,  // AI Helper group
        collisionFilterMask: 1    // Only collide with default group (ground, obstacles)
    }));

    // Animation
    const { actions } = useAnimations(animations, ref);
    const currentAction = useRef<string>('');

    // Refs
    const stateRef = useRef(state);
    const targetBagIdRef = useRef(targetBagId);
    const posRef = useRef<[number, number, number]>(position);

    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => { targetBagIdRef.current = targetBagId; }, [targetBagId]);
    useEffect(() => {
        const unsub = api.position.subscribe(v => posRef.current = v);
        return unsub;
    }, [api.position]);

    // Play animation
    useEffect(() => {
        const actionNames = Object.keys(actions);
        if (actionNames.length > 0) {
            const actionName = actionNames.find(n => n.toLowerCase().includes('walk')) || actionNames[0];
            actions[actionName]?.reset().fadeIn(0.5).play();
            currentAction.current = actionName;
        }
    }, [actions]);

    // Find nearest bag
    const findNearestBag = () => {
        if (bags.length === 0) return null;
        let nearest = null;
        let minDist = Infinity;
        const myPos = new THREE.Vector3(...posRef.current);
        for (const bag of bags) {
            const dist = myPos.distanceTo(new THREE.Vector3(...bag.position));
            if (dist < minDist) {
                minDist = dist;
                nearest = bag;
            }
        }
        return nearest;
    };

    // Simple AI Logic
    useFrame(() => {
        if (!ref.current) return;

        const myPos = new THREE.Vector3(...posRef.current);
        const trashBinConfig = SCENES[Math.min(currentStage - 1, SCENES.length - 1)].trashBins[0];
        const binPos = new THREE.Vector3(...trashBinConfig.position);

        switch (stateRef.current) {
            case 'IDLE':
                const bag = findNearestBag();
                if (bag) {
                    setTargetBagId(bag.id);
                    setState('MOVING_TO_BAG');
                } else {
                    api.velocity.set(0, 0, 0);
                }
                break;

            case 'MOVING_TO_BAG':
                const targetBag = bags.find(b => b.id === targetBagIdRef.current);
                if (!targetBag) {
                    setState('IDLE');
                    break;
                }

                const bagPos = new THREE.Vector3(...targetBag.position);
                const dirToBag = new THREE.Vector3().subVectors(bagPos, myPos).normalize();
                const distToBag = myPos.distanceTo(bagPos);

                api.velocity.set(dirToBag.x * 4, -1, dirToBag.z * 4);
                api.rotation.set(0, Math.atan2(dirToBag.x, dirToBag.z), 0);

                if (distToBag < 1.5) {
                    setHeldBagValue(targetBag.value);
                    removeBag(targetBag.id, false);
                    setState('CARRYING_BAG');
                }
                break;

            case 'CARRYING_BAG':
                // Find nearest bin
                const bins = SCENES[Math.min(currentStage - 1, SCENES.length - 1)].trashBins;
                let nearestBinPos = new THREE.Vector3(...bins[0].position);
                let minBinDist = Infinity;

                for (const bin of bins) {
                    const bPos = new THREE.Vector3(...bin.position);
                    const d = myPos.distanceTo(bPos);
                    if (d < minBinDist) {
                        minBinDist = d;
                        nearestBinPos = bPos;
                    }
                }

                const dirToBin = new THREE.Vector3().subVectors(nearestBinPos, myPos).normalize();
                const distToBin = myPos.distanceTo(nearestBinPos);

                api.velocity.set(dirToBin.x * 4, -1, dirToBin.z * 4);
                api.rotation.set(0, Math.atan2(dirToBin.x, dirToBin.z), 0);

                if (distToBin < 3.0) {
                    if (aiSellBag) {
                        aiSellBag(heldBagValue);
                    }
                    setState('IDLE');
                    setHeldBagValue(0);
                }
                break;
        }
    });

    return (
        <group ref={ref as any}>
            <primitive object={scene} scale={1.5} position={[0, -1, 0]} />
            {state === 'CARRYING_BAG' && (
                <primitive object={useGLTF('/models/trash_pack.glb').scene.clone()} position={[0, 0.8, 0]} scale={0.4} />
            )}
        </group>
    );
}

useGLTF.preload('/models/Potato_SH.glb');
useGLTF.preload('/models/trash_pack.glb');
