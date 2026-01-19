import { create } from 'zustand';
import { SCENES } from '@/spec/scenes';

export type ToolType = 'HAND' | 'RAKE' | 'BLOWER' | 'VACUUM';

export interface Upgrades {
    rakeRange: number;
    rakeStrength: number;
    blowerRange: number;
    blowerStrength: number;
    handSpeed: number;
}

interface GameState {
    score: number;
    money: number;
    totalLeaves: number;
    totalCollected: number; // For progress tracking
    currentTool: ToolType;
    unlockedTools: ToolType[];

    // UI State
    isInventoryOpen: boolean;
    isShopOpen: boolean;
    isAirVentActive: boolean;
    playerPushEvent: { pos: [number, number, number], radius: number, strength: number, timestamp: number } | null;
    currentStage: number;
    totalLeavesInStage: number;
    bagsDeliveredToDrain: number;
    bagsRequiredToClear: number;
    objectiveType: 'LEAVES' | 'BAGS';
    stageCleared: boolean;

    // Game Logic State
    pickAmount: number; // 1 -> 3 -> 5 -> 10
    moneyMultiplier: number; // 1.0 -> 1.2 -> 1.5 -> 2.0
    carriedBagId: string | null;
    bagImpulse: { id: string; force: [number, number, number] } | null;

    // Bags
    bags: { id: string; position: [number, number, number]; value: number }[];

    // Upgrade State
    upgrades: Upgrades;



    // Actions
    addLeaf: (amount: number) => void;
    createBag: (position: [number, number, number]) => void;
    removeBag: (id: string, sold: boolean) => void;
    setCarriedBag: (id: string | null) => void;
    triggerBagImpulse: (id: string, force: [number, number, number]) => void;
    clearBagImpulse: () => void; // Used by Bag component to consume the event

    setTool: (tool: ToolType) => void;
    unlockTool: (tool: ToolType) => void;
    toggleInventory: () => void;
    toggleShop: () => void;
    setAirVentActive: (active: boolean) => void;
    triggerPlayerPush: (pos: [number, number, number], radius: number, strength: number) => void;
    purchaseUpgrade: (type: 'PICK_AMOUNT' | 'MONEY_MULTI', cost: number, value: number) => void;
    nextStage: () => void;
    deliverBagToDrain: (id: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    score: 0,
    money: 0,
    totalLeaves: 10000,
    totalCollected: 0,
    currentTool: 'HAND',
    unlockedTools: ['HAND', 'RAKE', 'BLOWER', 'VACUUM'],

    isInventoryOpen: false,
    isShopOpen: false,
    isAirVentActive: false,
    playerPushEvent: null,
    currentStage: 1,
    totalLeavesInStage: SCENES[0].goal,
    bagsDeliveredToDrain: 0,
    bagsRequiredToClear: 0,
    objectiveType: 'LEAVES',
    stageCleared: false,

    pickAmount: 1,
    moneyMultiplier: 1.0,
    carriedBagId: null,
    bagImpulse: null,
    bags: [],

    upgrades: {
        rakeRange: 1,
        rakeStrength: 1,
        blowerRange: 1,
        blowerStrength: 1,
        handSpeed: 1,
    },

    addLeaf: (amount) => {
        set((state) => {
            const newScore = state.score + amount;
            const newTotal = state.totalCollected + amount;
            const cleared = state.objectiveType === 'LEAVES' && newTotal >= state.totalLeavesInStage;

            return {
                score: newScore,
                totalCollected: newTotal,
                stageCleared: state.stageCleared || cleared
            };
        });
    },

    setCarriedBag: (id) => set({ carriedBagId: id }),
    triggerBagImpulse: (id, force) => set({ bagImpulse: { id, force } }),
    clearBagImpulse: () => set({ bagImpulse: null }),

    createBag: (position) => set((state) => ({
        bags: [...state.bags, {
            id: Math.random().toString(36).substr(2, 9),
            position,
            value: 100
        }],
        score: state.score - 100
    })),

    removeBag: (id, sold) => set((state) => {
        if (sold) {
            const bag = state.bags.find(b => b.id === id);
            if (bag) {
                const payout = Math.floor(bag.value * 1 * state.moneyMultiplier);
                return {
                    bags: state.bags.filter(b => b.id !== id),
                    money: state.money + payout
                };
            }
        }
        return { bags: state.bags.filter(b => b.id !== id) };
    }),

    setTool: (tool) => set({ currentTool: tool }),
    unlockTool: (tool) => set((state) => ({
        unlockedTools: [...state.unlockedTools, tool]
    })),

    toggleInventory: () => set((state) => ({
        isInventoryOpen: !state.isInventoryOpen,
        isShopOpen: false
    })),

    toggleShop: () => set((state) => ({
        isShopOpen: !state.isShopOpen,
        isInventoryOpen: false
    })),
    setAirVentActive: (active) => set({ isAirVentActive: active }),
    triggerPlayerPush: (pos, radius, strength) => set({
        playerPushEvent: { pos, radius, strength, timestamp: Date.now() }
    }),

    purchaseUpgrade: (type, cost, value) => set((state) => {
        if (state.money >= cost) {
            const newState: Partial<GameState> = { money: state.money - cost };
            if (type === 'PICK_AMOUNT') newState.pickAmount = value;
            if (type === 'MONEY_MULTI') newState.moneyMultiplier = value;
            return newState;
        }
        return state;
    }),

    nextStage: () => set((state) => {
        const nextIndex = state.currentStage; // currentStage is 1-indexed
        if (nextIndex >= SCENES.length) return state; // No more stages

        const nextScene = SCENES[nextIndex];
        return {
            currentStage: state.currentStage + 1,
            money: state.money + 500, // Completion bonus
            totalLeavesInStage: nextScene.goalType === 'BAGS' ? 0 : nextScene.goal,
            bagsRequiredToClear: nextScene.goalType === 'BAGS' ? nextScene.goal : 0,
            objectiveType: nextScene.goalType || 'LEAVES',
            bagsDeliveredToDrain: 0,
            totalCollected: 0,
            stageCleared: false,
        };
    }),

    deliverBagToDrain: (id) => set((state) => {
        if (state.objectiveType !== 'BAGS') {
            // Even if not the objective, still sell it
            state.removeBag(id, true);
            return state;
        }

        const newDelivered = state.bagsDeliveredToDrain + 1;
        const cleared = newDelivered >= state.bagsRequiredToClear;

        // Use the original removeBag logic through get() or set
        setTimeout(() => get().removeBag(id, true), 0);

        return {
            bagsDeliveredToDrain: newDelivered,
            stageCleared: state.stageCleared || cleared
        };
    }),
}));
