/**
 * MoleSniperBrain.ts
 * ONNX-based inference for MoleSniper AI targeting.
 * Falls back to rule-based targeting if ONNX fails.
 */

import * as ort from 'onnxruntime-web';

// --- Constants (must match training script) ---
export const GRID_COLS = 20;
export const GRID_ROWS = 16;
export const CELL_SIZE = 1.5; // meters
export const BOUNDS_X: [number, number] = [105, 135];
export const BOUNDS_Z: [number, number] = [-12, 12];
export const MIN_DIST = 4.0;
export const MAX_DIST = 9.0;
export const CONE_HALF_ANGLE_DEG = 55;

const INPUT_SIZE = GRID_COLS * GRID_ROWS + 4; // 324
const MODEL_PATH = '/models/mole_sniper.onnx';

// --- Singleton Session ---
let session: ort.InferenceSession | null = null;
let sessionLoading = false;
let sessionFailed = false;

export async function loadModel(): Promise<boolean> {
    if (session) return true;
    if (sessionFailed) return false;
    if (sessionLoading) {
        // Wait for loading
        while (sessionLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        return session !== null;
    }

    sessionLoading = true;
    try {
        session = await ort.InferenceSession.create(MODEL_PATH, {
            executionProviders: ['wasm']
        });
        console.log('[MoleSniperBrain] ONNX model loaded successfully');
        sessionLoading = false;
        return true;
    } catch (e) {
        console.warn('[MoleSniperBrain] Failed to load ONNX model, using fallback:', e);
        sessionFailed = true;
        sessionLoading = false;
        return false;
    }
}

export function isModelLoaded(): boolean {
    return session !== null;
}

// --- Coordinate Helpers ---
export function cellToWorld(ix: number, iz: number): [number, number] {
    const worldX = BOUNDS_X[0] + (ix + 0.5) * CELL_SIZE;
    const worldZ = BOUNDS_Z[0] + (iz + 0.5) * CELL_SIZE;
    return [worldX, worldZ];
}

export function indexToCell(idx: number): [number, number] {
    const ix = idx % GRID_COLS;
    const iz = Math.floor(idx / GRID_COLS);
    return [ix, iz];
}

export function worldToNormalized(x: number, z: number): [number, number] {
    const u = (x - BOUNDS_X[0]) / (BOUNDS_X[1] - BOUNDS_X[0]);
    const v = (z - BOUNDS_Z[0]) / (BOUNDS_Z[1] - BOUNDS_Z[0]);
    return [u, v];
}

// --- Validation ---
function isValidTarget(
    playerX: number, playerZ: number,
    playerFx: number, playerFz: number,
    cellX: number, cellZ: number
): boolean {
    const dx = cellX - playerX;
    const dz = cellZ - playerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Distance constraint
    if (dist < MIN_DIST || dist > MAX_DIST) return false;

    // Cone constraint
    if (dist < 0.01) return false;

    const dirX = dx / dist;
    const dirZ = dz / dist;
    const dot = dirX * playerFx + dirZ * playerFz;
    const angleDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);

    return angleDeg <= CONE_HALF_ANGLE_DEG;
}

function computeInterceptScore(
    playerX: number, playerZ: number,
    playerFx: number, playerFz: number,
    cellX: number, cellZ: number
): number {
    const dx = cellX - playerX;
    const dz = cellZ - playerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.01) return 0;

    const dirX = dx / dist;
    const dirZ = dz / dist;
    const dot = dirX * playerFx + dirZ * playerFz;

    const distanceScore = 1.0 - Math.abs(dist - 6.5) / 2.5;
    return Math.max(0, dot * distanceScore);
}

