import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  radius: number;
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
  const lightsOnRef = useRef(lightsOn);

  useEffect(() => {
    spotlightRef.current = { x: spotlightX, y: spotlightY };
  }, [spotlightX, spotlightY]);

  useEffect(() => {
    lightsOnRef.current = lightsOn;
  }, [lightsOn]);

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

    const count = 120;
    particlesRef.current = Array.from({ length: count }, () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      return {
        x,
        y,
        homeX: x,
        homeY: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 180 + 120,
        baseOpacity: Math.random() * 0.07 + 0.04,
      };
    });

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!lightsOnRef.current) {
        const sx = spotlightRef.current.x;
        const sy = spotlightRef.current.y;
        const repelZone = spotlightRadius * 1.5;

        particlesRef.current.forEach(p => {
          const dx = p.x - sx;
          const dy = p.y - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Repulsion force — pushes radially outward
          if (dist < repelZone && dist > 0) {
            const force = (1 - dist / repelZone) * 3.5;
            const nx = dx / dist;
            const ny = dy / dist;

            // Tangential component for swirl — perpendicular to radial
            const tx = -ny;
            const ty = nx;

            p.vx += nx * force + tx * force * 0.6;
            p.vy += ny * force + ty * force * 0.6;
          }

          // Gentle return toward home position
          const homeDx = p.homeX - p.x;
          const homeDy = p.homeY - p.y;
          p.vx += homeDx * 0.0008;
          p.vy += homeDy * 0.0008;

          // Base drift
          p.vx += (Math.random() - 0.5) * 0.02;
          p.vy += (Math.random() - 0.5) * 0.02;

          // Dampen
          p.vx *= 0.97;
          p.vy *= 0.97;

          p.x += p.vx;
          p.y += p.vy;

          // Opacity — fade inside spotlight
          let opacity = p.baseOpacity;
          if (dist < spotlightRadius) {
            opacity = p.baseOpacity * Math.pow(dist / spotlightRadius, 1.5);
          }

          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          gradient.addColorStop(0, `rgba(200, 210, 225, ${opacity})`);
          gradient.addColorStop(0.4, `rgba(200, 210, 225, ${opacity * 0.5})`);
          gradient.addColorStop(1, `rgba(200, 210, 225, 0)`);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        });
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [spotlightRadius]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2, opacity: 0.85 }}
    />
  );
}