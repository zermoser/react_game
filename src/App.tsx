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

    const context = ctx;

    // พารามิเตอร์ฉาก (internal resolution 800×240)
    const baseWidth = 800;
    const baseHeight = 240;
    const baseGroundY = 180;

    let lastTime = 0;
    let obstacleTimer = 0;
    let nextObstacleDelay = randomDelay();
    let speed = 200;
    let currentScore = 0;
    const highestThisRun = { current: highScore };

    const dino = {
      x: 80,
      y: 0,
      width: 30,
      height: 40,
      velocityY: 0,
      gravity: 1000,
    };

    // ตัวแปรสำหรับหมุนขา (ต้นขาเป็นจุดหมุน)
    let legPhase = 0;
    const legSpeed = 0.01;            // ค่าเล็กลงเพื่อให้ขาช้าลง
    const maxLegAngle = Math.PI / 6;   // ประมาณ 30 องศา (PI/6)

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
          y: 40 + Math.random() * 20,
          size: 50 + Math.random() * 30,
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
      legPhase = 0; // รีเซ็ต phase ตอนเริ่มใหม่
    }

    function handleJump() {
      if (dino.y >= 0) dino.velocityY = -450;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
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

    function handleMouseDown() {
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

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('mousedown', handleMouseDown);

    function drawBackground() {
      // sky
      context.fillStyle = '#87CEEB';
      context.fillRect(0, 0, baseWidth, baseGroundY + 20);

      // ground (ลบขีดๆ ด้านบนออก)
      context.fillStyle = '#deb887';
      context.fillRect(0, baseGroundY, baseWidth, baseHeight - baseGroundY);
    }

    // ปรับปรุงก้อนเมฆ
    function drawCloud(cloud: Cloud, deltaTime: number) {
      cloud.x -= (speed * 0.2 * deltaTime) / 1000;
      if (cloud.x + cloud.size * 2 < 0) {
        cloud.x = baseWidth + Math.random() * 100;
        cloud.y = 40 + Math.random() * 20;
        cloud.size = 50 + Math.random() * 30;
      }

      const cx = cloud.x;
      const cy = cloud.y;
      const s = cloud.size;

      // ฟุ้งด้วยหลายวงกลม
      context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      context.beginPath();
      context.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
      context.arc(cx + s * 0.4, cy + s * 0.1, s * 0.4, 0, Math.PI * 2);
      context.arc(cx - s * 0.3, cy + s * 0.1, s * 0.4, 0, Math.PI * 2);
      context.arc(cx + s * 0.7, cy + s * 0.2, s * 0.3, 0, Math.PI * 2);
      context.arc(cx - s * 0.6, cy + s * 0.2, s * 0.3, 0, Math.PI * 2);
      context.fill();

      // ไฮไลท์
      context.fillStyle = 'rgba(255, 255, 255, 0.5)';
      context.beginPath();
      context.arc(cx, cy - s * 0.1, s * 0.25, Math.PI, 0);
      context.closePath();
      context.fill();
    }

    // ปรับปรุงตัวละครหลัก พร้อมหมุนขาแบบ "โค้ง" (30°–45°)
    function drawDino(deltaTime: number) {
      // physics
      dino.velocityY += (dino.gravity * deltaTime) / 1000;
      dino.y = Math.min(dino.y + (dino.velocityY * deltaTime) / 1000, 0);
      if (dino.y > 0) {
        dino.y = 0;
        dino.velocityY = 0;
      }

      const x = dino.x;
      const y = baseGroundY - dino.height + dino.y;
      const w = dino.width;
      const h = dino.height;

      // อัปเดต phase ของขา
      legPhase += deltaTime * legSpeed;
      // angle จะสวิงระหว่าง -maxLegAngle และ +maxLegAngle
      const angle = Math.sin(legPhase) * maxLegAngle;

      // วาดลำตัวและหัวเหมือนเดิม
      // body (ellipse)
      context.fillStyle = '#228B22';
      context.beginPath();
      context.ellipse(x + w / 2, y + h / 2, w * 0.8, h * 0.6, 0, 0, Math.PI * 2);
      context.fill();

      // head
      context.beginPath();
      context.ellipse(x + w + 8, y + h * 0.4, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
      context.fill();

      // tail
      context.fillStyle = '#196619';
      context.beginPath();
      context.moveTo(x - 5, y + h * 0.6);
      context.quadraticCurveTo(x - 20, y + h * 0.4, x - 5, y + h * 0.2);
      context.fill();

      // วาดขาแบบหมุน (ต้นขาเป็นจุดหมุน)
      const legWidth = w * 0.2;
      const legHeight = h * 0.8;
      // ตำแหน่ง pivot y (บนขา)
      const pivotY = y + h * 0.8;

      context.fillStyle = '#196619';

      // ขาซ้าย: หมุนด้วย angle บวก
      const leftHipX = x + w * 0.2 + legWidth / 2;
      context.save();
      context.translate(leftHipX, pivotY);
      context.rotate(angle);
      // วาดขาลากลงมาจาก pivot
      context.fillRect(-legWidth / 2, 0, legWidth, legHeight);
      context.restore();

      // ขาขวา: หมุนด้วย angle ลบ (ขาออกคนละทิศทาง)
      const rightHipX = x + w * 0.6 + legWidth / 2;
      context.save();
      context.translate(rightHipX, pivotY);
      context.rotate(-angle);
      context.fillRect(-legWidth / 2, 0, legWidth, legHeight);
      context.restore();

      // eye
      context.fillStyle = '#fff';
      context.beginPath();
      context.arc(x + w + 8, y + h * 0.3, 5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#000';
      context.beginPath();
      context.arc(x + w + 10, y + h * 0.3, 2, 0, Math.PI * 2);
      context.fill();
    }

    // ปรับปรุงอุปสรรคเป็นต้นกระบองเพชรสวยงาม
    function drawObstacle(obs: Obstacle, deltaTime: number) {
      obs.x -= (speed * deltaTime) / 1000;
      const x = obs.x;
      const h = obs.height;
      const w = obs.width;
      const ground = baseGroundY;

      // main cactus body
      const grd = context.createLinearGradient(x, ground - h, x + w, ground);
      grd.addColorStop(0, '#32CD32');
      grd.addColorStop(1, '#228B22');
      context.fillStyle = grd;
      context.fillRect(x, ground - h, w, h);

      // left arm
      context.fillRect(x - w * 0.4, ground - h * 0.6, w * 0.4, h * 0.3);
      // right arm
      context.fillRect(x + w, ground - h * 0.5, w * 0.4, h * 0.3);

      // shading stripes
      context.strokeStyle = '#006400';
      context.lineWidth = 2;
      for (let i = ground - h + 10; i < ground; i += 15) {
        context.beginPath();
        context.moveTo(x + 5, i);
        context.lineTo(x + w - 5, i);
        context.stroke();
      }

      // small spines (triangles)
      context.fillStyle = '#006400';
      for (let i = ground - h + 15; i < ground; i += 30) {
        context.beginPath();
        context.moveTo(x + 5, i);
        context.lineTo(x + 10, i - 5);
        context.lineTo(x + 15, i);
        context.closePath();
        context.fill();

        context.beginPath();
        context.moveTo(x + w - 5, i);
        context.lineTo(x + w - 10, i - 5);
        context.lineTo(x + w - 15, i);
        context.closePath();
        context.fill();
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
        'Press Space or Click to Restart',
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
          spawnTimestamp: timestamp,
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
          height: dino.height,
        };
        const obsRect = {
          x: obs.x,
          y: baseGroundY - obs.height,
          width: obs.width,
          height: obs.height,
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

    // วาดหน้าจอเริ่มต้น—แสดงตัวละครและอุปสรรคสวยงาม
    function drawStartScreen() {
      drawBackground();
      clouds.forEach((cloud) => {
        drawCloud(cloud, 16);
      });

      drawDino(0);

      // ข้อความสตาร์ท
      context.fillStyle = '#000';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(
        'Press Space or Click to Start',
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
      canvas.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animationId);
    };
  }, [isRunning, isGameOver, highScore]);

  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
      <canvas ref={canvasRef} width={800} height={240} className="w-full" />
    </div>
  );
};

export default App;
