import React from 'react';
import { GameSaveData } from '../types/game';
import { INITIAL_BIKES } from '../utils/bikeCatalog';
import { soundManager } from '../audio/SoundManager';
import { motion } from 'framer-motion';
import { Play, Wrench, Map, Settings, Volume2, VolumeX, Smartphone, Coins, Target, Clock, Trophy, Gift, MapPin, Flame } from 'lucide-react';

interface MainMenuProps {
  saveData: GameSaveData;
  onPlay: () => void;
  onOpenGarage: () => void;
  onOpenLevelSelect: () => void;
  onOpenDailyMissions: () => void;
  onOpenDailyCheckpoint: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenApkGuide: () => void;
  onOpenDailyLogin: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onPlay,
  onOpenGarage,
  onOpenLevelSelect,
  onOpenDailyMissions,
  onOpenDailyCheckpoint,
  onOpenLeaderboard,
  onOpenSettings,
  onOpenApkGuide,
  onOpenDailyLogin,
  onToggleSound,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-[#090d16] flex flex-col items-center justify-between p-4 overflow-hidden select-none">
      {/* Background Bike Animation */}
      <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
        <motion.div
          animate={{ x: [-100, 100, -100], rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="text-[200px] font-black text-white/10"
        >
          🚲
        </motion.div>
      </div>

      {/* Top Header Bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 pt-4">
        <div className="text-xl font-black text-white font-racing tracking-wider leading-none">
          MALIK BIKE STUNT 2D
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/40 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-lg">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-lg font-black text-yellow-300 font-racing">
              {saveData.coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Central Play Button */}
      <div className="z-10 w-full flex justify-center items-center flex-grow">
        <button
          onClick={() => {
            soundManager.playClick();
            onPlay();
          }}
          className="group w-64 h-64 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-4xl uppercase tracking-wider flex items-center justify-center font-racing shadow-[0_0_50px_rgba(245,158,11,0.7)] transition active:scale-95 cursor-pointer"
        >
          PLAY
        </button>
      </div>

      {/* Bottom 4 Options */}
      <div className="w-full max-w-4xl mx-auto z-10 pb-4 grid grid-cols-4 gap-4">
        {/* Levels */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenLevelSelect();
          }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-cyan-500 text-white transition"
        >
          <Map className="w-8 h-8 text-cyan-400" />
          <span className="font-bold uppercase text-xs">LEVELS</span>
        </button>

        {/* Garage */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenGarage();
          }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-amber-500 text-white transition"
        >
          <Wrench className="w-8 h-8 text-amber-400" />
          <span className="font-bold uppercase text-xs">GARAGE</span>
        </button>

        {/* Daily Checkpoints */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenDailyCheckpoint();
          }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-emerald-500 text-white transition"
        >
          <Target className="w-8 h-8 text-emerald-400" />
          <span className="font-bold uppercase text-xs">CHECKPOINTS</span>
        </button>

        {/* Global Leaderboard */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenLeaderboard();
          }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-purple-500 text-white transition"
        >
          <Trophy className="w-8 h-8 text-purple-400" />
          <span className="font-bold uppercase text-xs">LEADERBOARD</span>
        </button>
      </div>
    </div>
  );
};
