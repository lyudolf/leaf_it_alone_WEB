'use client';

import { useProgress } from '@react-three/drei';
import { useEffect, useState, useRef } from 'react';

import { useGameStore } from '@/game/store';

export function LoadingScreen() {
    const { progress, active } = useProgress();
    const [visible, setVisible] = useState(true);
    const [leaves, setLeaves] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);
    const currentStage = useGameStore(s => s.currentStage);

    const isStageLoading = useGameStore(s => s.isStageLoading);
    const setStageLoading = useGameStore(s => s.setStageLoading);

    // Determine background based on stage
    let bgImage = '/loading_bg.png';
    // We want the loading screen to show the *next* stage's image if we are transitioning?
    // Usually currentStage updates quickly.
    if (currentStage === 2) bgImage = '/loading_stage_2.png';
    if (currentStage === 3) bgImage = '/loading_stage_3.png';
    if (currentStage === 4) bgImage = '/loading_stage_4.jpg';
    if (currentStage === 5) bgImage = '/loading_stage_5.jpg';

    const loadingStartTime = useRef(0);

    // Manual Stage Loading Trigger
    useEffect(() => {
        if (isStageLoading) {
            setVisible(true);
            loadingStartTime.current = Date.now();

            // Force at least 3 seconds
            const timer = setTimeout(() => {
                setVisible(false);
                setStageLoading(false);
                loadingStartTime.current = 0;
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isStageLoading, setStageLoading]);

    // Initial Load (Assets)
    useEffect(() => {
        // Skip this if manual stage loading is active to avoid conflict
        if (isStageLoading) return;

        if (progress < 100) {
            setVisible(true);
            if (loadingStartTime.current === 0) {
                loadingStartTime.current = Date.now();
            }
        } else if (progress === 100) {
            // Calculate how long we've been loading
            const elapsed = Date.now() - loadingStartTime.current;
            // Ensure minimum 3 seconds (3000ms)
            const minDuration = 3000;
            const remaining = Math.max(0, minDuration - elapsed);

            const timer = setTimeout(() => {
                setVisible(false);
                loadingStartTime.current = 0; // Reset for next loading
            }, remaining);

            return () => clearTimeout(timer);
        }
    }, [progress, isStageLoading]);

    // Generate falling leaves based on progress
    useEffect(() => {
        if (active && progress < 100) {
            // Spawn new leaves proportional to progress? or just continuously?
            // "Progressed amount -> Leaves fall ... to fill gauge"
            // Let's spawn leaves continuously, but the bar fills up.

            const interval = setInterval(() => {
                setLeaves(prev => {
                    const id = Date.now();
                    const newLeaf = {
                        id,
                        left: Math.random() * 100, // Random horizontal pos
                        delay: 0,
                        duration: 3 + Math.random() * 2 // Fall duration
                    };
                    // Keep strictly last 50 to avoid DOM overload
                    return [...prev.slice(-49), newLeaf];
                });
            }, 100);

            return () => clearInterval(interval);
        }
    }, [active, progress]);

    if (!active && !visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 flex flex-col items-center justify-center pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center opacity-80 transition-all duration-500"
                style={{ backgroundImage: `url('${bgImage}')` }}
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 z-0 bg-black/40" />

            {/* Falling Leaves Container */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                {leaves.map(leaf => (
                    <div
                        key={leaf.id}
                        className="absolute top-[-50px] w-8 h-8 opacity-80"
                        style={{
                            left: `${leaf.left}%`,
                            animation: `fall ${leaf.duration}s linear infinite`,
                            transform: `rotate(${Math.random() * 360}deg)`
                        }}
                    >
                        {/* CSS Leaf Shape */}
                        <div className="w-full h-full bg-orange-500 rounded-tr-[50%] rounded-bl-[50%] transform rotate-45 shadow-sm border border-orange-600/20" />
                    </div>
                ))}
            </div>

            {/* Loading Gauge - 2D Pile Style */}
            <div className="relative z-10 w-80 h-10 bg-black/20 rounded-full border-4 border-white/50 backdrop-blur overflow-hidden shadow-xl">
                {/* Fill Bar - Made of leaves pattern? or simply green/orange fill */}
                <div
                    className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-300 relative"
                    style={{ width: `${progress}%` }}
                >
                    {/* Bubbling effect inside bar */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] animate-pulse" />
                </div>
            </div>

            <div className="mt-4 text-2xl font-black text-white drop-shadow-lg tracking-wider animate-bounce">
                LOADING {Math.floor(progress)}%
            </div>

            <style jsx>{`
                @keyframes fall {
                    0% { top: -50px; transform: rotate(0deg) translateX(0px); }
                    50% { transform: rotate(180deg) translateX(20px); }
                    100% { top: 110vh; transform: rotate(360deg) translateX(-20px); }
                }
            `}</style>
        </div>
    );
}
