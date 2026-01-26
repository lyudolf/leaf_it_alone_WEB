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
    processedLeavesTotal: number; // Cumulative across all stages
    totalLeaves: number;
    totalCollected: number; // Current stage progress
    currentTool: ToolType;
    unlockedTools: ToolType[];

    // UI State
    isInventoryOpen: boolean;
    isShopOpen: boolean;
    isHelpOpen: boolean;
    isAirVentActive: boolean;
    playerPushEvent: { pos: [number, number, number], radius: number, strength: number, timestamp: number } | null;
    currentStage: number;
    totalLeavesInStage: number; // goal
    bagsDeliveredToDrain: number;
    bagsRequiredToClear: number;
    objectiveType: 'LEAVES' | 'BAGS';
    interactionPrompt: string | null;
    stageCleared: boolean;
    toasts: { id: string; message: string }[];
    isEndingOpen: boolean;
    closeEnding: () => void;
    tornadoPosition: [number, number, number] | null; // Tornado position for Stage 5
    isVideoPlaying: boolean; // Ending video playback state

    // Graphics Options
    isGraphicsOpen: boolean;
    graphicsShadows: boolean;
    graphicsResolution: number; // 1.0 = full, 0.75, 0.5
    graphicsAntialiasing: boolean;
    graphicsHighQuality: boolean;
    toggleGraphics: () => void;
    setGraphicsShadows: (v: boolean) => void;
    setGraphicsResolution: (v: number) => void;
    setGraphicsAntialiasing: (v: boolean) => void;
    setGraphicsHighQuality: (v: boolean) => void;

    // Create Mode State
    gameStarted: boolean;
    isCreateMode: boolean;
    customLeafModel: string | null;
    customSkybox: string | null;
    isGenerating: boolean;
    generationStep: 'leaf' | 'skybox' | 'done' | null;
    generationsToday: number;
    lastGenerationDate: string | null;

    // Game Logic State
    pickAmount: number; // 1, 3, 5, 10, 50, 100
    moneyMultiplier: number; // 1, 2, 3
    carriedBagId: string | null;
    bagImpulse: { id: string; force: [number, number, number] } | null;

    // Bags
    bags: { id: string; position: [number, number, number]; value: number }[];

    // Upgrade State
    upgrades: Upgrades;

    // Actions
    addLeaf: (amount: number) => void;
    createBag: (position: [number, number, number], id?: string) => void;
    removeBag: (id: string, sold: boolean) => void;
    setCarriedBag: (id: string | null) => void;
    triggerBagImpulse: (id: string, force: [number, number, number]) => void;
    clearBagImpulse: () => void;

    setTool: (tool: ToolType) => void;
    unlockTool: (tool: ToolType) => void;
    toggleInventory: () => void;
    toggleShop: () => void;
    toggleHelp: () => void;
    isIntroOpen: boolean;
    closeIntro: () => void;
    isTutorialOpen: boolean;
    closeTutorial: () => void;
    isStageTutorialOpen: boolean;
    closeStageTutorial: () => void;
    isBagTutorialOpen: boolean;
    triggerBagTutorial: () => void;
    closeBagTutorial: () => void;
    hasSeenBagTutorial: boolean;
    isStageLoading: boolean;
    setStageLoading: (loading: boolean) => void;
    setAirVentActive: (active: boolean) => void;
    triggerPlayerPush: (pos: [number, number, number], radius: number, strength: number) => void;
    purchaseUpgrade: (type: 'PICK_AMOUNT' | 'MONEY_MULTI' | 'RAKE' | 'BLOWER' | 'POTATO_AI' | 'CARROT_AI' | 'TOMATO_AI', cost: number, value: number) => void;
    setInteractionPrompt: (prompt: string | null) => void;
    setTornadoPosition: (pos: [number, number, number] | null) => void;
    nextStage: () => void;
    deliverBagToDrain: (id: string) => void;
    addToast: (message: string) => void;
    startEndingVideo: () => void;
    stopEndingVideo: () => void;
    resetGame: () => void;
    aiSellBag: (value: number) => void;

    // Create Mode Actions
    startGame: (createMode: boolean) => void;
    setCustomLeafModel: (url: string | null) => void;
    setCustomSkybox: (url: string | null) => void;
    setGenerating: (generating: boolean) => void;
    setGenerationStep: (step: 'leaf' | 'skybox' | 'done' | null) => void;
    incrementGenerations: () => boolean; // Returns false if limit reached
    checkGenerationLimit: () => boolean; // Returns true if can generate

    unlockedPotato: boolean;
    unlockedCarrot: boolean;
    unlockedTomato: boolean;
}

