import React from 'react';
import { soundManager } from '../audio/SoundManager';
import { RotateCcw, Home, Skull, ArrowRight } from 'lucide-react';

interface CrashModalProps {
  crashReason: string;
  onRestartCheckpoint: () => void;
  onRestartLevel: () => void;
  onMainMenu: () => void;
}

export const CrashModal: React.FC<CrashModalProps> = ({
  crashReason,
  onRestartCheckpoint,
  onRestartLevel,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-rose-950/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-rose-500/60 rounded-3xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.35)] flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-500 mb-3 shadow-lg">
          <Skull className="w-9 h-9" />
        </div>

        <h2 className="text-3xl font-black uppercase tracking-wider text-rose-400 font-racing mb-1">
          WIPEOUT!
        </h2>
        <p className="text-xs text-rose-300/80 mb-6 font-medium">
          {crashReason || 'Crash impact detected'}
        </p>

        {/* Buttons */}
        <div className="w-full space-y-3">
          {/* Quick Checkpoint Respawn */}
          <button
            onClick={() => {
              soundManager.playClick();
              onRestartCheckpoint();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black uppercase text-base flex items-center justify-center gap-2 font-racing shadow-[0_0_20px_rgba(245,158,11,0.5)] transition active:scale-95 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5 stroke-[3]" /> RESTART CHECKPOINT
          </button>

          {/* Restart Entire Level */}
          <button
            onClick={() => {
              soundManager.playClick();
              onRestartLevel();
            }}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold uppercase text-xs flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> RETRY FULL TRACK
          </button>

          {/* Main Menu */}
          <button
            onClick={() => {
              soundManager.playClick();
              onMainMenu();
            }}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold uppercase text-xs flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Home className="w-4 h-4" /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
