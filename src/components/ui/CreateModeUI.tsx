'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/game/store';
import { generateModel } from '@/api/tripo';
import { generateSkybox } from '@/api/skyboxai';

export function CreateModeUI() {
    const {
        isCreateMode,
        generationStep,
        isGenerating,
        setGenerationStep,
        setGenerating,
        setCustomLeafModel,
        setCustomSkybox,
        startGame,
        incrementGenerations,
        checkGenerationLimit,
    } = useGameStore();

    const [leafPrompt, setLeafPrompt] = useState('');
    const [skyboxPrompt, setSkyboxPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [currentLoadingImage, setCurrentLoadingImage] = useState(0);

    // Carousel for loading images
    const loadingImages = [
        '/loading/loading1.png', '/loading/loading2.png', '/loading/loading3.png', '/loading/loading4.png',
        '/loading/loading5.png', '/loading/loading6.png', '/loading/loading7.png', '/loading/loading8.png'
    ];

    // Auto-rotate loading images
    useEffect(() => {
        if (!isGenerating) return;

        const interval = setInterval(() => {
            setCurrentLoadingImage((prev) => (prev + 1) % loadingImages.length);
        }, 5000); // 5 seconds per image

        return () => clearInterval(interval);
    }, [isGenerating]);

    // Handle 'E' key press to start game
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isGenerating && (generationStep === 'completed' as any) && (e.code === 'KeyE' || e.key.toLowerCase() === 'e')) {
                // Request Pointer Lock immediately must be user-triggered (keypress counts)
                document.body.requestPointerLock();

                setGenerationStep('done');
                startGame(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGenerating, generationStep, setGenerationStep, startGame]);

    // Move conditional return after hooks
    if (!isCreateMode || generationStep === 'done') return null;

    const handleGenerateLeaf = async () => {
        if (!leafPrompt.trim()) {
            setError('낙엽 모델을 위한 프롬프트를 입력해주세요.');
            return;
        }

        if (!checkGenerationLimit()) {
            setError('하루 생성 한도(3회)에 도달했습니다. 내일 다시 시도해주세요.');
            return;
        }

        setError(null);
        setGenerating(true);
        setProgress(0);
        // setGenerationStep('leaf'); // Already set

        const result = await generateModel(leafPrompt, (p) => setProgress(p));

        if (result.success && result.modelUrl) {
            setCustomLeafModel(result.modelUrl);
            incrementGenerations();
            setGenerationStep('skybox');
        } else {
            setError(result.error || '모델 생성 실패. 기본 모델을 사용합니다.');
            setCustomLeafModel(null);
            setGenerationStep('skybox');
        }

        setGenerating(false);
    };

    const handleGenerateSkybox = async () => {
        if (!skyboxPrompt.trim()) {
            setError('스카이박스를 위한 프롬프트를 입력해주세요.');
            return;
        }

        if (!checkGenerationLimit()) {
            setError('하루 생성 한도(3회)에 도달했습니다. 내일 다시 시도해주세요.');
            return;
        }

        setError(null);
        setGenerating(true);

        const result = await generateSkybox(skyboxPrompt);

        if (result.success && result.skyboxUrl) {
            setCustomSkybox(result.skyboxUrl);
            incrementGenerations();
        } else {
            setError(result.error || '스카이박스 생성 실패. 기본 스카이박스를 사용합니다.');
            setCustomSkybox(null);
        }

        setGenerating(false);
        // Instead of 'done', go to 'completed' step to let user press start
        setGenerationStep('completed' as any); // Using 'completed' as a temporary local step, casting to any because store type is strict

        // Remove focus from any inputs
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    const handleStartGame = () => {
        // Remove focus from any inputs
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        // Ensure Pointer Lock is requested
        document.body.requestPointerLock();

        setGenerationStep('done');
        startGame(true);
    };

    const handleSkipToGame = () => {
        // Remove focus from any inputs
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setGenerationStep('done');
        startGame(true);
    };

    // Helper to render current loading image background for completed screen
    const lastImage = loadingImages[currentLoadingImage];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90">
            {/* Loading Screen - Full Screen Image */}
            {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-end bg-black z-50">
                    {/* Full Screen Background Image */}
                    <img
                        src={loadingImages[currentLoadingImage]}
                        alt="Loading"
                        className="absolute inset-0 w-full h-full object-contain bg-black opacity-100 transition-opacity duration-1000"
                    />

                    {/* Bottom Loading Indicator */}
                    <div className="relative z-10 w-full bg-gradient-to-t from-black via-black/80 to-transparent pb-12 pt-24 px-8 flex flex-col items-center">
                        <div className="text-white text-3xl font-bold mb-4 drop-shadow-lg text-center">
                            {generationStep === 'leaf' ? '🍂 낙엽 모델 생성 중...' : '🌅 스카이박스 생성 중...'}
                        </div>

                        <div className="w-full max-w-xl h-3 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-700">
                            {generationStep === 'leaf' ? (
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 transition-all duration-300 ease-out"
                                    style={{ width: `${Math.max(5, progress)}%` }}
                                ></div>
                            ) : (
                                <div className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 animate-pulse w-full origin-left animate-[progress_2s_infinite]"></div>
                            )}
                        </div>
                        <p className="text-gray-300 text-sm mt-4 font-medium tracking-wide">
                            {generationStep === 'leaf'
                                ? `AI가 3D 모델을 생성하고 있습니다... (${progress}%)`
                                : 'AI가 스카이박스를 생성하고 있습니다... (1~2분 소요)'}
                        </p>
                    </div>
                </div>
            )}

            {/* Step 3: Completed Screen - Autumn Theme */}
            {!isGenerating && (generationStep === 'completed' as any) && (
                <div className="bg-white rounded-3xl p-12 max-w-2xl w-full shadow-2xl text-center relative overflow-hidden border-4 border-amber-200">
                    <div className="relative z-10">
                        <h2 className="text-5xl font-black text-amber-600 mb-6 drop-shadow-sm">✨ 생성 완료! ✨</h2>
                        <p className="text-xl text-gray-700 mb-8 font-medium">
                            나만의 <span className="text-orange-600 font-bold">가을 월드</span>가 준비되었습니다.<br />
                            낙엽을 쓸어담을 준비가 되셨나요?
                        </p>

                        <button
                            onClick={handleStartGame}
                            className="bg-gradient-to-r from-amber-600 to-orange-500 text-white px-12 py-6 rounded-2xl font-black text-3xl shadow-xl hover:scale-105 transition-all animate-bounce border-b-4 border-orange-700 active:border-b-0 active:translate-y-1"
                        >
                            GAME START
                            <span className="block text-sm font-bold mt-1 text-amber-100">(Press E)</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 1: Leaf Model Prompt */}
            {!isGenerating && generationStep === null && (
                <div className="bg-white rounded-3xl p-12 max-w-2xl w-full shadow-2xl">
                    <h2 className="text-4xl font-black text-gray-800 mb-4">🍂 Step 1: 수집할 오브젝트</h2>
                    <p className="text-gray-600 mb-8">어떤 오브젝트를 수집하고 싶으신가요?</p>

                    <textarea
                        value={leafPrompt}
                        onChange={(e) => setLeafPrompt(e.target.value)}
                        className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg mb-6 focus:border-emerald-500 focus:outline-none resize-none placeholder:text-gray-500 font-medium text-gray-800"
                        rows={3}
                        placeholder="예: autumn maple leaves, cherry blossoms, golden coins..."
                    />

                    {error && (
                        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => { setGenerationStep('leaf'); handleGenerateLeaf(); }}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-xl hover:scale-105 transition-all shadow-lg"
                        >
                            ✨ AI로 생성하기
                        </button>
                        <button
                            onClick={() => {
                                setCustomLeafModel(null);
                                setGenerationStep('skybox');
                            }}
                            className="px-8 py-4 border-2 border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all"
                        >
                            기본 모델 사용
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Skybox Prompt */}
            {!isGenerating && generationStep === 'skybox' && (
                <div className="bg-white rounded-3xl p-12 max-w-2xl w-full shadow-2xl">
                    <h2 className="text-4xl font-black text-gray-800 mb-4">🌅 Step 2: 환경 설정</h2>
                    <p className="text-gray-600 mb-8">어떤 환경에서 플레이하고 싶으신가요?</p>

                    <textarea
                        value={skyboxPrompt}
                        onChange={(e) => setSkyboxPrompt(e.target.value)}
                        className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg mb-6 focus:border-purple-500 focus:outline-none resize-none placeholder:text-gray-500 font-medium text-gray-800"
                        rows={3}
                        placeholder="예: sunny autumn park, cherry blossom garden, fantasy forest..."
                    />

                    {error && (
                        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={handleGenerateSkybox}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-xl hover:scale-105 transition-all shadow-lg"
                        >
                            ✨ AI로 생성하기
                        </button>
                        <button
                            onClick={handleSkipToGame}
                            className="px-8 py-4 border-2 border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all"
                        >
                            기본 환경 사용
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
