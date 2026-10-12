import { LevelData, TerrainPoint, Coin, Checkpoint, MovingPlatform, FireRing, LoopDeLoop } from '../types/game';

// Helper to generate smooth curved hill segments
function generateHill(
  startX: number,
  startY: number,
  length: number,
  height: number,
  steps = 14
): TerrainPoint[] {
  const points: TerrainPoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Cosine ease for natural terrain slope
    const x = startX + t * length;
    const y = startY - Math.sin(t * Math.PI) * height;
    points.push({ x, y });
  }
  return points;
}

// Helper to generate a stunt ramp with a launch lip
function generateRamp(
  startX: number,
  startY: number,
  rampLength: number,
  rampHeight: number,
  lipLength: number = 20,
  steps = 8
): TerrainPoint[] {
  const points: TerrainPoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Quadratic ramp curve
    const x = startX + t * rampLength;
    const y = startY - Math.pow(t, 1.4) * rampHeight;
    points.push({ x, y });
  }
  // Launch flat lip
  const last = points[points.length - 1];
  points.push({ x: last.x + lipLength, y: last.y });
  return points;
}

// Generate coins in an arc above a ramp or gap
function generateCoinArc(
  startX: number,
  startY: number,
  endX: number,
  peakHeight: number,
  count = 5,
  prefix = 'coin'
): Coin[] {
  const coins: Coin[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const x = startX + t * (endX - startX);
    const y = startY - Math.sin(t * Math.PI) * peakHeight;
    coins.push({
      id: `${prefix}_${i}_${Math.floor(x)}`,
      x,
      y,
      collected: false,
    });
  }
  return coins;
}

// Level 1: Beginner Hills & Small Ramps
function createLevel1(): LevelData {
  const terrain: TerrainPoint[] = [
    { x: -200, y: 500 },
    { x: 200, y: 500 }, // Start flat
  ];

  // Gentle Hill 1
  terrain.push(...generateHill(200, 500, 400, 70));
  // Flat run-up
  terrain.push({ x: 800, y: 500 });
  // Ramp 1
  terrain.push(...generateRamp(800, 500, 220, 90));
  // Landing slope after gap
  terrain.push({ x: 1080, y: 440 });
  terrain.push({ x: 1250, y: 520 });
  terrain.push({ x: 1450, y: 520 });

  // Checkpoint 1 at 1450
  terrain.push(...generateHill(1450, 520, 500, 110));
  terrain.push({ x: 2100, y: 520 });

  // Ramp 2 (Big Air Jump)
  terrain.push(...generateRamp(2100, 520, 280, 130));
  // Downhill landing ramp
  terrain.push({ x: 2460, y: 430 });
  terrain.push({ x: 2750, y: 540 });
  terrain.push({ x: 3200, y: 540 });
  terrain.push({ x: 3500, y: 540 }); // Finish

  const coins: Coin[] = [
    ...generateCoinArc(250, 500, 550, 100, 4, 'l1_hill1'),
    ...generateCoinArc(1020, 420, 1250, 120, 5, 'l1_ramp1'),
    ...generateCoinArc(1600, 520, 1900, 140, 4, 'l1_hill2'),
    ...generateCoinArc(2380, 390, 2750, 170, 6, 'l1_bigair'),
    { id: 'l1_fin1', x: 3000, y: 500, collected: false },
    { id: 'l1_fin2', x: 3100, y: 500, collected: false },
  ];

  const checkpoints: Checkpoint[] = [
    { id: 'cp_l1_1', x: 1450, y: 520, reached: false },
  ];

  return {
    id: 1,
    name: "Valley Warmup",
    subtitle: "Beginner hills with small ramps",
    theme: "green_hills",
    skyColors: ["#0f2027", "#203a43"],
    groundColor: "#15803d",
    groundSubColor: "#78350f",
    trackLength: 3500,
    terrain,
    coins,
    checkpoints,
    finishX: 3350,
    parTime: 25,
    threeStarScore: 3500,
  };
}

