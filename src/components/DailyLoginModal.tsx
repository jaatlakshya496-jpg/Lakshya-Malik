import React from 'react';
import { motion } from 'framer-motion';
import { GameSaveData } from '../types/game';
import { DAILY_REWARDS } from '../utils/dailyRewards';
import { soundManager } from '../audio/SoundManager';
import { Gift, CheckCircle, Coins, X, Flame, Crown, Sparkles, Award } from 'lucide-react';

interface DailyLoginModalProps {
  saveData: GameSaveData;
  onClaim: (coins: number) => void;
  onClose: () => void;
}

export const DailyLoginModal: React.FC<DailyLoginModalProps> = ({
  saveData,
  onClaim,
  onClose,
}) => {
  // Persistent streak from save data (fallback to 1 if not set)
  const currentStreak = saveData.loginStreak || 1;
  const alreadyClaimed = Boolean(saveData.loginRewardClaimedToday);
  
  // Safe day index (0-based) for base reward lookup
  const dayIndex = Math.min(Math.max(currentStreak - 1, 0), DAILY_REWARDS.length - 1);
  const currentReward = DAILY_REWARDS[dayIndex] || DAILY_REWARDS[0];

  // Special logic: grant a 500-coin bonus when the user reaches the 7th day of their login streak
  const isSeventhDayStreak = currentStreak >= 7;
  const streakBonus = isSeventhDayStreak ? 500 : 0;
  const totalRewardCoins = currentReward.coins + streakBonus;

  const handleClaimReward = () => {
    soundManager.playClick();
    soundManager.playLevelComplete();
    // Grant the base coins plus 500-coin bonus on the 7th day streak
    onClaim(totalRewardCoins);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.35)] relative overflow-hidden flex flex-col items-center"
      >
        {/* Background Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.8)] mb-3">
          <Gift className="w-8 h-8" />
        </div>

        <div className="text-xs font-black tracking-widest text-amber-400 uppercase mb-1 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> DAILY LOGIN REWARD STREAK
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-racing tracking-wide text-center mb-2">
          {isSeventhDayStreak ? '7-DAY STREAK GRANDMASTER' : 'DAILY LOGIN REWARDS'}
        </h2>

        {/* Persistent Streak Counter & 'Day X/7' indicator */}
        <div className="flex items-center gap-3 text-sm text-slate-200 mb-6 bg-slate-900/90 px-5 py-2.5 rounded-2xl border-2 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Flame className="w-5 h-5 animate-pulse text-amber-400" />
            <span>Streak:</span>
          </div>
          {/* Explicit 'Day X/7' indicator */}
          <div className="bg-amber-500 text-slate-950 font-black font-racing px-3.5 py-1 rounded-xl text-base tracking-wider shadow">
            Day {Math.min(currentStreak, 7)}/7
          </div>
          {isSeventhDayStreak && (
            <div className="flex items-center gap-1 text-xs text-amber-300 font-extrabold bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-400/30">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>+500 Bonus Active!</span>
            </div>
          )}
        </div>

        {/* Streak Progress Bar */}
        <div className="w-full max-w-sm bg-slate-800 rounded-full h-3 mb-6 overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 ease-out"
            style={{ width: `${(Math.min(currentStreak, 7) / 7) * 100}%` }}
          />
        </div>

        {/* Rewards Grid (7 Days) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-6">
          {DAILY_REWARDS.map((item) => {
            const isPassed = item.day < currentStreak || (item.day === currentStreak && alreadyClaimed);
            const isToday = item.day === currentStreak && !alreadyClaimed;
            const isDay7 = item.day === 7;
            const day7Classes = isDay7 ? 'col-span-2 sm:col-span-1 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.3)]' : '';
            const glowClass = isDay7 && !isPassed ? 'animate-golden-glow' : '';

            return (
              <div
                key={item.day}
                className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border transition-all ${day7Classes} ${glowClass} ${

                  isToday
                    ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-105 z-10'
                    : isPassed
                    ? 'bg-slate-900/70 border-emerald-500/40 opacity-80'
                    : !isDay7 ? 'bg-slate-900/40 border-slate-800' : ''
                }`}
              >
                {/* Day Badge & Special Crown for Day 7 */}
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider">
                    DAY {item.day}
                  </div>
                  {isDay7 && (
                    <div className="flex items-center gap-1 bg-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-black text-amber-300 border border-amber-400/50">
                      <Crown className="w-3 h-3 text-amber-400" /> +500 BONUS
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div className="text-3xl my-1.5 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{item.icon}</div>

                {/* Coins */}
                <div className="flex flex-col items-center mb-1">
                  <div className="flex items-center gap-1 text-yellow-400 font-black font-racing text-sm">
                    <Coins className="w-4 h-4" />
                    <span>+{item.coins}</span>
                  </div>
                  {isDay7 && (
                    <span className="text-[10px] text-amber-300 font-bold tracking-tight">
                      (+500 Streak Bonus)
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-300 text-center font-bold line-clamp-1">
                  {item.title}
                </div>

                {/* Status Indicator */}
                {isPassed && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-400 filter drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Special 7-Day Completion Celebration Banner */}
        {isSeventhDayStreak && !alreadyClaimed && (
          <div className="w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/60 rounded-2xl p-3 mb-5 text-center text-amber-300 text-xs font-black tracking-wide uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
            <span>Day 7 Streak Reached! 500-Coin Bonus Included (+{totalRewardCoins} Total Coins)!</span>
          </div>
        )}

        {/* Action Button */}
        {alreadyClaimed ? (
          <div className="w-full flex flex-col gap-2">
            <div className="text-center text-xs text-emerald-400 font-bold mb-1">
              ✓ Today's reward claimed! Come back tomorrow for Day {Math.min(currentStreak + 1, 7)}/7.
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-lg uppercase tracking-wider font-racing transition active:scale-95 shadow-lg border border-slate-700"
            >
              CLOSE & RACE
            </button>
          </div>
        ) : (
          <button
            onClick={handleClaimReward}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xl uppercase tracking-wider font-racing shadow-[0_0_35px_rgba(245,158,11,0.7)] transition active:scale-95 flex items-center justify-center gap-2 border border-yellow-200"
          >
            <Gift className="w-6 h-6 animate-pulse" /> 
            {isSeventhDayStreak 
              ? `CLAIM DAY 7 REWARD (+${totalRewardCoins} COINS)` 
              : `CLAIM DAY ${currentStreak} (+${totalRewardCoins} COINS)`
            }
          </button>
        )}
      </motion.div>
    </div>
  );
};
