export interface DailyCheckpointSegment {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  targetLevelId: number;
  icon: string;
  completed: boolean;
}

export interface DailyCheckpointState {
  lastResetTimestamp: number;
  currentSegment: DailyCheckpointSegment;
  completedToday: boolean;
}

const CHECKPOINT_POOL: Omit<DailyCheckpointSegment, 'completed'>[] = [
  {
    id: 'chk_neon_skyway',
    title: 'Neon Skyway Checkpoint',
    description: 'High-altitude neon jump sequence with a 2.5x coin multiplier reward!',
    multiplier: 2.5,
    targetLevelId: 3,
    icon: 'Zap',
  },
  {
    id: 'chk_gravity_warp',
    title: 'Gravity Warp Gorge',
    description: 'Extreme steep drops and steep hills with a 3.0x mega coin multiplier!',
    multiplier: 3.0,
    targetLevelId: 7,
    icon: 'Flame',
  },
  {
    id: 'chk_stunt_canyon',
    title: 'Stunt Canyon Ridge',
    description: 'Multi-ramp gap jump challenge with a 2.0x coin boost bonus!',
    multiplier: 2.0,
    targetLevelId: 5,
    icon: 'Flag',
  },
  {
    id: 'chk_turbo_loop',
    title: 'Turbo Loop Arena',
    description: 'Loop-de-loop stunt track segment with a 2.8x multiplier reward!',
    multiplier: 2.8,
    targetLevelId: 10,
    icon: 'RotateCw',
  },
];

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function getRandomCheckpointSegment(): DailyCheckpointSegment {
  const index = Math.floor(Date.now() / TWENTY_FOUR_HOURS_MS) % CHECKPOINT_POOL.length;
  const item = CHECKPOINT_POOL[index] || CHECKPOINT_POOL[0];
  return {
    ...item,
    completed: false,
  };
}

export function checkAndRefreshCheckpoint(state?: DailyCheckpointState): DailyCheckpointState {
  const now = Date.now();

  if (!state || !state.currentSegment || !state.lastResetTimestamp) {
    return {
      lastResetTimestamp: now,
      currentSegment: getRandomCheckpointSegment(),
      completedToday: false,
    };
  }

  // Check if 24 hours have passed since last reset
  if (now - state.lastResetTimestamp >= TWENTY_FOUR_HOURS_MS) {
    return {
      lastResetTimestamp: now,
      currentSegment: getRandomCheckpointSegment(),
      completedToday: false,
    };
  }

  return state;
}

export function getTimeUntilCheckpointReset(lastResetTimestamp: number): {
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
