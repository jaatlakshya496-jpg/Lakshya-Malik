import React, { useEffect } from 'react';
import { LevelData } from '../types/game';
import { soundManager } from '../audio/SoundManager';
import confetti from 'canvas-confetti';
import { Star, Trophy, Coins, RotateCcw, ArrowRight, Home, Film, Sparkles } from 'lucide-react';

interface LevelCompleteModalProps {
  level: LevelData;
  score: number;
  coinsEarned: number;
  bestStunt: string;
  onNextLevel: () => void;
  onReplay: () => void;
  onMainMenu: () => void;
  onOpenLeaderboard?: () => void;
  onWatchReplay?: () => void;
  hasNextLevel: boolean;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  level,
  score,
  coinsEarned,
  bestStunt,
  onNextLevel,
  onReplay,
  onMainMenu,
  onOpenLeaderboard,
  onWatchReplay,
  hasNextLevel,
}) => {
  // Calculate 1 to 3 stars based on level target score
  let stars = 1;
  if (score >= level.threeStarScore) {
    stars = 3;
  } else if (score >= level.threeStarScore * 0.6) {
    stars = 2;
  }

  useEffect(() => {
    // Fire festive celebration confetti bursts
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
        });
      }, 300);
      return () => clearTimeout(timer);
    } catch {}
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center text-center">
        {/* Banner Tag */}
        <div className="px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold uppercase text-xs tracking-widest mb-2 font-racing">
          STAGE {level.id} CLEARED
        </div>

        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-white font-racing mb-2">
          VICTORY!
        </h2>
        <p className="text-xs text-slate-400 mb-5">{level.name}</p>

        {/* 3 Gold Stars Display */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-3 rounded-2xl border transition-all duration-300 ${
                starIdx <= stars
                  ? 'bg-amber-500/20 border-yellow-400/80 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                  : 'bg-slate-950/60 border-slate-800 scale-95 opacity-40'
              }`}
            >
              <Star
                className={`w-8 h-8 ${
                  starIdx <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-6">
          {/* Final Score */}
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col items-center">
            <Trophy className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">FINAL SCORE</span>
            <span className="text-xl font-black text-amber-300 font-racing">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Coins Earned */}
          <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col items-center">
            <Coins className="w-5 h-5 text-yellow-400 mb-1" />
            <span className="text-[10px] text-slate-400 font-bold uppercase">COINS COLLECTED</span>
            <span className="text-xl font-black text-yellow-300 font-racing">
              +{coinsEarned}
            </span>
          </div>

          {/* Best Stunt */}
          <div className="col-span-2 p-3 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between px-5">
            <span className="text-xs text-slate-400 font-bold uppercase">BEST TRICK</span>
            <span className="text-sm font-black text-cyan-300 font-racing uppercase tracking-wider">
              {bestStunt || '360 Air Stunt'}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-2.5">
          {hasNextLevel ? (
            <button
              onClick={() => {
                soundManager.playClick();
                onNextLevel();
              }}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-base flex items-center justify-center gap-2 font-racing shadow-[0_0_20px_rgba(245,158,11,0.6)] transition active:scale-95 cursor-pointer"
            >
              NEXT TRACK <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold uppercase text-xs">
              ALL TRACKS CONQUERED! CHAMPION OF MALIK STUNTS!
            </div>
          )}

          {/* Watch Stunt Replay Cinema Button */}
          {onWatchReplay && (
            <button
              onClick={() => {
                soundManager.playClick();
                onWatchReplay();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black uppercase text-xs sm:text-sm flex items-center justify-center gap-2 font-racing shadow-[0_0_20px_rgba(6,182,212,0.4)] transition active:scale-95 cursor-pointer border border-cyan-400/40"
            >
              <Film className="w-4 h-4 text-cyan-200" />
              <span>WATCH STUNT REPLAY CINEMA</span>
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            </button>
          )}

          {onOpenLeaderboard && (
            <button
              onClick={() => {
                soundManager.playClick();
                onOpenLeaderboard();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black uppercase text-xs flex items-center justify-center gap-2 font-racing shadow-md transition active:scale-95 cursor-pointer"
            >
              <Trophy className="w-4 h-4" /> GLOBAL LEADERBOARD & SUBMIT SCORE
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                soundManager.playClick();
                onReplay();
              }}
              className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold uppercase text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              title="Restart Level"
            >
              <RotateCcw className="w-4 h-4" /> RESTART TRACK
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onMainMenu();
              }}
              className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold uppercase text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Home className="w-4 h-4" /> MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
