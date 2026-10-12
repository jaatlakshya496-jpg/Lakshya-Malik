import React from 'react';
import { AudioSettings } from '../types/game';
import { soundManager } from '../audio/SoundManager';
import { Volume2, VolumeX, Music, Gauge, ArrowLeft, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  settings: AudioSettings;
  onUpdateSettings: (newSettings: AudioSettings) => void;
  onResetData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetData,
  onClose,
}) => {
  const handleToggleSound = () => {
    soundManager.playClick();
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    soundManager.updateSettings(updated);
    onUpdateSettings(updated);
  };

  const handleToggleMusic = () => {
    soundManager.playClick();
    const updated = { ...settings, musicEnabled: !settings.musicEnabled };
    soundManager.updateSettings(updated);
    onUpdateSettings(updated);
  };

  const handleVolumeChange = (key: keyof AudioSettings, val: number) => {
    const updated = { ...settings, [key]: val };
    soundManager.updateSettings(updated);
    onUpdateSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white font-racing">
            SETTINGS & AUDIO
          </h1>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-6 space-y-6">
        {/* Audio Toggles */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            AUDIO MASTER CONTROLS
          </h3>

          {/* Master Sound FX Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-bold text-white">Engine & Sound Effects</div>
                <div className="text-xs text-slate-400">Motor revs, flips, coins, crashes</div>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 ease-in-out ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Arcade Music Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Background Stunt Beats</div>
                <div className="text-xs text-slate-400">Arcade synth soundtrack</div>
              </div>
            </div>
            <button
              onClick={handleToggleMusic}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                settings.musicEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 ease-in-out ${
                  settings.musicEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Volume Sliders */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            VOLUME MIXER
          </h3>

          {/* Master Volume */}
          <div>
            <div className="flex justify-between text-xs font-bold text-white mb-1.5">
              <span>Master Volume</span>
              <span className="text-amber-400">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => handleVolumeChange('masterVolume', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Engine Volume */}
          <div>
            <div className="flex justify-between text-xs font-bold text-white mb-1.5">
              <span>Motor Exhaust Volume</span>
              <span className="text-amber-400">{Math.round(settings.engineVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.engineVolume}
              onChange={(e) => handleVolumeChange('engineVolume', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between text-xs font-bold text-white mb-1.5">
              <span>Stunt & Coin SFX</span>
              <span className="text-amber-400">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleVolumeChange('sfxVolume', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Reset Progress Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
            LOCAL STORAGE SAVE
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Game coins, unlocked bikes, upgrades, and high scores are saved on this device.
          </p>

          <button
            onClick={() => {
              if (window.confirm('Reset all coins, bike unlocks, and track stars back to start?')) {
                onResetData();
              }
            }}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> RESET ALL GAME PROGRESS
          </button>
        </div>
      </div>
    </div>
  );
};