// --- Fallback Rule-Based Targeting ---
function fallbackPredict(
    densityMap: Float32Array,
    playerPos: [number, number],
    playerDir: [number, number]
): number {
    const [playerX, playerZ] = playerPos;
    const [playerFx, playerFz] = playerDir;

    let bestCell = -1;
    let bestScore = -Infinity;

    for (let iz = 0; iz < GRID_ROWS; iz++) {
        for (let ix = 0; ix < GRID_COLS; ix++) {
            const [cellX, cellZ] = cellToWorld(ix, iz);

            if (!isValidTarget(playerX, playerZ, playerFx, playerFz, cellX, cellZ)) {
                continue;
            }

            const intercept = computeInterceptScore(playerX, playerZ, playerFx, playerFz, cellX, cellZ);
            const density = densityMap[iz * GRID_COLS + ix] || 0;
            const score = intercept + density * 0.2;

            if (score > bestScore) {
                bestScore = score;
                bestCell = iz * GRID_COLS + ix;
            }
        }
    }

    // Random fallback if no valid cell
    if (bestCell === -1) {
        const validCells: number[] = [];
        for (let iz = 0; iz < GRID_ROWS; iz++) {
            for (let ix = 0; ix < GRID_COLS; ix++) {
                const [cellX, cellZ] = cellToWorld(ix, iz);
                if (isValidTarget(playerX, playerZ, playerFx, playerFz, cellX, cellZ)) {
                    validCells.push(iz * GRID_COLS + ix);
                }
            }
        }
        if (validCells.length > 0) {
            bestCell = validCells[Math.floor(Math.random() * validCells.length)];
        } else {
            bestCell = Math.floor(Math.random() * (GRID_COLS * GRID_ROWS));
        }
    }

    return bestCell;
}

// --- Main Predict Function ---
export async function predict(
    densityMap: Float32Array,
    playerPos: [number, number], // world coords
    playerDir: [number, number]  // normalized direction
): Promise<{ cellIndex: number; worldPos: [number, number]; usedONNX: boolean }> {
    const [u, v] = worldToNormalized(playerPos[0], playerPos[1]);

    // Try ONNX inference
    if (session) {
        try {
            // Build input: densityMap (320) + playerPos (2) + playerDir (2)
            const input = new Float32Array(INPUT_SIZE);
            input.set(densityMap.slice(0, GRID_COLS * GRID_ROWS), 0);
            input[320] = u;
            input[321] = v;
            input[322] = playerDir[0];
            input[323] = playerDir[1];

            const tensor = new ort.Tensor('float32', input, [1, INPUT_SIZE]);
            const results = await session.run({ input: tensor });
            const output = results.output.data as Float32Array;

            // ArgMax
            let maxIdx = 0;
            let maxVal = output[0];
            for (let i = 1; i < output.length; i++) {
                if (output[i] > maxVal) {
                    maxVal = output[i];
                    maxIdx = i;
                }
            }

            const [ix, iz] = indexToCell(maxIdx);
            const worldPos = cellToWorld(ix, iz);

            return { cellIndex: maxIdx, worldPos, usedONNX: true };
        } catch (e) {
            console.warn('[MoleSniperBrain] ONNX inference failed, using fallback:', e);
        }
    }

    // Fallback
    const cellIndex = fallbackPredict(densityMap, playerPos, playerDir);
    const [ix, iz] = indexToCell(cellIndex);
    const worldPos = cellToWorld(ix, iz);

    return { cellIndex, worldPos, usedONNX: false };
}

// --- DensityMap Builder ---
export function buildDensityMap(
    positions: Float32Array,
    count: number
): Float32Array {
    const map = new Float32Array(GRID_COLS * GRID_ROWS);

    for (let i = 0; i < count; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];

        // Skip collected leaves (y < -100 convention)
        if (y < -100) continue;

        // Check bounds
        if (x < BOUNDS_X[0] || x > BOUNDS_X[1]) continue;
        if (z < BOUNDS_Z[0] || z > BOUNDS_Z[1]) continue;

        // Map to cell
        const ix = Math.floor((x - BOUNDS_X[0]) / CELL_SIZE);
        const iz = Math.floor((z - BOUNDS_Z[0]) / CELL_SIZE);

        if (ix >= 0 && ix < GRID_COLS && iz >= 0 && iz < GRID_ROWS) {
            map[iz * GRID_COLS + ix]++;
        }
    }

    // Normalize
    let maxVal = 0;
    for (let i = 0; i < map.length; i++) {
        if (map[i] > maxVal) maxVal = map[i];
    }
    if (maxVal > 0) {
        for (let i = 0; i < map.length; i++) {
            map[i] /= maxVal;
        }
    }

    return map;
}
