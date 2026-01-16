'use client';

import { useGameStore } from '@/game/store';

const UpgradeCard = ({ title, desc, cost, level, maxLevel, onBuy, canAfford }: any) => (
    <div className={`p-4 rounded-xl border-2 transition-all ${canAfford ? 'bg-white border-slate-200 hover:border-emerald-400 cursor-pointer' : 'bg-slate-100 border-slate-200 opacity-60 grayscale'}`}>
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-slate-800">{title}</h3>
            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">Lv {level} / {maxLevel}</span>
        </div>
        <p className="text-sm text-slate-500 mb-4 h-10">{desc}</p>
        <button
            onClick={onBuy}
            disabled={!canAfford || level >= maxLevel}
            className={`w-full py-2 rounded-lg font-bold text-sm ${canAfford && level < maxLevel ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-slate-300 text-slate-500'}`}
        >
            {level >= maxLevel ? 'MAX' : `Upgrade (₩${cost})`}
        </button>
    </div>
);

export function ShopUI() {
    const { money, purchaseUpgrade, toggleShop, pickAmount, moneyMultiplier } = useGameStore();

    // Configuration for Pick Amount
    const getPickUpgrade = () => {
        if (pickAmount === 1) return { cost: 100, next: 3, desc: "Collect 3 leaves at once" };
        if (pickAmount === 3) return { cost: 600, next: 5, desc: "Collect 5 leaves at once" };
        if (pickAmount === 5) return { cost: 1000, next: 10, desc: "Collect 10 leaves at once" };
        return { cost: 0, next: 10, desc: "Max efficiency reached" };
    };

    // Configuration for Money Multiplier
    const getMultiUpgrade = () => {
        // Floating point comparison warning: use epsilon or text approach
        const m = Math.round(moneyMultiplier * 10);
        if (m === 10) return { cost: 1200, next: 1.2, desc: "x1.2 Sell Value" };
        if (m === 12) return { cost: 2500, next: 1.5, desc: "x1.5 Sell Value" };
        if (m === 15) return { cost: 6000, next: 2.0, desc: "x2.0 Sell Value" };
        return { cost: 0, next: 2.0, desc: "Max multiplier reached" };
    };

    const pickUp = getPickUpgrade();
    const multiUp = getMultiUpgrade();

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-auto">
            <div className="bg-white w-[600px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase">Upgrade Shop</h2>
                        <div className="text-emerald-100 font-medium">Invest to earn more!</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs uppercase opacity-75">Current Balance</div>
                        <div className="text-3xl font-black">₩{money}</div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-2 gap-4">
                    <UpgradeCard
                        title="Leaf Grabber"
                        desc={pickUp.desc}
                        cost={pickUp.cost}
                        level={pickAmount}
                        maxLevel={10} // Just visual cap
                        canAfford={money >= pickUp.cost}
                        onBuy={() => purchaseUpgrade('PICK_AMOUNT', pickUp.cost, pickUp.next)}
                    />

                    <UpgradeCard
                        title="Market Demand"
                        desc={multiUp.desc}
                        cost={multiUp.cost}
                        level={moneyMultiplier}
                        maxLevel={2.0}
                        canAfford={money >= multiUp.cost}
                        onBuy={() => purchaseUpgrade('MONEY_MULTI', multiUp.cost, multiUp.next)}
                    />
                </div>

                {/* Close */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={() => toggleShop()}
                        className="px-8 py-2 bg-slate-200 text-slate-600 font-bold rounded-full hover:bg-slate-300"
                    >
                        Close
                    </button>
                    <div className="ml-4 text-xs text-slate-400 self-center">Press ESC or U to close</div>
                </div>
            </div>
        </div>
    );
}
