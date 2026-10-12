import React, { useState } from 'react';
import { GameSaveData } from '../types/game';
import { getLevelById, GAME_SESSIONS, GameSession, TOTAL_LEVELS } from '../levels/levelData';
import { soundManager } from '../audio/SoundManager';
import { Lock, Star, Play, ArrowLeft, Trophy, ChevronRight, ChevronLeft, ShieldAlert, Sparkles } from 'lucide-react';

interface LevelSelectModalProps {
  saveData: GameSaveData;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  saveData,
  onSelectLevel,
  onClose,
}) => {
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  // Max unlocked level from saveData
  const maxUnlocked = Math.max(...(saveData.unlockedLevels || [1]), 1);

  // Check if a session is unlocked
  const isSessionUnlocked = (session: GameSession) => {
    if (session.id === 1) return true;
    const prevSession = GAME_SESSIONS.find(s => s.id === session.id - 1);
    if (!prevSession) return true;
    return maxUnlocked >= prevSession.endLevel || saveData.unlockedLevels.includes(prevSession.endLevel);
  };

  // If inside a session, calculate levels for pagination
  const sessionLevelsCount = selectedSession ? selectedSession.endLevel - selectedSession.startLevel + 1 : 0;
  const totalSessionPages = selectedSession ? Math.ceil(sessionLevelsCount / pageSize) : 1;

  const startLevelId = selectedSession ? selectedSession.startLevel + (page - 1) * pageSize : 1;
  const endLevelId = selectedSession ? Math.min(selectedSession.endLevel, startLevelId + pageSize - 1) : 1;

  const levelList = [];
  if (selectedSession) {
    for (let id = startLevelId; id <= endLevelId; id++) {
      levelList.push(getLevelById(id));
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-y-auto select-none">
      {/* Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              if (selectedSession) {
                setSelectedSession(null);
                setPage(1);
              } else {
                onClose();
              }
            }}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-wider text-white font-racing">
              {selectedSession ? `${selectedSession.name} (Levels ${selectedSession.startLevel}-${selectedSession.endLevel})` : 'SELECT FREE FIRE STUNT SESSIONS (500 LEVELS)'}
            </h1>
            <p className="text-xs text-slate-400">
              {selectedSession ? selectedSession.subtitle : 'Choose a session. Complete previous session to unlock dangerous higher tiers.'}
            </p>
          </div>
        </div>

        {/* Pagination or Session Count */}
        {selectedSession ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-white disabled:opacity-40 hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-amber-400 font-racing px-2">
              PAGE {page} / {totalSessionPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalSessionPages, p + 1))}
              disabled={page === totalSessionPages}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-white disabled:opacity-40 hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-1.5 flex items-center gap-2 text-amber-400 text-xs font-bold font-racing">
            <Sparkles className="w-4 h-4" /> 5 SESSIONS • 500 LEVELS
          </div>
        )}
      </div>

      {/* Content: Sessions View OR Level Cards Grid */}
      {!selectedSession ? (
        /* Sessions List */
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-auto py-8">
          {GAME_SESSIONS.map((session) => {
            const unlocked = isSessionUnlocked(session);
            let completedCount = 0;
            for (let i = session.startLevel; i <= session.endLevel; i++) {
              if (saveData.unlockedLevels.includes(i + 1) || (saveData.levelStars[i] && saveData.levelStars[i] > 0)) {
                completedCount++;
              }
            }
            const percent = Math.round((completedCount / 100) * 100);

            return (
              <div
                key={session.id}
                onClick={() => {
                  soundManager.playClick();
                  if (unlocked) {
                    setSelectedSession(session);
                    setPage(1);
                  }
                }}
                className={`rounded-2xl border transition relative overflow-hidden flex flex-col justify-between group cursor-pointer ${
                  unlocked
                    ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500 shadow-xl hover:scale-[1.02]'
                    : 'bg-slate-950/80 border-slate-900 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Banner Gradient */}
                <div
                  className="h-32 w-full relative flex flex-col items-center justify-center p-4 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${session.skyColors[0]}, ${session.skyColors[1]})`,
                  }}
                >
                  <span className="text-8xl font-black text-white/5 font-racing select-none absolute right-2 -bottom-6">
                    0{session.id}
                  </span>

                  <div className="absolute top-3 left-3 bg-slate-950/70 backdrop-blur-md border border-slate-700/60 rounded-lg px-2.5 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3" /> {session.dangerLevel}
                  </div>

                  <div className="z-10 text-center mt-3">
                    <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest font-racing">
                      SESSION {session.id} • LEVELS {session.startLevel}-{session.endLevel}
                    </div>
                    <h3 className="text-xl font-black uppercase text-white font-racing drop-shadow-md">
                      {session.name.replace(/^Session \d+: /, '')}
                    </h3>
                  </div>
                </div>

                {/* Session Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <p className="text-xs text-slate-300 leading-relaxed">{session.subtitle}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>SESSION PROGRESS</span>
                      <span className="text-amber-400 font-racing">{completedCount} / 100 STAGES ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                  </div>

                  {unlocked ? (
                    <button
                      className="w-full py-3 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-black uppercase text-sm flex items-center justify-center gap-2 transition font-racing shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                    >
                      <Play className="w-4 h-4 fill-current" /> ENTER SESSION {session.id}
                    </button>
                  ) : (
                    <div className="w-full py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 font-black uppercase text-xs flex items-center justify-center gap-2 font-racing">
                      <Lock className="w-4 h-4 text-rose-500" /> LOCKED (COMPLETE SESSION {session.id - 1})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Level Cards Grid inside Selected Session */
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-auto py-8">
          {levelList.map((lvl) => {
            const isUnlocked = lvl.id <= 5 || saveData.unlockedLevels.includes(lvl.id) || maxUnlocked >= lvl.id;
            const stars = saveData.levelStars[lvl.id] || 0;
            const bestScore = saveData.levelBestScores[lvl.id] || 0;

            return (
              <div
                key={lvl.id}
                className={`rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-slate-900/80 border-slate-800 hover:border-amber-500/70 shadow-lg'
                    : 'bg-slate-950/60 border-slate-900 opacity-60'
                }`}
              >
                {/* Card Banner Background */}
                <div
                  className="h-28 w-full relative flex items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${lvl.skyColors[0]}, ${lvl.skyColors[1]})`,
                  }}
                >
                  <span className="text-7xl font-black text-white/10 font-racing select-none absolute right-3 -bottom-4">
                    {lvl.id}
                  </span>

                  <div className="z-10 text-center">
                    <div className="text-xs uppercase tracking-widest font-bold text-amber-400">
                      STAGE {lvl.id}
                    </div>
                    <h3 className="text-lg font-black uppercase text-white font-racing drop-shadow-md truncate max-w-[260px]">
                      {lvl.name}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-300 mb-4 line-clamp-2">{lvl.subtitle}</p>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-4 h-4 ${
                            starIdx <= stars
                              ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-amber-300 font-racing font-bold">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>BEST: {bestScore > 0 ? bestScore.toLocaleString() : '---'}</span>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onSelectLevel(lvl.id);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-sm flex items-center justify-center gap-2 transition font-racing shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" /> RIDE TRACK #{lvl.id}
                    </button>
                  ) : (
                    <div className="w-full py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 font-black uppercase text-xs flex items-center justify-center gap-2 font-racing">
                      <Lock className="w-4 h-4 text-rose-500" /> STAGE LOCKED
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