// Level 2: Mountain Peaks & Moving Platforms
function createLevel2(): LevelData {
  const terrain: TerrainPoint[] = [
    { x: -200, y: 500 },
    { x: 250, y: 500 },
  ];

  // Mountain Peak 1
  terrain.push(...generateRamp(250, 500, 350, 150));
  terrain.push({ x: 750, y: 380 });
  terrain.push({ x: 950, y: 500 }); // Valley

  // Checkpoint 1
  terrain.push({ x: 1200, y: 500 });
  // Ramp to Moving Platform chasm
  terrain.push(...generateRamp(1200, 500, 240, 110));

  // Chasm gap: platform hovers between x=1550 and x=1850 over mountain gorge!
  terrain.push({ x: 1470, y: 680 });
  terrain.push({ x: 1980, y: 680 });
  // Receiving cliff:
  terrain.push({ x: 2000, y: 440 });
  terrain.push({ x: 2200, y: 440 });

  // Downward steep slope to Checkpoint 2
  terrain.push({ x: 2400, y: 560 });
  terrain.push({ x: 2650, y: 560 });

  // Triple Roller Hills
  terrain.push(...generateHill(2650, 560, 260, 60));
  terrain.push(...generateHill(2910, 560, 260, 70));
  terrain.push(...generateRamp(3170, 560, 300, 160));

  // High mountain landing
  terrain.push({ x: 3580, y: 430 });
  terrain.push({ x: 3900, y: 500 });
  terrain.push({ x: 4200, y: 500 });

  const movingPlatforms: MovingPlatform[] = [
    {
      id: 'mp_l2_1',
      startX: 1500,
      startY: 420,
      endX: 1850,
      endY: 420,
      width: 140,
      height: 24,
      currentX: 1600,
      currentY: 420,
      speed: 1.8,
      progress: 0,
      direction: 1,
    },
  ];

  const coins: Coin[] = [
    ...generateCoinArc(600, 350, 950, 130, 5, 'l2_peak1'),
    ...generateCoinArc(1440, 390, 2000, 150, 6, 'l2_chasm'),
    ...generateCoinArc(2650, 540, 3170, 120, 6, 'l2_rollers'),
    ...generateCoinArc(3470, 400, 3800, 170, 5, 'l2_finishjump'),
  ];

  const checkpoints: Checkpoint[] = [
    { id: 'cp_l2_1', x: 1200, y: 500, reached: false },
    { id: 'cp_l2_2', x: 2500, y: 560, reached: false },
  ];

  return {
    id: 2,
    name: "Alpine Leap",
    subtitle: "Mountain jumps and moving platforms",
    theme: "mountain_peaks",
    skyColors: ["#1e3a8a", "#0284c7"],
    groundColor: "#0284c7",
    groundSubColor: "#1e293b",
    trackLength: 4200,
    terrain,
    movingPlatforms,
    coins,
    checkpoints,
    finishX: 4050,
    parTime: 32,
    threeStarScore: 5000,
  };
}

// Level 3: Cyber City Rooftop Gaps
function createLevel3(): LevelData {
  const terrain: TerrainPoint[] = [
    { x: -200, y: 480 },
    { x: 300, y: 480 }, // Roof 1
  ];

  // Rooftop 1 Ramp (ends at 600, y: 370)
  terrain.push(...generateRamp(300, 480, 280, 110));
  // Street alley gap below
  terrain.push({ x: 610, y: 680 });
  terrain.push({ x: 730, y: 680 });
  // Gap over street to Roof 2
  terrain.push({ x: 740, y: 460 });
  terrain.push({ x: 1100, y: 460 });

  // Rooftop 2 Step down & jump
  terrain.push({ x: 1200, y: 510 });
  terrain.push(...generateRamp(1200, 510, 260, 120)); // ends at 1480, y: 390

  // Gap to Crane beam over alley
  terrain.push({ x: 1490, y: 680 });
  terrain.push({ x: 1590, y: 680 });
  terrain.push({ x: 1600, y: 450 });
  terrain.push({ x: 1950, y: 450 }); // Crane beam

  // Checkpoint 1 at Crane beam
  // Steep descent to highway
  terrain.push({ x: 2150, y: 570 });
  terrain.push({ x: 2450, y: 570 });

  // Speed launch ramp
  terrain.push(...generateRamp(2450, 570, 320, 170)); // ends at 2790, y: 400
  // Massive leap over neon billboards alley
  terrain.push({ x: 2800, y: 700 });
  terrain.push({ x: 2940, y: 700 });
  terrain.push({ x: 2950, y: 470 });
  terrain.push({ x: 3400, y: 470 });

  // Checkpoint 2
  terrain.push({ x: 3550, y: 520 });
  terrain.push(...generateRamp(3550, 520, 300, 150));
  terrain.push({ x: 4000, y: 480 });
  terrain.push({ x: 4400, y: 480 });

  const coins: Coin[] = [
    ...generateCoinArc(580, 370, 740, 120, 4, 'l3_gap1'),
    ...generateCoinArc(1460, 390, 1600, 130, 4, 'l3_gap2'),
    ...generateCoinArc(2770, 400, 3050, 180, 7, 'l3_megagap'),
    ...generateCoinArc(3850, 370, 4100, 140, 5, 'l3_finalroof'),
  ];

  const checkpoints: Checkpoint[] = [
    { id: 'cp_l3_1', x: 1800, y: 450, reached: false },
    { id: 'cp_l3_2', x: 3400, y: 470, reached: false },
  ];

  return {
    id: 3,
    name: "Neon Skyways",
    subtitle: "City rooftops with challenging gaps",
    theme: "cyber_city",
    skyColors: ["#2e1065", "#0f172a"],
    groundColor: "#ec4899",
    groundSubColor: "#1e1b4b",
    trackLength: 4400,
    terrain,
    coins,
    checkpoints,
    finishX: 4250,
    parTime: 30,
    threeStarScore: 6500,
  };
}

