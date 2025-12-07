import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Play, RotateCcw, Gamepad2, Zap, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface GameScore {
  id: string;
  walletAddress: string;
  score: number;
  createdAt: string;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  isJumping: boolean;
  onGround: boolean;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'blue' | 'red';
  hit: boolean;
  tearCollected: boolean;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  alive: boolean;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const MOVE_SPEED = 5;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [tearsCollected, setTearsCollected] = useState(0);
  const { toast } = useToast();
  
  const gameRef = useRef({
    player: null as Player | null,
    blocks: [] as Block[],
    enemies: [] as Enemy[],
    platforms: [] as Platform[],
    keys: {} as Record<string, boolean>,
    animationId: 0,
    level: 1,
    cameraX: 0,
  });

  const { data: leaderboard = [] } = useQuery<GameScore[]>({
    queryKey: ['/api/game/leaderboard'],
  });

  const submitScoreMutation = useMutation({
    mutationFn: async (finalScore: number) => {
      return apiRequest('POST', '/api/game/score', { score: finalScore });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game/leaderboard'] });
    },
  });

  const initGame = useCallback(() => {
    const game = gameRef.current;
    
    game.player = {
      x: 100,
      y: CANVAS_HEIGHT - 150,
      width: 40,
      height: 50,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      onGround: false,
    };

    game.platforms = [
      { x: 0, y: CANVAS_HEIGHT - 40, width: 3000, height: 40 },
      { x: 300, y: CANVAS_HEIGHT - 120, width: 150, height: 20 },
      { x: 550, y: CANVAS_HEIGHT - 180, width: 150, height: 20 },
      { x: 800, y: CANVAS_HEIGHT - 140, width: 200, height: 20 },
      { x: 1100, y: CANVAS_HEIGHT - 200, width: 150, height: 20 },
      { x: 1400, y: CANVAS_HEIGHT - 160, width: 180, height: 20 },
      { x: 1700, y: CANVAS_HEIGHT - 220, width: 150, height: 20 },
      { x: 2000, y: CANVAS_HEIGHT - 180, width: 200, height: 20 },
      { x: 2300, y: CANVAS_HEIGHT - 240, width: 150, height: 20 },
    ];

    game.blocks = [
      { x: 350, y: CANVAS_HEIGHT - 220, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
      { x: 600, y: CANVAS_HEIGHT - 280, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
      { x: 700, y: CANVAS_HEIGHT - 280, width: 40, height: 40, type: 'red', hit: false, tearCollected: false },
      { x: 900, y: CANVAS_HEIGHT - 240, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
      { x: 1000, y: CANVAS_HEIGHT - 240, width: 40, height: 40, type: 'red', hit: false, tearCollected: false },
      { x: 1200, y: CANVAS_HEIGHT - 300, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
      { x: 1300, y: CANVAS_HEIGHT - 300, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
      { x: 1500, y: CANVAS_HEIGHT - 260, width: 40, height: 40, type: 'red', hit: false, tearCollected: false },
      { x: 1600, y: CANVAS_HEIGHT - 260, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
      { x: 1800, y: CANVAS_HEIGHT - 320, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
      { x: 1900, y: CANVAS_HEIGHT - 320, width: 40, height: 40, type: 'red', hit: false, tearCollected: false },
      { x: 2100, y: CANVAS_HEIGHT - 280, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
      { x: 2200, y: CANVAS_HEIGHT - 280, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
      { x: 2400, y: CANVAS_HEIGHT - 340, width: 40, height: 40, type: 'blue', hit: false, tearCollected: false },
    ];

    game.enemies = [
      { x: 500, y: CANVAS_HEIGHT - 80, width: 50, height: 40, velocityX: -1.5, alive: true },
      { x: 950, y: CANVAS_HEIGHT - 80, width: 50, height: 40, velocityX: -1.5, alive: true },
      { x: 1350, y: CANVAS_HEIGHT - 80, width: 50, height: 40, velocityX: -1.5, alive: true },
      { x: 1750, y: CANVAS_HEIGHT - 80, width: 50, height: 40, velocityX: -1.5, alive: true },
      { x: 2150, y: CANVAS_HEIGHT - 80, width: 50, height: 40, velocityX: -1.5, alive: true },
    ];

    game.cameraX = 0;
    game.keys = {};
    
    setScore(0);
    setTearsCollected(0);
  }, []);

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, cameraX: number) => {
    const x = player.x - cameraX;
    const y = player.y;
    
    // Silver lid with ridges
    ctx.fillStyle = '#D4D4D4';
    ctx.fillRect(x + 8, y, 24, 5);
    ctx.fillStyle = '#B8B8B8';
    ctx.fillRect(x + 5, y + 4, 30, 8);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 8 + i * 7, y + 5);
      ctx.lineTo(x + 8 + i * 7, y + 11);
      ctx.stroke();
    }
    
    // Glass jar outline
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 12, 30, 38, 4);
    ctx.stroke();
    
    // Orange liquid inside jar
    const liquidGradient = ctx.createLinearGradient(x, y + 14, x, y + 48);
    liquidGradient.addColorStop(0, '#FF9500');
    liquidGradient.addColorStop(0.4, '#FFB347');
    liquidGradient.addColorStop(0.8, '#FF8C00');
    liquidGradient.addColorStop(1, '#E67300');
    ctx.fillStyle = liquidGradient;
    ctx.beginPath();
    ctx.roundRect(x + 7, y + 14, 26, 34, 3);
    ctx.fill();
    
    // Liquid shine highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 9, y + 17, 4, 26);
    
    // Big cartoon eyes - white
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 28, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 27, y + 28, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye outlines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 28, 6, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + 27, y + 28, 6, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Pupils
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 15, y + 29, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 28, y + 29, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(x + 13, y + 26, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 26, y + 26, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Cute smile
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 20, y + 38, 5, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
    
    // Stick arms
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 30);
    ctx.lineTo(x - 4, y + 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 35, y + 30);
    ctx.lineTo(x + 44, y + 40);
    ctx.stroke();
    
    // Stick legs
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 50);
    ctx.lineTo(x + 7, y + 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 28, y + 50);
    ctx.lineTo(x + 33, y + 64);
    ctx.stroke();
  };

  const drawBlock = (ctx: CanvasRenderingContext2D, block: Block, cameraX: number) => {
    const x = block.x - cameraX;
    
    if (block.type === 'blue') {
      const gradient = ctx.createLinearGradient(x, block.y, x, block.y + block.height);
      gradient.addColorStop(0, '#00FFFF');
      gradient.addColorStop(1, '#0088AA');
      ctx.fillStyle = gradient;
    } else {
      const gradient = ctx.createLinearGradient(x, block.y, x, block.y + block.height);
      gradient.addColorStop(0, '#FF4444');
      gradient.addColorStop(1, '#AA0000');
      ctx.fillStyle = gradient;
    }
    
    ctx.beginPath();
    ctx.roundRect(x, block.y, block.width, block.height, 4);
    ctx.fill();
    
    ctx.strokeStyle = block.type === 'blue' ? '#00FFFF' : '#FF6666';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 5, block.y + 5, 10, 5);
    
    if (block.type === 'blue' && !block.hit) {
      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + block.width / 2, block.y + block.height / 2 + 6);
    } else if (block.type === 'red') {
      ctx.fillStyle = '#FFAAAA';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('X', x + block.width / 2, block.y + block.height / 2 + 5);
    }
    
    if (block.hit && block.type === 'blue' && !block.tearCollected) {
      ctx.fillStyle = '#00D9D9';
      ctx.beginPath();
      ctx.moveTo(x + block.width / 2, block.y - 15);
      ctx.bezierCurveTo(
        x + block.width / 2 - 8, block.y - 25,
        x + block.width / 2 - 8, block.y - 35,
        x + block.width / 2, block.y - 40
      );
      ctx.bezierCurveTo(
        x + block.width / 2 + 8, block.y - 35,
        x + block.width / 2 + 8, block.y - 25,
        x + block.width / 2, block.y - 15
      );
      ctx.fill();
    }
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy, cameraX: number) => {
    if (!enemy.alive) return;
    
    const x = enemy.x - cameraX;
    const y = enemy.y;
    const w = enemy.width;
    const h = enemy.height;
    
    // Shell (orange/brown like a Koopa)
    const shellGradient = ctx.createRadialGradient(x + w/2, y + h/2, 5, x + w/2, y + h/2, w/2);
    shellGradient.addColorStop(0, '#FF8C00');
    shellGradient.addColorStop(0.5, '#E67300');
    shellGradient.addColorStop(1, '#8B4513');
    ctx.fillStyle = shellGradient;
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2 + 5, w/2 - 2, h/2 - 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Shell outline
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2 + 5, w/2 - 2, h/2 - 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Shell hexagon pattern
    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 15, y + h/2);
    ctx.lineTo(x + w - 15, y + h/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + 8);
    ctx.lineTo(x + w/2, y + h - 3);
    ctx.stroke();
    
    // Lightning bolt on shell (Bitcoin Lightning Network)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(x + w/2 + 2, y + 10);
    ctx.lineTo(x + w/2 - 5, y + h/2 + 2);
    ctx.lineTo(x + w/2 - 1, y + h/2 + 2);
    ctx.lineTo(x + w/2 - 4, y + h - 5);
    ctx.lineTo(x + w/2 + 5, y + h/2 - 2);
    ctx.lineTo(x + w/2 + 1, y + h/2 - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#CC9900';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Head (green like Koopa)
    ctx.fillStyle = '#3D8B40';
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + 5, 12, 10, 0, Math.PI, 2 * Math.PI);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(x + w/2 - 6, y + 2, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w/2 + 6, y + 2, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils (angry looking)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + w/2 - 5, y + 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w/2 + 7, y + 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyebrows
    ctx.strokeStyle = '#2D6B30';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w/2 - 10, y - 2);
    ctx.lineTo(x + w/2 - 3, y + 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w/2 + 10, y - 2);
    ctx.lineTo(x + w/2 + 3, y + 1);
    ctx.stroke();
    
    // Feet
    ctx.fillStyle = '#E67300';
    ctx.beginPath();
    ctx.ellipse(x + 10, y + h - 2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w - 10, y + h - 2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPlatform = (ctx: CanvasRenderingContext2D, platform: Platform, cameraX: number) => {
    const x = platform.x - cameraX;
    
    const gradient = ctx.createLinearGradient(x, platform.y, x, platform.y + platform.height);
    gradient.addColorStop(0, '#1a3a3a');
    gradient.addColorStop(1, '#0d1f1f');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, platform.y, platform.width, platform.height);
    
    ctx.strokeStyle = '#00D9D9';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, platform.y, platform.width, platform.height);
    
    ctx.strokeStyle = 'rgba(0, 217, 217, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < platform.width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(x + i, platform.y);
      ctx.lineTo(x + i, platform.y + platform.height);
      ctx.stroke();
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, cameraX: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#0d1a1a');
    gradient.addColorStop(1, '#0a1515');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.strokeStyle = 'rgba(0, 217, 217, 0.1)';
    ctx.lineWidth = 1;
    for (let i = -cameraX % 50; i < CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }
    
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    for (let i = 0; i < 20; i++) {
      const starX = ((i * 137 + cameraX * 0.1) % CANVAS_WIDTH);
      const starY = (i * 23) % (CANVAS_HEIGHT - 100);
      ctx.beginPath();
      ctx.arc(starX, starY, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawHUD = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 70);
    ctx.strokeStyle = '#00D9D9';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 70);
    
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TEARS: ${tearsCollected}`, 25, 35);
    ctx.fillText(`SCORE: ${score}`, 25, 55);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`HIGH: ${highScore}`, 25, 75);
    
    ctx.fillStyle = '#00D9D9';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('← → MOVE  |  SPACE JUMP', CANVAS_WIDTH - 20, 25);
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const game = gameRef.current;
    const player = game.player;
    if (!player) return;

    if (game.keys['ArrowLeft'] || game.keys['KeyA']) {
      player.velocityX = -MOVE_SPEED;
    } else if (game.keys['ArrowRight'] || game.keys['KeyD']) {
      player.velocityX = MOVE_SPEED;
    } else {
      player.velocityX *= 0.8;
    }

    if ((game.keys['Space'] || game.keys['ArrowUp'] || game.keys['KeyW']) && player.onGround) {
      player.velocityY = JUMP_FORCE;
      player.isJumping = true;
      player.onGround = false;
    }

    player.velocityY += GRAVITY;
    player.x += player.velocityX;
    player.y += player.velocityY;

    if (player.x < 0) player.x = 0;

    player.onGround = false;
    for (const platform of game.platforms) {
      if (
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + player.height > platform.y &&
        player.y + player.height < platform.y + platform.height + player.velocityY + 5 &&
        player.velocityY >= 0
      ) {
        player.y = platform.y - player.height;
        player.velocityY = 0;
        player.onGround = true;
        player.isJumping = false;
      }
    }

    for (const block of game.blocks) {
      const horizontalOverlap = player.x + player.width > block.x && player.x < block.x + block.width;
      
      // Land on top of blocks (like platforms)
      if (
        horizontalOverlap &&
        player.y + player.height > block.y &&
        player.y + player.height < block.y + 15 &&
        player.velocityY >= 0
      ) {
        player.y = block.y - player.height;
        player.velocityY = 0;
        player.onGround = true;
        player.isJumping = false;
      }
      
      if (block.hit) continue;
      
      // Hit block from below (jumping up into it)
      const hitFromBelow = 
        horizontalOverlap &&
        player.y < block.y + block.height &&
        player.y + player.height > block.y + block.height - 10 &&
        player.velocityY < 0;
      
      if (hitFromBelow) {
        block.hit = true;
        player.velocityY = 2;
        
        if (block.type === 'red') {
          setGameState('gameover');
          if (score > highScore) {
            setHighScore(score);
            submitScoreMutation.mutate(score);
          }
          return;
        } else {
          setScore(prev => prev + 100);
          setTearsCollected(prev => prev + 1);
          setTimeout(() => { block.tearCollected = true; }, 500);
        }
      }
    }

    for (const enemy of game.enemies) {
      if (!enemy.alive) continue;
      
      enemy.x += enemy.velocityX;
      
      if (enemy.x < 200 || enemy.x > 2500) {
        enemy.velocityX *= -1;
      }
      
      const playerBottom = player.y + player.height;
      const playerRight = player.x + player.width;
      const enemyTop = enemy.y;
      const enemyBottom = enemy.y + enemy.height;
      const enemyRight = enemy.x + enemy.width;
      
      const horizontalOverlap = playerRight > enemy.x + 10 && player.x < enemyRight - 10;
      const verticalOverlap = playerBottom > enemyTop && player.y < enemyBottom;
      
      if (horizontalOverlap && verticalOverlap) {
        // Stomp detection: must be falling AND feet in top 60% of enemy
        const isFalling = player.velocityY > 0;
        const enemyMidpoint = enemyTop + enemy.height * 0.6;
        const feetInStompZone = playerBottom <= enemyMidpoint;
        
        if (isFalling && feetInStompZone) {
          enemy.alive = false;
          player.y = enemyTop - player.height; // Position above enemy
          player.velocityY = JUMP_FORCE * 0.6; // Bounce up
          setScore(prev => prev + 50);
        } else {
          setGameState('gameover');
          if (score > highScore) {
            setHighScore(score);
            submitScoreMutation.mutate(score);
          }
          return;
        }
      }
    }

    game.cameraX = Math.max(0, player.x - CANVAS_WIDTH / 3);

    drawBackground(ctx, game.cameraX);
    
    for (const platform of game.platforms) {
      drawPlatform(ctx, platform, game.cameraX);
    }
    
    for (const block of game.blocks) {
      drawBlock(ctx, block, game.cameraX);
    }
    
    for (const enemy of game.enemies) {
      drawEnemy(ctx, enemy, game.cameraX);
    }
    
    drawPlayer(ctx, player, game.cameraX);
    drawHUD(ctx);

    game.animationId = requestAnimationFrame(gameLoop);
  }, [score, highScore, tearsCollected, submitScoreMutation]);

  useEffect(() => {
    if (gameState === 'playing') {
      initGame();
      gameRef.current.animationId = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (gameRef.current.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
    };
  }, [gameState, initGame, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      gameRef.current.keys[e.code] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    setGameState('playing');
  };

  const restartGame = () => {
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Gamepad2 className="w-8 h-8 text-kaspa-cyan" />
            Tear Collector
          </h1>
          <p className="text-muted-foreground">
            Collect Bitcoin Maxi tears, avoid orphan blocks, stomp the slow maxis!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 justify-center">
          <div className="flex-shrink-0">
            <Card className="bg-card border-kaspa-cyan/30 overflow-hidden">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="block max-w-full"
                  style={{ imageRendering: 'pixelated' }}
                  data-testid="game-canvas"
                />
                
                {gameState === 'menu' && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-4xl font-bold text-kaspa-cyan mb-4">TEAR COLLECTOR</h2>
                      <p className="text-muted-foreground mb-2">A Cypherpunk Adventure</p>
                      <div className="text-sm text-muted-foreground mb-6 space-y-1">
                        <p>💧 Hit <span className="text-kaspa-cyan">BLUE</span> blocks to collect tears</p>
                        <p>🔴 Avoid <span className="text-red-500">RED</span> orphan blocks</p>
                        <p>🐢 Stomp slow Bitcoin Maxis</p>
                      </div>
                      <Button 
                        onClick={startGame}
                        className="bg-kaspa-cyan text-background hover:bg-kaspa-cyan/80 text-lg px-8 py-6"
                        data-testid="button-start-game"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        START GAME
                      </Button>
                      <p className="text-xs text-muted-foreground mt-4">
                        Use ← → or A/D to move, SPACE or ↑ to jump
                      </p>
                    </div>
                  </div>
                )}
                
                {gameState === 'gameover' && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-4xl font-bold text-red-500 mb-4">ORPHANED!</h2>
                      <div className="text-xl text-white mb-2">
                        Final Score: <span className="text-kaspa-cyan font-bold">{score}</span>
                      </div>
                      <div className="text-lg text-muted-foreground mb-2">
                        Tears Collected: <span className="text-kaspa-cyan">{tearsCollected}</span>
                      </div>
                      {score === highScore && score > 0 && (
                        <Badge className="bg-yellow-500 text-black mb-4">
                          <Trophy className="w-4 h-4 mr-1" />
                          NEW HIGH SCORE!
                        </Badge>
                      )}
                      <div className="mt-6">
                        <Button 
                          onClick={restartGame}
                          className="bg-kaspa-cyan text-background hover:bg-kaspa-cyan/80"
                          data-testid="button-restart-game"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          TRY AGAIN
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            
            {gameState === 'playing' && (
              <div className="flex justify-center gap-4 mt-4 md:hidden select-none" data-testid="mobile-controls">
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-16 h-16 border-kaspa-cyan/50 bg-background/80 touch-none"
                    onTouchStart={(e) => { e.preventDefault(); gameRef.current.keys['ArrowLeft'] = true; }}
                    onTouchEnd={(e) => { e.preventDefault(); gameRef.current.keys['ArrowLeft'] = false; }}
                    onTouchCancel={() => { gameRef.current.keys['ArrowLeft'] = false; }}
                    onMouseDown={() => { gameRef.current.keys['ArrowLeft'] = true; }}
                    onMouseUp={() => { gameRef.current.keys['ArrowLeft'] = false; }}
                    onMouseLeave={() => { gameRef.current.keys['ArrowLeft'] = false; }}
                    data-testid="button-mobile-left"
                  >
                    <ChevronLeft className="w-8 h-8 text-kaspa-cyan pointer-events-none" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-16 h-16 border-kaspa-cyan/50 bg-background/80 touch-none"
                    onTouchStart={(e) => { e.preventDefault(); gameRef.current.keys['ArrowRight'] = true; }}
                    onTouchEnd={(e) => { e.preventDefault(); gameRef.current.keys['ArrowRight'] = false; }}
                    onTouchCancel={() => { gameRef.current.keys['ArrowRight'] = false; }}
                    onMouseDown={() => { gameRef.current.keys['ArrowRight'] = true; }}
                    onMouseUp={() => { gameRef.current.keys['ArrowRight'] = false; }}
                    onMouseLeave={() => { gameRef.current.keys['ArrowRight'] = false; }}
                    data-testid="button-mobile-right"
                  >
                    <ChevronRight className="w-8 h-8 text-kaspa-cyan pointer-events-none" />
                  </Button>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-20 h-16 border-kaspa-cyan/50 bg-background/80 touch-none flex-col"
                  onTouchStart={(e) => { e.preventDefault(); gameRef.current.keys['Space'] = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); gameRef.current.keys['Space'] = false; }}
                  onTouchCancel={() => { gameRef.current.keys['Space'] = false; }}
                  onMouseDown={() => { gameRef.current.keys['Space'] = true; }}
                  onMouseUp={() => { gameRef.current.keys['Space'] = false; }}
                  onMouseLeave={() => { gameRef.current.keys['Space'] = false; }}
                  data-testid="button-mobile-jump"
                >
                  <ChevronUp className="w-8 h-8 text-kaspa-cyan pointer-events-none" />
                  <span className="text-xs text-kaspa-cyan pointer-events-none">JUMP</span>
                </Button>
              </div>
            )}
          </div>

          <div className="lg:w-72">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No scores yet. Be the first!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.slice(0, 10).map((entry, index) => (
                      <div 
                        key={entry.id}
                        className={`flex items-center justify-between p-2 rounded ${
                          index === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                          index === 1 ? 'bg-gray-400/20 border border-gray-400/50' :
                          index === 2 ? 'bg-orange-600/20 border border-orange-600/50' :
                          'bg-muted/30'
                        }`}
                        data-testid={`leaderboard-entry-${index}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-bold w-6 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            index === 2 ? 'text-orange-600' :
                            'text-muted-foreground'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className="text-sm text-white truncate max-w-[100px]">
                            {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                          </span>
                        </div>
                        <span className="font-bold text-kaspa-cyan">
                          {entry.score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-kaspa-cyan" />
                  How to Play
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>🫙 You are the BMT jar - collect those maxi tears!</p>
                <p>💧 Jump and hit <span className="text-kaspa-cyan">blue blocks</span> from below for +100 points</p>
                <p>🔴 Avoid <span className="text-red-500">red orphan blocks</span> - they end your game!</p>
                <p>🐢 Stomp Bitcoin Maxis (they're slow) for +50 points</p>
                <p>⌨️ Controls: Arrow keys or WASD</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
