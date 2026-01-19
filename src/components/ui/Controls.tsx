'use client';

import { SceneSpec } from '@/spec/SceneSpec';

interface ControlsProps {
    spec: SceneSpec;
    onUpdate: (newSpec: Partial<SceneSpec>) => void;
    onPanic: () => void;
    onReset: () => void;
    currentState: any;
}

export function Controls({ spec, onUpdate, onPanic, onReset, currentState }: ControlsProps) {
    const intensity = currentState?.context?.intensity ?? spec.intensity;
    const holdProgress = currentState?.context?.holdProgress ?? 0;
    const isRegulating = currentState?.matches('regulating');

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">

                {/* Status & Intensity */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                        <label className="text-white/60 text-sm font-medium uppercase tracking-wider">Intensity</label>
                        <span className="text-white font-mono text-xl">{(intensity * 100).toFixed(0)}%</span>
                    </div>
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-300"
                            style={{ width: `${(intensity / 0.7) * 100}%` }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="0.7"
                            step="0.01"
                            value={intensity}
                            onChange={(e) => onUpdate({ intensity: parseFloat(e.target.value) })}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Progress Bar (Visible when holding) */}
                <div className={`transition-all duration-300 ${isRegulating || holdProgress > 0 ? 'opacity-100 h-8' : 'opacity-0 h-0 overflow-hidden'}`}>
                    <div className="flex flex-col gap-1">
                        <label className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Hold Progress</label>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-blue-400"
                                style={{ width: `${holdProgress * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Buttons Row */}
                <div className="grid grid-cols-4 gap-4">
                    <button
                        onClick={() => onUpdate({ neutralMode: !spec.neutralMode })}
                        className={`py-3 rounded-2xl font-semibold text-sm transition-all border ${spec.neutralMode
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-transparent border-white/5 text-white/40 hover:bg-white/5'
                            }`}
                    >
                        {spec.neutralMode ? 'Neutral On' : 'Neutral Off'}
                    </button>

                    <button
                        onClick={onReset}
                        className="py-3 bg-white/5 border border-white/5 rounded-2xl font-semibold text-sm text-white/80 hover:bg-white/10 transition-all"
                    >
                        Reset
                    </button>

                    <button
                        onClick={onPanic}
                        className="col-span-2 py-3 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-bold text-sm tracking-widest uppercase shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                    >
                        Panic
                    </button>
                </div>

                {/* Instructions */}
                <div className="text-center text-white/30 text-[10px] uppercase tracking-widest font-medium">
                    Hold 1.2s to soften • Drag to guide flow
                </div>
            </div>
        </div>
    );
}