export const useGameStore = create<GameState>((set, get) => ({
    score: 0,
    money: 0,
    processedLeavesTotal: 0,
    totalLeaves: 10000,
    totalCollected: 0,
    currentTool: 'HAND',
    unlockedTools: ['HAND'], // Production: Start with HAND only

    isInventoryOpen: false,
    isShopOpen: false,
    isAirVentActive: false,
    playerPushEvent: null,
    currentStage: 1, // Production: Start at Stage 1
    totalLeavesInStage: SCENES[0].goal, // Stage 1 goal
    bagsDeliveredToDrain: 0,
    bagsRequiredToClear: 0,
    objectiveType: 'LEAVES',
    interactionPrompt: null,
    stageCleared: false,
    isEndingOpen: false,
    closeEnding: () => set({ isEndingOpen: false }),
    toasts: [],
    tornadoPosition: null,
    isVideoPlaying: false,

    // Graphics Options (defaults: all OFF for performance)
    isGraphicsOpen: false,
    graphicsShadows: false,
    graphicsResolution: 0.75,
    graphicsAntialiasing: false,
    graphicsHighQuality: false,
    toggleGraphics: () => set((s) => ({ isGraphicsOpen: !s.isGraphicsOpen })),
    setGraphicsShadows: (v) => set({ graphicsShadows: v }),
    setGraphicsResolution: (v) => set({ graphicsResolution: v }),
    setGraphicsAntialiasing: (v) => set({ graphicsAntialiasing: v }),
    setGraphicsHighQuality: (v) => set({ graphicsHighQuality: v }),

    // Create Mode State
    gameStarted: false,
    isCreateMode: false,
    customLeafModel: null,
    customSkybox: null,
    isGenerating: false,
    generationStep: null,
    generationsToday: 0,
    lastGenerationDate: null,

    unlockedPotato: false,
    unlockedCarrot: false,
    unlockedTomato: false,

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
            const isLeavesTask = state.objectiveType === 'LEAVES';
            const cleared = isLeavesTask && newTotal >= state.totalLeavesInStage;

            // Trigger Ending if Stage 5 cleared just now
            let openEnding = false;
            if (cleared && !state.stageCleared && state.currentStage === 5) {
                openEnding = true;
            }

            return {
                score: newScore,
                totalCollected: newTotal,
                stageCleared: state.stageCleared || cleared,
                isEndingOpen: state.isEndingOpen || openEnding
            };
        });
    },

    setCarriedBag: (id) => set({ carriedBagId: id }),
    triggerBagImpulse: (id, force) => set({ bagImpulse: { id, force } }),
    clearBagImpulse: () => set({ bagImpulse: null }),

    createBag: (position, id) => set((state) => {
        const bagId = id || Math.random().toString(36).substr(2, 9);
        return {
            bags: [...state.bags, {
                id: bagId,
                position,
                value: 150
            }],
            score: state.score - 100
        };
    }),

    removeBag: (id, sold) => set((state) => {
        if (sold) {
            const bag = state.bags.find(b => b.id === id);
            if (bag) {
                const payout = Math.floor(bag.value * state.moneyMultiplier);
                const newProcessed = state.processedLeavesTotal + bag.value;

                // Check if Stage goal (processed leaves) met
                const isBagTask = state.objectiveType === 'BAGS';
                const currentGoal = state.totalLeavesInStage;
                const cleared = isBagTask && newProcessed >= currentGoal;

                return {
                    bags: state.bags.filter(b => b.id !== id),
                    money: state.money + payout,
                    processedLeavesTotal: newProcessed,
                    bagsDeliveredToDrain: state.bagsDeliveredToDrain + 1,
                    stageCleared: state.stageCleared || cleared
                };
            }
        }
        return { bags: state.bags.filter(b => b.id !== id) };
    }),

    aiSellBag: (value: number) => set((state) => {
        const payout = Math.floor(value * state.moneyMultiplier);
        const newProcessed = state.processedLeavesTotal + value;

        // Check if Stage goal
        const isBagTask = state.objectiveType === 'BAGS';
        const currentGoal = state.totalLeavesInStage;
        const cleared = isBagTask && newProcessed >= currentGoal;

        return {
            money: state.money + payout,
            processedLeavesTotal: newProcessed,
            bagsDeliveredToDrain: state.bagsDeliveredToDrain + 1,
            stageCleared: state.stageCleared || cleared
        };
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

    isHelpOpen: false,
    toggleHelp: () => set((state) => ({ isHelpOpen: !state.isHelpOpen })),

    isIntroOpen: true,
    closeIntro: () => set({ isIntroOpen: false, isTutorialOpen: true }),

    isTutorialOpen: false,
    closeTutorial: () => set({ isTutorialOpen: false }),

    isStageTutorialOpen: false,
    closeStageTutorial: () => set({ isStageTutorialOpen: false }),

    isBagTutorialOpen: false,
    hasSeenBagTutorial: false,
    triggerBagTutorial: () => set((state) => {
        if (!state.hasSeenBagTutorial) {
            return { isBagTutorialOpen: true, hasSeenBagTutorial: true };
        }
        return {};
    }),

    closeBagTutorial: () => set({ isBagTutorialOpen: false }),

    isStageLoading: false,
    setStageLoading: (loading) => set({ isStageLoading: loading }),

    setAirVentActive: (active) => set({ isAirVentActive: active }),
    triggerPlayerPush: (pos, radius, strength) => set({
        playerPushEvent: { pos, radius, strength, timestamp: Date.now() }
    }),



    purchaseUpgrade: (type: 'PICK_AMOUNT' | 'MONEY_MULTI' | 'RAKE' | 'BLOWER' | 'POTATO_AI' | 'CARROT_AI' | 'TOMATO_AI', cost: number, value: number) => set((state) => {
        if (state.money >= cost) {
            const newState: Partial<GameState> = { money: state.money - cost };
            if (type === 'PICK_AMOUNT') newState.pickAmount = value;
            if (type === 'MONEY_MULTI') newState.moneyMultiplier = value;
            if (type === 'RAKE') {
                newState.upgrades = {
                    ...state.upgrades,
                    rakeRange: value,
                    rakeStrength: value
                };
            }
            if (type === 'BLOWER') {
                newState.upgrades = {
                    ...state.upgrades,
                    blowerRange: value,
                    blowerStrength: value
                };
            }
            if (type === 'POTATO_AI' as any) {
                newState.unlockedPotato = true;
            }
            if (type === 'CARROT_AI' as any) {
                newState.unlockedCarrot = true;
            }
            if (type === 'TOMATO_AI' as any) {
                newState.unlockedTomato = true;
            }
            return newState;
        }
        return state;
    }),

    setInteractionPrompt: (prompt) => set({ interactionPrompt: prompt }),
    setTornadoPosition: (pos) => set({ tornadoPosition: pos }),
    nextStage: () => {
        const state = get();
        const nextIndex = state.currentStage; // 1-indexed
        if (nextIndex >= SCENES.length) {
            state.addToast("최종 스테이지 클리어! 모든 구역이 개방되었습니다.");
            return;
        }

        const nextScene = SCENES[nextIndex];
        const unlockMessage = nextIndex === 1 ? "Stage 2 오픈! 두더지 출현 + 갈퀴 해금" :
            nextIndex === 2 ? "Stage 3 오픈! 송풍기 해금" :
                nextIndex === 3 ? "Stage 4 오픈! 거대 두더지 출몰!" :
                    "Stage 5 오픈! 재난!";

        state.addToast(unlockMessage);

        set({
            currentStage: state.currentStage + 1,
            totalLeavesInStage: nextScene.goal,
            objectiveType: nextScene.goalType || 'LEAVES',
            bagsDeliveredToDrain: 0,
            totalCollected: 0,
            processedLeavesTotal: 0,
            stageCleared: false,
            isStageTutorialOpen: true // Open tutorial for next stage
        });

        // Auto unlock tools
        if (nextIndex === 1) get().unlockTool('RAKE');
        if (nextIndex === 2) get().unlockTool('BLOWER');
    },

    deliverBagToDrain: (id) => {
        get().removeBag(id, true);
    },

    addToast: (message) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message }]
        }));
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter(t => t.id !== id)
            }));
        }, 3000);
    },

    startEndingVideo: () => set({ isVideoPlaying: true }),
    stopEndingVideo: () => set({ isVideoPlaying: false }),

    resetGame: () => set({
        score: 0,
        money: 0,
        processedLeavesTotal: 0,
        totalCollected: 0,
        currentStage: 1,
        totalLeavesInStage: SCENES[0].goal,
        bagsDeliveredToDrain: 0,
        objectiveType: 'LEAVES',
        stageCleared: false,
        toasts: [],
        pickAmount: 1,
        moneyMultiplier: 1.0,
        carriedBagId: null,
        bags: [],
        unlockedTools: ['HAND'],
        currentTool: 'HAND',
        upgrades: {
            rakeRange: 1,
            rakeStrength: 1,
            blowerRange: 1,
            blowerStrength: 1,
            handSpeed: 1,
        }
    }),

    // Create Mode Actions
    startGame: (createMode) => set({
        gameStarted: true,
        isCreateMode: createMode,
        isInventoryOpen: false,
        isShopOpen: false,
        isHelpOpen: false,
        isIntroOpen: true,
        isTutorialOpen: false,
        isStageTutorialOpen: false
    }),

    setCustomLeafModel: (url) => set({ customLeafModel: url }),
    setCustomSkybox: (url) => set({ customSkybox: url }),
    setGenerating: (generating) => set({ isGenerating: generating }),
    setGenerationStep: (step) => set({ generationStep: step }),

    incrementGenerations: () => {
        const state = get();
        const today = new Date().toDateString();

        // Reset counter if new day
        if (state.lastGenerationDate !== today) {
            set({
                generationsToday: 1,
                lastGenerationDate: today
            });
            return true;
        }

        // Check limit
        if (state.generationsToday >= 3) {
            return false; // Limit reached
        }

        set({
            generationsToday: state.generationsToday + 1
        });
        return true;
    },

    checkGenerationLimit: () => {
        const state = get();
        const today = new Date().toDateString();

        // Reset if new day
        if (state.lastGenerationDate !== today) {
            return true;
        }

        return state.generationsToday < 3;
    }
}));
