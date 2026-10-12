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
  const activeBike = INITIAL_BIKES.find((b) => b.id === saveData.selectedBikeId) || INITIAL_BIKES[0];

  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-between p-4 overflow-hidden select-none">
      {/* Background Bike Animation - floating showcase */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
        <motion.div
          animate={{ x: [-150, 150, -150], rotate: [0, 3, 0, -3, 0], y: [-20, 20, -20] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="text-[250px] font-black text-white/5 select-none"
        >
          {activeBike ? (
            <div style={{ color: activeBike.color }}>
              🏍️
            </div>
          ) : (
            <div>🚲</div>
          )}
        </motion.div>
      </div>

      {/* Top Header Bar */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between z-10 pt-4">
        <div className="text-2xl font-black text-white font-racing tracking-wider leading-none">
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

      {/* Central Play Button with glow effect */}
      <div className="z-10 w-full flex justify-center items-center flex-grow">
        <button
          onClick={() => {
            soundManager.playClick();
            onPlay();
          }}
          className="group w-72 h-72 rounded-3xl bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 hover:from-orange-500 hover:to-red-400 text-slate-950 font-black text-5xl uppercase tracking-wider flex items-center justify-center font-racing shadow-[0_0_60px_rgba(251,191,34,0.5)] transition active:scale-90 cursor-pointer"
        >
          PLAY
        </button>
      </div>

      {/* Bottom 4 Options with improved design */}
      <div className="w-full max-w--xl mx-auto z-10 pb-4 grid grid-cols-2 gap-4">
        {/* Levels */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenLevelSelect();
          }}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-white transition duration-300"
        >
          <Map className="w-7 h-7 text-cyan-300" />
          <span className="font-bold uppercase text-xs">LEVELS</span>
        </button>

        {/* Garage - showcases bike selection */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenGarage();
          }}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-400 text-white transition duration-300"
        >
          <Wrench className="w-7 h-7 text-amber-300" />
          <span className="font-bold uppercase text-xs">GARAGE</span>
        </button>

        {/* Daily Checkpoints */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenDailyCheckpoint();
          }}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400 text-white transition duration-300"
        >
          <Target className="w-7 h-7 text-emerald-300" />
          <span className="font-bold uppercase text-xs">CHECKPOINTS</span>
        </button>

        {/* Global Leaderboard */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenLeaderboard();
          }}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-400 text-white transition duration-300"
        >
          <Trophy className="w-7 h-7 text-purple-300" />
          <span className="font-bold uppercase text-xs">LEADERBOARD</span>
        </button>
      </div>

      {/* Bike Showcase Row at bottom */}
      <div className="w-full max-w-2xl mx-auto mt-6 flex justify-center gap-4">
        {INITIAL_BIKES.slice(0, 4).map((bike) => (
          <motion.div
            key={bike.id}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
            className="relative group"
          >
            <div
              className="w-14 h-10 rounded-2xl overflow-hidden group-hover:shadow-2xl transition"
              style={{
                background: `linear-gradient(135deg, ${bike.color}, ${bike.accentColor})`,
                boxShadow: `0 4px 20px rgba(${hexToRgb(bike.color)}, 0.4)`,
              }}
            >
              <Flame className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="text-center mt-1 text-[10px] font-black">
              {bike.name}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Helper to convert hex to rgb for box-shadow
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
