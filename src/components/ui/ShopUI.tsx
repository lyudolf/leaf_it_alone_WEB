'use client';

import { useGameStore } from '@/game/store';

const UpgradeCard = ({ title, desc, cost, level, maxLevel, onBuy, canAfford, icon }: any) => (
    <div className={`p-4 rounded-xl border-2 transition-all ${canAfford ? 'bg-white border-slate-200 hover:border-emerald-400 cursor-pointer' : 'bg-slate-100 border-slate-200 opacity-60 grayscale'}`}>
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-bold text-slate-800">{title}</h3>
            </div>
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
    const { money, purchaseUpgrade, toggleShop, pickAmount, moneyMultiplier, currentStage, upgrades, unlockedPotato, unlockedCarrot, unlockedTomato } = useGameStore();

    // Configuration for Pick Amount
    const getPickUpgrade = () => {
        if (pickAmount === 1) return { cost: 70, next: 3, desc: "손 줍기 (1 -> 3)" };
        if (pickAmount === 3) return { cost: 420, next: 5, desc: "손 줍기 (3 -> 5)" };
        if (pickAmount === 5) return { cost: 700, next: 10, desc: "손 줍기 (5 -> 10)" };
        if (pickAmount === 10) return { cost: 2100, next: 50, desc: "손 줍기 (10 -> 50)" };
        if (pickAmount === 50) return { cost: 5600, next: 100, desc: "원클릭 봉투화 (50 -> 100)" };
        return { cost: 0, next: 100, desc: "마이다스의 손: 이제부터 낙엽을 봉투로 만듭니다" };
    };

    // Configuration for Money Multiplier
    const getMultiUpgrade = () => {
        const m = Math.round(moneyMultiplier);
        if (m === 1) return { cost: 1500, next: 2.0, desc: "수익 2배 (x1.0 -> x2.0)" };
        if (m === 2) return { cost: 3000, next: 3.0, desc: "수익 3배 (x2.0 -> x3.0)" };
        return { cost: 0, next: 3.0, desc: "최대 배율 도달" };
    };

    // Configuration for Rake Upgrade
    const getRakeUpgrade = () => {
        const level = upgrades.rakeRange;
        const baseCost = 560;
        const cost = baseCost * level; // 560, 1120, 1680, 2240
        const nextLevel = level + 1;
        return {
            cost,
            next: nextLevel,
            desc: `범위 ${3 + (level - 1) * 1.5}m → ${3 + nextLevel * 1.5 - 1.5}m`,
            level
        };
    };

    // Configuration for Blower Upgrade
    const getBlowerUpgrade = () => {
        const level = upgrades.blowerRange;
        const baseCost = 840;
        const cost = baseCost * level; // 840, 1680, 2520, 3360
        const nextLevel = level + 1;
        return {
            cost,
            next: nextLevel,
            desc: `범위 ${5 + (level - 1) * 2}m → ${5 + nextLevel * 2 - 2}m`,
            level
        };
    };

    const pickUp = getPickUpgrade();
    const multiUp = getMultiUpgrade();
    const rakeUp = getRakeUpgrade();
    const blowerUp = getBlowerUpgrade();

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
                        icon="🖐️"
                        title="줍기 능력 (Pick Up)"
                        desc={pickUp.desc}
                        cost={pickUp.cost}
                        level={pickAmount}
                        maxLevel={100}
                        canAfford={money >= pickUp.cost}
                        onBuy={() => purchaseUpgrade('PICK_AMOUNT', pickUp.cost, pickUp.next)}
                    />

                    <UpgradeCard
                        icon="💰"
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
                            icon="🧹"
                            title="갈퀴 강화 (Rake Up)"
                            desc={rakeUp.desc}
                            cost={rakeUp.cost}
                            level={rakeUp.level}
                            maxLevel={4}
                            canAfford={money >= rakeUp.cost}
                            onBuy={() => purchaseUpgrade('RAKE', rakeUp.cost, rakeUp.next)}
                        />
                    )}

                    {currentStage >= 3 && (
                        <UpgradeCard
                            icon="💨"
                            title="송풍기 강화 (Blower Up)"
                            desc={blowerUp.desc}
                            cost={blowerUp.cost}
                            level={blowerUp.level}
                            maxLevel={4}
                            canAfford={money >= blowerUp.cost}
                            onBuy={() => purchaseUpgrade('BLOWER', blowerUp.cost, blowerUp.next)}
                        />
                    )}

                    {!unlockedPotato && (
                        <UpgradeCard
                            icon="🥔"
                            title="감자 설해 (Potato AI)"
                            desc="봉투를 자동으로 수거하는 AI 로봇을 고용합니다."
                            cost={500}
                            level={0}
                            maxLevel={1}
                            canAfford={money >= 500}
                            onBuy={() => purchaseUpgrade('POTATO_AI', 500, 1)}
                        />
                    )}

                    {unlockedPotato && !unlockedCarrot && (
                        <UpgradeCard
                            icon="🥕"
                            title="당근 설해 (Carrot AI)"
                            desc="더 빠른 AI 로봇을 추가로 고용합니다."
                            cost={800}
                            level={0}
                            maxLevel={1}
                            canAfford={money >= 800}
                            onBuy={() => purchaseUpgrade('CARROT_AI', 800, 1)}
                        />
                    )}

                    {unlockedCarrot && !unlockedTomato && (
                        <UpgradeCard
                            icon="🍅"
                            title="토마토 설해 (Tomato AI)"
                            desc="가장 빠른 AI 로봇을 추가로 고용합니다."
                            cost={1200}
                            level={0}
                            maxLevel={1}
                            canAfford={money >= 1200}
                            onBuy={() => purchaseUpgrade('TOMATO_AI', 1200, 1)}
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
