import { GameSaveData, AudioSettings } from '../types/game';
import { checkAndRefreshDailyMissions } from './dailyMissions';
import { checkAndRefreshCheckpoint } from './dailyCheckpoint';

const SAVE_KEY = 'malik_bike_stunt_2d_save_v1';

const DEFAULT_AUDIO: AudioSettings = {
  soundEnabled: true,
  musicEnabled: true,
  masterVolume: 0.8,
  engineVolume: 0.7,
  sfxVolume: 0.9,
  musicVolume: 0.5,
};

const DEFAULT_SAVE: GameSaveData = {
  coins: 200, // Starter coins so player can test garage right away
  unlockedBikes: ['motocross_basic'],
  selectedBikeId: 'motocross_basic',
  bikeUpgrades: {
    motocross_basic: {
      enginePower: 1,
      acceleration: 1,
      brakeStrength: 1,
      airControl: 1,
      suspension: 1,
    },
  },
  unlockedLevels: [1],
  levelBestScores: {},
  levelStars: {},
  levelBestReplays: {},
  ghostEnabled: true,
  bestStunt: 'Front Flip',
  audioSettings: DEFAULT_AUDIO,
  dailyMissions: checkAndRefreshDailyMissions(),
  dailyCheckpoint: checkAndRefreshCheckpoint(),
  unlockedNitros: ['default_flame'],
  selectedNitro: 'default_flame',
};

export function loadGameData(): GameSaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const initial = { ...DEFAULT_SAVE };
      saveGameData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const refreshedMissions = checkAndRefreshDailyMissions(parsed.dailyMissions);
    const refreshedCheckpoint = checkAndRefreshCheckpoint(parsed.dailyCheckpoint);

    const loaded: GameSaveData = {
      ...DEFAULT_SAVE,
      ...parsed,
      bikeUpgrades: {
        ...DEFAULT_SAVE.bikeUpgrades,
        ...(parsed.bikeUpgrades || {}),
      },
      audioSettings: {
        ...DEFAULT_AUDIO,
        ...(parsed.audioSettings || {}),
      },
      dailyMissions: refreshedMissions,
      dailyCheckpoint: refreshedCheckpoint,
      loginStreak: parsed.loginStreak ?? 1,
      loginRewardClaimedToday: parsed.loginRewardClaimedToday ?? false,
      lastLoginDate: parsed.lastLoginDate,
      unlockedNitros: parsed.unlockedNitros || ['default_flame'],
      selectedNitro: parsed.selectedNitro || 'default_flame',
    };

    saveGameData(loaded);
    return loaded;
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function saveGameData(data: GameSaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save game data:', e);
  }
}

export function resetGameData(): GameSaveData {
  const fresh = { ...DEFAULT_SAVE };
  saveGameData(fresh);
  return fresh;
}
