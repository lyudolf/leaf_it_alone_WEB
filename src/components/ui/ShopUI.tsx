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
    const { money, purchaseUpgrade, toggleShop, pickAmount, moneyMultiplier, currentStage } = useGameStore();

    // Configuration for Pick Amount
    const getPickUpgrade = () => {
        if (pickAmount === 1) return { cost: 100, next: 3, desc: "손 줍기 (1 -> 3)" };
        if (pickAmount === 3) return { cost: 600, next: 5, desc: "손 줍기 (3 -> 5)" };
        if (pickAmount === 5) return { cost: 1000, next: 10, desc: "손 줍기 (5 -> 10)" };
        if (pickAmount === 10) return { cost: 3000, next: 50, desc: "손 줍기 (10 -> 50)" };
        if (pickAmount === 50) return { cost: 8000, next: 100, desc: "원클릭 봉투화 (50 -> 100)" };
        return { cost: 0, next: 100, desc: "최고 효율 도달" };
    };

    // Configuration for Money Multiplier
    const getMultiUpgrade = () => {
        const m = Math.round(moneyMultiplier);
        if (m === 1) return { cost: 3000, next: 2.0, desc: "수익 2배 (x1.0 -> x2.0)" };
        if (m === 2) return { cost: 9000, next: 3.0, desc: "수익 3배 (x2.0 -> x3.0)" };
        return { cost: 0, next: 3.0, desc: "최대 배율 도달" };
    };

    const pickUp = getPickUpgrade();
    const multiUp = getMultiUpgrade();

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-auto">
            <div className="bg-white w-[600px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase">상점 (Shop)</h2>
                        <div className="text-emerald-100 font-medium">청소 효율을 높여 더 많은 수익을 올리세요!</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs uppercase opacity-75">보유 금액</div>
                        <div className="text-3xl font-black">₩{money.toLocaleString()}</div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                    <UpgradeCard
                        title="줍기 능력 (Pick Up)"
                        desc={pickUp.desc}
                        cost={pickUp.cost}
                        level={pickAmount}
                        maxLevel={100}
                        canAfford={money >= pickUp.cost}
                        onBuy={() => purchaseUpgrade('PICK_AMOUNT', pickUp.cost, pickUp.next)}
                    />

                    <UpgradeCard
                        title="판매 단가 (Multiplier)"
                        desc={multiUp.desc}
                        cost={multiUp.cost}
                        level={moneyMultiplier}
                        maxLevel={3}
                        canAfford={money >= multiUp.cost}
                        onBuy={() => purchaseUpgrade('MONEY_MULTI', multiUp.cost, multiUp.next)}
                    />

                    {currentStage >= 2 && (
                        <UpgradeCard
                            title="갈퀴 강화 (Rake Up)"
                            desc="갈퀴 범위 및 강도 강화"
                            cost={800}
                            level={1}
                            maxLevel={4}
                            canAfford={money >= 800}
                            onBuy={() => purchaseUpgrade('RAKE', 800, 2)}
                        />
                    )}

                    {currentStage >= 3 && (
                        <UpgradeCard
                            title="송풍기 강화 (Blower Up)"
                            desc="송풍기 풍속 및 범위 강화"
                            cost={1200}
                            level={1}
                            maxLevel={4}
                            canAfford={money >= 1200}
                            onBuy={() => purchaseUpgrade('BLOWER', 1200, 2)}
                        />
                    )}
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
