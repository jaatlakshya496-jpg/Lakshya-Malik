import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSaveData, GameControls, LevelData, BikeConfig, MissionCategory } from './types/game';
import { loadGameData, saveGameData, resetGameData } from './utils/storage';
import { INITIAL_BIKES } from './utils/bikeCatalog';
import { getLevelById } from './levels/levelData';
import { BikePhysicsEngine } from './physics/BikePhysics';
import { soundManager } from './audio/SoundManager';
import { GameCanvas } from './components/GameCanvas';
import { TouchControls } from './components/TouchControls';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { GarageModal } from './components/GarageModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { PauseModal } from './components/PauseModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { CrashModal } from './components/CrashModal';
import { SettingsModal } from './components/SettingsModal';
import { ApkExportModal } from './components/ApkExportModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { GlobalLeaderboardModal } from './components/GlobalLeaderboardModal';
import { ReplayModal } from './components/ReplayModal';
import { updateMissionProgress, checkAndRefreshDailyMissions } from './utils/dailyMissions';
import { checkDailyLogin } from './utils/dailyRewards';
import { DailyLoginModal } from './components/DailyLoginModal';
import { DailyCheckpointModal } from './components/DailyCheckpointModal';
import { NitroShopModal } from './components/NitroShopModal';
import { ReplayData } from './types/game';

