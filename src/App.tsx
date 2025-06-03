// src/App.tsx
import React, { useRef, useEffect, useState } from 'react';

interface Obstacle {
  x: number;
  width: number;
  height: number;
  spawnTimestamp: number;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // state สำหรับเก็บคะแนนสูงสุดและสถานะเกม
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // alias เพื่อให้แน่ใจว่าไม่เป็น null ตลอด
    const context = ctx;

    // พารามิเตอร์ฉาก (ใช้ขนาดเวอร์ชวล 800x240 แต่จะปรากฏบนหน้าจอแบบ responsive โดย CSS)
    const baseWidth = 800;
    const baseHeight = 240;
    const baseGroundY = 180; // ในระบบพิกเซล 800x240

    let lastTime = 0;
    let obstacleTimer = 0;
    let nextObstacleDelay = randomDelay();
    let speed = 200;

    // เก็บคะแนนในรอบนั้น (ไม่ใช้ state ตรง ๆ)
    let currentScore = 0;

    // ref เก็บคะแนนสูงสุดในรอบนี้
    const highestThisRun = { current: highScore };

    // ข้อมูลไดโนเสาร์ (ใช้ค่า base จากระบบ 800x240)
    const dino = {
      x: 80,
      y: 0,
      width: 30,
      height: 40,
      velocityY: 0,
      gravity: 1000
    };

    let animationId: number;
    let obstacles: Obstacle[] = [];
    let clouds: Cloud[] = [];
    let gameStartTimestamp = 0;

    function randomDelay() {
      return 800 + Math.random() * 600;
    }

    function initClouds() {
      clouds = [];
      for (let i = 0; i < 3; i++) {
        clouds.push({
          x: 200 + i * 300,
          y: 30 + Math.random() * 20,
          size: 40 + Math.random() * 20
        });
      }
    }

    function resetGame() {
      lastTime = 0;
      obstacleTimer = 0;
      nextObstacleDelay = randomDelay();
      speed = 200;
      dino.y = 0;
      dino.velocityY = 0;
      currentScore = 0;
      setIsGameOver(false);
      obstacles = [];
      initClouds();
      gameStartTimestamp = 0;
      highestThisRun.current = highScore;
    }

