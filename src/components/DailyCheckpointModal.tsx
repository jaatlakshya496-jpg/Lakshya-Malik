import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DailyCheckpointSegment } from '../utils/dailyCheckpoint';
import { getTimeUntilCheckpointReset } from '../utils/dailyCheckpoint';
import { soundManager } from '../audio/SoundManager';
import { MapPin, Zap, Flame, Clock, Play, X, Coins, CheckCircle } from 'lucide-react';

interface DailyCheckpointModalProps {
  segment: DailyCheckpointSegment;
  lastResetTimestamp: number;
  completedToday: boolean;
  onPlayLevel: (levelId: number) => void;
  onClose: () => void;
}

export const DailyCheckpointModal: React.FC<DailyCheckpointModalProps> = ({
  segment,
  lastResetTimestamp,
  completedToday,
  onPlayLevel,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilCheckpointReset(lastResetTimestamp));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilCheckpointReset(lastResetTimestamp));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastResetTimestamp]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden flex flex-col items-center"
      >
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

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

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-[0_0_25px_rgba(6,182,212,0.7)] mb-4">
          <MapPin className="w-8 h-8" />
        </div>

        <div className="text-xs font-black tracking-widest text-cyan-400 uppercase mb-1">
          24-HOUR ROTATING CHECKPOINT
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-racing tracking-wide text-center mb-2">
          {segment.title}
        </h2>
        <p className="text-sm text-slate-300 text-center mb-6 leading-relaxed">
          {segment.description}
        </p>

        {/* Multiplier & Countdown Banner */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="bg-slate-900/80 border border-cyan-500/40 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase mb-1">
              <Coins className="w-4 h-4" />
              <span>Coin Multiplier</span>
            </div>
            <div className="text-3xl font-black text-white font-racing tracking-wide">
              {segment.multiplier}x
            </div>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase mb-1">
              <Clock className="w-4 h-4" />
              <span>Refreshes In</span>
            </div>
            <div className="text-xl font-black text-white font-racing tracking-wider">
              {timeLeft.formatted}
            </div>
          </div>
        </div>

        {/* Status & Action */}
        {completedToday ? (
          <div className="w-full bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-4 flex items-center justify-center gap-3 text-emerald-300 font-bold">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <span>Bonus Checkpoint Completed Today!</span>
          </div>
        ) : (
          <button
            onClick={() => {
              soundManager.playClick();
              onPlayLevel(segment.targetLevelId);
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black font-racing text-lg tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RACE BONUS CHECKPOINT (Level {segment.targetLevelId})</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};
