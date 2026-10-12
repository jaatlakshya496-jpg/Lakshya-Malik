import React, { useState } from 'react';
import { BikeConfig, UpgradeType, GameSaveData } from '../types/game';
import { INITIAL_BIKES, UPGRADE_METADATA, UPGRADE_MAX_LEVEL, getUpgradeCost, computeEffectiveStats } from '../utils/bikeCatalog';
import { soundManager } from '../audio/SoundManager';
import { Coins, Check, Lock, Zap, Gauge, Disc, RotateCw, Activity, ArrowLeft } from 'lucide-react';
import { NitroShopView } from './NitroShopView';
import { SkinsView, CharacterCustomizationView, NewVehiclesView } from './ShopViews';

interface GarageModalProps {
  saveData: GameSaveData;
  onUpdateSave: (newSave: GameSaveData) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<string>(saveData.selectedBikeId);

  // Merge base bikes with saved unlocked status & upgrades
  const bikes: BikeConfig[] = INITIAL_BIKES.map((b) => {
    const isUnlocked = saveData.unlockedBikes.includes(b.id);
    const savedUpgrades = saveData.bikeUpgrades[b.id] || {
      enginePower: 1,
      acceleration: 1,
      brakeStrength: 1,
      airControl: 1,
      suspension: 1,
    };
    return {
      ...b,
      unlocked: isUnlocked,
      upgrades: savedUpgrades,
    };
  });

  const activeBike = bikes.find((b) => b.id === selectedId) || bikes[0];
  const effectiveStats = computeEffectiveStats(activeBike);

  const handleSelectBike = (bike: BikeConfig) => {
    soundManager.playClick();
    setSelectedId(bike.id);
    if (bike.unlocked) {
      onUpdateSave({
        ...saveData,
        selectedBikeId: bike.id,
      });
    }
  };

  const handleUnlockBike = () => {
    if (saveData.coins < activeBike.price) {
      soundManager.playCrash();
      return;
    }
    soundManager.playLevelComplete();
    const newCoins = saveData.coins - activeBike.price;
    const newUnlocked = [...saveData.unlockedBikes, activeBike.id];
    onUpdateSave({
      ...saveData,
      coins: newCoins,
      unlockedBikes: newUnlocked,
      selectedBikeId: activeBike.id,
    });
  };

  const handleUpgrade = (type: UpgradeType) => {
    const currentLv = activeBike.upgrades[type];
    if (currentLv >= UPGRADE_MAX_LEVEL) return;
    const cost = getUpgradeCost(currentLv);
    if (saveData.coins < cost) {
      soundManager.playCrash();
      return;
    }

    soundManager.playCoin();
    const newCoins = saveData.coins - cost;
    const newUpgrades = {
      ...saveData.bikeUpgrades,
      [activeBike.id]: {
        ...activeBike.upgrades,
        [type]: currentLv + 1,
      },
    };

    onUpdateSave({
      ...saveData,
      coins: newCoins,
      bikeUpgrades: newUpgrades,
    });
  };

  const getUpgradeIcon = (type: UpgradeType) => {
    switch (type) {
      case 'enginePower':
        return <Gauge className="w-5 h-5 text-amber-400" />;
      case 'acceleration':
        return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'brakeStrength':
        return <Disc className="w-5 h-5 text-rose-400" />;
      case 'airControl':
        return <RotateCw className="w-5 h-5 text-cyan-400" />;
      case 'suspension':
        return <Activity className="w-5 h-5 text-purple-400" />;
    }
  };

