import React, { useEffect, useRef } from 'react';
import { BikePhysicsEngine } from '../physics/BikePhysics';
import { GameControls, Particle, FloatingText, ReplayData, ReplayFrame } from '../types/game';
import { NITRO_ITEMS } from '../utils/nitroCatalog';

interface GameCanvasProps {
  engine: BikePhysicsEngine;
  controls: GameControls;
  paused: boolean;
  onScreenShake?: () => void;
  ghostReplay?: ReplayData | null;
  ghostEnabled?: boolean;
  selectedNitro?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  controls,
  paused,
  ghostReplay,
  ghostEnabled = true,
  selectedNitro = 'default_flame',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const cameraRef = useRef({ x: 100, y: 400, zoom: 1.0, shake: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Connect particle and stunt notifications to engine
    engine.setParticleCallback((type: string, x: number, y: number, count = 5) => {
      spawnParticles(type, x, y, count);
    });

    engine.setStuntCallback((stunt) => {
      floatingTextsRef.current.push({
        id: Math.random().toString(),
        text: stunt.text,
        x: engine.getState().x,
        y: engine.getState().y - 45,
        color: stunt.color,
        alpha: 1.0,
        scale: 1.2,
        vy: -1.6,
      });

      if (stunt.text.includes('LANDING') || stunt.text.includes('FLIP')) {
        cameraRef.current.shake = 4;
      }
    });
  }, [engine]);