// Level 4: Desert Dunes & Canyon Loops
function createLevel4(): LevelData {
  const terrain: TerrainPoint[] = [
    { x: -200, y: 520 },
    { x: 300, y: 520 },
  ];

  // Huge Desert Dune 1
  terrain.push(...generateHill(300, 520, 450, 140));
  terrain.push({ x: 900, y: 520 });

  // Loop-de-loop approach run-up
  terrain.push({ x: 1150, y: 520 });
  // Loop is located at X=1400, radius 130
  // Track goes into loop entrance and exits
  terrain.push({ x: 1300, y: 520 });
  terrain.push({ x: 1550, y: 520 }); // Loop exit base

  // Checkpoint 1 after loop
  terrain.push({ x: 1750, y: 520 });
  // Steep canyon jump
  terrain.push(...generateRamp(1750, 520, 300, 160));
  terrain.push({ x: 2200, y: 440 });
  terrain.push({ x: 2500, y: 500 });

  // Rolling Dune Waves
  terrain.push(...generateHill(2500, 500, 320, 90));
  terrain.push(...generateHill(2820, 500, 320, 110));

  // Checkpoint 2
  terrain.push({ x: 3250, y: 500 });
  // Super Mega Dune Ramp
  terrain.push(...generateRamp(3250, 500, 360, 200));
  terrain.push({ x: 3800, y: 450 });
  terrain.push({ x: 4200, y: 500 });
  terrain.push({ x: 4600, y: 500 });

  const loops: LoopDeLoop[] = [
    {
      id: 'loop_l4_1',
      centerX: 1420,
      centerY: 390,
      radius: 130,
    },
  ];

  const coins: Coin[] = [
    ...generateCoinArc(400, 480, 800, 160, 5, 'l4_dune1'),
    // Loop coin ring
    { id: 'l4_loop1', x: 1350, y: 390, collected: false },
    { id: 'l4_loop2', x: 1420, y: 260, collected: false },
    { id: 'l4_loop3', x: 1490, y: 390, collected: false },
    ...generateCoinArc(2050, 360, 2300, 160, 5, 'l4_canyon'),
    ...generateCoinArc(2600, 480, 3100, 140, 6, 'l4_waves'),
    ...generateCoinArc(3610, 300, 3950, 220, 8, 'l4_megajump'),
  ];

  const checkpoints: Checkpoint[] = [
    { id: 'cp_l4_1', x: 1700, y: 520, reached: false },
    { id: 'cp_l4_2', x: 3250, y: 500, reached: false },
  ];

  return {
    id: 4,
    name: "Dune Vortex",
    subtitle: "Desert stunt track with steep ramps and loops",
    theme: "desert_dunes",
    skyColors: ["#7c2d12", "#ca8a04"],
    groundColor: "#f59e0b",
    groundSubColor: "#78350f",
    trackLength: 4600,
    terrain,
    loops,
    coins,
    checkpoints,
    finishX: 4450,
    parTime: 35,
    threeStarScore: 7800,
  };
}

