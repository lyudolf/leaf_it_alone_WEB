'use client';

import { useGameStore, ToolType } from '@/game/store';
import { InventoryUI } from '@/components/ui/InventoryUI';
import { ShopUI } from '@/components/ui/ShopUI';
import { EndingPanel } from '@/components/ui/EndingPanel';
import { GraphicsPanel } from '@/components/ui/GraphicsPanel';

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

function UpgradeHint() {
    const toggleShop = useGameStore(s => s.toggleShop);
    return (
        <button
            onClick={toggleShop}
            className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-yellow-500/30 text-yellow-400 flex items-center gap-2 mr-3 hover:bg-black/80 hover:scale-105 transition-all pointer-events-auto shadow-lg"
        >
            <span className="bg-yellow-500 text-black text-xs font-black px-1.5 py-0.5 rounded">U</span>
            <span className="text-sm font-bold uppercase tracking-wider">Upgrade</span>
        </button>
    );
}

function SettingsHint() {
    const toggleGraphics = useGameStore(s => s.toggleGraphics);
    return (
        <button
            onClick={toggleGraphics}
            className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-500/30 text-slate-300 flex items-center gap-2 mr-3 hover:bg-black/80 hover:scale-105 transition-all pointer-events-auto shadow-lg"
        >
            <span className="bg-slate-500 text-white text-xs font-black px-1.5 py-0.5 rounded">O</span>
            <span className="text-sm font-bold uppercase tracking-wider">설정</span>
        </button>
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
                    <button
                        onClick={() => useGameStore.getState().closeIntro()}
                        className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-full font-bold animate-pulse hover:scale-105 transition-transform"
                    >
                        <span className="bg-black text-white px-2 rounded text-sm">E</span>
                        <span>닫기 / 시작하기</span>
                    </button>
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

function TutorialPanel() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border-2 border-white/20 p-8 rounded-2xl shadow-2xl max-w-2xl w-full text-center animate-fade-in pointer-events-auto relative">
                <div className="text-3xl font-black text-emerald-400 mb-8 tracking-tight border-b-2 border-white/10 pb-4">
                    기초 조작 가이드
                </div>

                <div className="grid grid-cols-2 gap-8 text-left mb-8">
                    {/* Controls */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-emerald-500 pl-3">이동 및 액션</h3>
                        <ul className="space-y-3 text-gray-300">
                            <li className="flex items-center gap-3">
                                <span className="bg-white/10 px-2 py-1 rounded text-yellow-400 font-bold font-mono text-sm border border-white/10">WASD</span>
                                <span>이동 (Move)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="bg-white/10 px-2 py-1 rounded text-yellow-400 font-bold font-mono text-sm border border-white/10">Shift</span>
                                <span>달리기 (Run)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="bg-white/10 px-2 py-1 rounded text-yellow-400 font-bold font-mono text-sm border border-white/10">Space</span>
                                <span>점프! (Jump)</span>
                            </li>
                        </ul>
                    </div>

                    {/* Mechanics */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-emerald-500 pl-3">채집 및 환전</h3>
                        <ul className="space-y-3 text-gray-300">
                            <li className="flex items-start gap-3">
                                <span className="text-2xl pt-1">🍂</span>
                                <div>
                                    <div className="font-bold text-white">낙엽 줍기</div>
                                    <div className="text-xs opacity-70">마우스 클릭으로 수집하세요.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-2xl pt-1">💰</span>
                                <div>
                                    <div className="font-bold text-white">낙엽 봉투 (100개)</div>
                                    <div className="text-xs opacity-70">100개를 모으면 봉투가 됩니다.<br />클릭해서 줍고, 쓰레기통에 넣으세요.</div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-xl pt-1">🖱️</span>
                                <div>
                                    <div className="font-bold text-white">봉투 던지기</div>
                                    <div className="text-xs opacity-70"><span className="text-yellow-400">클릭(들기) + 우클릭</span>으로 멀리 던집니다.</div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl mb-8">
                    <p className="text-emerald-200/80 italic font-medium">
                        "[ 지켜본다, 당신의 끈기... ]"
                    </p>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => useGameStore.getState().closeTutorial()}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 shadow-lg shadow-emerald-900/50"
                    >
                        <span className="bg-black/30 px-2 py-0.5 rounded text-sm">E</span>
                        <span>알겠습니다</span>
                    </button>
                </div>
            </div>
        </div>
    );
}



function StageTutorialPanel() {
    const currentStage = useGameStore(s => s.currentStage);
    const closeStageTutorial = useGameStore(s => s.closeStageTutorial);

    // Stage Config
    const config = {
        2: {
            title: "STAGE 2: 새로운 도구",
            color: "text-amber-400",
            border: "border-amber-500",
            items: [
                { icon: "🧹", title: "갈퀴 (Rake)", desc: "키보드 [2], 클릭하면 낙엽이 모입니다!" },
                { icon: "🐻", title: "두더지 출현", desc: "녀석은 절대 호의적이지 않습니다." }
            ]
        },
        3: {
            title: "STAGE 3: 바람의 힘",
            color: "text-blue-400",
            border: "border-blue-500",
            items: [
                { icon: "💨", title: "송풍기 (Blower)", desc: "키보드 [3], 클릭하면 낙엽을 밀어냅니다!" },
                { icon: "💪", title: "강력해진 두더지", desc: "녀석들이 더 빠르고 강해집니다." },
                { icon: "🤖", title: "AI 도우미", desc: "상점(U)에서 로봇을 고용해 보세요." }
            ]
        },
        4: {
            title: "STAGE 4: 거대 두더지",
            color: "text-red-500",
            border: "border-red-600",
            items: [
                { icon: "👑", title: "몰킹 등장", desc: "거대한 녀석이 나타납니다. 호락호락하지 않을 것." },
                { icon: "🕳️", title: "배수관 환전", desc: "배수관에 낙엽을 밀어넣으면 자동 환전됩니다." }
            ]
        },
        5: {
            title: "STAGE 5: 대재앙",
            color: "text-purple-500",
            border: "border-purple-600",
            items: [
                { icon: "⚡", title: "천둥번개", desc: "천둥은 모든 낙엽을 혐오합니다." },
                { icon: "🌪️", title: "설네이도", desc: "봉투를 조심하세요! 다 날아갑니다." },
                { icon: "🎯", title: "료이키 설카이", desc: "스나이퍼 설토루가 당신을 노립니다." },
                { icon: "🗑️", title: "쓰레기통 축소", desc: "쓰레기통이 더 작아집니다." },
                { icon: "👑", title: "몰킹", desc: "ㅎㅇ" }
            ]
        }
    };

    const stageConfig = config[currentStage as keyof typeof config];
    if (!stageConfig) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className={`bg-zinc-900 border-2 ${stageConfig.border} p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center animate-bounce-in pointer-events-auto relative`}>
                <div className={`text-3xl font-black ${stageConfig.color} mb-8 tracking-tight border-b-2 border-white/10 pb-4 uppercase`}>
                    {stageConfig.title}
                </div>

                <div className="space-y-6 text-left mb-8">
                    {stageConfig.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4 bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors">
                            <span className="text-3xl">{item.icon}</span>
                            <div>
                                <div className={`font-bold text-xl ${stageConfig.color}`}>{item.title}</div>
                                <div className="text-gray-300 text-sm mt-1 font-medium">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={() => closeStageTutorial()}
                        className={`flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold transition-all hover:scale-105 shadow-lg`}
                    >
                        <span className="bg-black text-white px-2 py-0.5 rounded text-sm">E</span>
                        <span>도전하기</span>
                    </button>
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
    const isTutorialOpen = useGameStore(s => s.isTutorialOpen);
    const isStageTutorialOpen = useGameStore(s => s.isStageTutorialOpen);
    const isBagTutorialOpen = useGameStore(s => s.isBagTutorialOpen);
    const interactionPrompt = useGameStore(s => s.interactionPrompt);
    const isEndingOpen = useGameStore(s => s.isEndingOpen);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
            {isIntroOpen && <IntroPanel />}
            {isTutorialOpen && <TutorialPanel />}
            {isStageTutorialOpen && <StageTutorialPanel />}
            {isBagTutorialOpen && <BagTutorialPanel />}
            {isInventoryOpen && <InventoryUI />}
            {isShopOpen && <ShopUI />}
            <GraphicsPanel />

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
                <div className="flex items-center">
                    <SettingsHint />
                    <UpgradeHint />
                    <MoneyDisplay />
                </div>
                {!isHelpOpen && (
                    <div className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur border border-white/10 animate-pulse">
                        Press <b>P</b> for Help
                    </div>
                )}
            </div>

            {/* Hotbar */}
            <Hotbar />
            {isEndingOpen && <EndingPanel />}

            {/* Watermark */}
            <div className="absolute bottom-2 right-4 text-white/30 text-xs font-bold pointer-events-none select-none">
                made by 유희수
            </div>
        </div>
    );
}
