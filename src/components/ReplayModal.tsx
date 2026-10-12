import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  X,
  Sparkles,
  Flame,
  Award,
  Film,
  Maximize2,
} from 'lucide-react';
import { ReplayData, ReplayFrame, LevelData } from '../types/game';
import { soundManager } from '../audio/SoundManager';

interface ReplayModalProps {
  replayData: ReplayData;
  level: LevelData;
  onClose: () => void;
}

export const ReplayModal: React.FC<ReplayModalProps> = ({
  replayData,
  level,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0); // 0.5x, 1x, 2x
  const [showBestStuntOnly, setShowBestStuntOnly] = useState<boolean>(false);

  // Stunt segment detection (where combos or highest score delta / air occurred)
  const stuntSegment = useRef<{ start: number; end: number; name: string } | null>(null);

  useEffect(() => {
    if (!replayData || replayData.frames.length === 0) return;

    // Find the frame with the biggest stunt text or highest comboMultiplier
    let bestFrameIdx = -1;
    let maxCombo = 0;

    for (let i = 0; i < replayData.frames.length; i++) {
      const f = replayData.frames[i];
      if (f.stuntText && !f.stuntText.includes('CHECKPOINT') && !f.stuntText.includes('FINISH')) {
        bestFrameIdx = i;
      }
      if (f.comboMultiplier > maxCombo) {
        maxCombo = f.comboMultiplier;
        bestFrameIdx = i;
      }
    }

    if (bestFrameIdx !== -1) {
      // 90 frames (~1.5s) before and 120 frames (~2s) after
      const start = Math.max(0, bestFrameIdx - 90);
      const end = Math.min(replayData.frames.length - 1, bestFrameIdx + 120);
      stuntSegment.current = {
        start,
        end,
        name: replayData.bestStuntName || 'Aerial Stunt',
      };
    } else {
      // Fallback: middle third of the run
      const mid = Math.floor(replayData.frames.length / 2);
      stuntSegment.current = {
        start: Math.max(0, mid - 60),
        end: Math.min(replayData.frames.length - 1, mid + 60),
        name: 'Track Highlights',
      };
    }
  }, [replayData]);

  // Jump to best stunt segment
  const jumpToBestStunt = useCallback(() => {
    if (stuntSegment.current) {
      setCurrentFrameIndex(stuntSegment.current.start);
      setIsPlaying(true);
      setShowBestStuntOnly(true);
      soundManager.playClick();
    }
  }, []);

  // Main canvas animation playback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let lastTime = performance.now();

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (time: number) => {
      const dtMs = time - lastTime;
      lastTime = time;

      if (isPlaying && replayData.frames.length > 0) {
        const framesToAdvance = (dtMs / 16.67) * playbackSpeed;
        setCurrentFrameIndex((prev) => {
          let next = prev + framesToAdvance;
          if (showBestStuntOnly && stuntSegment.current) {
            if (next >= stuntSegment.current.end) {
              next = stuntSegment.current.start; // Loop best stunt
            }
          } else if (next >= replayData.frames.length) {
            next = 0; // Loop full run
          }
          return next;
        });
      }

      // Render Current Frame
      const idx = Math.min(
        Math.floor(currentFrameIndex),
        replayData.frames.length - 1
      );
      const frame = replayData.frames[Math.max(0, idx)];

      if (frame) {
        drawFrame(ctx, canvas, frame);
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, playbackSpeed, currentFrameIndex, showBestStuntOnly, replayData]);

  // Render terrain, bike, rider, and replay HUD onto canvas
  const drawFrame = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    frame: ReplayFrame
  ) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // 1. Clear & Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, level.skyColors[0]);
    skyGrad.addColorStop(1, level.skyColors[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Camera Setup (Centered on bike)
    ctx.save();
    const zoom = 0.95;
    ctx.translate(width / 2, height / 2 + 30);
    ctx.scale(zoom, zoom);
    ctx.translate(-frame.x, -frame.y);

    // Draw Terrain
    drawReplayTerrain(ctx, level);
    drawReplayDecorations(ctx, level);

    // Tire trail during stunts
    if (frame.inAir || Math.abs(frame.vx) > 10) {
      ctx.save();
      ctx.strokeStyle = frame.comboMultiplier > 1 ? '#facc15' : replayData.bikeConfig.glowColor;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(frame.rearWheelX - frame.vx * 3, frame.rearWheelY - frame.vy * 3);
      ctx.lineTo(frame.rearWheelX, frame.rearWheelY);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Bike at frame position & rotation
    drawReplayBike(ctx, frame, replayData.bikeConfig);

    ctx.restore();

    // 3. Stunt Banner Overlay (if active stunt at this timestamp)
    if (frame.stuntText) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.roundRect(width / 2 - 140, 75, 280, 44, [12]);
      ctx.fill();
      ctx.strokeStyle = frame.stuntColor || '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '900 18px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = frame.stuntColor || '#fbbf24';
      ctx.fillText(frame.stuntText.toUpperCase(), width / 2, 103);
      ctx.restore();
    }
  };

  const drawReplayTerrain = (ctx: CanvasRenderingContext2D, lvl: LevelData) => {
    const terrain = lvl.terrain;
    if (!terrain || terrain.length < 2) return;

    ctx.save();
    // Ground body
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    for (let i = 1; i < terrain.length; i++) {
      ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    ctx.lineTo(terrain[terrain.length - 1].x + 500, 1600);
    ctx.lineTo(terrain[0].x - 500, 1600);
    ctx.closePath();

    const groundGrad = ctx.createLinearGradient(0, 400, 0, 1200);
    groundGrad.addColorStop(0, lvl.groundSubColor);
    groundGrad.addColorStop(1, '#05070c');
    ctx.fillStyle = groundGrad;
    ctx.fill();

    // Track surface ribbon
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, terrain[0].y);
    for (let i = 1; i < terrain.length; i++) {
      ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    ctx.lineWidth = 14;
    ctx.strokeStyle = lvl.groundColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();
  };

  const drawReplayDecorations = (ctx: CanvasRenderingContext2D, lvl: LevelData) => {
    // Finish line
    const fx = lvl.finishX;
    ctx.save();
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(fx - 15, 300, 12, 220);
    ctx.fillRect(fx + 25, 300, 12, 220);
    ctx.fillStyle = '#111827';
    ctx.fillRect(fx - 25, 290, 75, 40);
    const sqSize = 10;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(fx - 23 + c * sqSize, 292 + r * (sqSize - 1), sqSize, sqSize - 1);
      }
    }
    ctx.restore();
  };

  const drawReplayBike = (
    ctx: CanvasRenderingContext2D,
    frame: ReplayFrame,
    bike: ReplayData['bikeConfig']
  ) => {
    ctx.save();
    ctx.translate(frame.x, frame.y);
    ctx.rotate(frame.angle);

    // Wheels
    drawReplayWheel(ctx, -28, 16, frame.rearWheelRotation, bike.glowColor);
    drawReplayWheel(ctx, 28, 16, frame.frontWheelRotation, bike.glowColor);

    // Swingarm & Fork
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-28, 16);
    ctx.lineTo(-6, 2);
    ctx.stroke();

    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(28, 16);
    ctx.lineTo(16, -16);
    ctx.stroke();

    // Engine Block
    ctx.fillStyle = '#374151';
    ctx.fillRect(-12, -4, 18, 14);

    // Exhaust
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(-24, 6);
    ctx.lineTo(-34, -2);
    ctx.stroke();

    // Gas puff
    if (frame.gas) {
      ctx.fillStyle = Math.random() > 0.5 ? '#f97316' : '#ef4444';
      ctx.beginPath();
      ctx.arc(-37, -2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chassis / Fairings
    ctx.fillStyle = bike.color;
    ctx.beginPath();
    ctx.moveTo(-20, -6);
    ctx.lineTo(-2, -18);
    ctx.lineTo(16, -16);
    ctx.lineTo(8, -4);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    // Accent Graphic
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

    // Handlebar
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, -18);
    ctx.lineTo(18, -24);
    ctx.stroke();

    // Rider
    const lean = frame.riderLean;
    const hipX = -12 + lean * 4;
    const hipY = -12;
    const shoulderX = -4 + lean * 8;
    const shoulderY = -28;
    const headX = -2 + lean * 10;
    const headY = -40;

    // Legs
    ctx.strokeStyle = bike.riderSuitColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 6);
    ctx.stroke();

    // Torso
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(shoulderX, shoulderY);
    ctx.stroke();

    // Arms
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(6, -24);
    ctx.lineTo(17, -24);
    ctx.stroke();

    // Helmet
    ctx.fillStyle = bike.riderHelmetColor;
    ctx.beginPath();
    ctx.arc(headX, headY, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 1, 4.5, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.fill();

    ctx.restore();
  };

  const drawReplayWheel = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rot: number,
    glow: string
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Tire
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#27272a';
    ctx.stroke();

    // Rim
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = glow;
    ctx.stroke();

    // Spokes
    ctx.save();
    ctx.rotate(rot);
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

    ctx.restore();
  };

  const totalFrames = Math.max(1, replayData.frames.length);
  const currentProgress = (currentFrameIndex / totalFrames) * 100;
  const currentFrameObj = replayData.frames[Math.min(Math.floor(currentFrameIndex), totalFrames - 1)] || replayData.frames[0];
  const currentSeconds = ((currentFrameIndex * 16.67) / 1000).toFixed(1);
  const totalSeconds = ((totalFrames * 16.67) / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden animate-fade-in">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black uppercase text-white font-racing tracking-wide">
                STUNT REPLAY CINEMA
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> REC
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {level.name} • {replayData.bikeConfig.name}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition active:scale-95 cursor-pointer"
          title="Back to Victory Screen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Canvas Replay Screen */}
      <div className="relative w-full max-w-4xl flex-1 my-3 bg-slate-950 rounded-3xl overflow-hidden border border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Telemetry HUD in Top Left */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
          <div className="px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-racing text-amber-400 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            <span>BEST TRICK: {replayData.bestStuntName || 'AIR FLIP'}</span>
          </div>

          {currentFrameObj?.comboMultiplier > 1 && (
            <div className="px-3 py-1 rounded-xl bg-yellow-500/20 backdrop-blur-md border border-yellow-400/60 text-xs font-racing text-yellow-300 font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-combo-bounce">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>COMBO! x{currentFrameObj.comboMultiplier}</span>
            </div>
          )}

          <div className="px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 font-mono">
            SCORE: {currentFrameObj?.score?.toLocaleString() || 0}
          </div>
        </div>

        {/* Mode Pill Indicator in Top Right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {showBestStuntOnly ? (
            <div className="px-3 py-1 rounded-xl bg-amber-500/30 border border-amber-400 text-amber-300 text-xs font-bold font-racing flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> BEST STUNT CLIP
            </div>
          ) : (
            <div className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-bold font-racing">
              FULL RUN
            </div>
          )}
        </div>

        {/* Center Play/Pause Overlay indicator when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            <div className="p-5 rounded-full bg-amber-500/90 text-slate-950 shadow-2xl scale-110">
              <Pause className="w-8 h-8" />
            </div>
          </div>
        )}
      </div>

      {/* Replay Controls & Timeline Bar */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col gap-3">
        {/* Scrubber Timeline */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-12 text-right">
            {currentSeconds}s
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max={totalFrames - 1}
              value={Math.floor(currentFrameIndex)}
              onChange={(e) => {
                setCurrentFrameIndex(Number(e.target.value));
                setShowBestStuntOnly(false);
              }}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
            />
          </div>
          <span className="text-xs font-mono text-slate-400 w-12">
            {totalSeconds}s
          </span>
        </div>

        {/* Bottom Playback Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Left Controls: Play, Restart, Best Stunt */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setIsPlaying(!isPlaying);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-racing uppercase flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" /> PAUSE
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> PLAY
                </>
              )}
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setCurrentFrameIndex(0);
                setShowBestStuntOnly(false);
                setIsPlaying(true);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition active:scale-95"
              title="Restart from beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Jump to Best Stunt */}
            <button
              onClick={jumpToBestStunt}
              className={`px-3 py-2 rounded-xl border text-xs font-bold font-racing uppercase flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                showBestStuntOnly
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-amber-400 border-amber-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>WATCH BEST STUNT</span>
            </button>
          </div>

          {/* Right Controls: Playback Speed Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold px-2 uppercase">SPEED:</span>
            {[0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  soundManager.playClick();
                  setPlaybackSpeed(spd);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  playbackSpeed === spd
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {spd === 0.5 ? 'SLO-MO (0.5x)' : `${spd}x`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
