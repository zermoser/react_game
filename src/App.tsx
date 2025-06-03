// src/App.tsx
import React, { useRef, useEffect, useState } from 'react';

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    let animationId: number;
    let frameCount = 0;
    let spawnRate = 80; // ปรับให้ต้นกระบองเพชรโผล่ถี่ขึ้น
    let obstacles: Obstacle[] = [];
    let clouds: Cloud[] = [];
    const dino = {
      x: 80,
      y: 0,
      width: 30,
      height: 40,
      velocityY: 0,
      gravity: 1.2
    };
    const groundY = 180; // เปลี่ยนให้พื้นดินต่ำลงนิดหนึ่ง
    let speed = 5;
    let highestScore = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // สร้างก้อนเมฆเริ่มต้น
    for (let i = 0; i < 3; i++) {
      clouds.push({
        x: 200 + i * 300,
        y: 30 + Math.random() * 20,
        size: 40 + Math.random() * 20
      });
    }

    const resetGame = () => {
      frameCount = 0;
      obstacles = [];
      clouds = [];
      // สร้างก้อนเมฆเริ่มต้นใหม่
      for (let i = 0; i < 3; i++) {
        clouds.push({
          x: 200 + i * 300,
          y: 30 + Math.random() * 20,
          size: 40 + Math.random() * 20
        });
      }
      dino.y = 0;
      dino.velocityY = 0;
      setScore(0);
      speed = 5;
      spawnRate = 80;
      setIsGameOver(false);
      // เก็บคะแนนสูงถ้าสูงกว่า
      if (score > highestScore) {
        highestScore = score;
        setHighScore(highestScore);
      }
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

    const drawBackground = () => {
      // วาดท้องฟ้าสีฟ้าอ่อน
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, groundY + 20);

      // วาดพื้นดิน (striped pattern)
      ctx.fillStyle = '#deb887';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.strokeStyle = '#c2a471';
      ctx.lineWidth = 2;
      // ลายทางพื้นดิน
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, groundY);
        ctx.lineTo(i + 10, groundY + 10);
        ctx.stroke();
      }
    };

    const drawCloud = (cloud: Cloud) => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      // วาดกลุ่มวงกลม 3 วงกลมเพื่อให้เป็นก้อนเมฆ
      ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.6, cloud.y + 5, cloud.size * 0.4, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 1.2, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawDino = () => {
      // วาดไดโนเสาร์เป็นสี่เหลี่ยมและทำ head เป็นสามเหลี่ยม
      ctx.fillStyle = '#2e8b57'; // สีเขียวเข้ม
      // ตัว
      ctx.fillRect(
        dino.x,
        groundY - dino.height + dino.y,
        dino.width,
        dino.height
      );
      // หัว (สามเหลี่ยม)
      ctx.beginPath();
      ctx.moveTo(dino.x + dino.width, groundY - dino.height + dino.y + 10);
      ctx.lineTo(dino.x + dino.width + 10, groundY - dino.height + dino.y + dino.height / 2);
      ctx.lineTo(dino.x + dino.width, groundY - dino.height + dino.y + dino.height - 10);
      ctx.closePath();
      ctx.fill();
      // ตา (วงกลมเล็ก)
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(
        dino.x + dino.width * 0.6,
        groundY - dino.height + dino.y + 10,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const drawObstacle = (obs: Obstacle) => {
      // วาดต้นกระบองเพชรสีเขียวขนาดต่าง ๆ
      ctx.fillStyle = '#228B22';
      // ลำต้นตรงกลาง
      ctx.fillRect(obs.x, groundY - obs.height, obs.width, obs.height);
      // วาดกิ่งซ้าย
      ctx.fillRect(obs.x - 5, groundY - obs.height / 2 - 10, 5, obs.height / 2);
      // วาดกิ่งขวา
      ctx.fillRect(obs.x + obs.width, groundY - obs.height / 2 - 10, 5, obs.height / 2);
      // วาดหนาม (เส้นเล็ก ๆ)
      ctx.strokeStyle = '#006400';
      ctx.lineWidth = 1;
      for (let y = groundY - obs.height + 5; y < groundY; y += 10) {
        ctx.beginPath();
        ctx.moveTo(obs.x + 5, y);
        ctx.lineTo(obs.x + obs.width - 5, y);
        ctx.stroke();
      }
    };

    const drawGameOver = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fff';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);

      ctx.font = '18px Arial';
      ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 20);

      ctx.font = '16px Arial';
      ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 60);
    };

    const drawScore = () => {
      ctx.fillStyle = '#000';
      ctx.font = '20px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`Score: ${score}`, canvas.width - 20, 30);
    };

    const gameLoop = () => {
      if (!ctx || !canvas) return;

      drawBackground();

      // เคลื่อนก้อนเมฆ
      clouds.forEach((cloud) => {
        cloud.x -= speed * 0.2; // เมฆเคลื่อนช้ากว่า
        if (cloud.x + cloud.size * 1.5 < 0) {
          // สุ่มตำแหน่งเมฆใหม่เมื่อหลุดกรอบ
          cloud.x = canvas.width + Math.random() * 100;
          cloud.y = 30 + Math.random() * 20;
          cloud.size = 40 + Math.random() * 20;
        }
        drawCloud(cloud);
      });

      // ฟิสิกส์ไดโนเสาร์
      if (isRunning && !isGameOver) {
        dino.velocityY += dino.gravity;
        dino.y = Math.min(dino.y + dino.velocityY, 0);
        if (dino.y > 0) {
          dino.y = 0;
          dino.velocityY = 0;
        }
      }

      // วาดไดโนเสาร์
      drawDino();

      // สร้างอุปสรรคใหม่
      if (isRunning && !isGameOver) {
        frameCount++;
        if (frameCount % spawnRate === 0) {
          const h = 30 + Math.random() * 50;
          obstacles.push({ x: canvas.width, width: 15, height: h });
          // ค่อย ๆ ลด spawnRate เพื่อเพิ่มความถี่ตามเกมดำเนิน
          if (spawnRate > 40) spawnRate -= 2;
        }
      }

      // เคลื่อนและวาดอุปสรรค
      obstacles.forEach((obs, index) => {
        if (isRunning && !isGameOver) {
          obs.x -= speed;
        }
        drawObstacle(obs);

        // ตรวจการชน
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

        // ถ้าอุปสรรคหลุดหน้าจอ
        if (obs.x + obs.width < 0) {
          obstacles.splice(index, 1);
          setScore((prev: number) => {
            const newScore = prev + 1;
            if (newScore > highestScore) {
              highestScore = newScore;
              setHighScore(highestScore);
            }
            return newScore;
          });
        }
      });

      // ปรับความยาก : เพิ่มความเร็วทุก 600 เฟรม
      if (frameCount % 600 === 0 && frameCount !== 0) {
        speed += 0.5;
      }

      // วาดคะแนน
      drawScore();

      if (!isGameOver) {
        animationId = requestAnimationFrame(gameLoop);
      } else {
        drawGameOver();
      }
    };

    // หน้าจอเริ่มต้น
    if (!isRunning && !isGameOver) {
      drawBackground();
      clouds.forEach(drawCloud);
      drawDino();
      ctx.fillStyle = '#000';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2);
    }

    if (isRunning) {
      animationId = requestAnimationFrame(gameLoop);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationId);
    };
  }, [isRunning, isGameOver, score, highScore]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <canvas
        ref={canvasRef}
        width={800}
        height={240}
        className="border border-gray-400 bg-transparent"
      />
    </div>
  );
};

export default App;
