import { create } from 'zustand';

export type ToolType = 'HAND' | 'RAKE' | 'BLOWER';

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
    currentTool: ToolType;
    unlockedTools: ToolType[];

    // UI State
    isInventoryOpen: boolean;
    isShopOpen: boolean;

    // Game Logic State
    pickAmount: number; // 1 -> 3 -> 5 -> 10
    moneyMultiplier: number; // 1.0 -> 1.2 -> 1.5 -> 2.0
    carriedBagId: string | null;

    // Bags
    bags: { id: string; position: [number, number, number]; value: number }[];

    // Upgrade State
    upgrades: Upgrades;

    // Actions
    addLeaf: (amount: number) => void; // Modified to create bags
    createBag: (position: [number, number, number]) => void;
    removeBag: (id: string, sold: boolean) => void;
    setCarriedBag: (id: string | null) => void;

    setTool: (tool: ToolType) => void;
    unlockTool: (tool: ToolType) => void;
    toggleInventory: () => void;
    toggleShop: () => void;
    purchaseUpgrade: (type: 'PICK_AMOUNT' | 'MONEY_MULTI', cost: number, value: number) => void; // Specific types
}

export const useGameStore = create<GameState>((set, get) => ({
    score: 0, // Current leaves
    money: 0,
    currentTool: 'HAND',
    unlockedTools: ['HAND', 'RAKE', 'BLOWER'],

    isInventoryOpen: false,
    isShopOpen: false,

    pickAmount: 1,
    moneyMultiplier: 1.0,
    carriedBagId: null,
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
            let newScore = state.score + amount;
            // Check for bag creation (every 100 leaves)
            // Note: In a real tick, we might want to spawn multiple if vastly over 100, 
            // but for single click events, usually it creates 1. 
            // We'll trust the caller to handle position, but here we just manage the count.
            // Wait, the caller (Tools.tsx) needs to know IF a bag should spawn to determine position.
            // Let's just create the bag logic here and let caller ask "should I spawn?" or handle it differently.
            // Revised: We'll just increment score here. The Tools.tsx will check score >= 100 and call createBag.
            return { score: newScore };
        });

        // Auto-convert 100 leaves to bag logic could be here, but we need player position.
        // So we will stick to simple state update here.
    },

    setCarriedBag: (id) => set({ carriedBagId: id }),

    createBag: (position) => set((state) => ({
        bags: [...state.bags, {
            id: Math.random().toString(36).substr(2, 9),
            position,
            value: 100
        }],
        score: state.score - 100 // Deduct cost
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

    purchaseUpgrade: (type, cost, value) => set((state) => {
        if (state.money >= cost) {
            const newState: Partial<GameState> = { money: state.money - cost };
            if (type === 'PICK_AMOUNT') newState.pickAmount = value;
            if (type === 'MONEY_MULTI') newState.moneyMultiplier = value;
            return newState;
        }
        return state;
    }),
}));
