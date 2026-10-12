import React, { useState, useEffect } from 'react';
import {
  Trophy,
  ArrowLeft,
  RefreshCw,
  Flame,
  Award,
  LogIn,
  LogOut,
  Send,
  CheckCircle,
  Coins,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  getTopLeaderboardScores,
  submitStuntScore,
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
  LeaderboardEntry,
} from '../utils/firebase';
import { soundManager } from '../audio/SoundManager';
import { User } from 'firebase/auth';

interface GlobalLeaderboardModalProps {
  onClose: () => void;
  recentScore?: {
    score: number;
    bestStunt: string;
    levelName: string;
    bikeName: string;
    coins: number;
  } | null;
}

export const GlobalLeaderboardModal: React.FC<GlobalLeaderboardModalProps> = ({
  onClose,
  recentScore,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [playerNameInput, setPlayerNameInput] = useState<string>('');

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user?.displayName && !playerNameInput) {
        setPlayerNameInput(user.displayName);
      }
    });
    return () => unsubscribe();
  }, [playerNameInput]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTopLeaderboardScores(10);
      setEntries(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load stunt leaderboard. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleSignIn = async () => {
    soundManager.playClick();
    setError(null);
    try {
      await signInWithGoogle();
      soundManager.playCoin();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
    }
  };

  const handleSignOut = async () => {
    soundManager.playClick();
    try {
      await signOutUser();
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleSubmitScore = async () => {
    if (!recentScore || recentScore.score <= 0) return;
    if (!currentUser) {
      await handleSignIn();
      return;
    }

    soundManager.playClick();
    setSubmitting(true);
    setError(null);

    try {
      const name = playerNameInput.trim() || currentUser.displayName || 'Pro Rider';
      await submitStuntScore({
        playerName: name,
        score: recentScore.score,
        bestStunt: recentScore.bestStunt,
        levelName: recentScore.levelName,
        bikeName: recentScore.bikeName,
        coinsCollected: recentScore.coins,
      });

      setSubmittedSuccess(true);
      soundManager.playLevelComplete();
      // Reload rankings
      await loadLeaderboard();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit high score.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 text-slate-950 font-black flex items-center justify-center text-sm shadow-[0_0_12px_rgba(251,191,36,0.6)]">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-100 text-slate-950 font-black flex items-center justify-center text-sm shadow-[0_0_10px_rgba(226,232,240,0.5)]">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-800 via-amber-600 to-amber-400 text-white font-black flex items-center justify-center text-sm shadow-[0_0_8px_rgba(217,119,6,0.4)]">
          3
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 font-bold flex items-center justify-center text-sm">
        {rank}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.15)] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                  Global Leaderboard
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium normal-case">
                    Top 10 Stunt Scores
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Real-time persistent rankings hosted on Cloud Firestore</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                loadLeaderboard();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="avatar"
                    className="w-5 h-5 rounded-full border border-amber-400/50"
                  />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-white font-medium max-w-[100px] truncate">
                  {currentUser.displayName || 'Rider'}
                </span>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Recent Run Score Submission Banner if present */}
        {recentScore && recentScore.score > 0 && (
          <div className="px-5 py-3 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900 border-b border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Your Current Run Score: <span className="text-white text-sm font-black">{recentScore.score.toLocaleString()} PTS</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>Tricks: {recentScore.bestStunt}</span>
                  <span>•</span>
                  <span>{recentScore.levelName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {submittedSuccess ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span>Submitted to Leaderboard!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={(e) => setPlayerNameInput(e.target.value)}
                    placeholder="Enter Rider Name"
                    maxLength={32}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-36"
                  />
                  <button
                    onClick={handleSubmitScore}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Posting...' : 'Submit Score'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="px-5 py-2.5 bg-rose-950/60 border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white ml-2 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Table Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-semibold">Retrieving global stunt rankings from Firestore...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Award className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-300">No scores recorded yet!</p>
              <p className="text-xs text-slate-500 mt-1">Be the very first rider to register a stunt record.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-4 sm:col-span-3">Rider Name</div>
                <div className="col-span-3 sm:col-span-3 text-right">Stunt Score</div>
                <div className="hidden sm:block sm:col-span-3">Top Stunt Combo</div>
                <div className="col-span-4 sm:col-span-2 text-right">Track / Bike</div>
              </div>

              {/* Rows */}
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                const isUser = currentUser && entry.userId === currentUser.uid;

                return (
                  <div
                    key={entry.id || idx}
                    className={`grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl border transition-all ${
                      isUser
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : rank === 1
                        ? 'bg-gradient-to-r from-amber-950/20 to-slate-900 border-amber-500/40'
                        : rank === 2
                        ? 'bg-slate-900/90 border-slate-600/40'
                        : rank === 3
                        ? 'bg-slate-900/80 border-amber-800/30'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex justify-center">
                      {getRankBadge(rank)}
                    </div>

                    {/* Rider Name */}
                    <div className="col-span-4 sm:col-span-3">
                      <div className="flex items-center gap-1.5 font-bold text-white text-sm truncate">
                        <span className="truncate">{entry.playerName}</span>
                        {isUser && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate hidden sm:block">
                        {entry.bikeName}
                      </div>
                    </div>

                    {/* Stunt Score */}
                    <div className="col-span-3 sm:col-span-3 text-right">
                      <div className="text-base sm:text-lg font-black text-amber-400 tracking-tight">
                        {entry.score.toLocaleString()}
                        <span className="text-[10px] text-amber-500/80 font-normal ml-1">PTS</span>
                      </div>
                      {entry.coinsCollected !== undefined && entry.coinsCollected > 0 && (
                        <div className="flex items-center justify-end gap-1 text-[11px] text-yellow-300/80">
                          <Coins className="w-3 h-3 text-yellow-400" />
                          <span>{entry.coinsCollected}</span>
                        </div>
                      )}
                    </div>

                    {/* Top Stunt */}
                    <div className="hidden sm:block sm:col-span-3">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-200">
                        <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span className="truncate">{entry.bestStunt}</span>
                      </div>
                    </div>

                    {/* Track / Bike */}
                    <div className="col-span-4 sm:col-span-2 text-right">
                      <div className="text-xs font-semibold text-slate-300 truncate">
                        {entry.levelName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate sm:hidden">
                        {entry.bikeName}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Scores are ranked by stunt points accumulated from flips, wheelies, and combo multipliers!</span>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