// Level 5: Extreme Stunt Arena
function createLevel5(): LevelData {
  const terrain: TerrainPoint[] = [
    { x: -200, y: 520 },
    { x: 250, y: 520 },
  ];

  // Double Speed Rollers
  terrain.push(...generateHill(250, 520, 240, 80));
  terrain.push(...generateHill(490, 520, 240, 90));

  // Ramp 1 into Ring of Fire
  terrain.push(...generateRamp(730, 520, 280, 140));
  terrain.push({ x: 1150, y: 440 });
  terrain.push({ x: 1350, y: 500 });

  // Loop 1
  terrain.push({ x: 1550, y: 500 });
  terrain.push({ x: 1850, y: 500 }); // Checkpoint 1

  // Ramp 2 into second Ring of Fire
  terrain.push(...generateRamp(1850, 500, 320, 160));
  terrain.push({ x: 2300, y: 420 });

  // Magma pit chasm: moving platform ferries bike over the fire pit!
  terrain.push({ x: 2320, y: 690 });
  terrain.push({ x: 2730, y: 690 });
  terrain.push({ x: 2750, y: 450 });
  terrain.push({ x: 3000, y: 520 }); // Checkpoint 2

  // Loop 2
  terrain.push({ x: 3200, y: 520 });
  terrain.push({ x: 3500, y: 520 });

  // Ultra Climax Ramp
  terrain.push(...generateRamp(3500, 520, 380, 220));
  terrain.push({ x: 4100, y: 420 });
  terrain.push({ x: 4500, y: 520 });
  terrain.push({ x: 4900, y: 520 });

  const loops: LoopDeLoop[] = [
    { id: 'loop_l5_1', centerX: 1700, centerY: 380, radius: 120 },
    { id: 'loop_l5_2', centerX: 3350, centerY: 400, radius: 120 },
  ];

  const movingPlatforms: MovingPlatform[] = [
    {
      id: 'mp_l5_1',
      startX: 2360,
      startY: 420,
      endX: 2680,
      endY: 420,
      width: 130,
      height: 24,
      currentX: 2420,
      currentY: 420,
      speed: 2.2,
      progress: 0,
      direction: 1,
    },
  ];

  const fireRings: FireRing[] = [
    { id: 'fr_1', x: 1050, y: 350, radius: 60, cleared: false },
    { id: 'fr_2', x: 2200, y: 320, radius: 65, cleared: false },
    { id: 'fr_3', x: 3950, y: 280, radius: 75, cleared: false },
  ];

  const coins: Coin[] = [
    ...generateCoinArc(250, 500, 730, 100, 6, 'l5_warmup'),
    { id: 'l5_ring1', x: 1050, y: 350, collected: false },
    { id: 'l5_ring2', x: 2200, y: 320, collected: false },
    { id: 'l5_ring3', x: 3950, y: 280, collected: false },
    { id: 'l5_loop1_top', x: 1700, y: 260, collected: false },
    { id: 'l5_loop2_top', x: 3350, y: 280, collected: false },
    ...generateCoinArc(3880, 270, 4200, 240, 8, 'l5_megajump'),
  ];

  const checkpoints: Checkpoint[] = [
    { id: 'cp_l5_1', x: 1850, y: 500, reached: false },
    { id: 'cp_l5_2', x: 3000, y: 520, reached: false },
  ];

  return {
    id: 5,
    name: "Inferno Arena",
    subtitle: "Extreme stunt arena with loops, fire rings and mega gaps",
    theme: "extreme_arena",
    skyColors: ["#450a0a", "#18181b"],
    groundColor: "#ef4444",
    groundSubColor: "#292524",
    trackLength: 4900,
    terrain,
    loops,
    movingPlatforms,
    fireRings,
    coins,
    checkpoints,
    finishX: 4700,
    parTime: 40,
    threeStarScore: 10000,
  };
}

export interface GameSession {
  id: number;
  name: string;
  subtitle: string;
  theme: string;
  startLevel: number;
  endLevel: number;
  dangerLevel: string;
  skyColors: string[];
  groundColor: string;
}

export const GAME_SESSIONS: GameSession[] = [
  {
    id: 1,
    name: "Session 1: Bermuda Royale",
    subtitle: "Beginner hills with smooth ramps & warmup tracks (Levels 1 - 100)",
    theme: "green_hills",
    startLevel: 1,
    endLevel: 100,
    dangerLevel: "Normal",
    skyColors: ["#0f2027", "#203a43"],
    groundColor: "#15803d",
  },
  {
    id: 2,
    name: "Session 2: Kalahari Dunes",
    subtitle: "Desert dunes, steep drops & high-speed jumps (Levels 101 - 200)",
    theme: "desert",
    startLevel: 101,
    endLevel: 200,
    dangerLevel: "Dangerous 🔥",
    skyColors: ["#451a03", "#78350f"],
    groundColor: "#f59e0b",
  },
  {
    id: 3,
    name: "Session 3: Cyber Alok Matrix",
    subtitle: "Neon cyber tracks, moving platforms & laser loops (Levels 201 - 300)",
    theme: "cyber",
    startLevel: 201,
    endLevel: 300,
    dangerLevel: "Extreme ⚡",
    skyColors: ["#3b0764", "#090d16"],
    groundColor: "#06b6d4",
  },
  {
    id: 4,
    name: "Session 4: Alpine Snow Peak",
    subtitle: "Frozen cliffs, slippery slopes & sheer drops (Levels 301 - 400)",
    theme: "alpine",
    startLevel: 301,
    endLevel: 400,
    dangerLevel: "Deadly ❄️",
    skyColors: ["#1e1b4b", "#312e81"],
    groundColor: "#e2e8f0",
  },
  {
    id: 5,
    name: "Session 5: Inferno Magma Pit",
    subtitle: "Ultimate magma arena, fire rings & death pits (Levels 401 - 500)",
    theme: "volcano",
    startLevel: 401,
    endLevel: 500,
    dangerLevel: "INSANE 🌋",
    skyColors: ["#450a0a", "#18181b"],
    groundColor: "#ef4444",
  },
];

