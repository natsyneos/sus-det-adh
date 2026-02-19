import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  baseOpacity: number;
}

interface FogLayerProps {
  spotlightX: number;
  spotlightY: number;
  spotlightRadius?: number;
  lightsOn: boolean;
}

export function FogLayer({ spotlightX, spotlightY, spotlightRadius = 280, lightsOn }: FogLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const spotlightRef = useRef({ x: spotlightX, y: spotlightY });

  // Keep spotlight ref current
  useEffect(() => {
    spotlightRef.current = { x: spotlightX, y: spotlightY };
  }, [spotlightX, spotlightY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 350;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      radius: Math.random() * 60 + 20,
      opacity: 0,
      baseOpacity: Math.random() * 0.12 + 0.04,
    }));

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const sx = spotlightRef.current.x;
      const sy = spotlightRef.current.y;

      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -p.radius) p.x = canvas.width + p.radius;
        if (p.x > canvas.width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = canvas.height + p.radius;
        if (p.y > canvas.height + p.radius) p.y = -p.radius;

        const dx = p.x - sx;
        const dy = p.y - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelZone = spotlightRadius * 1.1;

        if (dist < repelZone && dist > 0) {
          const force = (1 - dist / repelZone) * 1.8;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        let opacity = p.baseOpacity;
        if (dist < spotlightRadius) {
          opacity = p.baseOpacity * (dist / spotlightRadius);
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, `rgba(180, 190, 210, ${opacity})`);
        gradient.addColorStop(1, `rgba(180, 190, 210, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [spotlightRadius]);

  if (lightsOn) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2, opacity: 0.9 }}
    />
  );
}