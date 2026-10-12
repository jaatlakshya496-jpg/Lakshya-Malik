import React from 'react';
import { GameControls } from '../types/game';
import { ArrowUpRight, ArrowUpLeft, Flame, ShieldAlert } from 'lucide-react';

interface TouchControlsProps {
  controls: GameControls;
  onControlChange: (controlKey: keyof GameControls, active: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  controls,
  onControlChange,
}) => {
  // Prevent context menu and unwanted drag
  const bindTouch = (key: keyof GameControls) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      onControlChange(key, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      onControlChange(key, false);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      onControlChange(key, false);
    },
    onPointerLeave: () => {
      onControlChange(key, false);
    },
  });

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-end p-4 pb-6 md:pb-8">
      <div className="w-full flex items-end justify-between px-2 sm:px-6">
        {/* Left Side: Back / Reverse (Piche Ho) & Niche (Down) */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Niche (Down / Nose Down) */}
          <button
            {...bindTouch('leanForward')}
            type="button"
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 touch-control-button ${
              controls.leanForward
                ? 'bg-amber-500/90 border-amber-300 text-white shadow-[0_0_24px_rgba(245,158,11,0.85)] scale-95'
                : 'bg-slate-900/80 border-amber-500/40 text-amber-400 hover:border-amber-400/80'
            } backdrop-blur-md`}
            aria-label="Niche (Down / Tilt Forward)"
          >
            <ArrowUpRight className="w-8 h-8 mb-0.5 rotate-90" />
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">NICHE 🔽</span>
            <span className="text-[8px] font-semibold text-amber-300/80 tracking-tight">NOSE DOWN</span>
          </button>

          {/* Back / Reverse (Piche Ho / Brake) */}
          <button
            {...bindTouch('brake')}
            type="button"
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 touch-control-button ${
              controls.brake
                ? 'bg-rose-600/95 border-rose-300 text-white shadow-[0_0_28px_rgba(225,29,72,0.9)] scale-95'
                : 'bg-slate-900/85 border-rose-500/50 text-rose-400 hover:border-rose-400'
            } backdrop-blur-md`}
            aria-label="Back / Reverse (Piche Ho)"
          >
            <ShieldAlert className="w-8 h-8 sm:w-9 sm:h-9 mb-0.5" />
            <span className="text-xs sm:text-sm font-black tracking-widest uppercase">PICHE ⏪</span>
            <span className="text-[9px] font-semibold text-rose-300/80 tracking-tight">BRAKE / REV</span>
          </button>
        </div>

        {/* Right Side: Upper (Up / Lift Front) & Speed (Aage Badhe) */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Upper (Up / Lift Wheelie) */}
          <button
            {...bindTouch('leanBack')}
            type="button"
            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 touch-control-button ${
              controls.leanBack
                ? 'bg-cyan-500/90 border-cyan-300 text-white shadow-[0_0_24px_rgba(6,182,212,0.85)] scale-95'
                : 'bg-slate-900/80 border-cyan-500/40 text-cyan-400 hover:border-cyan-400/80'
            } backdrop-blur-md`}
            aria-label="Upper (Up / Wheelie Lift)"
          >
            <ArrowUpLeft className="w-8 h-8 mb-0.5" />
            <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase">UPPER 🔼</span>
            <span className="text-[8px] font-semibold text-cyan-300/80 tracking-tight">WHEELIE</span>
          </button>


          {/* Speed / Accelerate (Aage Badhe) */}
          <button
            {...bindTouch('gas')}
            type="button"
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 touch-control-button ${
              controls.gas
                ? 'bg-emerald-500/95 border-emerald-300 text-white shadow-[0_0_32px_rgba(16,185,129,0.95)] scale-95'
                : 'bg-slate-900/85 border-emerald-500/50 text-emerald-400 hover:border-emerald-400'
            } backdrop-blur-md`}
            aria-label="Speed (Aage Badhe)"
          >
            <Flame className="w-8 h-8 sm:w-9 sm:h-9 mb-0.5" />
            <span className="text-xs sm:text-sm font-black tracking-widest uppercase">AAGE ⏩</span>
            <span className="text-[9px] font-semibold text-emerald-300/80 tracking-tight">SPEED / GO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
