export type { BikePhysicsState } from '../physics/BikePhysics';

export type UpgradeType = 
  | 'enginePower' 
  | 'acceleration' 
  | 'brakeStrength' 
  | 'airControl' 
  | 'suspension'
  | 'nitro';

export interface BikeUpgrades {
  enginePower: number; // 1 to 5
  acceleration: number;
  brakeStrength: number;
  airControl: number;
  suspension: number;
  nitro: number;
}

export interface BikeConfig {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  unlocked: boolean;
  color: string;
  accentColor: string;
  glowColor: string;
  riderSuitColor: string;
  riderHelmetColor: string;
  baseStats: {
    topSpeed: number; // units/s
    torque: number;
    brakePower: number;
    flipSpeed: number;
    shockAbsorb: number;
    weight: number;
  };
  upgrades: BikeUpgrades;
}

export interface TerrainPoint {
  x: number;
  y: number;
}

export interface MovingPlatform {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
  currentX: number;
  currentY: number;
  speed: number;
  progress: number;
  direction: 1 | -1;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  reached: boolean;
}

export interface FireRing {
  id: string;
  x: number;
  y: number;
  radius: number;
  cleared: boolean;
}

export interface LoopDeLoop {
  id: string;
  centerX: number;
  centerY: number;
  radius: number;
}

export interface LevelData {
  id: number;
  name: string;
  subtitle: string;
  theme: 'green_hills' | 'mountain_peaks' | 'cyber_city' | 'desert_dunes' | 'extreme_arena';
  skyColors: [string, string];
  groundColor: string;
  groundSubColor: string;
  trackLength: number;
  terrain: TerrainPoint[];
  movingPlatforms?: MovingPlatform[];
  coins: Coin[];
  checkpoints: Checkpoint[];
  fireRings?: FireRing[];
  loops?: LoopDeLoop[];
  finishX: number;
  parTime: number; // seconds
  threeStarScore: number;
}

export interface ActiveStunt {
  text: string;
  points: number;
  color: string;
  timestamp: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'confetti' | 'trail';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
  engineVolume: number;
  sfxVolume: number;
  musicVolume: number;
}

export type MissionCategory = 'flips' | 'wheelies' | 'combos' | 'coins' | 'level_clear' | 'big_air';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface DailyMissionsState {
  lastResetTimestamp: number;
  missions: DailyMission[];
}

export interface GameSaveData {
  coins: number;
  unlockedBikes: string[];
  selectedBikeId: string;
  bikeUpgrades: Record<string, BikeUpgrades>;
  unlockedLevels: number[];
  levelBestScores: Record<number, number>;
  levelStars: Record<number, number>;
  bestStunt: string;
  audioSettings: AudioSettings;
  dailyMissions: DailyMissionsState;
  dailyCheckpoint?: DailyCheckpointState;
  currentSession?: string;
  levelBestReplays?: Record<number, ReplayData>;
  ghostEnabled?: boolean;
  lastLoginDate?: string;
  loginStreak?: number;
  loginRewardClaimedToday?: boolean;
  unlockedNitros?: string[];
  selectedNitro?: string;
  unlockedSkins?: string[];
  unlockedCharacters?: string[];
  unlockedVehicles?: string[];
  completedMissionsHistory?: { timestamp: number; mission: DailyMission }[];
}

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

export interface GameControls {
  gas: boolean;
  brake: boolean;
  leanBack: boolean;
  leanForward: boolean;
}

export interface AirdropCrate {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  rewardCoins: number;
  smokeTimer?: number;
}

export interface ReplayFrame {
  timestamp: number; // in-run millisecond or frame tick
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  rearWheelX: number;
  rearWheelY: number;
  rearWheelRotation: number;
  frontWheelX: number;
  frontWheelY: number;
  frontWheelRotation: number;
  riderLean: number;
  gas: boolean;
  brake: boolean;
  inAir: boolean;
  comboMultiplier: number;
  score: number;
  stuntText?: string;
  stuntColor?: string;
}

export interface ReplayData {
  levelId: number;
  levelName: string;
  bikeConfig: BikeConfig;
  frames: ReplayFrame[];
  bestStuntName: string;
  finalScore: number;
  durationMs: number;
}
