'use client';

import { useGameStore, ToolType } from '@/game/store';
import { InventoryUI } from '@/components/ui/InventoryUI';
import { ShopUI } from '@/components/ui/ShopUI';

const TOOL_ICONS: Record<ToolType, string> = {
    HAND: '✋',
    RAKE: '🧹',
    BLOWER: '💨'
};

const TOOL_DESCRIPTIONS: Record<ToolType, string> = {
    HAND: 'Click to collect leaves',
    RAKE: 'Click to scrape leaves toward you',
    BLOWER: 'Hold to blast leaves away'
};

export function UIOverlay() {
    const { score, money, currentTool, unlockedTools, setTool, isInventoryOpen, isShopOpen } = useGameStore();

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
            {isInventoryOpen && <InventoryUI />}
            {isShopOpen && <ShopUI />}

            {/* Instructions Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-50 z-40">
                <div className="text-white font-bold text-2xl drop-shadow-md pb-2">CLICK TO PLAY</div>
                <div className="text-white text-sm drop-shadow-md font-medium">WASD to Move • 1/2/3 Tools</div>
                <div className="text-white text-sm drop-shadow-md font-medium mt-1">I: Inventory • U: Shop</div>
                <div className="text-white text-xs drop-shadow-md font-medium mt-1 opacity-75">Colored sphere shows tool range</div>
            </div>

            {/* Crosshair (Center Dot) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md z-50 mix-blend-difference" />

            {/* HUD Header */}
            <div className="flex justify-between items-start pointer-events-auto">
                <div className="bg-white/90 p-4 rounded-xl shadow-lg border-2 border-slate-200">
                    <div className="text-sm text-slate-500 font-bold uppercase tracking-wider">Leaves Collected</div>
                    <div className="text-3xl font-black text-slate-800">{score}</div>
                </div>
            </div>

            {/* HUD Top Right */}
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2 pointer-events-none">
                <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-emerald-100">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Money</div>
                    <div className="text-2xl font-black text-slate-800 font-mono">₩{money.toLocaleString()}</div>
                </div>
            </div>

            {/* Hotbar */}
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
        </div>
    );
}
