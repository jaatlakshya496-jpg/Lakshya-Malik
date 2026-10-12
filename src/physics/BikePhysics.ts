import {
  BikeConfig,
  LevelData,
  GameControls,
  TerrainPoint,
  ActiveStunt,
  ReplayFrame,
} from '../types/game';
import { computeEffectiveStats } from '../utils/bikeCatalog';
import { soundManager } from '../audio/SoundManager';

export interface WheelState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  grounded: boolean;
  rotation: number;
  groundNormalX: number;
  groundNormalY: number;
  groundSlope: number;
}

export interface BikePhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  rearWheel: WheelState;
  frontWheel: WheelState;
  headX: number;
  headY: number;
  riderLean: number;
  inAir: boolean;
  airTime: number;
  flipAngleAccumulator: number;
  wheelieTimer: number;
  stoppieTimer: number;
  crashed: boolean;
  crashReason: string;
  finished: boolean;
  score: number;
  coinsEarned: number;
  currentCombo: number;
  comboMultiplier: number;
  comboCount: number;
  comboTimer: number;
  // Free Fire EP (Energy Points) & HP
  ep: number;
  maxEp: number;
  hp: number;
  maxHp: number;
  airdropsCollected: number;
}

export interface DebugPhysicsInfo {
  vx: number;
  vy: number;
  speed: number;
  inAir: boolean;
  rearGrounded: boolean;
  frontGrounded: boolean;
  angleDeg: number;
  angularVelocity: number;
  crashReason: string;
  checkpointX: number;
  progressPercent: number;
}

function normalizeAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export class BikePhysicsEngine {
  private state: BikePhysicsState;
  private level: LevelData;
  private bike: BikeConfig;
  private stats: ReturnType<typeof computeEffectiveStats>;
  private lastCheckpoint: { x: number; y: number; score: number; coins: number } = {
    x: 100,
    y: 440,
    score: 0,
    coins: 0,
  };
  private stuntCallback: ((stunt: ActiveStunt) => void) | null = null;
  private particleCallback: ((type: string, x: number, y: number, count?: number) => void) | null = null;
  private consecutiveAirTricks = 0;
  private replayFrames: ReplayFrame[] = [];
  private currentFrameTick = 0;
  private pendingStuntBanner: { text: string; color: string } | null = null;
  private bestStuntEverRecorded = 'Air Flip';

  // Landing Recovery Grace Window
  private recoveryGraceFrames = 0;

  // Constants
  private readonly GRAVITY = 0.38;
  private readonly WHEEL_BASE = 54; // Distance between front and rear axle
  private readonly WHEEL_RADIUS = 16;
  private readonly SUSPENSION_REST_LENGTH = 22;
  private readonly SUSPENSION_STIFFNESS = 0.38;
  private readonly SUSPENSION_DAMPING = 0.24;
  private readonly MAX_DT = 2.0;
  private readonly MIN_DT = 0.5;

  constructor(level: LevelData, bike: BikeConfig) {
    this.level = level;
    this.bike = bike;
    this.stats = computeEffectiveStats(bike);
    this.state = this.createInitialState(100, 440);
    this.lastCheckpoint = { x: 100, y: 440, score: 0, coins: 0 };
  }

  public setStuntCallback(cb: (stunt: ActiveStunt) => void) {
    this.stuntCallback = cb;
  }

  public setParticleCallback(cb: (type: string, x: number, y: number, count?: number) => void) {
    this.particleCallback = cb;
  }

  public emitParticle(type: string, x: number, y: number, count?: number) {
    if (this.particleCallback) {
      this.particleCallback(type, x, y, count);
    }
  }

  public setBike(bike: BikeConfig) {
    this.bike = bike;
    this.stats = computeEffectiveStats(bike);
  }

  private createInitialState(spawnX: number, spawnY: number): BikePhysicsState {
    const halfBase = this.WHEEL_BASE / 2;
    return {
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      rearWheel: {
        x: spawnX - halfBase,
        y: spawnY + this.SUSPENSION_REST_LENGTH,
        vx: 0,
        vy: 0,
        radius: this.WHEEL_RADIUS,
        grounded: false,
        rotation: 0,
        groundNormalX: 0,
        groundNormalY: -1,
        groundSlope: 0,
      },
      frontWheel: {
        x: spawnX + halfBase,
        y: spawnY + this.SUSPENSION_REST_LENGTH,
        vx: 0,
        vy: 0,
        radius: this.WHEEL_RADIUS,
        grounded: false,
        rotation: 0,
        groundNormalX: 0,
        groundNormalY: -1,
        groundSlope: 0,
      },
      headX: spawnX,
      headY: spawnY - 32,
      riderLean: 0,
      inAir: false,
      airTime: 0,
      flipAngleAccumulator: 0,
      wheelieTimer: 0,
      stoppieTimer: 0,
      crashed: false,
      crashReason: '',
      finished: false,
      score: 0,
      coinsEarned: 0,
      currentCombo: 1,
      comboMultiplier: 1,
      comboCount: 0,
      comboTimer: 0,
      ep: 200,
      maxEp: 200,
      hp: 200,
      maxHp: 200,
      airdropsCollected: 0,
    };
  }

  public resetToCheckpoint(): void {
    const savedScore = this.lastCheckpoint.score;
    const savedCoins = this.lastCheckpoint.coins;
    this.state = this.createInitialState(this.lastCheckpoint.x, this.lastCheckpoint.y - 25);
    this.state.score = savedScore;
    this.state.coinsEarned = savedCoins;
    this.recoveryGraceFrames = 0;
    this.consecutiveAirTricks = 0;
    soundManager.muteEngine();
  }

  public resetLevel(): void {
    this.lastCheckpoint = { x: 100, y: 440, score: 0, coins: 0 };
    this.state = this.createInitialState(100, 440);
    this.replayFrames = [];
    this.currentFrameTick = 0;
    this.pendingStuntBanner = null;
    this.recoveryGraceFrames = 0;
    this.consecutiveAirTricks = 0;

    // Reset coins, checkpoints & fire rings in level
    this.level.coins.forEach((c) => (c.collected = false));
    this.level.checkpoints.forEach((cp) => (cp.reached = false));
    if (this.level.fireRings) {
      this.level.fireRings.forEach((fr) => (fr.cleared = false));
    }
    soundManager.muteEngine();
  }

  public update(controls: GameControls, dt = 1): BikePhysicsState {
    if (this.state.crashed || this.state.finished) {
      soundManager.muteEngine();
      return this.state;
    }

    const clampedDt = Math.min(this.MAX_DT, Math.max(this.MIN_DT, dt));

    // Decrement recovery grace window if active
    if (this.recoveryGraceFrames > 0) {
      this.recoveryGraceFrames -= clampedDt;
    }

    // 1. Rider Dynamic Lean (controls weight shifting)
    let targetLean = 0;
    if (controls.leanBack) targetLean -= 1.0;
    if (controls.leanForward) targetLean += 1.0;
    this.state.riderLean += (targetLean - this.state.riderLean) * (0.22 * clampedDt);

    // 2. Air vs Ground Detection
    const wasInAir = this.state.inAir;
    const rearGrounded = this.state.rearWheel.grounded;
    const frontGrounded = this.state.frontWheel.grounded;
    const isAnyGrounded = rearGrounded || frontGrounded;
    this.state.inAir = !isAnyGrounded;

    // 3. In-Air Controls & Flipping Stunts
    if (this.state.inAir) {
      this.state.airTime += clampedDt;
      const flipTorque = this.stats.flipSpeed * 0.08 * clampedDt;

      if (controls.leanBack) {
        this.state.angularVelocity -= flipTorque;
      }
      if (controls.leanForward) {
        this.state.angularVelocity += flipTorque;
      }

      // Air angular drag
      this.state.angularVelocity *= Math.pow(0.985, clampedDt);

      // Clamp max angular velocity to prevent uncontrollable spin blur
      this.state.angularVelocity = Math.max(-0.13, Math.min(0.13, this.state.angularVelocity));

      // Air throttle assists forward jump momentum smoothly
      if (controls.gas && this.state.vx < this.stats.topSpeed) {
        this.state.vx += 0.08 * clampedDt;
      } else if (controls.brake && this.state.vx > 0) {
        this.state.vx -= 0.05 * clampedDt;
      }

      // Track cumulative flip rotation
      this.state.flipAngleAccumulator += this.state.angularVelocity;
      this.checkFlipStunts();

      // Big Air trigger
      if (Math.round(this.state.airTime) === 65) {
        this.emitAirStunt('BIG AIR!', 350, '#38bdf8');
      }
    } else {
      // Bike landed from jump
      if (wasInAir && this.state.airTime > 14) {
        this.handleLanding();
      }
      this.state.airTime = 0;
      this.state.flipAngleAccumulator = 0;

      // Ground balance / wheelie checks
      this.checkGroundStunts(controls);
    }

    // Decrement combo timer
    if (this.state.comboTimer > 0) {
      this.state.comboTimer -= clampedDt;
      if (this.state.comboTimer <= 0 && !this.state.inAir) {
        this.state.comboMultiplier = 1;
        this.state.currentCombo = 1;
        this.state.comboCount = 0;
      }
    }

    // 4. Chassis Gravity & Physics Integration
    this.state.vy += this.GRAVITY * this.stats.weight * clampedDt;

    // Air friction
    this.state.vx *= Math.pow(0.996, clampedDt);

    // Clamp velocities to prevent physics tunneling or teleportation
    const maxHorizSpeed = this.stats.topSpeed * 1.25;
    this.state.vx = Math.max(-8.0, Math.min(maxHorizSpeed, this.state.vx));
    this.state.vy = Math.max(-24.0, Math.min(24.0, this.state.vy));

    // Update chassis position & rotation
    this.state.angle += this.state.angularVelocity * clampedDt;
    this.state.x += this.state.vx * clampedDt;
    this.state.y += this.state.vy * clampedDt;

    // 5. Update Wheel Anchors & Ground Contact
    this.updateWheel(this.state.rearWheel, -1, controls, clampedDt);
    this.updateWheel(this.state.frontWheel, 1, controls, clampedDt);

    // 6. Suspension Spring & Ground Balance
    this.applySuspensionAndBalance(controls, clampedDt);

    // 7. Rider Helmet & Crash Detection
    this.updateHeadAndCheckCrash();

    // 8. Interactive Objects: Coins, Checkpoints, Fire Rings, Moving Platforms, Finish
    this.updateInteractiveObjects(clampedDt);

    // 9. Engine Audio & Particles
    const speed = Math.hypot(this.state.vx, this.state.vy);
    const speedNorm = Math.min(1.0, speed / this.stats.topSpeed);
    soundManager.updateEngine(controls.gas, controls.brake, speedNorm, this.state.inAir);

    if (this.state.rearWheel.grounded && controls.gas && Math.random() < 0.4) {
      this.particleCallback?.('dirt', this.state.rearWheel.x - 8, this.state.rearWheel.y + 10, 2);
    }

    // 10. Record Replay Frame
    this.currentFrameTick++;
    if (this.replayFrames.length < 12000) {
      this.replayFrames.push({
        timestamp: this.currentFrameTick * 16.67,
        x: this.state.x,
        y: this.state.y,
        angle: this.state.angle,
        vx: this.state.vx,
        vy: this.state.vy,
        rearWheelX: this.state.rearWheel.x,
        rearWheelY: this.state.rearWheel.y,
        rearWheelRotation: this.state.rearWheel.rotation,
        frontWheelX: this.state.frontWheel.x,
        frontWheelY: this.state.frontWheel.y,
        frontWheelRotation: this.state.frontWheel.rotation,
        riderLean: this.state.riderLean,
        gas: !!controls.gas,
        brake: !!controls.brake,
        inAir: this.state.inAir,
        comboMultiplier: this.state.comboMultiplier || 1,
        score: this.state.score,
        stuntText: this.pendingStuntBanner?.text,
        stuntColor: this.pendingStuntBanner?.color,
      });
      this.pendingStuntBanner = null;
    }

    return this.state;
  }

  private updateWheel(wheel: WheelState, side: number, controls: GameControls, dt: number) {
    const cos = Math.cos(this.state.angle);
    const sin = Math.sin(this.state.angle);
    const halfBase = (this.WHEEL_BASE / 2) * side;

    // Wheel mount position relative to chassis
    // Chassis local down is (-sin, cos), local right is (cos, sin)
    const anchorX = this.state.x + halfBase * cos - (-4) * sin;
    const anchorY = this.state.y + halfBase * sin + (-4) * cos;

    // Ideal wheel rest position along local suspension fork
    const restX = anchorX - (-sin) * this.SUSPENSION_REST_LENGTH;
    const restY = anchorY + cos * this.SUSPENSION_REST_LENGTH;

    wheel.x = restX;
    wheel.y = restY;

    // Check terrain & platform collision
    const collision = this.getGroundCollision(wheel.x, wheel.y, wheel.radius);

    if (collision.collided) {
      wheel.grounded = true;
      wheel.groundNormalX = collision.nx;
      wheel.groundNormalY = collision.ny;
      wheel.groundSlope = collision.slope;

      // Keep wheel surface firmly resting on the ground
      wheel.y = collision.groundY - wheel.radius;

      // Surface tangent (forward along track slope in direction of track progress)
      const tx = collision.tx;
      const ty = collision.ty;

      // Rear Wheel Drive Traction (Speed / Aage Badhe)
      if (side === -1 && controls.gas) {
        const effectiveTopSpeed = this.stats.topSpeed;

        // Progressive acceleration: smooth torque that tapers gracefully as topSpeed is approached
        const currentSpeed = Math.hypot(this.state.vx, this.state.vy);
        const speedRatio = Math.min(1.0, currentSpeed / effectiveTopSpeed);
        const drivePower = this.stats.torque * (1.25 - speedRatio * 0.4) * dt;

        // If rolling backwards, quickly overcome reverse momentum and drive forward
        if (this.state.vx < 0) {
          this.state.vx += drivePower * 2.0;
        }

        // Always drive forward in positive X direction when gas is pressed
        const forwardPush = Math.max(0.4, Math.abs(tx) > 0 ? Math.abs(tx) : 1);
        this.state.vx += forwardPush * drivePower * 1.4;
        this.state.vy += ty * drivePower * 0.4;

        // Subtle wheelie torque ONLY when accelerating hard from low speed, never flipping backwards
        if (currentSpeed < effectiveTopSpeed * 0.8 && !this.state.frontWheel.grounded) {
          this.state.angularVelocity -= 0.003 * dt;
        }

        // Cap to top speed
        if (currentSpeed > effectiveTopSpeed) {
          const cap = effectiveTopSpeed;
          this.state.vx = (this.state.vx / currentSpeed) * cap;
          this.state.vy = (this.state.vy / currentSpeed) * cap;
        }
      }

      // Slowly regenerate EP when riding smoothly
      if (this.state.ep < this.state.maxEp) {
        this.state.ep = Math.min(this.state.maxEp, this.state.ep + 0.08 * dt);
      }

      // Brakes & Reverse Driving (Back / Piche Ho)
      if (controls.brake) {
        if (this.state.vx > 0.4) {
          // Smooth progressive braking without sudden lockup
          const brakeFactor = 1 - (this.stats.brakePower * 0.12 * dt);
          this.state.vx *= Math.max(0.7, brakeFactor);
        } else {
          // Stopped or rolling back: Reverse drive (Back / Piche ho)
          const reversePower = this.stats.torque * 0.52 * dt;
          this.state.vx -= tx * reversePower;
          this.state.vy -= ty * reversePower;
          if (this.state.vx < -6.5) {
            this.state.vx = -6.5;
          }
        }
      }

      // Gentle rolling friction
      this.state.vx *= Math.pow(0.995, dt);

      // Wheel rotation visual
      wheel.rotation += (this.state.vx / wheel.radius) * dt;
    } else {
      wheel.grounded = false;
      if (controls.gas && side === -1) {
        wheel.rotation += 0.4 * dt;
      } else if (controls.brake && side === -1) {
        wheel.rotation -= 0.25 * dt;
      }
    }
  }

  private applySuspensionAndBalance(controls: GameControls, dt: number) {
    const rearDown = this.state.rearWheel.grounded;
    const frontDown = this.state.frontWheel.grounded;

    if (rearDown && frontDown) {
      // Both wheels on ground: Natural track alignment & stability
      const groundSlope = Math.atan2(
        this.state.frontWheel.y - this.state.rearWheel.y,
        this.state.frontWheel.x - this.state.rearWheel.x
      );
      const angleDiff = normalizeAngle(groundSlope - this.state.angle);

      if (controls.leanBack) {
        // UPPER 🔼 (Controlled Wheelie): lifts front wheel smoothly
        // Soft limit prevents accidental backflip while riding on ground
        if (this.state.angle > groundSlope - 0.5) {
          this.state.angularVelocity -= 0.016 * dt;
        }
      } else if (controls.leanForward) {
        // NICHE 🔽 (Nose Down): stabilizes front wheel down firmly
        if (this.state.angle < groundSlope + 0.3) {
          this.state.angularVelocity += 0.014 * dt;
        }
      } else {
        // Self-righting spring torque firmly aligns chassis with ground slope
        this.state.angularVelocity += (angleDiff * 0.18 - this.state.angularVelocity * 0.35) * dt;
        this.state.angle += angleDiff * 0.16 * dt;
      }

      // Smooth suspension lift to keep chassis floating safely above axles
      const targetChassisY = (this.state.rearWheel.y + this.state.frontWheel.y) / 2 - this.SUSPENSION_REST_LENGTH;
      const compression = targetChassisY - this.state.y;
      this.state.y += compression * (this.SUSPENSION_STIFFNESS * dt);
      this.state.vy *= Math.pow(1 - this.stats.shockAbsorb * 0.32, dt);
      this.state.angularVelocity *= Math.pow(0.85, dt);
    } else if (rearDown) {
      // Rear wheel only on ground (Wheelie balance or landing on rear)
      const slope = this.state.rearWheel.groundSlope;
      const angleDiff = normalizeAngle(slope - this.state.angle);

      if (controls.leanBack) {
        // Controlled wheelie lift
        if (this.state.angle > slope - 0.65) {
          this.state.angularVelocity -= 0.012 * dt;
        }
      } else if (controls.leanForward) {
        // Recover from wheelie / push front down
        this.state.angularVelocity += 0.018 * dt;
      } else {
        // Gentle righting tendency to bring front wheel down stably
        this.state.angularVelocity += (angleDiff * 0.08 - this.state.angularVelocity * 0.2) * dt;
      }

      const targetChassisY = this.state.rearWheel.y - this.SUSPENSION_REST_LENGTH;
      if (this.state.y > targetChassisY) {
        this.state.y += (targetChassisY - this.state.y) * (this.SUSPENSION_STIFFNESS * dt);
        this.state.vy *= Math.pow(1 - this.stats.shockAbsorb * 0.25, dt);
      }
      this.state.angularVelocity *= Math.pow(0.92, dt);
    } else if (frontDown) {
      // Front wheel only on ground (Stoppie or nose-first landing)
      const slope = this.state.frontWheel.groundSlope;
      const angleDiff = normalizeAngle(slope - this.state.angle);

      if (controls.leanBack) {
        this.state.angularVelocity -= 0.018 * dt;
      } else if (controls.leanForward) {
        if (this.state.angle < slope + 0.45) {
          this.state.angularVelocity += 0.012 * dt;
        }
      } else {
        this.state.angularVelocity += (angleDiff * 0.08 - this.state.angularVelocity * 0.2) * dt;
      }

      const targetChassisY = this.state.frontWheel.y - this.SUSPENSION_REST_LENGTH;
      if (this.state.y > targetChassisY) {
        this.state.y += (targetChassisY - this.state.y) * (this.SUSPENSION_STIFFNESS * dt);
        this.state.vy *= Math.pow(1 - this.stats.shockAbsorb * 0.25, dt);
      }
      this.state.angularVelocity *= Math.pow(0.92, dt);
    }
  }

  private handleLanding() {
    const rearDown = this.state.rearWheel.grounded;
    const frontDown = this.state.frontWheel.grounded;
    const groundSlope = rearDown
      ? this.state.rearWheel.groundSlope
      : frontDown
      ? this.state.frontWheel.groundSlope
      : 0;

    // Angle relative to ground slope
    const relAngle = normalizeAngle(this.state.angle - groundSlope);

    // Check for severe inverted landing (landing completely upside-down on the rider's helmet)
    // |relAngle| > 2.05 rad is ~118 degrees inverted
    if (Math.abs(relAngle) > 2.05 && !this.isInsideLoop()) {
      this.triggerCrash('Upside down landing');
      return;
    }

    // Play landing impact sound scaled by downward velocity
    const impactIntensity = Math.min(1.0, Math.abs(this.state.vy) / 12);
    soundManager.playLanding(impactIntensity);

    // Dampen impact velocity to stabilize the bike
    this.state.vy *= 0.22;
    this.state.angularVelocity *= 0.35;

    // If landing angle was steep (between 1.4 and 2.0 rad), provide a recovery grace period
    if (Math.abs(relAngle) >= 1.4) {
      this.recoveryGraceFrames = 24; // 24 frames of recovery opportunity
      this.emitStunt('ROUGH LANDING! RECOVER!', 0, '#f59e0b');
      this.particleCallback?.('spark', this.state.rearWheel.x, this.state.rearWheel.y, 8);
      this.consecutiveAirTricks = 0;
      this.state.comboMultiplier = 1;
      this.state.currentCombo = 1;
      this.state.comboCount = 0;
      this.state.comboTimer = 0;
      return;
    }

    // Safe, Clean Landing!
    this.particleCallback?.('spark', this.state.rearWheel.x, this.state.rearWheel.y, 6);

    // Stunt combo rewards
    if (this.state.airTime > 25) {
      if (this.consecutiveAirTricks > 1) {
        const comboBank = this.consecutiveAirTricks * 400;
        this.emitStunt(`COMBO x${this.consecutiveAirTricks} LANDED!`, comboBank, '#10b981');
        soundManager.playLevelComplete();
        this.particleCallback?.('confetti', this.state.x, this.state.y - 25, 20);
        this.state.comboTimer = 110;
      }

      if (Math.abs(relAngle) < 0.28) {
        this.emitStunt('PERFECT LANDING!', 300, '#22c55e');
      } else {
        this.emitStunt('SAFE LANDING', 100, '#38bdf8');
      }
    }
    this.consecutiveAirTricks = 0;
  }

  private updateHeadAndCheckCrash() {
    // 1. Abyss / Fell off track check: only triggers if deep below the entire playable world
    if (this.state.y > 900) {
      this.triggerCrash('Niche gir gaye! (Fell off track)');
      return;
    }

    const groundBelow = this.getGroundCollision(this.state.x, this.state.y, 16);
    if (groundBelow.groundY < 9000 && this.state.y > groundBelow.groundY + 280) {
      this.triggerCrash('Niche gir gaye! (Fell off track)');
      return;
    }

    // 2. Rider helmet position
    const cos = Math.cos(this.state.angle);
    const sin = Math.sin(this.state.angle);

    const headOffsetX = -4 + this.state.riderLean * 5;
    const headOffsetY = -32;

    this.state.headX = this.state.x + headOffsetX * cos - headOffsetY * sin;
    this.state.headY = this.state.y + headOffsetX * sin + headOffsetY * cos;

    // Head crash check:
    // A head crash must ONLY occur when:
    // a) The bike is genuinely inverted / upside-down (cos(angle) < -0.15)
    // b) The player is not currently protected by recovery grace window
    // c) Neither wheel is safely planted on the ground
    // d) The player is not riding inside a loop-de-loop
    if (
      this.recoveryGraceFrames <= 0 &&
      cos < -0.15 &&
      !this.state.rearWheel.grounded &&
      !this.state.frontWheel.grounded &&
      !this.isInsideLoop()
    ) {
      const headCollision = this.getGroundCollision(this.state.headX, this.state.headY, 8);
      if (headCollision.collided) {
        this.triggerCrash('Sir ke bal gir gaye! (Head impact / Crash)');
      }
    }
  }

  private isInsideLoop(): boolean {
    if (!this.level.loops) return false;
    for (const loop of this.level.loops) {
      const dist = Math.hypot(this.state.x - loop.centerX, this.state.y - loop.centerY);
      if (dist < loop.radius + 40) {
        return true;
      }
    }
    return false;
  }

  private triggerCrash(reason: string) {
    if (this.state.crashed) return;
    this.state.crashed = true;
    this.state.crashReason = reason;
    this.consecutiveAirTricks = 0;
    this.state.comboMultiplier = 1;
    this.state.currentCombo = 1;
    this.state.comboCount = 0;
    this.state.comboTimer = 0;
    soundManager.playCrash();
    this.particleCallback?.('smoke', this.state.headX, this.state.headY, 14);
    this.particleCallback?.('spark', this.state.x, this.state.y, 18);
  }

  private getGroundCollision(x: number, y: number, radius: number): {
    collided: boolean;
    groundY: number;
    nx: number;
    ny: number;
    tx: number;
    ty: number;
    slope: number;
  } {
    // 1. Check Moving Platforms
    if (this.level.movingPlatforms) {
      for (const p of this.level.movingPlatforms) {
        const platLeft = p.currentX - p.width / 2;
        const platRight = p.currentX + p.width / 2;
        if (x >= platLeft && x <= platRight) {
          const platTop = p.currentY;
          if (y + radius >= platTop && y <= platTop + p.height + 15) {
            return {
              collided: true,
              groundY: platTop,
              nx: 0,
              ny: -1,
              tx: 1,
              ty: 0,
              slope: 0,
            };
          }
        }
      }
    }

    // 2. Check Loop-de-Loops
    if (this.level.loops) {
      for (const loop of this.level.loops) {
        const distFromCenter = Math.hypot(x - loop.centerX, y - loop.centerY);
        if (Math.abs(distFromCenter - loop.radius) < radius * 2.0) {
          const angle = Math.atan2(y - loop.centerY, x - loop.centerX);
          const nx = -Math.cos(angle);
          const ny = -Math.sin(angle);
          const tx = Math.sin(angle);
          const ty = -Math.cos(angle);
          return {
            collided: true,
            groundY: loop.centerY + Math.sin(angle) * (loop.radius - radius),
            nx,
            ny,
            tx,
            ty,
            slope: angle + Math.PI / 2,
          };
        }
      }
    }

    // 3. Terrain Polyline
    const terrain = this.level.terrain;
    let closestCollision: {
      collided: boolean;
      groundY: number;
      nx: number;
      ny: number;
      tx: number;
      ty: number;
      slope: number;
    } | null = null;

    for (let i = 0; i < terrain.length - 1; i++) {
      const p1 = terrain[i];
      const p2 = terrain[i + 1];

      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);

      // Avoid division by zero on vertical steps
      const dx = p2.x - p1.x;
      if (Math.abs(dx) < 0.001) continue;

      if (x >= minX && x <= maxX) {
        const t = (x - p1.x) / dx;
        const groundY = p1.y + t * (p2.y - p1.y);

        if (y + radius >= groundY) {
          const dy = p2.y - p1.y;
          const len = Math.hypot(dx, dy) || 1;
          // Surface tangent pointing forward along track in direction of travel (+X)
          const tx = dx / len;
          const ty = dy / len;
          // Surface normal pointing up into the air (-Y in screen space)
          const nx = dy / len;
          const ny = -dx / len;
          const slope = Math.atan2(dy, dx);

          // If multiple segments overlap, choose the top-most ground
          if (!closestCollision || groundY < closestCollision.groundY) {
            closestCollision = {
              collided: true,
              groundY,
              nx,
              ny,
              tx,
              ty,
              slope,
            };
          }
        }
      }
    }

    if (closestCollision) {
      return closestCollision;
    }

    return { collided: false, groundY: 9999, nx: 0, ny: -1, tx: 1, ty: 0, slope: 0 };
  }

  private checkFlipStunts() {
    const TWO_PI = Math.PI * 2;

    if (this.state.flipAngleAccumulator <= -TWO_PI) {
      this.state.flipAngleAccumulator += TWO_PI;
      this.emitAirStunt('BACKFLIP!', 500, '#fbbf24');
      this.particleCallback?.('spark', this.state.x, this.state.y, 10);
    } else if (this.state.flipAngleAccumulator >= TWO_PI) {
      this.state.flipAngleAccumulator -= TWO_PI;
      this.emitAirStunt('FRONT FLIP!', 600, '#f43f5e');
      this.particleCallback?.('spark', this.state.x, this.state.y, 10);
    }
  }

  private emitAirStunt(stuntName: string, basePoints: number, color: string) {
    this.consecutiveAirTricks++;
    this.state.comboCount = this.consecutiveAirTricks;
    this.state.comboMultiplier = this.consecutiveAirTricks;
    this.state.currentCombo = this.consecutiveAirTricks;
    this.state.comboTimer = 160;

    const finalPoints = basePoints * this.state.comboMultiplier;
    const comboTag =
      this.state.comboMultiplier > 1
        ? `${stuntName} (COMBO x${this.state.comboMultiplier}!)`
        : stuntName;

    this.emitStunt(comboTag, finalPoints, this.state.comboMultiplier > 1 ? '#f59e0b' : color);
    soundManager.playStunt();
  }

  private checkGroundStunts(controls: GameControls) {
    const rearDown = this.state.rearWheel.grounded;
    const frontDown = this.state.frontWheel.grounded;
    const speed = Math.abs(this.state.vx);

    // Wheelie: riding on rear wheel alone moving forward
    if (rearDown && !frontDown && speed > 2.8 && this.state.angle < -0.18) {
      this.state.wheelieTimer += 1;
      if (this.state.wheelieTimer % 28 === 0) {
        this.emitStunt('WHEELIE BONUS!', 150, '#10b981');
      }
    } else {
      this.state.wheelieTimer = 0;
    }

    // Stoppie: riding on front wheel alone
    if (!rearDown && frontDown && speed > 2.2 && controls.brake && this.state.angle > 0.2) {
      this.state.stoppieTimer += 1;
      if (this.state.stoppieTimer % 28 === 0) {
        this.emitStunt('STOPPIE!', 200, '#8b5cf6');
      }
    } else {
      this.state.stoppieTimer = 0;
    }
  }

  private updateInteractiveObjects(dt: number) {
    // Moving platforms
    if (this.level.movingPlatforms) {
      for (const p of this.level.movingPlatforms) {
        p.progress += p.speed * 0.005 * p.direction * dt;
        if (p.progress >= 1.0) {
          p.progress = 1.0;
          p.direction = -1;
        } else if (p.progress <= 0) {
          p.progress = 0;
          p.direction = 1;
        }
        p.currentX = p.startX + (p.endX - p.startX) * p.progress;
        p.currentY = p.startY + (p.endY - p.startY) * p.progress;
      }
    }

    // Coins collection
    for (const coin of this.level.coins) {
      if (!coin.collected) {
        const dist = Math.hypot(this.state.x - coin.x, this.state.y - coin.y);
        if (dist < 38) {
          coin.collected = true;
          this.state.coinsEarned += 10;
          this.state.score += 100;
          soundManager.playCoin();
          this.emitStunt('+10 COINS', 100, '#fbbf24');
          this.particleCallback?.('coin', coin.x, coin.y, 6);
        }
      }
    }

    // Fire rings
    if (this.level.fireRings) {
      for (const ring of this.level.fireRings) {
        if (!ring.cleared) {
          const dist = Math.hypot(this.state.x - ring.x, this.state.y - ring.y);
          if (dist < ring.radius + 14) {
            ring.cleared = true;
            this.state.score += 800;
            this.state.coinsEarned += 25;
            soundManager.playStunt();
            this.emitStunt('FIRE RING CLEARED!', 800, '#f97316');
            this.particleCallback?.('spark', ring.x, ring.y, 14);
          }
        }
      }
    }

    // Checkpoints
    for (const cp of this.level.checkpoints) {
      if (!cp.reached && this.state.x >= cp.x) {
        cp.reached = true;
        this.lastCheckpoint = {
          x: cp.x,
          y: cp.y,
          score: this.state.score,
          coins: this.state.coinsEarned,
        };
        soundManager.playCheckpoint();
        this.emitStunt('CHECKPOINT SAVED!', 250, '#10b981');
        this.particleCallback?.('spark', cp.x, cp.y, 10);
      }
    }

    // Finish Line
    if (!this.state.finished && this.state.x >= this.level.finishX) {
      this.state.finished = true;
      soundManager.playLevelComplete();
      this.emitStunt('FINISH LINE REACHED!', 1500, '#22c55e');
      this.particleCallback?.('confetti', this.level.finishX, this.state.y - 60, 40);
    }
  }

  private emitStunt(text: string, points: number, color: string) {
    this.state.score += points;
    this.pendingStuntBanner = { text, color };
    if (!text.includes('CHECKPOINT') && !text.includes('FINISH')) {
      this.bestStuntEverRecorded = text;
    }
    if (this.stuntCallback) {
      this.stuntCallback({
        text,
        points,
        color,
        timestamp: Date.now(),
      });
    }
  }

  // Getters & Public Methods
  public getState(): BikePhysicsState {
    return this.state;
  }

  public getBike(): BikeConfig {
    return this.bike;
  }

  public getLevel(): LevelData {
    return this.level;
  }

  public getBestStuntName(): string {
    return this.bestStuntEverRecorded || 'Air Flip';
  }

  public getReplayFrames(): ReplayFrame[] {
    return this.replayFrames;
  }

  public getCurrentFrameTick(): number {
    return this.currentFrameTick;
  }

  public getDebugInfo(): DebugPhysicsInfo {
    const rearDown = this.state.rearWheel.grounded;
    const frontDown = this.state.frontWheel.grounded;
    const progress = Math.min(100, Math.max(0, Math.round((this.state.x / this.level.finishX) * 100)));
    return {
      vx: Math.round(this.state.vx * 100) / 100,
      vy: Math.round(this.state.vy * 100) / 100,
      speed: Math.round(Math.hypot(this.state.vx, this.state.vy) * 10) / 10,
      inAir: this.state.inAir,
      rearGrounded: rearDown,
      frontGrounded: frontDown,
      angleDeg: Math.round((this.state.angle * 180) / Math.PI),
      angularVelocity: Math.round(this.state.angularVelocity * 1000) / 1000,
      crashReason: this.state.crashReason,
      checkpointX: this.lastCheckpoint.x,
      progressPercent: progress,
    };
  }
}
