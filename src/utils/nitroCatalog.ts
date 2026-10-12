export interface NitroItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  color: string;
  secondaryColor: string;
  particleStyle: 'flame' | 'plasma' | 'fireball' | 'quantum' | 'gold_sparks';
  boostMultiplier: number; // Speed multiplier while active
}

export const NITRO_ITEMS: NitroItem[] = [
  {
    id: 'default_flame',
    name: 'Standard Crimson Flame',
    description: 'Classic red and yellow exhaust boost with warm amber embers.',
    price: 0,
    rarity: 'Common',
    color: '#ef4444',
    secondaryColor: '#fbbf24',
    particleStyle: 'flame',
    boostMultiplier: 1.15,
  },
  {
    id: 'cyber_blue',
    name: 'Cyber Cyan Plasma',
    description: 'Futuristic neon blue electric surge inspired by DJ Alok beats.',
    price: 450,
    rarity: 'Rare',
    color: '#06b6d4',
    secondaryColor: '#3b82f6',
    particleStyle: 'plasma',
    boostMultiplier: 1.20,
  },
  {
    id: 'inferno_booyah',
    name: 'Booyah Hellfire',
    description: 'Intense blazing orange and fiery red eruption for stunt masters.',
    price: 1100,
    rarity: 'Epic',
    color: '#f97316',
    secondaryColor: '#ef4444',
    particleStyle: 'fireball',
    boostMultiplier: 1.25,
  },
  {
    id: 'chrono_purple',
    name: 'Chrono Void Warp',
    description: 'Mystical purple quantum energy jet distorting space-time.',
    price: 2400,
    rarity: 'Epic',
    color: '#a855f7',
    secondaryColor: '#c084fc',
    particleStyle: 'quantum',
    boostMultiplier: 1.30,
  },
  {
    id: 'gold_royale',
    name: 'Golden Royale 777',
    description: 'Legendary gold-spangled grandmaster thruster radiating pure wealth.',
    price: 5000,
    rarity: 'Legendary',
    color: '#eab308',
    secondaryColor: '#fef08a',
    particleStyle: 'gold_sparks',
    boostMultiplier: 1.35,
  },
  // NEW: Additional nitro items
  {
    id: 'ice_cold',
    name: 'Ice Cold',
    description: 'Cool blue-white frost thrust with trailing ice particles.',
    price: 800,
    rarity: 'Rare',
    color: '#3b82f6',
    secondaryColor: '#60a5fa',
    particleStyle: 'plasma',
    boostMultiplier: 1.18,
  },
  {
    id: 'sky_high',
    name: 'Sky High',
    description: 'Purple-pink sunset gradient boost for aerial stunts.',
    price: 1500,
    rarity: 'Epic',
    color: '#ec4899',
    secondaryColor: '#f472b6',
    particleStyle: 'flame',
    boostMultiplier: 1.22,
  },
  {
    id: 'lightning',
    name: 'Lightning Strike',
    description: 'Electric yellow-blue bolt with crackling particle effects.',
    price: 3000,
    rarity: 'Legendary',
    color: '#f59e0b',
    secondaryColor: '#a855f7',
    particleStyle: 'fireball',
    boostMultiplier: 1.32,
  },
];
