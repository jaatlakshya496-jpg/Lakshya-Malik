import React, { useState, useEffect } from 'react';
import { DailyMissionsState, DailyMission } from '../types/game';
import { getTimeUntilNextReset } from '../utils/dailyMissions';
import { soundManager } from '../audio/SoundManager';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Clock,
  Coins,
  CheckCircle2,
  Gift,
  Flame,
  Zap,
  RotateCw,
  Flag,
  Plane,
  ArrowUpRight,
} from 'lucide-react';

interface DailyMissionsModalProps {
  missionsState: DailyMissionsState;
  completedMissionsHistory?: { timestamp: number; mission: DailyMission }[];
  onClaimReward: (missionId: string, coins: number) => void;
  onClose: () => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  missionsState,
  completedMissionsHistory,
  onClaimReward,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(
    getTimeUntilNextReset(missionsState.lastResetTimestamp).formatted
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const res = getTimeUntilNextReset(missionsState.lastResetTimestamp);
      setTimeLeft(res.formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, [missionsState.lastResetTimestamp]);

  const handleClaim = (mission: DailyMission) => {
    if (!mission.completed || mission.claimed) return;
    soundManager.playCoin();
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
    onClaimReward(mission.id, mission.rewardCoins);
  };

  const getMissionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'RotateCw':
        return <RotateCw className="w-5 h-5 text-cyan-400" />;
      case 'Coins':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'Flag':
        return <Flag className="w-5 h-5 text-emerald-400" />;
      case 'Plane':
        return <Plane className="w-5 h-5 text-sky-400" />;
      default:
        return <ArrowUpRight className="w-5 h-5 text-purple-400" />;
    }
  };

  const completedCount = missionsState.missions.filter((m) => m.completed).length;
  const totalRewardAvailable = missionsState.missions.reduce((sum, m) => sum + m.rewardCoins, 0);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-y-auto">
      {/* Header Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
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
              DAILY MISSIONS & BOUNTIES
            </h1>
            <p className="text-xs text-slate-400">Complete stunt challenges within 24 hours for huge coin rewards</p>
          </div>
        </div>

        {/* 24h Countdown Clock */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-lg">
          <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">RESETS IN</div>
            <div className="text-sm font-black text-amber-300 font-racing tracking-wider leading-none">
              {timeLeft}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto my-auto py-6 space-y-4">
        {/* Tab Selector */}
        <div className="flex bg-slate-900 rounded-2xl p-1 w-full sm:w-64 border border-slate-800">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition ${activeTab === 'active' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition ${activeTab === 'completed' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
          >
            Completed
          </button>
        </div>

        {activeTab === 'active' ? (
          <>
          {/* Banner Summary */}
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400">
                <Gift className="w-7 h-7" />
              </div>
              <div>
                <div className="text-base font-black uppercase text-white font-racing">
                  DAILY BOUNTY PROGRESS: {completedCount} / {missionsState.missions.length} COMPLETED
                </div>
                <div className="text-xs text-slate-300">
                  Earn up to <strong className="text-amber-400">+{totalRewardAvailable.toLocaleString()} Extra Coins</strong> every 24 hours!
                </div>
              </div>
            </div>

            <div className="w-full sm:w-48 bg-slate-950/80 rounded-full h-3.5 border border-slate-800 p-0.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / (missionsState.missions.length || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Missions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {missionsState.missions.map((mission) => {
              const isDone = mission.completed;
              const isClaimed = mission.claimed;
              const progressPercent = Math.min(100, Math.round((mission.current / mission.target) * 100));

              return (
                <div
                  key={mission.id}
                  className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                    isClaimed
                      ? 'bg-slate-950/50 border-slate-900 opacity-60'
                      : isDone
                      ? 'bg-slate-900/90 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          {getMissionIcon(mission.icon)}
                        </div>
                        <div>
                          <h3 className="text-base font-black uppercase text-white font-racing tracking-wide">
                            {mission.title}
                          </h3>
                          <p className="text-xs text-slate-400">{mission.description}</p>
                        </div>
                      </div>

                      {/* Coin Reward Pill */}
                      <div className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 font-racing font-black text-sm shrink-0">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        +{mission.rewardCoins}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-3 mt-3">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400">
                        <span>Progress</span>
                        <span className={isDone ? 'text-emerald-400' : 'text-amber-400'}>
                          {mission.current} / {mission.target} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDone
                              ? 'bg-emerald-400'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Claim or Status Button */}
                  <div className="pt-2">
                    {isClaimed ? (
                      <div className="w-full py-2 rounded-xl bg-slate-950 border border-slate-900 text-slate-500 text-xs font-bold uppercase text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-slate-600" /> REWARD CLAIMED
                      </div>
                    ) : isDone ? (
                      <button
                        onClick={() => handleClaim(mission)}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-sm flex items-center justify-center gap-2 font-racing shadow-[0_0_15px_rgba(16,185,129,0.5)] transition active:scale-95 cursor-pointer"
                      >
                        <Coins className="w-4 h-4" /> CLAIM +{mission.rewardCoins} COINS!
                      </button>
                    ) : (
                      <div className="w-full py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-slate-400 text-xs font-bold uppercase text-center">
                        IN PROGRESS
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        ) : (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 max-h-[400px] overflow-y-auto space-y-3">
            {(completedMissionsHistory || []).length > 0 ? (
              completedMissionsHistory?.slice().sort((a: any, b: any) => b.timestamp - a.timestamp).map((item: any, index: number) => (
                <div key={index} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMissionIcon(item.mission.icon)}
                    <div>
                      <h4 className="text-sm font-black text-white">{item.mission.title}</h4>
                      <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">COMPLETED</span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 text-sm py-8">No missions completed in the last 7 days.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
