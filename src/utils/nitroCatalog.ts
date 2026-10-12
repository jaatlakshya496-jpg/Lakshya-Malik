export interface NitroItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  color: string;
  secondaryColor: string;
  particleStyle: 'flame' | 'plasma' | 'fireball' | 'quantum' | 'gold_sparks';
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
  },
];
