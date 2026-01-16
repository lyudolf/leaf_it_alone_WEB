import * as THREE from 'three';

/**
 * Creates a simple maple leaf shape geometry (~50-80 polygons)
 * Based on a 5-pointed maple leaf silhouette
 */
export function createLeafGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();

    // Start from center bottom (stem)
    shape.moveTo(0, -0.3);

    // Bottom center lobe (small)
    shape.lineTo(-0.1, -0.15);
    shape.lineTo(-0.15, 0);

    // Left bottom lobe
    shape.lineTo(-0.25, -0.05);
    shape.lineTo(-0.35, 0.1);
    shape.lineTo(-0.3, 0.2);

    // Left top lobe
    shape.lineTo(-0.4, 0.25);
    shape.lineTo(-0.5, 0.4);
    shape.lineTo(-0.4, 0.45);

    // Top center lobe (tallest)
    shape.lineTo(-0.2, 0.5);
    shape.lineTo(0, 0.7);
    shape.lineTo(0.2, 0.5);

    // Right top lobe
    shape.lineTo(0.4, 0.45);
    shape.lineTo(0.5, 0.4);
    shape.lineTo(0.4, 0.25);

    // Right bottom lobe
    shape.lineTo(0.3, 0.2);
    shape.lineTo(0.35, 0.1);
    shape.lineTo(0.25, -0.05);

    // Right center lobe
    shape.lineTo(0.15, 0);
    shape.lineTo(0.1, -0.15);

    // Back to stem
    shape.lineTo(0, -0.3);

    // Extrude settings for thin leaf
    const extrudeSettings = {
        depth: 0.02,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Center the geometry
    geometry.center();

    // Rotate to lay flat
    geometry.rotateX(Math.PI / 2);

    return geometry;
}
