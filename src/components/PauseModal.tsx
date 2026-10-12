import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';
import { AudioSettings } from '../types/game';

interface PauseModalProps {
  onResume: () => void;
  onRestartCheckpoint: () => void;
  onRestartLevel: () => void;
  onMainMenu: () => void;
  audioSettings: AudioSettings;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestartCheckpoint,
  onRestartLevel,
  onMainMenu,
  audioSettings,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-3xl font-black uppercase tracking-wider text-white font-racing mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6">Take a breath or restart the current run</p>

        {/* Buttons stack */}
        <div className="w-full space-y-3">
          {/* Resume */}
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-base flex items-center justify-center gap-2 font-racing shadow-[0_0_20px_rgba(245,158,11,0.5)] transition active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" /> RESUME RACE
          </button>

          {/* Restart from Checkpoint */}
          <button
            onClick={() => {
              soundManager.playClick();
              onRestartCheckpoint();
            }}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 font-bold uppercase text-sm flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> RESTART CHECKPOINT
          </button>

          {/* Restart Level */}
          <button
            onClick={() => {
              soundManager.playClick();
              onRestartLevel();
            }}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold uppercase text-sm flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> RESTART TRACK
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-full py-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-slate-400 font-medium text-xs flex items-center justify-center gap-2 transition"
          >
            {audioSettings.soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" /> SOUND: ON
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" /> SOUND: MUTED
              </>
            )}
          </button>

          {/* Main Menu */}
          <button
            onClick={() => {
              soundManager.playClick();
              onMainMenu();
            }}
            className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold uppercase text-sm flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Home className="w-4 h-4" /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
