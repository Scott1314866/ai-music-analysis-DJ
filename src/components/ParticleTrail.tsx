import React, { useEffect, useRef } from 'react';

interface ParticleTrailProps {
  theme: 'dark' | 'light';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  type: 'pixel' | 'cross' | 'dot';
}

export function ParticleTrail({ theme }: ParticleTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // Match theme color palette
    const primaryColor = isDark ? '63, 185, 80' : '107, 70, 193'; // #3fb950 or #6b46c1
    const secondaryColor = isDark ? '139, 92, 246' : '236, 72, 153'; // complimentary violet or pink

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      // Add a couple of particles on mouse movement
      const x = e.clientX;
      const y = e.clientY;

      for (let i = 0; i < 2; i++) {
        const isSecondary = Math.random() > 0.7;
        const baseColor = isSecondary ? secondaryColor : primaryColor;
        
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.5,
          size: Math.random() * 5 + 2,
          alpha: 1.0,
          decay: Math.random() * 0.03 + 0.015,
          color: baseColor,
          type: Math.random() > 0.6 ? 'pixel' : Math.random() > 0.5 ? 'cross' : 'dot'
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = isDark ? 6 : 2;
        ctx.shadowColor = `rgba(${p.color}, ${p.alpha})`;
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.strokeStyle = `rgba(${p.color}, ${p.alpha})`;

        if (p.type === 'pixel') {
          // Draw a small retro cyber square
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else if (p.type === 'cross') {
          // Draw a small electronic '+' wireframe
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x - p.size, p.y);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.stroke();
        } else {
          // Draw a simple glowing round photon particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
    />
  );
}
