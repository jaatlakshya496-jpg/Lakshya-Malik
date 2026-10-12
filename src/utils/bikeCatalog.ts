import { BikeConfig, BikeUpgrades, UpgradeType } from '../types/game';

export const INITIAL_BIKES: BikeConfig[] = [
  {
    id: 'motocross_basic',
    name: 'FF Cobra Motorbike',
    subtitle: 'Free Fire signature red & neon venom speed bike',
    price: 0,
    unlocked: true,
    color: '#ff2a2a',
    accentColor: '#fbbf24',
    glowColor: '#ff0055',
    riderSuitColor: '#dc2626',
    riderHelmetColor: '#18181b',
    baseStats: {
      topSpeed: 15.5,
      torque: 0.72,
      brakePower: 0.95,
      flipSpeed: 0.055,
      shockAbsorb: 0.75,
      weight: 1.0,
    },
    upgrades: {
      enginePower: 1,
      acceleration: 1,
      brakeStrength: 1,
      airControl: 1,
      suspension: 1,
    },
  },
  {
    id: 'dirt_jumper',
    name: 'Inferno Booyah Beast',
    subtitle: 'Fiery flaming dirt bike crafted for brutal stunt jumps',
    price: 1200,
    unlocked: false,
    color: '#f97316',
    accentColor: '#facc15',
    glowColor: '#fb923c',
    riderSuitColor: '#ea580c',
    riderHelmetColor: '#fef08a',
    baseStats: {
      topSpeed: 17.0,
      torque: 0.88,
      brakePower: 1.1,
      flipSpeed: 0.06,
      shockAbsorb: 0.86,
      weight: 1.02,
    },
    upgrades: {
      enginePower: 1,
      acceleration: 1,
      brakeStrength: 1,
      airControl: 1,
      suspension: 1,
    },
  },
  {
    id: 'sport_blade',
    name: 'DJ Alok Cyber Blade',
    subtitle: 'Neon cyan EDM beat bike with hypersonic boost',
    price: 2800,
    unlocked: false,
    color: '#06b6d4',
    accentColor: '#3b82f6',
    glowColor: '#22d3ee',
    riderSuitColor: '#0f172a',
    riderHelmetColor: '#00f2fe',
    baseStats: {
      topSpeed: 19.5,
      torque: 0.85,
      brakePower: 1.4,
      flipSpeed: 0.07,
      shockAbsorb: 0.78,
      weight: 0.93,
    },
    upgrades: {
      enginePower: 1,
      acceleration: 1,
      brakeStrength: 1,
      airControl: 1,
      suspension: 1,
    },
  },
  {
    id: 'super_bike',
    name: 'Chrono Time Hopper',
    subtitle: 'Cosmic purple gravity-defying super bike with maximum air torque',
    price: 5000,
    unlocked: false,
    color: '#8b5cf6',
    accentColor: '#c084fc',
    glowColor: '#a855f7',
    riderSuitColor: '#581c87',
    riderHelmetColor: '#e9d5ff',
    baseStats: {
      topSpeed: 21.0,
      torque: 1.05,
      brakePower: 1.45,
      flipSpeed: 0.082,
      shockAbsorb: 0.84,
      weight: 0.9,
    },
    upgrades: {
      enginePower: 1,
      acceleration: 1,
      brakeStrength: 1,
      airControl: 1,
      suspension: 1,
    },
  },
  {
    id: 'monster_titan',
    name: 'Golden Royale Titan 777',
    subtitle: 'Apex legendary grandmaster stunt bike with supreme torque',
    price: 8500,
    unlocked: false,
    color: '#eab308',
    accentColor: '#f59e0b',
    glowColor: '#fef08a',
    riderSuitColor: '#713f12',
    riderHelmetColor: '#fde047',
    baseStats: {
      topSpeed: 23.5,
      torque: 1.25,
      brakePower: 1.65,
      flipSpeed: 0.092,
      shockAbsorb: 0.94,
      weight: 0.85,
    },
    upgrades: {
      enginePower: 1,
      acceleration: 1,
      brakeStrength: 1,
      airControl: 1,
      suspension: 1,
    },
  },
];

export const UPGRADE_METADATA: Record<UpgradeType, { name: string; description: string; icon: string }> = {
  enginePower: {
    name: 'Engine Power',
    description: 'Increases top speed & uphill climbing momentum',
    icon: 'Gauge',
  },
  acceleration: {
    name: 'Acceleration',
    description: 'Quicker throttle response & faster wheel revs',
    icon: 'Zap',
  },
  brakeStrength: {
    name: 'Brake Strength',
    description: 'Faster stopping power & acute mid-air leveling',
    icon: 'Disc',
  },
  airControl: {
    name: 'Air Control',
    description: 'Faster front/backflip rotation & mid-air agility',
    icon: 'RotateCw',
  },
  suspension: {
    name: 'Suspension',
    description: 'Absorbs heavy impacts & prevents harsh crash bounces',
    icon: 'Activity',
  },
};

export const UPGRADE_MAX_LEVEL = 5;

export function getUpgradeCost(currentLevel: number): number {
  if (currentLevel >= UPGRADE_MAX_LEVEL) return 0;
  // Level 1->2: 250, Level 2->3: 500, Level 3->4: 900, Level 4->5: 1500
  const costs = [0, 250, 500, 900, 1500];
  return costs[currentLevel] || 2000;
}

export function computeEffectiveStats(bike: BikeConfig, upgrades?: BikeUpgrades) {
  const currentUpgrades = upgrades || bike.upgrades;
  const eng = currentUpgrades.enginePower - 1;
  const acc = currentUpgrades.acceleration - 1;
  const brk = currentUpgrades.brakeStrength - 1;
  const air = currentUpgrades.airControl - 1;
  const sus = currentUpgrades.suspension - 1;

  return {
    topSpeed: bike.baseStats.topSpeed * (1 + eng * 0.09),
    torque: bike.baseStats.torque * (1 + acc * 0.12),
    brakePower: bike.baseStats.brakePower * (1 + brk * 0.14),
    flipSpeed: bike.baseStats.flipSpeed * (1 + air * 0.15),
    shockAbsorb: Math.min(0.96, bike.baseStats.shockAbsorb * (1 + sus * 0.08)),
    weight: bike.baseStats.weight * (1 - (eng + air) * 0.02),
  };
}
