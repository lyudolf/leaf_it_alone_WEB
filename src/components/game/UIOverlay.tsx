'use client';

import { useGameStore, ToolType } from '@/game/store';
import { InventoryUI } from '@/components/ui/InventoryUI';
import { ShopUI } from '@/components/ui/ShopUI';

const TOOL_ICONS: Record<ToolType, string> = {
    HAND: '✋',
    RAKE: '🧹',
    BLOWER: '💨',
    VACUUM: '🌀'
};

const TOOL_DESCRIPTIONS: Record<ToolType, string> = {
    HAND: 'Click to collect leaves',
    RAKE: 'Click to scrape leaves toward you',
    BLOWER: 'Hold to blast leaves away',
    VACUUM: 'Hold to suck up leaves'
};

function ProgressHeader() {
    const totalLeavesInStage = useGameStore(s => s.totalLeavesInStage);
    const totalCollected = useGameStore(s => s.totalCollected);
    const currentStage = useGameStore(s => s.currentStage);

    const targetGoal = Math.max(1, totalLeavesInStage);
    const progress = (totalCollected / targetGoal) * 100;

    return (
        <div className="bg-white/90 p-4 rounded-xl shadow-lg border-2 border-slate-200 min-w-[240px] pointer-events-auto">
            <div className="flex justify-between items-center mb-1">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    수집된 나뭇잎 (Collected)
                </div>
                <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{currentStage}단계</div>
            </div>
            <div className="flex items-end justify-between gap-4 mb-2">
                <div className="text-4xl font-black text-slate-800 leading-none">
                    {totalCollected.toLocaleString()}
                </div>
                <div className="text-sm font-bold text-slate-400 pb-1">/ {targetGoal.toLocaleString()}</div>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden relative">
                <div
                    className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${Math.min(100, progress)}%` }}
                />
            </div>

            <div className="flex justify-between items-center mt-1.5">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">
                    수집 진행도
                </div>
                <div className="text-xs font-black text-slate-700">{Math.min(100, Math.floor(progress))}%</div>
            </div>
        </div>
    );
}

function MoneyDisplay() {
    const money = useGameStore(s => s.money);
    return (
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-emerald-100">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Money</div>
            <div className="text-2xl font-black text-slate-800 font-mono">₩{money.toLocaleString()}</div>
        </div>
    );
}

function Hotbar() {
    const currentTool = useGameStore(s => s.currentTool);
    const unlockedTools = useGameStore(s => s.unlockedTools);
    const setTool = useGameStore(s => s.setTool);

    return (
        <div className="flex justify-center gap-3 pointer-events-auto pb-4">
            {unlockedTools.map((tool, idx) => (
                <div key={tool} className="relative group">
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-white font-bold bg-black/70 px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {TOOL_DESCRIPTIONS[tool]}
                    </span>
                    <button
                        onClick={() => setTool(tool)}
                        className={`
                            w-16 h-16 rounded-xl flex flex-col items-center justify-center shadow-lg transition-all
                            ${currentTool === tool
                                ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-300 translate-y-[-10px]'
                                : 'bg-white text-slate-700 hover:bg-slate-50'}
                        `}
                    >
                        <div className="text-3xl">{TOOL_ICONS[tool]}</div>
                        <div className="text-[10px] font-bold opacity-60 mt-1">{idx + 1}</div>
                    </button>
                </div>
            ))}
        </div>
    );
}


function HelpPanel() {
    return (
        <div className="bg-black/80 text-white p-4 rounded-xl shadow-xl border border-white/20 pointer-events-auto min-w-[200px]">
            <div className="text-lg font-bold mb-2 border-b border-white/20 pb-1">도움말 (Help)</div>
            <ul className="text-sm space-y-1">
                <li><span className="font-bold text-yellow-400">WASD</span> : 이동</li>
                <li><span className="font-bold text-yellow-400">Space</span> : 점프</li>
                <li><span className="font-bold text-yellow-400">1-4</span> : 도구 변경</li>
                <li><span className="font-bold text-yellow-400">좌클릭</span> : 도구 사용 / 봉투 들기</li>
                <li><span className="font-bold text-yellow-400">우클릭</span> : 봉투 던지기</li>
                <li><span className="font-bold text-yellow-400">I</span> : 인벤토리</li>
                <li><span className="font-bold text-yellow-400">U</span> : 상점</li>
                <li><span className="font-bold text-yellow-400">E</span> : 상호작용</li>
                <li><span className="font-bold text-yellow-400">P</span> : 도움말 끄기/켜기</li>
            </ul>
        </div>
    );
}

function IntroPanel() {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 border-2 border-white/20 p-8 rounded-2xl shadow-2xl max-w-lg text-center animate-fade-in pointer-events-auto relative">
                <div className="text-3xl font-black text-yellow-500 mb-6 tracking-tight border-b-2 border-white/10 pb-4">
                    공  지
                </div>

                <div className="space-y-4 text-gray-200 text-lg leading-relaxed font-medium">
                    <p className="text-xl text-white font-bold">
                        <span className="text-red-400">'낙엽 방치 과태료'</span>가 도입되었습니다.
                    </p>
                    <p>
                        오늘 밤 12시까지 마당을 정리하지 않으면,<br />
                        내일 아침부터 벌금이 매일 늘어납니다.
                    </p>
                    <p className="italic bg-white/5 py-2 px-4 rounded text-yellow-100/90">
                        다행히(?) 낙엽 봉투는 돈이 됩니다.<br />
                        쓰레기통에 넣으면 현금으로 환전.
                    </p>
                    <p>
                        문제는… 낙엽이 스스로 사라지지 않는다는 것.<br />
                        그리고 <span className="text-red-400 font-bold">두더지</span>는, 절대 협조하지 않습니다.
                    </p>
                </div>

                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold animate-pulse">
                        <span className="bg-black text-white px-2 rounded text-sm">E</span>
                        <span>닫기 / 시작하기</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BagTutorialPanel() {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-zinc-900 border-2 border-yellow-500/50 p-8 rounded-2xl shadow-2xl max-w-lg text-center animate-bounce-in pointer-events-auto relative">
                <div className="text-3xl font-black text-yellow-400 mb-6 tracking-tight border-b-2 border-white/10 pb-4">
                    첫 낙엽 봉투!
                </div>

                <div className="space-y-6 text-gray-200 text-lg leading-relaxed font-medium flex flex-col items-center">
                    <div className="w-24 h-24 bg-orange-800 rounded-xl flex items-center justify-center shadow-inner border-4 border-orange-700 mb-2">
                        {/* Placeholder for Bag Icon (Generation Failed) - using CSS representation */}
                        <div className="w-12 h-16 bg-yellow-600 rounded-sm border-2 border-yellow-800 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-yellow-900 opacity-50">LEAF</div>
                        </div>
                    </div>

                    <ul className="text-left space-y-3 bg-white/5 p-6 rounded-xl w-full">
                        <li className="flex gap-3">
                            <span className="bg-yellow-600 text-black font-bold px-2 rounded shadow shrink-0">클릭</span>
                            <span>봉투를 집거나 내려놓기</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-blue-600 text-white font-bold px-2 rounded shadow shrink-0">100원</span>
                            <span>쓰레기통에 넣으면 보상 획득!</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-red-500 text-white font-bold px-2 rounded shadow shrink-0">우클릭</span>
                            <span>(꾹 누르면) 봉투 멀리 던지기</span>
                        </li>
                    </ul>
                </div>

                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold animate-pulse">
                        <span className="bg-black text-white px-2 rounded text-sm">E</span>
                        <span>닫기 / 계속하기</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function UIOverlay() {
    const isInventoryOpen = useGameStore(s => s.isInventoryOpen);
    const isShopOpen = useGameStore(s => s.isShopOpen);
    const isHelpOpen = useGameStore(s => s.isHelpOpen);
    const isIntroOpen = useGameStore(s => s.isIntroOpen);
    const isBagTutorialOpen = useGameStore(s => s.isBagTutorialOpen);
    const interactionPrompt = useGameStore(s => s.interactionPrompt);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
            {isIntroOpen && <IntroPanel />}
            {isBagTutorialOpen && <BagTutorialPanel />}
            {isInventoryOpen && <InventoryUI />}
            {isShopOpen && <ShopUI />}

            {/* Help Panel (Top Right, slightly below HUD) */}
            {isHelpOpen && (
                <div className="absolute top-24 right-8 z-50">
                    <HelpPanel />
                </div>
            )}

            {/* Interaction Prompt & Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                {interactionPrompt && (
                    <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-white/20 animate-bounce">
                        <div className="text-white font-black text-xl drop-shadow-lg flex items-center gap-2">
                            <span className="bg-white text-black px-2 py-0.5 rounded-lg text-sm mr-1">E</span>
                            {interactionPrompt}
                        </div>
                    </div>
                )}
                <div className="w-2 h-2 bg-white rounded-full shadow-md z-50 mix-blend-difference" />
            </div>

            {/* HUD Header */}
            <div className="flex justify-between items-start">
                <ProgressHeader />
            </div>

            {/* HUD Top Right */}
            <div className="absolute top-8 right-8 pointer-events-none flex flex-col items-end gap-2">
                <MoneyDisplay />
                {!isHelpOpen && (
                    <div className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur border border-white/10 animate-pulse">
                        Press <b>P</b> for Help
                    </div>
                )}
            </div>

            {/* Hotbar */}
            <Hotbar />
        </div>
    );
}