  const spawnParticles = (type: string, x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      if (type === 'dirt') {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 4,
          vx: -(Math.random() * 4 + 2),
          vy: -(Math.random() * 3 + 1),
          size: Math.random() * 3 + 2,
          color: '#a16207',
          alpha: 0.8,
          life: 0,
          maxLife: 20 + Math.random() * 15,
          shape: 'circle',
        });
      } else if (type === 'spark') {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 6 + 2;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: Math.random() * 2.5 + 1.5,
          color: Math.random() > 0.5 ? '#f59e0b' : '#fef08a',
          alpha: 1.0,
          life: 0,
          maxLife: 18 + Math.random() * 12,
          shape: 'spark',
        });
      } else if (type === 'smoke') {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 2,
          vy: -(Math.random() * 2 + 0.5),
          size: Math.random() * 8 + 6,
          color: '#6b7280',
          alpha: 0.7,
          life: 0,
          maxLife: 35 + Math.random() * 20,
          shape: 'smoke',
        });
      } else if (type === 'coin') {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4 + 1;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 2,
          size: Math.random() * 3 + 2,
          color: '#fbbf24',
          alpha: 1.0,
          life: 0,
          maxLife: 24,
          shape: 'spark',
        });
      } else if (type === 'confetti') {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 60,
          y: y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 8,
          vy: -(Math.random() * 8 + 4),
          size: Math.random() * 5 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1.0,
          life: 0,
          maxLife: 60 + Math.random() * 30,
          shape: 'confetti',
        });
      }
    }
  };

  const spawnTireTrail = (x: number, y: number, color: string, speed: number) => {
    particlesRef.current.push({
      x: x + (Math.random() - 0.5) * 3,
      y: y + (Math.random() - 0.5) * 3,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.min(10, Math.max(5.5, speed * 0.55)),
      color,
      alpha: 0.85,
      life: 0,
      maxLife: 20 + Math.random() * 8,
      shape: 'trail',
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let isRunning = true;
    let lastTimestamp = performance.now();
    let fixedAccumulator = 0;
    const fixedDt = 1 / 60;

    const gameLoop = (timestamp: number) => {
      if (!isRunning) return;

      const now = timestamp || performance.now();
      const frameDt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      fixedAccumulator += frameDt;

      // Update physics at fixed step for consistency
      if (!paused) {
        while (fixedAccumulator >= fixedDt) {
          engine.update(controls, fixedDt);
          fixedAccumulator -= fixedDt;
        }
      }

      const state = engine.getState();
      const bike = engine.getBike();
      const level = engine.getLevel();

      const speed = Math.hypot(state.vx, state.vy);

      // Visual trail effect for the bike tires during high-speed jumps and stunts
      const isHighSpeedJump = state.inAir && speed > 5.2;
      const isStuntRotation = state.inAir && Math.abs(state.angularVelocity) > 0.032;
      const isComboStunt = state.inAir && (state.comboMultiplier > 1 || state.currentCombo > 1);
      const isSuperSpeed = speed > 13.0;

      if (!paused && !state.crashed && (isHighSpeedJump || isStuntRotation || isComboStunt || isSuperSpeed)) {
        const rearColor = isComboStunt ? '#facc15' : (bike.glowColor || '#38bdf8');
        const frontColor = isComboStunt ? '#f97316' : (bike.color || '#06b6d4');

        spawnTireTrail(state.rearWheel.x, state.rearWheel.y, rearColor, speed);
        spawnTireTrail(state.frontWheel.x, state.frontWheel.y, frontColor, speed);

        // Extra spark particles when pulling high multiplier combos
        if (isComboStunt && Math.random() < 0.3) {
          spawnParticles('spark', state.rearWheel.x, state.rearWheel.y, 2);
        }
      }

      // Camera Follow with forward lookahead & speed zoom
      const targetLookahead = Math.min(220, state.vx * 14);
      const targetCamX = state.x + targetLookahead;
      const targetCamY = state.y - 40;

      // Smooth camera interpolation
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.15;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;

      // Dynamic zoom - less aggressive for stability
      const targetZoom = Math.max(0.78, Math.min(1.05, 1.0 - (speed / 35) * 0.2));
      cameraRef.current.zoom += (targetZoom - cameraRef.current.zoom) * 0.08;

      // Screen Shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (cameraRef.current.shake > 0) {
        shakeOffsetX = (Math.random() - 0.5) * cameraRef.current.shake * 2;
        shakeOffsetY = (Math.random() - 0.5) * cameraRef.current.shake * 2;
        cameraRef.current.shake = Math.max(0, cameraRef.current.shake - 0.2);
      }

      // Clear & Draw Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, level.skyColors[0]);
      skyGrad.addColorStop(1, level.skyColors[1]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Parallax Background
      drawParallaxBackground(ctx, width, height, cameraRef.current.x, level.theme);

      // Save transform for world-space rendering
      ctx.save();
      const zoom = cameraRef.current.zoom;
      ctx.translate(width / 2 + shakeOffsetX, height / 2 + shakeOffsetY);
      ctx.scale(zoom, zoom);
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // World Elements:
      drawLevelDecorations(ctx, level);
      drawTerrain(ctx, level);
      drawMovingPlatforms(ctx, level);
      drawLoops(ctx, level);
      drawFireRings(ctx, level);
      drawCoins(ctx, level);
      drawCheckpoints(ctx, level);
      drawFinishLine(ctx, level);

      // Render Ghost Rider if enabled
      if (ghostEnabled && ghostReplay && ghostReplay.frames && ghostReplay.frames.length > 0) {
        const currentTick = engine.getCurrentFrameTick();
        const ghostFrame = ghostReplay.frames[Math.min(currentTick, ghostReplay.frames.length - 1)];
        if (ghostFrame) {
          drawGhostBike(ctx, ghostFrame);
        }
      }

      // Render Bike & Rider
      drawBike(ctx, state, bike, controls);

      // Particles & Floating Text in World Space
      drawParticles(ctx);
      drawFloatingTexts(ctx);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [engine, controls, paused]);

  // Parallax backdrop
  const drawParallaxBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camX: number,
    theme: string
  ) => {
    // Layer 1: Distant celestial body & mountain silhouettes
    ctx.save();
    if (theme === 'cyber_city') {
      // Cyber Neon Moon
      ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.beginPath();
      ctx.arc(width * 0.8, height * 0.25, 60, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Skyscrapers
      const cityOffset = (camX * 0.08) % 300;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      for (let i = -1; i < width / 80 + 3; i++) {
        const h = 180 + ((i * 47) % 140);
        const bx = i * 90 - cityOffset;
        ctx.fillRect(bx, height - h, 75, h);
        // Window dots
        ctx.fillStyle = 'rgba(244, 114, 182, 0.25)';
        for (let wy = height - h + 15; wy < height - 30; wy += 22) {
          ctx.fillRect(bx + 12, wy, 8, 10);
          ctx.fillRect(bx + 35, wy, 8, 10);
          ctx.fillRect(bx + 54, wy, 8, 10);
        }
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      }
    } else if (theme === 'desert_dunes') {
      // Golden Sun
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.beginPath();
      ctx.arc(width * 0.2, height * 0.25, 70, 0, Math.PI * 2);
      ctx.fill();

      // Distant dunes
      ctx.fillStyle = 'rgba(180, 83, 9, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width + 50; x += 60) {
        const y = height * 0.55 + Math.sin((x + camX * 0.06) * 0.008) * 45;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    } else {
      // Mountain peaks
      ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width + 80; x += 80) {
        const y = height * 0.52 + Math.sin((x + camX * 0.07) * 0.006) * 70;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  // Terrain polyline rendering
  const drawTerrain = (ctx: CanvasRenderingContext2D, level: any) => {
    const terrain = level.terrain;
    if (terrain.length < 2) return;

    ctx.save();

    // 1. Fill ground body with gradient
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    for (let i = 1; i < terrain.length; i++) {
      ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    // Deep ground floor
    const lastX = terrain[terrain.length - 1].x;
    ctx.lineTo(lastX + 500, 1500);
    ctx.lineTo(terrain[0].x - 500, 1500);
    ctx.closePath();

    const groundGrad = ctx.createLinearGradient(0, 400, 0, 1200);
    groundGrad.addColorStop(0, level.groundSubColor);
    groundGrad.addColorStop(1, '#05070c');
    ctx.fillStyle = groundGrad;
    ctx.fill();

    // 2. Thick surface crust / track ribbon
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    for (let i = 1; i < terrain.length; i++) {
      ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    ctx.lineWidth = 14;
    ctx.strokeStyle = level.groundColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Top racing stripe edge
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.restore();
  };

  const drawLevelDecorations = (ctx: CanvasRenderingContext2D, level: any) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.4)';
    ctx.lineWidth = 4;
    const terrain = level.terrain;
    for (let i = 0; i < terrain.length - 1; i += 3) {
      const p = terrain[i];
      if (p.y < 480) {
        // Draw trestle truss support down to base
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 7);
        ctx.lineTo(p.x, p.y + 120);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const drawMovingPlatforms = (ctx: CanvasRenderingContext2D, level: any) => {
    if (!level.movingPlatforms) return;
    ctx.save();
    for (const p of level.movingPlatforms) {
      const x = p.currentX - p.width / 2;
      const y = p.currentY;

      // Platform body
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y, p.width, p.height);

      // Neon glowing top edge
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x, y, p.width, 5);

      // Warning hazard diagonal stripes
      ctx.fillStyle = '#f59e0b';
      for (let sx = x + 10; sx < x + p.width - 10; sx += 20) {
        ctx.beginPath();
        ctx.moveTo(sx, y + 6);
        ctx.lineTo(sx + 8, y + 6);
        ctx.lineTo(sx + 2, y + p.height - 2);
        ctx.lineTo(sx - 6, y + p.height - 2);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  };

  const drawLoops = (ctx: CanvasRenderingContext2D, level: any) => {
    if (!level.loops) return;
    ctx.save();
    for (const loop of level.loops) {
      // Loop support scaffold
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(loop.centerX - loop.radius, loop.centerY + loop.radius);
      ctx.lineTo(loop.centerX - loop.radius * 0.5, loop.centerY + loop.radius + 60);
      ctx.moveTo(loop.centerX + loop.radius, loop.centerY + loop.radius);
      ctx.lineTo(loop.centerX + loop.radius * 0.5, loop.centerY + loop.radius + 60);
      ctx.stroke();

      // Loop ring track
      ctx.beginPath();
      ctx.arc(loop.centerX, loop.centerY, loop.radius, 0, Math.PI * 2);
      ctx.lineWidth = 14;
      ctx.strokeStyle = level.groundColor;
      ctx.stroke();

      // Inner rim guide
      ctx.beginPath();
      ctx.arc(loop.centerX, loop.centerY, loop.radius - 7, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#facc15';
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawFireRings = (ctx: CanvasRenderingContext2D, level: any) => {
    if (!level.fireRings) return;
    ctx.save();
    const time = Date.now() * 0.006;
    for (const ring of level.fireRings) {
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.strokeStyle = ring.cleared ? '#22c55e' : '#f97316';
      ctx.stroke();

      if (!ring.cleared) {
        // Flickering fire particles around ring
        for (let a = 0; a < Math.PI * 2; a += 0.4) {
          const flameR = ring.radius + Math.sin(time + a * 4) * 6;
          const fx = ring.x + Math.cos(a) * flameR;
          const fy = ring.y + Math.sin(a) * flameR;
          ctx.fillStyle = Math.random() > 0.4 ? '#ef4444' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(fx, fy, 4 + Math.sin(time + a) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  };

  const drawCoins = (ctx: CanvasRenderingContext2D, level: any) => {
    ctx.save();
    const spin = Math.sin(Date.now() * 0.005);
    for (const coin of level.coins) {
      if (coin.collected) continue;

      ctx.save();
      ctx.translate(coin.x, coin.y);
      ctx.scale(Math.abs(spin) * 0.8 + 0.2, 1.0);

      // Gold coin outer
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();

      // Star emblem inside coin
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 1);

      ctx.restore();
    }
    ctx.restore();
  };

  const drawCheckpoints = (ctx: CanvasRenderingContext2D, level: any) => {
    ctx.save();
    for (const cp of level.checkpoints) {
      // Flagpole
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y);
      ctx.lineTo(cp.x, cp.y - 75);
      ctx.stroke();

      // Flapping Flag
      ctx.fillStyle = cp.reached ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.moveTo(cp.x, cp.y - 75);
      ctx.lineTo(cp.x + 36, cp.y - 58);
      ctx.lineTo(cp.x, cp.y - 42);
      ctx.closePath();
      ctx.fill();

      // Glowing orb beacon on top
      ctx.beginPath();
      ctx.arc(cp.x, cp.y - 77, 6, 0, Math.PI * 2);
      ctx.fillStyle = cp.reached ? '#34d399' : '#f87171';
      ctx.fill();
    }
    ctx.restore();
  };

  const drawFinishLine = (ctx: CanvasRenderingContext2D, level: any) => {
    const fx = level.finishX;
    ctx.save();

    // Finish gantry posts
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(fx - 15, 300, 12, 220);
    ctx.fillRect(fx + 25, 300, 12, 220);

    // Overhead Banner
    ctx.fillStyle = '#111827';
    ctx.fillRect(fx - 25, 290, 75, 40);

    // Checkered Banner squares
    const sqSize = 10;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(fx - 23 + col * sqSize, 292 + row * (sqSize - 1), sqSize, sqSize - 1);
      }
    }

    // "FINISH" Text
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 14px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', fx + 12, 280);

    ctx.restore();
  };

  // Detailed Bike & Animated Rider rendering
  const drawBike = (
    ctx: CanvasRenderingContext2D,
    state: ReturnType<typeof engine.getState>,
    bike: ReturnType<typeof engine.getBike>,
    controls: GameControls
  ) => {
    ctx.save();
    ctx.translate(state.x, state.y);
    ctx.rotate(state.angle);

    // 1. Rear Wheel Assembly
    drawWheel(ctx, -28, 16, state.rearWheel.rotation, bike.glowColor);

    // 2. Front Wheel Assembly
    drawWheel(ctx, 28, 16, state.frontWheel.rotation, bike.glowColor);

    // 3. Suspension swingarm & front telescopic forks
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 4;
    // Rear swingarm to chassis pivot
    ctx.beginPath();
    ctx.moveTo(-28, 16);
    ctx.lineTo(-6, 2);
    ctx.stroke();

    // Front fork stanchions
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(28, 16);
    ctx.lineTo(16, -16);
    ctx.stroke();

    // 4. Engine Block & Exhaust
    ctx.fillStyle = '#374151';
    ctx.fillRect(-12, -4, 18, 14);
    // Cylinder cooling fins
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-11, -2, 16, 2);
    ctx.fillRect(-11, 2, 16, 2);
    ctx.fillRect(-11, 6, 16, 2);

    // Chrome Exhaust Pipe
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(-24, 6);
    ctx.lineTo(-34, -2);
    ctx.stroke();

    // Exhaust throttle flame & High-Speed Nitro effect
    const nitroItem = NITRO_ITEMS.find((item) => item.id === selectedNitro) || NITRO_ITEMS[0];
    const topSpeed = bike.baseStats.topSpeed;
    const isHighSpeedNitro = Math.abs(state.vx) >= topSpeed * 0.75 && !state.crashed;

    if (isHighSpeedNitro) {
      const time = Date.now() * 0.02;
      const flameLen = 18 + Math.sin(time * 5) * 6;

      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = nitroItem.color;

      // Outer Flame Plume
      ctx.fillStyle = nitroItem.color;
      ctx.beginPath();
      ctx.moveTo(-34, -2);
      ctx.lineTo(-34 - flameLen - Math.random() * 8, -5 + (Math.random() - 0.5) * 6);
      ctx.lineTo(-34, 2);
      ctx.closePath();
      ctx.fill();

      // Inner Core Flame Plume
      ctx.fillStyle = nitroItem.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(-34, -1);
      ctx.lineTo(-34 - flameLen * 0.7, -2 + (Math.random() - 0.5) * 3);
      ctx.lineTo(-34, 1);
      ctx.closePath();
      ctx.fill();

      // Spark embers
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        const sx = -34 - Math.random() * (flameLen + 10);
        const sy = (Math.random() - 0.5) * 10;
        ctx.fillRect(sx, sy, 2, 2);
      }

      ctx.restore();
    } else if (controls.gas && !state.crashed) {
      ctx.fillStyle = Math.random() > 0.5 ? '#f97316' : '#ef4444';
      ctx.beginPath();
      ctx.arc(-39 + (Math.random() - 0.5) * 4, -2, 4 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Bike Chassis / Fairings with Realistic 3D Shading
    const bikeGrad = ctx.createLinearGradient(-20, -18, 16, 0);
    bikeGrad.addColorStop(0, bike.color);
    bikeGrad.addColorStop(0.4, '#ffffff');
    bikeGrad.addColorStop(1, bike.accentColor);
    ctx.fillStyle = bikeGrad;
    ctx.beginPath();
    ctx.moveTo(-20, -6);
    ctx.lineTo(-2, -18); // Gas tank peak
    ctx.lineTo(16, -16); // Handlebar headstock
    ctx.lineTo(8, -4);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    // Accent Graphics Stripe
    ctx.fillStyle = bike.accentColor;
    ctx.beginPath();
    ctx.moveTo(-16, -8);
    ctx.lineTo(0, -16);
    ctx.lineTo(6, -12);
    ctx.lineTo(-10, -5);
    ctx.closePath();
    ctx.fill();

    // Seat
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(-22, -12, 15, 6, [3]);
    ctx.fill();

    // Handlebars
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, -18);
    ctx.lineTo(18, -24);
    ctx.stroke();
    // Grip
    ctx.fillStyle = '#111827';
    ctx.fillRect(16, -26, 5, 4);

    // 6. Animated Rider
    drawRider(ctx, state, bike);

    ctx.restore();
  };

  const drawGhostBike = (ctx: CanvasRenderingContext2D, frame: ReplayFrame) => {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.translate(frame.x, frame.y);
    ctx.rotate(frame.angle);

    // Ghost Wheels
    drawWheel(ctx, -28, 16, frame.rearWheelRotation, '#38bdf8');
    drawWheel(ctx, 28, 16, frame.frontWheelRotation, '#38bdf8');

    // Ghost Chassis
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-20, -6);
    ctx.lineTo(-2, -18);
    ctx.lineTo(16, -16);
    ctx.lineTo(8, -4);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    // Ghost Rider helmet/suit
    const lean = frame.riderLean;
    const hipX = -12 + lean * 4;
    const hipY = -12;
    const shoulderX = -4 + lean * 8;
    const shoulderY = -28;
    const headX = -2 + lean * 10;
    const headY = -40;

    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(headX, headY, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Ghost Name Tag
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('👻 GHOST RIDER', frame.x, frame.y - 65);
    ctx.restore();
  };

  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rotation: number,
    glowColor: string
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Outer knobby rubber tire
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#27272a';
    ctx.stroke();

    // Wheel Rim
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = glowColor;
    ctx.stroke();

    // Rotating Spokes
    ctx.save();
    ctx.rotate(rotation);
    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 1.2;
    for (let s = 0; s < 4; s++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(11, 0);
      ctx.stroke();
    }
    ctx.restore();

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#e4e4e7';
    ctx.fill();

    ctx.restore();
  };

  const drawRider = (
    ctx: CanvasRenderingContext2D,
    state: ReturnType<typeof engine.getState>,
    bike: ReturnType<typeof engine.getBike>
  ) => {
    // Rider dynamically shifts posture based on controls
    const lean = state.riderLean; // -1 to +1
    const hipX = -12 + lean * 4;
    const hipY = -12;
    const shoulderX = -4 + lean * 8;
    const shoulderY = -28;
    const headX = -2 + lean * 10;
    const headY = -40;

    // Legs: Hip -> Knee -> Footpeg
    ctx.strokeStyle = bike.riderSuitColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(-4, 0); // Knee
    ctx.lineTo(-8, 6); // Foot on peg
    ctx.stroke();

    // Boots
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.lineTo(-10, 8);
    ctx.stroke();

    // Torso / Jersey
    ctx.strokeStyle = bike.riderSuitColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.stroke();

    // Arms: Shoulder -> Elbow -> Handlebar grip
    ctx.strokeStyle = bike.riderSuitColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(6, -24); // Elbow
    ctx.lineTo(17, -24); // Hand on grip
    ctx.stroke();

    // Helmet & Visor
    ctx.fillStyle = bike.riderHelmetColor;
    ctx.beginPath();
    ctx.arc(headX, headY, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Tinted Visor
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 1, 4.5, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.fill();

    // Helmet visor peak
    ctx.fillStyle = bike.riderHelmetColor;
    ctx.beginPath();
    ctx.moveTo(headX + 2, headY - 6);
    ctx.lineTo(headX + 9, headY - 4);
    ctx.lineTo(headX + 5, headY - 2);
    ctx.closePath();
    ctx.fill();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    const list = particlesRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        list.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'trail') {
        // High-octane glowing tire trail with luminous edge aura
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        const currentSize = p.size * (1 - (p.life / p.maxLife) * 0.65);
        ctx.arc(p.x, p.y, Math.max(1.5, currentSize), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (p.shape === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (p.life / p.maxLife) * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'confetti') {
        ctx.fillRect(p.x, p.y, p.size, p.size * 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  const drawFloatingTexts = (ctx: CanvasRenderingContext2D) => {
    const list = floatingTextsRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const ft = list[i];
      ft.y += ft.vy;
      ft.alpha -= 0.022;

      if (ft.alpha <= 0) {
        list.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = '800 18px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';

      // Drop shadow text
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillText(ft.text, ft.x + 2, ft.y + 2);

      // Main color text
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);

      ctx.restore();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block w-full h-full cursor-grab active:cursor-grabbing"
    />
  );
};