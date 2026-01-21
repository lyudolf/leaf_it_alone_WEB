'use client';

import { useGameStore } from '@/game/store';

export function StartMenu() {
    const startGame = useGameStore(s => s.startGame);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url(/menu-background.png)',
                }}
            />

            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Content */}
            <div className="relative z-10 text-center px-8">
                {/* Title */}
                <h1 className="text-8xl font-black text-white mb-4 drop-shadow-2xl tracking-tight" style={{
                    textShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.6)'
                }}>
                    LEAF IT ALONE
                </h1>
                <p className="text-2xl text-white mb-16 font-medium drop-shadow-lg" style={{
                    textShadow: '0 0 10px rgba(0,0,0,0.8)'
                }}>
                    낙엽 청소 시뮬레이터
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-6 items-center">
                    {/* Press to Start */}
                    <button
                        onClick={() => startGame(false)}
                        className="group relative px-16 py-6 bg-white text-orange-900 text-2xl font-black rounded-2xl shadow-2xl hover:scale-105 transition-all duration-200 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 group-hover:text-white transition-colors">
                            PRESS TO START
                        </span>
                    </button>

                    {/* Create Mode */}
                    <button
                        onClick={() => startGame(true)}
                        className="group relative px-16 py-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-2xl font-black rounded-2xl shadow-2xl hover:scale-105 transition-all duration-200 overflow-hidden border-4 border-amber-300"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10 flex items-center gap-3">
                            <span className="text-3xl">✨</span>
                            CREATE MODE
                            <span className="text-3xl">✨</span>
                        </span>
                        <div className="absolute -bottom-1 left-0 right-0 text-xs font-bold text-amber-100 opacity-90">
                            AI-Powered Customization
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-16 text-white text-sm opacity-90 drop-shadow-lg" style={{
                    textShadow: '0 0 10px rgba(0,0,0,0.8)'
                }}>
                    <p>WASD to move • Mouse to look • 1-4 to switch tools</p>
                </div>
            </div>
        </div>
    );
}
