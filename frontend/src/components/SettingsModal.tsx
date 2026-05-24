'use client';

import { useSettings } from '@/context/SettingsContext';

export default function SettingsModal() {
  const {
    warningThreshold,
    criticalThreshold,
    setWarningThreshold,
    setCriticalThreshold,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useSettings();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-md p-6 rounded-2xl glass-panel relative border-glowCyan/30">
        <button
          onClick={() => setIsSettingsOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-glowCyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Alert Settings
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-amber-400">Warning Threshold</span>
              <span className="font-mono text-white">{warningThreshold}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[10px] text-slate-500 block leading-normal">
              Triggers visual amber warnings when CPU, Memory, or Storage utilization passes this percentage.
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-rose-500">Critical Threshold</span>
              <span className="font-mono text-white">{criticalThreshold}%</span>
            </div>
            <input
              type="range"
              min={warningThreshold + 1}
              max="99"
              value={Math.max(criticalThreshold, warningThreshold + 1)}
              onChange={(e) => setCriticalThreshold(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <span className="text-[10px] text-slate-500 block leading-normal">
              Triggers active red warnings and console alert logs when resource metrics exceed this limit.
            </span>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-glowCyan to-glowIndigo text-white text-xs font-bold shadow-lg hover:shadow-cyan-500/10 hover:scale-[1.02] transition-all duration-200"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
