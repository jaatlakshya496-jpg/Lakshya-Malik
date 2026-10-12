import React, { useState } from 'react';
import { GameSaveData } from '../types/game';
import { NITRO_ITEMS, NitroItem } from '../utils/nitroCatalog';
import { soundManager } from '../audio/SoundManager';
import { Coins, Check, Zap, Flame, Sparkles } from 'lucide-react';

interface NitroShopViewProps {
  saveData: GameSaveData;
  onUpdateSave: (newSave: GameSaveData) => void;
}

export const NitroShopView: React.FC<NitroShopViewProps> = ({
  saveData,
  onUpdateSave,
}) => {
  const [selectedNitroId, setSelectedNitroId] = useState<string>(
    saveData.selectedNitro || 'default_flame'
  );

  const unlockedNitros = saveData.unlockedNitros || ['default_flame'];

  const selectedItem =
    NITRO_ITEMS.find((item) => item.id === selectedNitroId) || NITRO_ITEMS[0];
  const isUnlocked = unlockedNitros.includes(selectedItem.id);
  const isEquipped = saveData.selectedNitro === selectedItem.id;

  const handleSelectNitro = (item: NitroItem) => {
    soundManager.playClick();
    setSelectedNitroId(item.id);
  };

  const handlePurchase = () => {
    if (saveData.coins < selectedItem.price) {
      soundManager.playCrash();
      return;
    }

    soundManager.playLevelComplete();
    const newCoins = saveData.coins - selectedItem.price;
    const newUnlocked = [...unlockedNitros, selectedItem.id];

    onUpdateSave({
      ...saveData,
      coins: newCoins,
      unlockedNitros: newUnlocked,
      selectedNitro: selectedItem.id,
    });
  };

  const handleEquip = () => {
    soundManager.playClick();
    onUpdateSave({
      ...saveData,
      selectedNitro: selectedItem.id,
    });
  };

  const getRarityBadgeColor = (rarity: NitroItem['rarity']) => {
    switch (rarity) {
      case 'Common':
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
      case 'Rare':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Legendary':
        return 'bg-amber-500/20 text-yellow-300 border-amber-500/40';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-6">
      {/* Left Column: Nitro Items List (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          AVAILABLE NITRO EFFECTS ({NITRO_ITEMS.length})
        </div>
        <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
          {NITRO_ITEMS.map((item) => {
            const isSelected = item.id === selectedNitroId;
            const isOwned = unlockedNitros.includes(item.id);
            const isCurrentlyEquipped = saveData.selectedNitro === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectNitro(item)}
                className={`p-3.5 rounded-xl border text-left transition relative flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}, ${item.secondaryColor})`,
                    }}
                  >
                    <Zap className="w-5 h-5 text-white drop-shadow" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-racing">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getRarityBadgeColor(
                          item.rarity
                        )}`}
                      >
                        {item.rarity}
                      </span>
                      <span className="text-[11px] text-slate-400 uppercase">
                        {item.particleStyle}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {isOwned ? (
                    isCurrentlyEquipped ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 font-racing">
                        <Check className="w-3.5 h-3.5" /> EQUIPPED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700 font-racing">
                        OWNED
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-yellow-300 border border-amber-500/40 flex items-center gap-1 font-racing">
                      <Coins className="w-3.5 h-3.5" /> {item.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Spotlight & Action Preview (7 cols) */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 relative overflow-hidden shadow-2xl">
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 rounded-3xl blur-3xl opacity-15 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: selectedItem.color }}
        />

        {/* Rarity & Icon Banner */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center border-2 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4"
            style={{
              background: `linear-gradient(135deg, ${selectedItem.color}, ${selectedItem.secondaryColor})`,
            }}
          >
            <Flame className="w-12 h-12 text-white animate-pulse" />
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border mb-2 font-racing uppercase tracking-widest ${getRarityBadgeColor(
              selectedItem.rarity
            )}`}
          >
            {selectedItem.rarity} Nitro Effect
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-racing mb-2">
            {selectedItem.name}
          </h2>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {selectedItem.description}
          </p>

          {/* Simulated Live Exhaust Flame Preview Box */}
          <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-2 left-3 text-[10px] text-slate-500 uppercase tracking-widest font-racing flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> High-Speed Exhaust Preview
            </div>

            <div className="flex items-center gap-4 my-6">
              {/* Exhaust nozzle stub */}
              <div className="w-8 h-4 bg-slate-700 rounded-l-md border border-slate-500" />

              {/* Animated Flame Plumes */}
              <div className="flex items-center gap-1">
                <div
                  className="w-16 h-8 rounded-full blur-sm animate-pulse"
                  style={{ backgroundColor: selectedItem.color }}
                />
                <div
                  className="w-24 h-5 rounded-full blur-md animate-ping opacity-75"
                  style={{ backgroundColor: selectedItem.secondaryColor }}
                />
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-200 animate-bounce" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" />
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Activates automatically at <span className="text-amber-400 font-bold">75%+ top speed</span>
            </div>
          </div>

          {/* Action Button: Purchase or Equip */}
          <div className="w-full">
            {isUnlocked ? (
              isEquipped ? (
                <button
                  disabled
                  className="w-full py-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 font-racing cursor-default"
                >
                  <Check className="w-6 h-6" /> CURRENTLY EQUIPPED
                </button>
              ) : (
                <button
                  onClick={handleEquip}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 font-racing shadow-[0_0_20px_rgba(6,182,212,0.5)] transition active:scale-95 cursor-pointer"
                >
                  <Zap className="w-6 h-6 fill-current" /> EQUIP NITRO EFFECT
                </button>
              )
            ) : (
              <button
                onClick={handlePurchase}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 font-racing shadow-[0_0_25px_rgba(245,158,11,0.6)] transition active:scale-95 cursor-pointer"
              >
                <Coins className="w-6 h-6" /> UNLOCK FOR {selectedItem.price.toLocaleString()} COINS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
