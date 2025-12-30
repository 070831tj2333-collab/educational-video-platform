import { Position, Bullet, Enemy, Boss, Player } from './types';

export function checkCollision(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function distance(
  a: Position,
  b: Position
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createBullet(x: number, y: number): Bullet {
  return {
    x,
    y,
    vx: 0,
    vy: -8,
    width: 4,
    height: 12,
    active: true,
  };
}

export function createEnemy(x: number, y: number, wave: number): Enemy {
  const speed = 1 + wave * 0.2;
  return {
    x,
    y,
    vx: random(-0.5, 0.5),
    vy: speed,
    width: 30,
    height: 30,
    health: 1,
    active: true,
    points: 10,
  };
}

export function createBoss(canvasWidth: number, wave: number): Boss {
  const health = 10 + wave * 2;
  return {
    x: canvasWidth / 2,
    y: 80,
    vx: 2,
    vy: 0,
    width: 80,
    height: 60,
    health,
    maxHealth: health,
    active: true,
    points: 500,
    movePattern: wave % 2 === 0 ? 'sideToSide' : 'circular',
    patternTime: 0,
  };
}

export function updateBossMovement(
  boss: Boss,
  canvasWidth: number,
  deltaTime: number
): void {
  boss.patternTime += deltaTime;

  if (boss.movePattern === 'sideToSide') {
    const amplitude = canvasWidth / 2 - boss.width / 2 - 20;
    boss.x = canvasWidth / 2 + Math.sin(boss.patternTime * 0.02) * amplitude;
  } else {
    // Circular pattern
    const radius = 100;
    boss.x = canvasWidth / 2 + Math.cos(boss.patternTime * 0.015) * radius;
    boss.y = 80 + Math.sin(boss.patternTime * 0.015) * radius;
  }
}





