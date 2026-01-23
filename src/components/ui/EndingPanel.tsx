export function EndingPanel() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 pointer-events-auto">
            <div className="bg-[#1a1a1a] border-4 border-[#fbbf24] p-12 max-w-3xl w-full text-center rounded-xl shadow-[0_0_50px_rgba(251,191,36,0.3)] animate-pulse-slow">
                <h1 className="text-6xl font-black text-[#fbbf24] mb-8 drop-shadow-lg tracking-tight">
                    낙엽 방치세<br />회피 성공!!!
                </h1>
                <p className="text-2xl text-gray-200 mb-10 leading-relaxed font-bold">
                    축하합니다!<br />
                    모든 구역이 깨끗해졌습니다.
                </p>
                <div className="mt-10 pt-8 border-t border-[#333] flex justify-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#333] rounded-lg text-lg text-gray-300">
                        <kbd className="px-3 py-1.5 bg-[#222] rounded border border-[#555] font-mono font-bold text-[#fbbf24]">E</kbd>
                        <span>눌러서 닫기</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
