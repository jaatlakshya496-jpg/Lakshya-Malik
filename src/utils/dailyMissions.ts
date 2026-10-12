import { DailyMission, DailyMissionsState, MissionCategory } from '../types/game';

const MISSION_POOL: Omit<DailyMission, 'current' | 'completed' | 'claimed'>[] = [
  {
    id: 'mission_flips_5',
    title: 'Acrobatic Flyer',
    description: 'Perform 5 Backflips or Front Flips across any tracks',
    category: 'flips',
    target: 5,
    rewardCoins: 350,
    icon: 'RotateCw',
  },
  {
    id: 'mission_flips_10',
    title: 'Sky Spinner',
    description: 'Execute 10 aerial flips without wiping out',
    category: 'flips',
    target: 10,
    rewardCoins: 600,
    icon: 'RotateCw',
  },
  {
    id: 'mission_combo_x2',
    title: 'Double Trouble',
    description: 'Pull off 3 Air Stunt Combos of x2 or higher',
    category: 'combos',
    target: 3,
    rewardCoins: 450,
    icon: 'Flame',
  },
  {
    id: 'mission_combo_x3',
    title: 'Combo Maestro',
    description: 'Land a spectacular x3 or higher Air Trick Combo',
    category: 'combos',
    target: 1,
    rewardCoins: 750,
    icon: 'Zap',
  },
  {
    id: 'mission_wheelies_8',
    title: 'Wheelie Prodigy',
    description: 'Perform 6 Wheelie ground stunts',
    category: 'wheelies',
    target: 6,
    rewardCoins: 300,
    icon: 'ArrowUpRight',
  },
  {
    id: 'mission_coins_30',
    title: 'Bounty Hunter',
    description: 'Collect 30 Gold Coins placed along the stunt tracks',
    category: 'coins',
    target: 30,
    rewardCoins: 400,
    icon: 'Coins',
  },
  {
    id: 'mission_level_2',
    title: 'Track Finisher',
    description: 'Conquer and complete any 2 stunt track stages',
    category: 'level_clear',
    target: 2,
    rewardCoins: 500,
    icon: 'Flag',
  },
  {
    id: 'mission_big_air_4',
    title: 'High Altitude',
    description: 'Catch Big Air jumps 4 times with massive hang-time',
    category: 'big_air',
    target: 4,
    rewardCoins: 400,
    icon: 'Plane',
  },
];

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function generateDailyMissions(): DailyMission[] {
  // Pick 4 diverse missions from the pool
  const shuffled = [...MISSION_POOL].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 4);

  return selected.map((m) => ({
    ...m,
    current: 0,
    completed: false,
    claimed: false,
  }));
}

export function checkAndRefreshDailyMissions(state?: DailyMissionsState): DailyMissionsState {
  const now = Date.now();

  if (!state || !state.missions || state.missions.length === 0) {
    return {
      lastResetTimestamp: now,
      missions: generateDailyMissions(),
    };
  }

  // Check if 24 hours have passed since last reset
  if (now - state.lastResetTimestamp >= TWENTY_FOUR_HOURS_MS) {
    return {
      lastResetTimestamp: now,
      missions: generateDailyMissions(),
    };
  }

  return state;
}

export function getTimeUntilNextReset(lastResetTimestamp: number): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const now = Date.now();
  const nextReset = lastResetTimestamp + TWENTY_FOUR_HOURS_MS;
  const remainingMs = Math.max(0, nextReset - now);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { hours, minutes, seconds, formatted };
}

export function updateMissionProgress(
  state: DailyMissionsState,
  category: MissionCategory,
  amount = 1
): { updatedState: DailyMissionsState; newlyCompleted: DailyMission[] } {
  const newlyCompleted: DailyMission[] = [];

  const updatedMissions = state.missions.map((m) => {
    if (m.category === category && !m.completed) {
      const newCurrent = Math.min(m.target, m.current + amount);
      const isNowCompleted = newCurrent >= m.target;

      if (isNowCompleted && !m.completed) {
        newlyCompleted.push({
          ...m,
          current: newCurrent,
          completed: true,
        });
      }

      return {
        ...m,
        current: newCurrent,
        completed: isNowCompleted,
      };
    }
    return m;
  });

  return {
    updatedState: {
      ...state,
      missions: updatedMissions,
    },
    newlyCompleted,
  };
}
