'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export interface PerfStats {
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
}

// Global stats storage for UI access
let globalStats: PerfStats = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0
};

let statsListeners: Set<(stats: PerfStats) => void> = new Set();

export function subscribeToStats(callback: (stats: PerfStats) => void) {
    statsListeners.add(callback);
    return () => statsListeners.delete(callback);
}

function notifyListeners(stats: PerfStats) {
    globalStats = stats;
    statsListeners.forEach(cb => cb(stats));
}

/**
 * PerfMonitor - Real-time performance monitoring (inside Canvas)
 */
export function PerfMonitor() {
    const { gl } = useThree();
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());
    const frameTimes = useRef<number[]>([]);

    useFrame(() => {
        const now = performance.now();
        const delta = now - lastTime.current;
        lastTime.current = now;

        frameTimes.current.push(delta);
        frameCount.current++;

        // Update stats every 30 frames
        if (frameCount.current >= 30) {
            const avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
            const info = gl.info;

            notifyListeners({
                fps: Math.round(1000 / avgFrameTime),
                frameTime: Math.round(avgFrameTime * 10) / 10,
                drawCalls: info.render.calls,
                triangles: info.render.triangles,
                geometries: info.memory.geometries,
                textures: info.memory.textures
            });

            frameCount.current = 0;
            frameTimes.current = [];
        }
    });

    return null;
}

/**
 * PerfMonitorUI - HTML overlay for performance stats
 * Place outside Canvas in UIOverlay
 */
export function PerfMonitorUI() {
    const [visible, setVisible] = useState(false);
    const [stats, setStats] = useState<PerfStats>(globalStats);

    useEffect(() => {
        const unsubscribe = subscribeToStats(setStats);
        return () => { unsubscribe(); };
    }, []);

    // Toggle with backtick key
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Backquote') {
                setVisible(v => !v);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    if (!visible) return null;

    const getFPSColor = (fps: number) => {
        if (fps >= 55) return '#4ade80';
        if (fps >= 30) return '#facc15';
        return '#f87171';
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 10,
            left: 10,
            background: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'monospace',
            zIndex: 9999,
            minWidth: 200,
            pointerEvents: 'none'
        }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#60a5fa', fontSize: 14 }}>
                📊 Performance Monitor
            </div>
            <div style={{ color: getFPSColor(stats.fps), marginBottom: 4 }}>
                <span style={{ fontWeight: 'bold', fontSize: 18 }}>{stats.fps}</span> FPS
                <span style={{ color: '#888', marginLeft: 8 }}>({stats.frameTime}ms)</span>
            </div>
            <div style={{ borderTop: '1px solid #333', paddingTop: 8, marginTop: 8 }}>
                <div>🎨 Draw Calls: <span style={{ color: stats.drawCalls > 200 ? '#f87171' : '#4ade80' }}>{stats.drawCalls}</span></div>
                <div>🔺 Triangles: <span style={{ color: stats.triangles > 500000 ? '#facc15' : '#4ade80' }}>{(stats.triangles / 1000).toFixed(1)}K</span></div>
                <div>📦 Geometries: {stats.geometries}</div>
                <div>🖼️ Textures: {stats.textures}</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: '#666' }}>
                Press ` to hide
            </div>
        </div>
    );
}
