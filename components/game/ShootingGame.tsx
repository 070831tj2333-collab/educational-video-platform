'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  Player,
  Bullet,
  Enemy,
  Boss,
  Particle,
  GameStats,
} from './types';
import {
  checkCollision,
  createBullet,
  createEnemy,
  createBoss,
  updateBossMovement,
  clamp,
  random,
  randomInt,
} from './utils';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const SHOOT_COOLDOWN = 150; // milliseconds

export default function ShootingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [player, setPlayer] = useState<Player>(() => ({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    health: 3,
    maxHealth: 3,
    speed: PLAYER_SPEED,
    shootCooldown: SHOOT_COOLDOWN,
    lastShot: 0,
  }));

  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    wave: 1,
    enemiesKilled: 0,
    bossesKilled: 0,
  });

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Create explosion particles
  const createExplosion = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        x,
        y,
        vx: random(-3, 3),
        vy: random(-3, 3),
        life: 30,
        maxLife: 30,
        size: random(2, 5),
        color,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  // Spawn enemies for current wave
  const spawnWave = useCallback((wave: number) => {
    const enemyCount = 5 + wave * 2;
    const newEnemies: Enemy[] = [];

    for (let i = 0; i < enemyCount; i++) {
      const x = randomInt(50, CANVAS_WIDTH - 50);
      const y = randomInt(-200, -50);
      newEnemies.push(createEnemy(x, y, wave));
    }

    setEnemies(newEnemies);
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    setPlayer({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 60,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      health: 3,
      maxHealth: 3,
      speed: PLAYER_SPEED,
      shootCooldown: SHOOT_COOLDOWN,
      lastShot: 0,
    });
    setBullets([]);
    setEnemies([]);
    setBoss(null);
    setParticles([]);
    setStats({
      score: 0,
      wave: 1,
      enemiesKilled: 0,
      bossesKilled: 0,
    });
    setGameState(GameState.PLAYING);
    spawnWave(1);
  }, [spawnWave]);

  // Game update loop
  const update = useCallback(
    (deltaTime: number) => {
      if (gameState !== GameState.PLAYING) return;

      const now = Date.now();
      const keys = keysRef.current;

      // Update player position
      setPlayer((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        if (keys.has('a') || keys.has('arrowleft')) {
          newX -= prev.speed;
        }
        if (keys.has('d') || keys.has('arrowright')) {
          newX += prev.speed;
        }
        if (keys.has('w') || keys.has('arrowup')) {
          newY -= prev.speed;
        }
        if (keys.has('s') || keys.has('arrowdown')) {
          newY += prev.speed;
        }

        newX = clamp(newX, 0, CANVAS_WIDTH - prev.width);
        newY = clamp(newY, 0, CANVAS_HEIGHT - prev.height);

        return { ...prev, x: newX, y: newY };
      });

      // Shooting
      setPlayer((prev) => {
        if ((keys.has(' ') || keys.has('arrowup')) && now - prev.lastShot > prev.shootCooldown) {
          const newBullet = createBullet(
            prev.x + prev.width / 2 - 2,
            prev.y
          );
          setBullets((prevBullets) => [...prevBullets, newBullet]);
          return { ...prev, lastShot: now };
        }
        return prev;
      });

      // Update bullets
      setBullets((prev) =>
        prev
          .map((bullet) => ({
            ...bullet,
            x: bullet.x + bullet.vx,
            y: bullet.y + bullet.vy,
            active: bullet.active && bullet.y > -20 && bullet.y < CANVAS_HEIGHT + 20,
          }))
          .filter((bullet) => bullet.active)
      );

      // Update enemies
      setEnemies((prev) =>
        prev
          .map((enemy) => ({
            ...enemy,
            x: enemy.x + enemy.vx,
            y: enemy.y + enemy.vy,
            active: enemy.active && enemy.y < CANVAS_HEIGHT + 50,
          }))
          .filter((enemy) => enemy.active)
      );

      // Update boss
      if (boss) {
        setBoss((prev) => {
          if (!prev) return null;
          const updated = { ...prev };
          updateBossMovement(updated, CANVAS_WIDTH, deltaTime);
          return updated;
        });
      }

      // Update particles
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 1,
          }))
          .filter((particle) => particle.life > 0)
      );

      // Collision detection: Bullets vs Enemies
      setBullets((prevBullets) => {
        const activeBullets: Bullet[] = [];
        
        prevBullets.forEach((bullet) => {
          if (!bullet.active) return;

          let bulletHit = false;

          // Check collision with enemies
          const hitEnemyIndex = enemies.findIndex(
            (enemy) => enemy.active && checkCollision(bullet, enemy)
          );

          if (hitEnemyIndex !== -1) {
            const hitEnemy = enemies[hitEnemyIndex];
            const newHealth = hitEnemy.health - 1;
            
            if (newHealth <= 0) {
              createExplosion(hitEnemy.x + hitEnemy.width / 2, hitEnemy.y + hitEnemy.height / 2, '#ff0000');
              setStats((prev) => ({
                ...prev,
                score: prev.score + hitEnemy.points,
                enemiesKilled: prev.enemiesKilled + 1,
              }));
              setEnemies((prevEnemies) =>
                prevEnemies.map((enemy, idx) =>
                  idx === hitEnemyIndex ? { ...enemy, active: false } : enemy
                )
              );
            } else {
              setEnemies((prevEnemies) =>
                prevEnemies.map((enemy, idx) =>
                  idx === hitEnemyIndex ? { ...enemy, health: newHealth } : enemy
                )
              );
            }
            bulletHit = true;
          }

          // Check collision with boss
          if (!bulletHit && boss && boss.active && checkCollision(bullet, boss)) {
            const newBossHealth = boss.health - 1;
            createExplosion(bullet.x, bullet.y, '#ff00ff');
            
            if (newBossHealth <= 0) {
              createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, '#ff00ff');
              setStats((prev) => ({
                ...prev,
                score: prev.score + boss.points,
                bossesKilled: prev.bossesKilled + 1,
              }));
              setBoss(null);
            } else {
              setBoss({ ...boss, health: newBossHealth });
            }
            bulletHit = true;
          }

          if (!bulletHit) {
            activeBullets.push(bullet);
          }
        });

        return activeBullets;
      });

      // Collision detection: Enemies vs Player
      setPlayer((prev) => {
        const hitEnemyIndex = enemies.findIndex(
          (enemy) => enemy.active && checkCollision(prev, enemy)
        );

        if (hitEnemyIndex !== -1) {
          const hitEnemy = enemies[hitEnemyIndex];
          createExplosion(hitEnemy.x + hitEnemy.width / 2, hitEnemy.y + hitEnemy.height / 2, '#ff0000');
          setEnemies((prevEnemies) =>
            prevEnemies.map((enemy, idx) =>
              idx === hitEnemyIndex ? { ...enemy, active: false } : enemy
            )
          );
          const newHealth = prev.health - 1;
          if (newHealth <= 0) {
            setGameState(GameState.GAME_OVER);
          }
          return { ...prev, health: newHealth };
        }

        // Check boss collision
        if (boss && boss.active && checkCollision(prev, boss)) {
          const newHealth = prev.health - 1;
          if (newHealth <= 0) {
            setGameState(GameState.GAME_OVER);
          }
          return { ...prev, health: newHealth };
        }

        return prev;
      });

      // Check wave completion
      const activeEnemies = enemies.filter((e) => e.active).length;
      const hasActiveBoss = boss && boss.active;

      if (activeEnemies === 0 && !hasActiveBoss) {
        const nextWave = stats.wave + 1;
        // Spawn boss every 5 waves (wave 5, 10, 15, etc.)
        if (nextWave % 5 === 0) {
          setStats((prev) => ({ ...prev, wave: nextWave }));
          setBoss(createBoss(CANVAS_WIDTH, nextWave));
        } else {
          // Next regular wave
          setStats((prev) => ({ ...prev, wave: nextWave }));
          spawnWave(nextWave);
        }
      }
    },
    [gameState, boss, enemies, stats.wave, createExplosion, spawnWave]
  );

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars background
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % CANVAS_WIDTH;
      const y = (i * 23 + Date.now() * 0.01) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    if (gameState === GameState.PLAYING) {
      // Draw player
      ctx.fillStyle = '#00aaff';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      ctx.fillStyle = '#0088ff';
      ctx.fillRect(player.x + 5, player.y + 5, player.width - 10, player.height - 10);

      // Draw bullets
      ctx.fillStyle = '#ffff00';
      bullets.forEach((bullet) => {
        if (bullet.active) {
          ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
      });

      // Draw enemies
      ctx.fillStyle = '#ff0000';
      enemies.forEach((enemy) => {
        if (enemy.active) {
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }
      });

      // Draw boss
      if (boss && boss.active) {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        ctx.fillStyle = '#cc00cc';
        ctx.fillRect(boss.x + 5, boss.y + 5, boss.width - 10, boss.height - 10);

        // Boss health bar
        const barWidth = boss.width;
        const barHeight = 5;
        const healthPercent = boss.health / boss.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(boss.x, boss.y - 10, barWidth, barHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(boss.x, boss.y - 10, barWidth * healthPercent, barHeight);
      }

      // Draw particles
      particles.forEach((particle) => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        ctx.globalAlpha = 1;
      });

      // Draw UI
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${stats.score}`, 10, 30);
      ctx.fillText(`Wave: ${stats.wave}`, 10, 60);
      ctx.fillText(`Health: ${player.health}`, 10, 90);

      // Health bar
      const barWidth = 200;
      const barHeight = 20;
      const healthPercent = player.health / player.maxHealth;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(CANVAS_WIDTH - barWidth - 10, 10, barWidth, barHeight);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(CANVAS_WIDTH - barWidth - 10, 10, barWidth * healthPercent, barHeight);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(CANVAS_WIDTH - barWidth - 10, 10, barWidth, barHeight);
    } else if (gameState === GameState.MENU) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TOP-DOWN SHOOTER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = '24px Arial';
      ctx.fillText('Press SPACE to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('WASD or Arrow Keys to Move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.fillText('SPACE to Shoot', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
      ctx.textAlign = 'left';
    } else if (gameState === GameState.GAME_OVER) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${stats.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText(`Waves Survived: ${stats.wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.fillText('Press SPACE to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
      ctx.textAlign = 'left';
    }
  }, [gameState, player, bullets, enemies, boss, particles, stats]);

  // Game loop
  useEffect(() => {
    if (gameState === GameState.MENU || gameState === GameState.GAME_OVER) {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === ' ') {
          if (gameState === GameState.MENU) {
            startGame();
          } else if (gameState === GameState.GAME_OVER) {
            startGame();
          }
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [gameState, startGame]);

  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      update(deltaTime);
      render();

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [update, render]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-700 rounded-lg shadow-2xl"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-4 text-white text-center">
        <p className="text-sm text-gray-400">
          Use WASD or Arrow Keys to move • SPACE to shoot
        </p>
      </div>
    </div>
  );
}