export const TOTAL_LEVELS = 500;

function createProceduralLevel(id: number): LevelData {
  let sessionTheme = 'green_hills';
  let tName = 'Bermuda Royale';
  let sky: [string, string] = ['#0f172a', '#1e293b'];
  let ground = '#10b981';
  let sub = '#064e3b';

  if (id >= 101 && id <= 200) {
    sessionTheme = 'desert';
    tName = 'Kalahari Dunes';
    sky = ['#451a03', '#78350f'];
    ground = '#f59e0b';
    sub = '#b45309';
  } else if (id >= 201 && id <= 300) {
    sessionTheme = 'cyber';
    tName = 'Cyber Alok Matrix';
    sky = ['#3b0764', '#090d16'];
    ground = '#06b6d4';
    sub = '#0e7490';
  } else if (id >= 301 && id <= 400) {
    sessionTheme = 'alpine';
    tName = 'Alpine Snow Peak';
    sky = ['#1e1b4b', '#312e81'];
    ground = '#e2e8f0';
    sub = '#475569';
  } else if (id >= 401 && id <= 500) {
    sessionTheme = 'volcano';
    tName = 'Inferno Magma Pit';
    sky = ['#450a0a', '#18181b'];
    ground = '#ef4444';
    sub = '#7f1d1d';
  }

  const terrain: TerrainPoint[] = [
    { x: -200, y: 500 },
    { x: 200, y: 500 },
  ];

  let currentX = 200;
  let currentY = 500;
  const difficultyMultiplier = 1 + ((id - 1) % 100) * 0.015;
  const segmentCount = Math.min(12, 4 + Math.floor(((id - 1) % 100) / 12));
  const checkpoints: Checkpoint[] = [];
  const coins: Coin[] = [];

  for (let s = 0; s < segmentCount; s++) {
    const hillLen = Math.floor((280 + ((id * s * 37) % 200)) * Math.max(0.75, 1.25 - difficultyMultiplier * 0.08));
    const hillHt = Math.floor((60 + ((id * s * 19) % 100)) * difficultyMultiplier);
    terrain.push(...generateHill(currentX, currentY, hillLen, hillHt));
    currentX += hillLen;
    currentY = 500 - ((id * s * 13) % 40);

    if (s % 2 === 1) {
      const rampHt = Math.floor((90 + (id % 40)) * difficultyMultiplier);
      terrain.push(...generateRamp(currentX, currentY, 220, rampHt));
      coins.push(...generateCoinArc(currentX + 50, currentY - 50, currentX + 220, 140, 5, `l${id}_r${s}`));
      currentX += 280;
      currentY = 520;
      terrain.push({ x: currentX, y: currentY });

      if (s === Math.floor(segmentCount / 2)) {
        checkpoints.push({ id: `cp_${id}_1`, x: currentX, y: currentY, reached: false });
      }
    }
  }

  const finishX = currentX + 400;
  terrain.push({ x: finishX, y: 500 });

  return {
    id,
    name: `${tName} Stage #${id}`,
    subtitle: `Session stunt track #${id} with progressive danger & ramp jumps`,
    theme: sessionTheme as any,
    skyColors: sky,
    groundColor: ground,
    groundSubColor: sub,
    trackLength: finishX + 200,
    terrain,
    coins,
    checkpoints,
    finishX,
    parTime: 30 + (id % 25),
    threeStarScore: 5000 + id * 50,
  };
}

export const LEVELS: LevelData[] = [
  createLevel1(),
  createLevel2(),
  createLevel3(),
  createLevel4(),
  createLevel5(),
];

export function getLevelById(id: number): LevelData {
  if (id >= 1 && id <= 5) {
    const found = LEVELS.find(l => l.id === id);
    if (found) return JSON.parse(JSON.stringify(found));
  }
  if (id > 5 && id <= TOTAL_LEVELS) {
    return createProceduralLevel(id);
  }
  return JSON.parse(JSON.stringify(LEVELS[0]));
}

