export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Player extends Position {
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  shootCooldown: number;
  lastShot: number;
}

export interface Bullet extends Position, Velocity {
  width: number;
  height: number;
  active: boolean;
}

export interface Enemy extends Position, Velocity {
  width: number;
  height: number;
  health: number;
  active: boolean;
  points: number;
}

export interface Boss extends Position, Velocity {
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  active: boolean;
  points: number;
  movePattern: 'sideToSide' | 'circular';
  patternTime: number;
}

export interface Particle extends Position, Velocity {
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface GameStats {
  score: number;
  wave: number;
  enemiesKilled: number;
  bossesKilled: number;
}





