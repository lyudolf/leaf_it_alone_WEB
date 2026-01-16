'use client';

import { useGameStore } from '@/game/store';

export function InventoryUI() {
    const { score, money, toggleInventory, bags, pickAmount } = useGameStore();

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-auto">
            <div className="bg-white w-[500px] rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black italic uppercase text-slate-800">Inventory</h2>
                    <button onClick={toggleInventory} className="text-slate-400 hover:text-slate-600">
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <div className="text-xs uppercase font-bold text-emerald-600 mb-1">Leaves Collected</div>
                        <div className="text-3xl font-black text-emerald-800">{score}</div>
                        <div className="text-xs text-emerald-500 mt-1">Make 100 to create a bag</div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <div className="text-xs uppercase font-bold text-amber-600 mb-1">Money</div>
                        <div className="text-3xl font-black text-amber-800">₩{money}</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-xs uppercase font-bold text-slate-500 mb-1">Bags in Scene</div>
                        <div className="text-xl font-bold text-slate-700">{bags.length}</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-xs uppercase font-bold text-slate-500 mb-1">Pick Efficiency</div>
                        <div className="text-xl font-bold text-slate-700">{pickAmount} per click</div>
                    </div>
                </div>

                <div className="text-center text-xs text-slate-400">
                    Press I to close
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center text-slate-600">
            <span className="font-medium">{label}</span>
            <span className="font-bold text-slate-900">{value}</span>
        </div>
    );
}
