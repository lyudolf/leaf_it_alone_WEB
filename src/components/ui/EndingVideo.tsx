'use client';

import { useGameStore } from '@/game/store';
import { useEffect, useRef } from 'react';

export function EndingVideo() {
    const isVideoPlaying = useGameStore(s => s.isVideoPlaying);
    const stopEndingVideo = useGameStore(s => s.stopEndingVideo);
    const resetGame = useGameStore(s => s.resetGame);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isVideoPlaying && videoRef.current) {
            videoRef.current.play();
        }
    }, [isVideoPlaying]);

    if (!isVideoPlaying) return null;

    const handleVideoEnd = () => {
        stopEndingVideo();
        // Reset game to Stage 1 after video ends
        setTimeout(() => {
            resetGame();
            // Reload page to reset player position
            window.location.reload();
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
            <video
                ref={videoRef}
                src="/videos/ending.mp4"
                className="w-full h-full object-contain"
                onEnded={handleVideoEnd}
                playsInline
            />
        </div>
    );
}
