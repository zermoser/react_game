import React, { useRef, useEffect, useState } from 'react';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let animationId: number;
    let frameCount = 0;
    let spawnRate = 90;
    const obstacles: { x: number; width: number; height: number }[] = [];
    const dino = { x: 50, y: 0, width: 20, height: 40, velocityY: 0, gravity: 1 };
    const groundY = 150;
    let speed = 4;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resetGame = () => {
      frameCount = 0;
      obstacles.length = 0;
      dino.y = 0;
      dino.velocityY = 0;
      setScore(0);
      speed = 4;
      setIsGameOver(false);
    };

    const handleJump = () => {
      if (dino.y === 0) {
        dino.velocityY = -20;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!isRunning) {
          setIsRunning(true);
          resetGame();
        } else if (!isGameOver) {
          handleJump();
        } else {
          resetGame();
          setIsRunning(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const gameLoop = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ground
      ctx.fillStyle = '#888';
      ctx.fillRect(0, groundY, canvas.width, 5);

      // Dino physics
      if (isRunning && !isGameOver) {
        dino.velocityY += dino.gravity;
        dino.y = Math.min(dino.y + dino.velocityY, 0);
        if (dino.y > 0) {
          dino.y = 0;
          dino.velocityY = 0;
        }
      }

      // Draw dino
      ctx.fillStyle = '#333';
      ctx.fillRect(dino.x, groundY - dino.height + dino.y, dino.width, dino.height);

      // Spawn obstacles
      if (isRunning && !isGameOver) {
        frameCount++;
        if (frameCount % spawnRate === 0) {
          const size = 20 + Math.random() * 20;
          -          obstacles.push({ x: canvas.width, width: 20, height: size });
          +          obstacles.push({ x: canvas.width, width: 20, height: size });
        }
      }

      // Move and draw obstacles
      obstacles.forEach((obs, index) => {
        if (isRunning && !isGameOver) {
          obs.x -= speed;
        }
        ctx.fillStyle = '#4A5568';
        ctx.fillRect(obs.x, groundY - obs.height, obs.width, obs.height);

        // Collision detection
        const dinoRect = {
          x: dino.x,
          y: groundY - dino.height + dino.y,
          width: dino.width,
          height: dino.height
        };
        const obsRect = {
          x: obs.x,
          y: groundY - obs.height,
          width: obs.width,
          height: obs.height
        };
        if (
          dinoRect.x < obsRect.x + obsRect.width &&
          dinoRect.x + dinoRect.width > obsRect.x &&
          dinoRect.y < obsRect.y + obsRect.height &&
          dinoRect.y + dinoRect.height > obsRect.y
        ) {
          setIsGameOver(true);
          setIsRunning(false);
        }

        // Remove off-screen
        if (obs.x + obs.width < 0) {
          -          obstacles.splice(index, 1);
          -          setScore((prev) => prev + 1);
          +          obstacles.splice(index, 1);
          +          setScore((prev: number) => prev + 1);
        }
      });

      // Increase difficulty
      if (frameCount % 600 === 0) {
        speed += 0.5;
        if (spawnRate > 30) spawnRate -= 5;
      }

      // Draw score
      ctx.fillStyle = '#000';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${score}`, canvas.width - 120, 30);

      if (!isGameOver) {
        animationId = requestAnimationFrame(gameLoop);
      } else {
        // Game Over text
        ctx.fillStyle = 'red';
        ctx.font = '30px Arial';
        ctx.fillText('Game Over!', canvas.width / 2 - 80, 80);
        ctx.font = '18px Arial';
        ctx.fillText('Press Space to Restart', canvas.width / 2 - 110, 110);
      }
    };

    // Initial screen
    if (!isRunning) {
      ctx.fillStyle = '#000';
      ctx.font = '24px Arial';
      ctx.fillText('Press Space to Start', canvas.width / 2 - 120, canvas.height / 2);
    }

    if (isRunning) {
      animationId = requestAnimationFrame(gameLoop);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, [isRunning, isGameOver, score]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="border border-gray-400 bg-white"
      />
    </div>
  );
};

export default App;
