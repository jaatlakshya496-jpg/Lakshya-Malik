import React from 'react';
import { BikePhysicsState, LevelData } from '../types/game';
import { Pause, RotateCcw, Coins, Trophy, Gauge, Maximize2, Minimize2, Flame, Zap, Bug } from 'lucide-react';

interface HUDProps {
  state: BikePhysicsState;
  level: LevelData;
  totalSavedCoins: number;
  onPause: () => void;
  onRestartCheckpoint: () => void;
  isDebugActive?: boolean;
  onToggleDebug?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  level,
  totalSavedCoins,
  onPause,
  onRestartCheckpoint,
  isDebugActive,
  onToggleDebug,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const speedKmh = Math.round(Math.hypot(state.vx, state.vy) * 4.8);
  const progressRatio = Math.max(0, Math.min(1, state.x / level.finishX));
  const progressPercent = Math.round(progressRatio * 100);

  const multiplier = state.comboMultiplier || state.currentCombo || 1;
  const isComboActive = multiplier > 1 || (state.comboTimer > 0 && multiplier > 1);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 sm:p-5">
      {/* Active Stunt Air Combo! Overlay */}
      {isComboActive && (
        <div className="absolute top-18 sm:top-20 left-1/2 -translate-x-1/2 pointer-events-none z-40 flex flex-col items-center animate-combo-bounce">
          <div className="bg-gradient-to-r from-red-600/90 via-amber-500/95 to-yellow-500/90 backdrop-blur-md border-2 border-yellow-300 rounded-2xl px-5 sm:px-7 py-2.5 flex items-center gap-3 shadow-[0_0_35px_rgba(245,158,11,0.9)]">
            <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-200 fill-yellow-300 animate-pulse" />
            <div className="flex flex-col items-start leading-none">
              <div className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white font-racing drop-shadow-md">
                Combo! x{multiplier}
              </div>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-yellow-100 flex items-center gap-1 mt-0.5">
                <Zap className="w-3 h-3 fill-current" />
                {state.inAir ? 'CONSECUTIVE AIR STUNTS' : 'COMBO BONUS BANKED!'}
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between gap-2">
        {/* Left: Stunt Score & Coins */}
        <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto">
          {/* Stunt Score */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
            <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SCORE</div>
              <div className="text-base sm:text-lg font-black text-amber-300 font-racing leading-none">
                {state.score.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Level Coins */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-yellow-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
            <Coins className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">COINS</div>
              <div className="text-base sm:text-lg font-black text-yellow-300 font-racing leading-none">
                +{state.coinsEarned} <span className="text-xs text-slate-400 font-normal">({totalSavedCoins + state.coinsEarned})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Track Progress Bar & Level Info */}
        <div className="hidden sm:flex flex-col items-center max-w-[280px] w-full">
          <div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-300 mb-1 px-1">
            <span>{level.name}</span>
            <span className="text-amber-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-900/80 rounded-full border border-slate-700 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Speed & Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Speedometer */}
          <div className="hidden xs:flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 rounded-xl px-2.5 py-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <div className="text-right">
              <span className="text-base font-black text-cyan-300 font-racing">{speedKmh}</span>
              <span className="text-[10px] text-slate-400 ml-1">KM/H</span>
            </div>
          </div>

          {/* Restart from checkpoint */}
          <button
            onClick={onRestartCheckpoint}
            title="Restart from Checkpoint (R)"
            className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 shadow-md"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Optional Telemetry / Debug Toggle Button */}
          {onToggleDebug && (
            <button
              onClick={onToggleDebug}
              title="Toggle Physics Debug Telemetry (D)"
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition active:scale-95 shadow-md ${
                isDebugActive
                  ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                  : 'bg-slate-900/85 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bug className="w-5 h-5" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white items-center justify-center transition active:scale-95 shadow-md"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            title="Pause Game (Esc)"
            className="w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold transition active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
          >
            <Pause className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>

      {/* Physics Debug Telemetry Overlay (Step 9 Requirements) */}
      {isDebugActive && (
        <div className="pointer-events-auto absolute top-20 left-4 bg-slate-950/90 backdrop-blur-md border border-emerald-500/60 rounded-xl p-3 font-mono text-xs text-emerald-300 shadow-2xl max-w-xs space-y-1 z-50">
          <div className="font-bold uppercase tracking-wider text-emerald-400 border-b border-emerald-500/30 pb-1 flex items-center justify-between">
            <span>PHYSICS TELEMETRY</span>
            <span className="text-[10px] text-emerald-500/80">LIVE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Velocity:</span>
            <span>Vx: {state.vx.toFixed(2)} | Vy: {state.vy.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Speed / InAir:</span>
            <span>{Math.hypot(state.vx, state.vy).toFixed(1)} px/f | {state.inAir ? 'AIRBORNE' : 'GROUND'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Wheels Grounded:</span>
            <span>R: {state.rearWheel.grounded ? 'YES' : 'NO'} | F: {state.frontWheel.grounded ? 'YES' : 'NO'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Angle / AngVel:</span>
            <span>{Math.round((state.angle * 180) / Math.PI)}° | {state.angularVelocity.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Position / Finish:</span>
            <span>{Math.round(state.x)}px / {level.finishX}px ({progressPercent}%)</span>
          </div>
          {state.crashReason && (
            <div className="text-rose-400 font-bold pt-1 border-t border-rose-500/30">
              Crash: {state.crashReason}
            </div>
          )}
        </div>
      )}

      {/* Mobile Track Progress Indicator (Slim bottom-center) */}
      <div className="sm:hidden w-full max-w-[200px] mx-auto mb-20 pointer-events-none opacity-80">
        <div className="w-full h-1.5 bg-slate-900/80 rounded-full border border-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