    function handleJump() {
      if (dino.y >= 0) {
        dino.velocityY = -450;
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') {
        if (!isRunning) {
          setIsRunning(true);
          resetGame();
        } else if (!isGameOver) {
          handleJump();
        } else {
          setIsRunning(true);
          resetGame();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);

    function drawBackground() {
      // คำนวณสัดส่วน (scale) ระหว่าง canvas จริงกับ base (800x240)
      // แต่ since internal resolution เป็น 800x240 อยู่แล้ว จึงวาดตาม base coordinates
      context.fillStyle = '#87CEEB'; // ท้องฟ้า
      context.fillRect(0, 0, baseWidth, baseGroundY + 20);

      context.fillStyle = '#deb887'; // พื้นดิน
      context.fillRect(0, baseGroundY, baseWidth, baseHeight - baseGroundY);
      context.strokeStyle = '#c2a471';
      context.lineWidth = 2;
      for (let i = 0; i < baseWidth; i += 20) {
        context.beginPath();
        context.moveTo(i, baseGroundY);
        context.lineTo(i + 10, baseGroundY + 10);
        context.stroke();
      }
    }

    function drawCloud(cloud: Cloud, deltaTime: number) {
      context.fillStyle = 'rgba(255,255,255,0.8)';
      context.beginPath();
      context.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
      context.arc(
        cloud.x + cloud.size * 0.6,
        cloud.y + 5,
        cloud.size * 0.4,
        0,
        Math.PI * 2
      );
      context.arc(
        cloud.x + cloud.size * 1.2,
        cloud.y,
        cloud.size * 0.5,
        0,
        Math.PI * 2
      );
      context.fill();

      cloud.x -= (speed * 0.2 * deltaTime) / 1000;
      if (cloud.x + cloud.size * 1.5 < 0) {
        cloud.x = baseWidth + Math.random() * 100;
        cloud.y = 30 + Math.random() * 20;
        cloud.size = 40 + Math.random() * 20;
      }
    }

    function drawDino(deltaTime: number) {
      dino.velocityY += (dino.gravity * deltaTime) / 1000;
      dino.y = Math.min(dino.y + (dino.velocityY * deltaTime) / 1000, 0);
      if (dino.y > 0) {
        dino.y = 0;
        dino.velocityY = 0;
      }

      context.fillStyle = '#2e8b57';
      context.fillRect(
        dino.x,
        baseGroundY - dino.height + dino.y,
        dino.width,
        dino.height
      );

      context.beginPath();
      context.moveTo(
        dino.x + dino.width,
        baseGroundY - dino.height + dino.y + 10
      );
      context.lineTo(
        dino.x + dino.width + 10,
        baseGroundY - dino.height + dino.y + dino.height / 2
      );
      context.lineTo(
        dino.x + dino.width,
        baseGroundY - dino.height + dino.y + dino.height - 10
      );
      context.closePath();
      context.fill();

      context.fillStyle = '#000';
      context.beginPath();
      context.arc(
        dino.x + dino.width * 0.6,
        baseGroundY - dino.height + dino.y + 10,
        3,
        0,
        Math.PI * 2
      );
      context.fill();
    }

    function drawObstacle(obs: Obstacle, deltaTime: number) {
      obs.x -= (speed * deltaTime) / 1000;
      context.fillStyle = '#228B22';
      context.fillRect(obs.x, baseGroundY - obs.height, obs.width, obs.height);
      context.fillRect(
        obs.x - 5,
        baseGroundY - obs.height / 2 - 10,
        5,
        obs.height / 2
      );
      context.fillRect(
        obs.x + obs.width,
        baseGroundY - obs.height / 2 - 10,
        5,
        obs.height / 2
      );

      context.strokeStyle = '#006400';
      context.lineWidth = 1;
      for (let y = baseGroundY - obs.height + 5; y < baseGroundY; y += 10) {
        context.beginPath();
        context.moveTo(obs.x + 5, y);
        context.lineTo(obs.x + obs.width - 5, y);
        context.stroke();
      }
    }

    function drawGameOver() {
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(0, 0, baseWidth, baseHeight);

      context.fillStyle = '#fff';
      context.font = '30px Arial';
      context.textAlign = 'center';
      context.fillText('Game Over!', baseWidth / 2, baseHeight / 2 - 20);

      context.font = '18px Arial';
      context.fillText(
        'Press Space to Restart',
        baseWidth / 2,
        baseHeight / 2 + 20
      );

      context.font = '16px Arial';
      context.fillText(
        `High Score: ${highestThisRun.current}`,
        baseWidth / 2,
        baseHeight / 2 + 60
      );
    }

    function drawScore() {
      context.fillStyle = '#000';
      context.font = '20px Arial';
      context.textAlign = 'right';
      context.fillText(`Score: ${currentScore}`, baseWidth - 20, 30);
    }

    function gameLoop(timestamp: number) {
      if (!isRunning) return;

      // เฟรมแรก: ตั้ง lastTime และ gameStartTimestamp ให้เท่ากับ timestamp (deltaTime = 0)
      if (!gameStartTimestamp) {
        gameStartTimestamp = timestamp;
        lastTime = timestamp;
      }
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      context.clearRect(0, 0, baseWidth, baseHeight);

      drawBackground();
      clouds.forEach((cloud) => drawCloud(cloud, deltaTime));
      drawDino(deltaTime);

      obstacleTimer += deltaTime;
      if (obstacleTimer > nextObstacleDelay) {
        const h = 30 + Math.random() * 50;
        obstacles.push({
          x: baseWidth,
          width: 15,
          height: h,
          spawnTimestamp: timestamp
        });
        obstacleTimer = 0;
        nextObstacleDelay = randomDelay();
      }

      obstacles.forEach((obs, idx) => {
        drawObstacle(obs, deltaTime);

        const dinoRect = {
          x: dino.x,
          y: baseGroundY - dino.height + dino.y,
          width: dino.width,
          height: dino.height
        };
        const obsRect = {
          x: obs.x,
          y: baseGroundY - obs.height,
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

        if (obs.x + obs.width < 0) {
          obstacles.splice(idx, 1);
          currentScore += 1;
          if (currentScore > highestThisRun.current) {
            highestThisRun.current = currentScore;
          }
        }
      });

      const elapsed = timestamp - gameStartTimestamp;
      if (elapsed > 10000) speed = 250;
      if (elapsed > 20000) speed = 300;

      drawScore();

      if (!isGameOver) {
        animationId = requestAnimationFrame(gameLoop);
      } else {
        if (highestThisRun.current > highScore) {
          setHighScore(highestThisRun.current);
        }
        drawGameOver();
      }
    }

    function drawStartScreen() {
      drawBackground();
      clouds.forEach((cloud) => {
        drawCloud(cloud, 16);
      });
      context.fillStyle = '#2e8b57';
      context.fillRect(
        dino.x,
        baseGroundY - dino.height,
        dino.width,
        dino.height
      );
      context.fillStyle = '#000';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(
        'Press Space to Start',
        baseWidth / 2,
        baseHeight / 2
      );
    }

    resetGame();
    drawStartScreen();

    if (isRunning) {
      animationId = requestAnimationFrame(gameLoop);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationId);
    };
// ตัด currentScore และ highScore ออกจาก dependency array เพราะเราใช้ currentScore ภายใน effect
  }, [isRunning, isGameOver, highScore]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 p-2">
      <canvas
        ref={canvasRef}
        width={800}
        height={240}
        className="border border-gray-400 w-full max-w-md"
      />
    </div>
  );
};

export default App;
