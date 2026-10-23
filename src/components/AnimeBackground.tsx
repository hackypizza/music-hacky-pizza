import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  fadeSpeed: number;
  type: 'ember' | 'dust';
}

interface RainStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  diffractionColor: string;
}

export default function AnimeBackground({ nightRainActive }: { nightRainActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Floating Golden Dust / Embers (#f1e194)
    const particleCount = 48;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        speedY: -(Math.random() * 0.4 + 0.12),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.65 + 0.2,
        fadeSpeed: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1),
        type: Math.random() > 0.35 ? 'ember' : 'dust',
      });
    }

    // Anime Rain Streaks with soft neon light diffraction
    const rainCount = 70;
    const rainDrops: RainStreak[] = [];
    const diffractionTones = [
      'rgba(241, 225, 148, 0.4)', // Warm vintage cream highlight
      'rgba(255, 255, 255, 0.45)', // Pure white sheen
      'rgba(180, 100, 110, 0.35)', // Wine refraction
    ];

    for (let i = 0; i < rainCount; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 22 + 14,
        speed: Math.random() * 7 + 11,
        opacity: Math.random() * 0.35 + 0.15,
        diffractionColor: diffractionTones[i % diffractionTones.length],
      });
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Soft Ambient Wine & Cream Light Glow Orbs
      const time = frame * 0.01;
      const gradWine = ctx.createRadialGradient(
        width * 0.2 + Math.sin(time) * 35,
        height * 0.4 + Math.cos(time) * 25,
        5,
        width * 0.2,
        height * 0.4,
        width * 0.45
      );
      gradWine.addColorStop(0, 'rgba(91, 14, 20, 0.22)'); // Deep Wine
      gradWine.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradWine;
      ctx.fillRect(0, 0, width, height);

      // 2. Render falling raindrops on glass window with light diffraction
      if (nightRainActive) {
        for (const drop of rainDrops) {
          ctx.beginPath();
          ctx.strokeStyle = drop.diffractionColor;
          ctx.lineWidth = 1.1;
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 1.5, drop.y + drop.length);
          ctx.stroke();

          // Slight droplet bead at trailing edge
          ctx.beginPath();
          ctx.arc(drop.x - 1.5, drop.y + drop.length, 0.9, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fill();

          drop.y += drop.speed;
          drop.x -= 0.8;
          if (drop.y > height + 20) {
            drop.y = -25;
            drop.x = Math.random() * width;
          }
        }
      }

      // 3. Render floating golden dust & embers (#f1e194)
      for (const p of particles) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += p.fadeSpeed;

        if (p.opacity > 0.85 || p.opacity < 0.15) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        if (p.type === 'ember') {
          // Warm vintage cream/gold ember (#f1e194)
          ctx.fillStyle = `rgba(241, 225, 148, ${p.opacity})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(241, 225, 148, 0.7)';
        } else {
          // Pure white micro dust (#ffffff)
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.65})`;
          ctx.shadowBlur = 3;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [nightRainActive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      aria-hidden="true"
    />
  );
}