export default function App() {
  const [saveData, setSaveData] = useState<GameSaveData>(() => loadGameData());
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [screen, setScreen] = useState<'main_menu' | 'racing' | 'garage' | 'level_select' | 'settings' | 'apk_guide' | 'daily_missions' | 'leaderboard'>('main_menu');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [crashReason, setCrashReason] = useState<string>('');
  const [isLevelComplete, setIsLevelComplete] = useState<boolean>(false);
  const [levelScore, setLevelScore] = useState<number>(0);
  const [levelCoins, setLevelCoins] = useState<number>(0);
  const [bestStuntName, setBestStuntName] = useState<string>('Air Flip');
  const [missionToast, setMissionToast] = useState<string | null>(null);
  const [recentRunScore, setRecentRunScore] = useState<{
    score: number;
    bestStunt: string;
    levelName: string;
    bikeName: string;
    coins: number;
  } | null>(null);
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [isReplayOpen, setIsReplayOpen] = useState<boolean>(false);
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(false);
  const [showDailyLoginModal, setShowDailyLoginModal] = useState<boolean>(false);
  const [showDailyCheckpointModal, setShowDailyCheckpointModal] = useState<boolean>(false);
  const lastCoinsTrackedRef = useRef<number>(0);

  // Input Controls
  const [controls, setControls] = useState<GameControls>({
    gas: false,
    brake: false,
    leanBack: false,
    leanForward: false,
  });

  // Physics engine reference
  const engineRef = useRef<BikePhysicsEngine | null>(null);
  const currentLevelRef = useRef<LevelData>(getLevelById(1));

  // Initialize sound settings
  useEffect(() => {
    soundManager.init(saveData.audioSettings);
  }, [saveData.audioSettings]);

  // Manage background music: play in menus/garage/level select, stop when entering racing
  useEffect(() => {
    if (screen === 'racing') {
      soundManager.stopMusic();
    } else {
      if (saveData.audioSettings.musicEnabled && saveData.audioSettings.soundEnabled) {
        soundManager.startMusic();
      }
    }
  }, [screen, saveData.audioSettings.musicEnabled, saveData.audioSettings.soundEnabled]);

  // Ensure daily missions are refreshed every 24h & check daily login reward
  useEffect(() => {
    setSaveData((prev) => {
      const refreshed = checkAndRefreshDailyMissions(prev.dailyMissions);
      const loginCheck = checkDailyLogin(prev);
      const nextSave = {
        ...loginCheck.saveData,
        dailyMissions: refreshed,
      };
      saveGameData(nextSave);
      if (loginCheck.shouldShowModal) {
        setShowDailyLoginModal(true);
      }
      return nextSave;
    });
  }, []);

  const handleClaimDailyReward = (rewardCoins: number) => {
    setSaveData((prev) => {
      const next: GameSaveData = {
        ...prev,
        coins: prev.coins + rewardCoins,
        loginRewardClaimedToday: true,
      };
      saveGameData(next);
      return next;
    });
    setShowDailyLoginModal(false);
    setMissionToast(`🎁 DAILY REWARD CLAIMED: +${rewardCoins} COINS!`);
    setTimeout(() => setMissionToast(null), 3500);
  };

  const advanceMission = useCallback((category: MissionCategory, amount = 1) => {
    setSaveData((prev) => {
      const { updatedState, newlyCompleted } = updateMissionProgress(prev.dailyMissions, category, amount);
      if (newlyCompleted.length > 0) {
        soundManager.playLevelComplete();
        const first = newlyCompleted[0];
        setMissionToast(`🎯 MISSION COMPLETE: ${first.title}! (+${first.rewardCoins} COINS)`);
        setTimeout(() => setMissionToast(null), 3500);
      }
      const next = { ...prev, dailyMissions: updatedState };
      saveGameData(next);
      return next;
    });
  }, []);

  const handleClaimMission = (missionId: string, rewardCoins: number) => {
    setSaveData((prev) => {
      const updatedMissions = prev.dailyMissions.missions.map((m) =>
        m.id === missionId ? { ...m, claimed: true } : m
      );
      const next: GameSaveData = {
        ...prev,
        coins: prev.coins + rewardCoins,
        dailyMissions: {
          ...prev.dailyMissions,
          missions: updatedMissions,
        },
        completedMissionsHistory: [
          ...(prev.completedMissionsHistory || []).filter(h => h.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000),
          { timestamp: Date.now(), mission: prev.dailyMissions.missions.find(m => m.id === missionId)! }
        ]
      };
      saveGameData(next);
      return next;
    });
  };

  // Construct active bike with user upgrades
  const getActiveBike = useCallback((): BikeConfig => {
    const base = INITIAL_BIKES.find((b) => b.id === saveData.selectedBikeId) || INITIAL_BIKES[0];
    const upgrades = saveData.bikeUpgrades[base.id] || {
      enginePower: 1,
      acceleration: 1,
      brakeStrength: 1,
      airControl: 1,
      suspension: 1,
    };
    return {
      ...base,
      unlocked: true,
      upgrades,
    };
  }, [saveData.selectedBikeId, saveData.bikeUpgrades]);

  // Start or reload a level
  const startLevel = useCallback((levelId: number) => {
    const lvl = getLevelById(levelId);
    currentLevelRef.current = lvl;
    setCurrentLevelId(levelId);

    const bike = getActiveBike();
    const newEngine = new BikePhysicsEngine(lvl, bike);
    engineRef.current = newEngine;
    lastCoinsTrackedRef.current = 0;

    setIsPaused(false);
    setIsCrashed(false);
    setIsLevelComplete(false);
    setIsReplayOpen(false);
    setLevelScore(0);
    setLevelCoins(0);
    setScreen('racing');

    soundManager.stopMusic();
  }, [getActiveBike]);

  // Handle Level Complete
  const handleLevelFinished = useCallback((finalScore: number, coinsEarned: number) => {
    setIsLevelComplete(true);
    setLevelScore(finalScore);

    const activeBike = getActiveBike();
    const lvl = currentLevelRef.current;
    const finalBestStunt = engineRef.current?.getBestStuntName() || bestStuntName || 'Air Flip';
    setBestStuntName(finalBestStunt);

    const isDailyCheckpointLevel = saveData.dailyCheckpoint &&
      saveData.dailyCheckpoint.currentSegment.targetLevelId === currentLevelId &&
      !saveData.dailyCheckpoint.completedToday;

    const multiplier = isDailyCheckpointLevel ? saveData.dailyCheckpoint?.currentSegment?.multiplier ?? 1 : 1;
    const finalCoinsEarned = Math.floor(coinsEarned * multiplier);

    setLevelCoins(finalCoinsEarned);

    setRecentRunScore({
      score: finalScore,
      bestStunt: finalBestStunt,
      levelName: lvl.name,
      bikeName: activeBike.name,
      coins: finalCoinsEarned,
    });

    // Capture complete replay data from physics engine
    let newReplay: ReplayData | null = null;
    if (engineRef.current) {
      const frames = engineRef.current.getReplayFrames();
      newReplay = {
        levelId: lvl.id,
        levelName: lvl.name,
        bikeConfig: activeBike,
        frames: frames.length > 0 ? frames : [],
        bestStuntName: finalBestStunt,
        finalScore,
        durationMs: frames.length * 16.67,
      };
      setReplayData(newReplay);
    }

    // Advance daily mission for level clears
    advanceMission('level_clear', 1);

    // Calculate stars
    let stars = 1;
    if (finalScore >= lvl.threeStarScore) stars = 3;
    else if (finalScore >= lvl.threeStarScore * 0.6) stars = 2;

    // Update save data: unlock next level, add coins, update best score and ghost replay
    setSaveData((prev) => {
      const nextLevelId = currentLevelId + 1;
      const newUnlockedLevels = nextLevelId <= 5 && !prev.unlockedLevels.includes(nextLevelId)
        ? [...prev.unlockedLevels, nextLevelId]
        : prev.unlockedLevels;

      const currentBest = prev.levelBestScores[currentLevelId] || 0;
      const currentStars = prev.levelStars[currentLevelId] || 0;
      const isNewBest = finalScore >= currentBest || !prev.levelBestReplays?.[currentLevelId];

      const updatedCheckpoint = isDailyCheckpointLevel && prev.dailyCheckpoint ? {
        ...prev.dailyCheckpoint,
        completedToday: true,
      } : prev.dailyCheckpoint;

      const updated: GameSaveData = {
        ...prev,
        coins: prev.coins + finalCoinsEarned,
        unlockedLevels: newUnlockedLevels,
        levelBestScores: {
          ...prev.levelBestScores,
          [currentLevelId]: Math.max(currentBest, finalScore),
        },
        levelStars: {
          ...prev.levelStars,
          [currentLevelId]: Math.max(currentStars, stars),
        },
        levelBestReplays: {
          ...(prev.levelBestReplays || {}),
          ...(isNewBest && newReplay ? { [currentLevelId]: newReplay } : {}),
        },
        dailyCheckpoint: updatedCheckpoint,
      };

      saveGameData(updated);
      return updated;
    });
  }, [currentLevelId, advanceMission, saveData.dailyCheckpoint]);

  // Game tick monitor for finished, coins, or crashed state
  useEffect(() => {
    if (screen !== 'racing') return;

    const interval = setInterval(() => {
      if (!engineRef.current || isPaused) return;

      const state = engineRef.current.getState();

      // Track coin pickups towards daily missions
      if (state.coinsEarned > lastCoinsTrackedRef.current) {
        const diff = state.coinsEarned - lastCoinsTrackedRef.current;
        lastCoinsTrackedRef.current = state.coinsEarned;
        advanceMission('coins', diff);
      }

      if (state.crashed && !isCrashed) {
        setIsCrashed(true);
        setCrashReason(state.crashReason);
      } else if (state.finished && !isLevelComplete) {
        handleLevelFinished(state.score, state.coinsEarned);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [screen, isPaused, isCrashed, isLevelComplete, handleLevelFinished, advanceMission]);

  // Handle Pause on App Background (Android requirement: pause_on_app_background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && screen === 'racing' && !isCrashed && !isLevelComplete) {
        setIsPaused(true);
        soundManager.muteEngine();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [screen, isCrashed, isLevelComplete]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (screen === 'racing' && !isCrashed && !isLevelComplete) {
          setIsPaused((p) => {
            const next = !p;
            if (next) soundManager.muteEngine();
            return next;
          });
        }
        return;
      }

      if (e.code === 'KeyR') {
        if (screen === 'racing') {
          handleRestartCheckpoint();
        }
        return;
      }

      if (e.code === 'KeyT') {
        setShowDebugOverlay((p) => !p);
        return;
      }

      if (screen !== 'racing' || isPaused || isCrashed || isLevelComplete) return;

      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        setControls((c) => ({ ...c, gas: true }));
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setControls((c) => ({ ...c, brake: true }));
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setControls((c) => ({ ...c, leanBack: true }));
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setControls((c) => ({ ...c, leanForward: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        setControls((c) => ({ ...c, gas: false }));
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        setControls((c) => ({ ...c, brake: false }));
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setControls((c) => ({ ...c, leanBack: false }));
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setControls((c) => ({ ...c, leanForward: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, isPaused, isCrashed, isLevelComplete]);

  // Control handlers
  const handleTouchControl = (key: keyof GameControls, active: boolean) => {
    setControls((prev) => ({ ...prev, [key]: active }));
  };

  const handleRestartCheckpoint = () => {
    if (engineRef.current) {
      engineRef.current.resetToCheckpoint();
      setIsCrashed(false);
      setIsPaused(false);
      setControls({ gas: false, brake: false, leanBack: false, leanForward: false });
    }
  };

  const handleRestartLevel = () => {
    if (engineRef.current) {
      engineRef.current.resetLevel();
      setIsCrashed(false);
      setIsPaused(false);
      setIsLevelComplete(false);
      setLevelScore(0);
      setLevelCoins(0);
      setControls({ gas: false, brake: false, leanBack: false, leanForward: false });
    }
  };

  const handleReturnToMenu = () => {
    soundManager.muteEngine();
    soundManager.stopMusic();
    setScreen('main_menu');
    setIsPaused(false);
    setIsCrashed(false);
    setIsLevelComplete(false);
    setControls({ gas: false, brake: false, leanBack: false, leanForward: false });
  };

  const handleNextLevel = () => {
    const nextId = currentLevelId + 1;
    if (nextId <= 5) {
      startLevel(nextId);
    } else {
      handleReturnToMenu();
    }
  };

  const handleSaveUpdate = (newSave: GameSaveData) => {
    setSaveData(newSave);
    saveGameData(newSave);
  };

  const handleResetData = () => {
    const fresh = resetGameData();
    setSaveData(fresh);
    soundManager.init(fresh.audioSettings);
  };

  const handleToggleSound = () => {
    const updated = {
      ...saveData.audioSettings,
      soundEnabled: !saveData.audioSettings.soundEnabled,
    };
    soundManager.updateSettings(updated);
    handleSaveUpdate({
      ...saveData,
      audioSettings: updated,
    });
  };

  // Stunt listener for best stunt tracking & daily mission advancement
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setStuntCallback((stunt) => {
        if (stunt.points >= 500) {
          setBestStuntName(stunt.text);
          setSaveData((prev) => {
            const next = { ...prev, bestStunt: stunt.text };
            saveGameData(next);
            return next;
          });
        }

        // Advance daily missions based on stunt categories
        if (stunt.text.includes('FLIP')) {
          advanceMission('flips', 1);
        }
        if (stunt.text.includes('WHEELIE')) {
          advanceMission('wheelies', 1);
        }
        if (stunt.text.includes('BIG AIR')) {
          advanceMission('big_air', 1);
        }
        if (stunt.text.includes('COMBO')) {
          advanceMission('combos', 1);
        }
      });
    }
  }, [screen, advanceMission]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-tech">
      {/* Real-time Daily Mission Completion Toast */}
      {missionToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 text-slate-950 px-5 py-2.5 rounded-2xl font-black text-sm uppercase tracking-wide font-racing shadow-[0_0_35px_rgba(245,158,11,0.9)] flex items-center gap-2 border border-yellow-200 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <span>{missionToast}</span>
        </div>
      )}

      {/* Active Game World (mounted when racing or paused) */}
      {screen === 'racing' && engineRef.current && (
        <div className="relative w-full h-full">
          <GameCanvas
            engine={engineRef.current}
            controls={controls}
            paused={isPaused || isCrashed || isLevelComplete}
            ghostReplay={saveData.levelBestReplays?.[currentLevelId] || null}
            ghostEnabled={saveData.ghostEnabled ?? true}
            selectedNitro={saveData.selectedNitro || 'default_flame'}
          />

          <HUD
            state={engineRef.current.getState()}
            level={currentLevelRef.current}
            totalSavedCoins={saveData.coins}
            isDebugActive={showDebugOverlay}
            onToggleDebug={() => setShowDebugOverlay((p) => !p)}
            onPause={() => {
              setIsPaused(true);
              soundManager.muteEngine();
            }}
            onRestartCheckpoint={handleRestartCheckpoint}
          />

          {/* Touch Controls (Ergonomic Landscape UI) */}
          <TouchControls
            controls={controls}
            onControlChange={handleTouchControl}
          />

          {/* Pause Menu Overlay */}
          {isPaused && (
            <PauseModal
              onResume={() => setIsPaused(false)}
              onRestartCheckpoint={handleRestartCheckpoint}
              onRestartLevel={handleRestartLevel}
              onMainMenu={handleReturnToMenu}
              audioSettings={saveData.audioSettings}
              onToggleSound={handleToggleSound}
            />
          )}

          {/* Crash / Wipeout Overlay */}
          {isCrashed && (
            <CrashModal
              crashReason={crashReason}
              onRestartCheckpoint={handleRestartCheckpoint}
              onRestartLevel={handleRestartLevel}
              onMainMenu={handleReturnToMenu}
            />
          )}

          {/* Level Complete Victory Screen */}
          {isLevelComplete && (
            <LevelCompleteModal
              level={currentLevelRef.current}
              score={levelScore}
              coinsEarned={levelCoins}
              bestStunt={bestStuntName}
              onNextLevel={handleNextLevel}
              onReplay={handleRestartLevel}
              onMainMenu={handleReturnToMenu}
              onOpenLeaderboard={() => setScreen('leaderboard')}
              onWatchReplay={() => setIsReplayOpen(true)}
              hasNextLevel={currentLevelId < 5}
            />
          )}

          {/* Replay Playback Modal */}
          {isReplayOpen && replayData && (
            <ReplayModal
              replayData={replayData}
              level={currentLevelRef.current}
              onClose={() => setIsReplayOpen(false)}
            />
          )}
        </div>
      )}

      {/* Animated Screen Transitions */}
      <AnimatePresence mode="wait">
        {screen === 'main_menu' && (
          <motion.div
            key="main_menu"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 z-20"
          >
            <MainMenu
              saveData={saveData}
              onPlay={() => startLevel(Math.max(...saveData.unlockedLevels))}
              onOpenGarage={() => setScreen('garage')}
              onOpenLevelSelect={() => setScreen('level_select')}
              onOpenDailyMissions={() => setScreen('daily_missions')}
              onOpenDailyCheckpoint={() => setShowDailyCheckpointModal(true)}
              onOpenLeaderboard={() => setScreen('leaderboard')}
              onOpenSettings={() => setScreen('settings')}
              onOpenApkGuide={() => setScreen('apk_guide')}
              onOpenDailyLogin={() => setShowDailyLoginModal(true)}
              onToggleSound={handleToggleSound}
            />
          </motion.div>
        )}

        {screen === 'garage' && (
          <motion.div
            key="garage"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 z-30"
          >
            <GarageModal
              saveData={saveData}
              onUpdateSave={handleSaveUpdate}
              onClose={() => setScreen('main_menu')}
            />
          </motion.div>
        )}

        {screen === 'level_select' && (
          <motion.div
            key="level_select"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 z-30"
          >
            <LevelSelectModal
              saveData={saveData}
              onSelectLevel={(lvlId) => startLevel(lvlId)}
              onClose={() => setScreen('main_menu')}
            />
          </motion.div>
        )}

        {screen === 'daily_missions' && (
          <motion.div
            key="daily_missions"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 z-30"
          >
            <DailyMissionsModal
              missionsState={saveData.dailyMissions}
              completedMissionsHistory={saveData.completedMissionsHistory}
              onClaimReward={handleClaimMission}
              onClose={() => setScreen('main_menu')}
            />
          </motion.div>
        )}

        {screen === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 z-30"
          >
            <SettingsModal
              settings={saveData.audioSettings}
              onUpdateSettings={(newAudio) =>
                handleSaveUpdate({ ...saveData, audioSettings: newAudio })
              }
              onResetData={handleResetData}
              onClose={() => setScreen('main_menu')}
            />
          </motion.div>
        )}

        {screen === 'apk_guide' && (
          <motion.div
            key="apk_guide"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 z-30"
          >
            <ApkExportModal onClose={() => setScreen('main_menu')} />
          </motion.div>
        )}

        {screen === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 z-30"
          >
            <GlobalLeaderboardModal
              recentScore={recentRunScore}
              onClose={() => setScreen('main_menu')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Login Modal */}
      {showDailyLoginModal && (
        <DailyLoginModal
          saveData={saveData}
          onClaim={handleClaimDailyReward}
          onClose={() => setShowDailyLoginModal(false)}
        />
      )}

      {/* Daily Checkpoint Modal */}
      {showDailyCheckpointModal && saveData.dailyCheckpoint && (
        <DailyCheckpointModal
          segment={saveData.dailyCheckpoint.currentSegment}
          lastResetTimestamp={saveData.dailyCheckpoint.lastResetTimestamp}
          completedToday={saveData.dailyCheckpoint.completedToday}
          onPlayLevel={(lvlId) => {
            setShowDailyCheckpointModal(false);
            startLevel(lvlId);
          }}
          onClose={() => setShowDailyCheckpointModal(false)}
        />
      )}
    </main>
  );
}