  const [activeTab, setActiveTab] = useState<'garage' | 'skins' | 'character' | 'vehicles' | 'nitro'>('garage');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Header Bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white font-racing">
              SHOP
            </h1>
            <p className="text-xs text-slate-400">Manage your garage, customize, & shop</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
          {[
            { id: 'garage', label: 'Garage' },
            { id: 'skins', label: 'Skins' },
            { id: 'character', label: 'Man' },
            { id: 'vehicles', label: 'Vehicles' },
            { id: 'nitro', label: 'Nitro' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold uppercase ${activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Coin Balance */}
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-2 flex items-center gap-2">
          <Coins className="w-6 h-6 text-yellow-400" />
          <span className="text-xl sm:text-2xl font-black text-yellow-300 font-racing">
            {saveData.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Conditional Content based on activeTab */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'garage' && (
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-6">
            {/* Left Column: Bike Showcase & Selector (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Bike Selection Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
                {bikes.map((bike) => {
                  const isSelected = bike.id === activeBike.id;
                  const isEquipped = bike.id === saveData.selectedBikeId;

                  return (
                    <button
                      key={bike.id}
                      onClick={() => handleSelectBike(bike)}
                      className={`p-3 rounded-xl border text-left transition relative flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-800/90 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: bike.color }}
                        />
                        <div>
                          <div className="text-sm font-bold text-white">{bike.name}</div>
                          <div className="text-[11px] text-slate-400">{bike.subtitle}</div>
                        </div>
                      </div>

                      <div>
                        {bike.unlocked ? (
                          isEquipped ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                              <Check className="w-3 h-3" /> EQUIPPED
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold uppercase">READY</span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-black bg-amber-500/20 text-yellow-400 border border-amber-500/40 flex items-center gap-1 font-racing">
                            <Lock className="w-3 h-3" /> {bike.price}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bike Visual Spotlight Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                <div
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: activeBike.color }}
                />

                <h3 className="text-xl font-black text-white uppercase tracking-wide font-racing mb-1">
                  {activeBike.name}
                </h3>
                <p className="text-xs text-slate-400 text-center mb-4">{activeBike.subtitle}</p>

                {/* Custom SVG Silhouette Preview */}
                <div className="w-56 h-36 flex items-center justify-center my-2">
                  <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    {/* Wheels */}
                    <circle cx="45" cy="85" r="28" fill="#18181b" stroke={activeBike.glowColor} strokeWidth="4" />
                    <circle cx="45" cy="85" r="16" fill="#09090b" stroke="#71717a" strokeWidth="2" />
                    <circle cx="155" cy="85" r="28" fill="#18181b" stroke={activeBike.glowColor} strokeWidth="4" />
                    <circle cx="155" cy="85" r="16" fill="#09090b" stroke="#71717a" strokeWidth="2" />

                    {/* Frame & Fork */}
                    <path d="M 45 85 L 85 65 L 140 38 L 155 85" fill="none" stroke="#64748b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Body Tank Plastics */}
                    <path d="M 70 52 L 100 32 L 135 34 L 115 65 Z" fill={activeBike.color} stroke={activeBike.accentColor} strokeWidth="3" />
                    
                    {/* Seat & Exhaust */}
                    <rect x="58" y="44" width="28" height="10" rx="4" fill="#0f172a" />
                    <path d="M 85 75 L 50 65 L 35 55" fill="none" stroke="#d1d5db" strokeWidth="5" strokeLinecap="round" />
                    
                    {/* Handlebars */}
                    <path d="M 132 30 L 138 20" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Unlock or Equip Action */}
                <div className="w-full mt-4">
                  {!activeBike.unlocked ? (
                    <button
                      onClick={handleUnlockBike}
                      disabled={saveData.coins < activeBike.price}
                      className={`w-full py-3 rounded-xl font-black uppercase text-base flex items-center justify-center gap-2 transition font-racing ${
                        saveData.coins >= activeBike.price
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-5 h-5" />
                      UNLOCK BIKE FOR {activeBike.price.toLocaleString()} COINS
                    </button>
                  ) : saveData.selectedBikeId === activeBike.id ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold uppercase text-center text-sm flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> CURRENTLY EQUIPPED
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectBike(activeBike)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold uppercase text-sm transition"
                    >
                      SELECT & RIDE
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: 5 Upgrades & Performance Stats (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-lg font-black text-white uppercase tracking-wider font-racing mb-3 flex items-center justify-between">
                  <span>COMPONENT UPGRADES</span>
                  <span className="text-xs text-slate-400 font-normal">MAX LEVEL: {UPGRADE_MAX_LEVEL}</span>
                </h3>

                {/* 5 Upgrade Rows */}
                <div className="space-y-3">
                  {(Object.keys(UPGRADE_METADATA) as UpgradeType[]).map((type) => {
                    const meta = UPGRADE_METADATA[type];
                    const level = activeBike.upgrades[type];
                    const isMax = level >= UPGRADE_MAX_LEVEL;
                    const cost = getUpgradeCost(level);
                    const canAfford = saveData.coins >= cost && !isMax;

                    return (
                      <div
                        key={type}
                        className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-[140px]">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                            {getUpgradeIcon(type)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white leading-tight">{meta.name}</div>
                            <div className="text-[11px] text-slate-400 leading-tight">{meta.description}</div>
                          </div>
                        </div>

                        {/* Level pips */}
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((pip) => (
                            <div
                              key={pip}
                              className={`w-3.5 h-6 rounded-sm border ${
                                pip <= level
                                  ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                                  : 'bg-slate-900 border-slate-700'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Upgrade action button */}
                        <div>
                          {isMax ? (
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black uppercase font-racing">
                              MAXED
                            </span>
                          ) : (
                            <button
                              onClick={() => handleUpgrade(type)}
                              disabled={!canAfford || !activeBike.unlocked}
                              className={`px-3 py-1.5 rounded-lg font-black uppercase text-xs flex items-center gap-1.5 transition font-racing ${
                                canAfford && activeBike.unlocked
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                              }`}
                            >
                              <Coins className="w-3.5 h-3.5" />
                              UPGRADE ({cost})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Performance Stats Telemetry */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-lg font-black text-white uppercase tracking-wider font-racing mb-3">
                  EFFECTIVE PERFORMANCE TELEMETRY
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="text-slate-400 mb-1">Top Speed</div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (effectiveStats.topSpeed / 25) * 100)}%` }}
                      />
                    </div>
                    <span className="text-white font-bold">{Math.round(effectiveStats.topSpeed * 4.8)} KM/H</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="text-slate-400 mb-1">Climb Torque</div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (effectiveStats.torque / 1.5) * 100)}%` }}
                      />
                    </div>
                    <span className="text-white font-bold">{(effectiveStats.torque * 100).toFixed(0)} NM</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="text-slate-400 mb-1">Stunt Air Agility</div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                      <div
                        className="bg-cyan-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (effectiveStats.flipSpeed / 0.12) * 100)}%` }}
                      />
                    </div>
                    <span className="text-white font-bold">{(effectiveStats.flipSpeed * 1000).toFixed(0)} DPS</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div className="text-slate-400 mb-1">Suspension Damping</div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                      <div
                        className="bg-purple-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, effectiveStats.shockAbsorb * 100)}%` }}
                      />
                    </div>
                    <span className="text-white font-bold">{(effectiveStats.shockAbsorb * 100).toFixed(0)}% Absorbed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skins' && <SkinsView saveData={saveData} onUpdateSave={onUpdateSave} />}
        {activeTab === 'character' && <CharacterCustomizationView saveData={saveData} onUpdateSave={onUpdateSave} />}
        {activeTab === 'vehicles' && <NewVehiclesView saveData={saveData} onUpdateSave={onUpdateSave} />}
        {activeTab === 'nitro' && <NitroShopView saveData={saveData} onUpdateSave={onUpdateSave} />}
      </div>
    </div>
  );
};

