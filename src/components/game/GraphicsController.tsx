'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGameStore } from '@/game/store';

/**
 * GraphicsController
 * Applies graphics settings to the Three.js renderer.
 * Must be placed inside Canvas as a child component.
 */
export function GraphicsController() {
    const { gl, scene } = useThree();

    const shadows = useGameStore(s => s.graphicsShadows);
    const resolution = useGameStore(s => s.graphicsResolution);
    const antialiasing = useGameStore(s => s.graphicsAntialiasing);
    const highQuality = useGameStore(s => s.graphicsHighQuality);

    // Apply resolution scaling
    useEffect(() => {
        gl.setPixelRatio(window.devicePixelRatio * resolution);
    }, [gl, resolution]);

    // Apply shadow settings
    useEffect(() => {
        gl.shadowMap.enabled = shadows;

        // Update all lights in scene
        scene.traverse((obj) => {
            if ((obj as any).isLight && (obj as any).shadow) {
                (obj as any).castShadow = shadows;
            }
            if ((obj as any).isMesh) {
                (obj as any).castShadow = shadows;
                (obj as any).receiveShadow = shadows;
            }
        });
    }, [gl, scene, shadows]);

    // Antialiasing is set at Canvas creation, so we can't change it dynamically
    // High quality textures would require texture reload, simplified for now

    return null;
}
