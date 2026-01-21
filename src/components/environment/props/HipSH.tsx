import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';

export function HipSH({ position, scale = 1, rotation = [0, 0, 0] }: { position: [number, number, number], scale?: number, rotation?: [number, number, number] }) {
    const { scene, animations } = useGLTF('/models/Hip_SH.glb');

    // Physics body - Kinematic to allow manual rotation update while affecting collisions
    const [ref, api] = useBox(() => ({
        mass: 0,
        type: 'Kinematic',
        position,
        rotation: rotation as [number, number, number],
        args: [2 * scale, 4 * scale, 2 * scale]
    }));

    // Animation support
    const { actions } = useAnimations(animations, ref);

    useEffect(() => {
        // Play the first available animation loop
        const actionNames = Object.keys(actions);
        if (actionNames.length > 0) {
            const firstAction = actions[actionNames[0]];
            firstAction?.reset().fadeIn(0.5).play();
        }

        // Log animations for debugging if needed
        // console.log("Hip_SH Animations:", actionNames);
    }, [actions]);

    // Billboard effect: Always face the player (Y-axis only)
    useFrame((state) => {
        if (!ref.current) return;

        const playerPos = state.camera.position;
        const myPos = ref.current.position;

        // Calculate angle to face player
        const dx = playerPos.x - myPos.x;
        const dz = playerPos.z - myPos.z;

        // atan2(x, z) gives angle from +Z axis in Three.js usually
        const angle = Math.atan2(dx, dz);

        // Apply rotation to physics body (which syncs to mesh)
        api.rotation.set(0, angle, 0);
    });

    return (
        <group ref={ref as any}>
            <primitive object={scene} scale={scale} />
        </group>
    );
}

useGLTF.preload('/models/Hip_SH.glb');
