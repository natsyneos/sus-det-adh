import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
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

    // Large overlapping particles for unified fog look
    const count = 120;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15,
      radius: Math.random() * 180 + 120,
      baseOpacity: Math.random() * 0.07 + 0.04,
    }));

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (lightsOnRef.current) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const sx = spotlightRef.current.x;
      const sy = spotlightRef.current.y;
      const repelZone = spotlightRadius * 1.6;
      const repelStrength = 4.5;

      particlesRef.current.forEach(p => {
        // Drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges softly
        if (p.x < -p.radius) p.x = canvas.width + p.radius;
        if (p.x > canvas.width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = canvas.height + p.radius;
        if (p.y > canvas.height + p.radius) p.y = -p.radius;

        // Spotlight repulsion
        const dx = p.x - sx;
        const dy = p.y - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repelZone && dist > 0) {
          const force = (1 - dist / repelZone) * repelStrength;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
          // Add some lateral scatter for more natural displacement
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }

        // Dampen velocity so particles don't fly off forever
        p.vx *= 0.98;
        p.vy *= 0.98;
        // Restore base drift if too slow
        if (Math.abs(p.vx) < 0.1) p.vx += (Math.random() - 0.5) * 0.05;
        if (Math.abs(p.vy) < 0.06) p.vy += (Math.random() - 0.5) * 0.03;

        // Opacity fades to zero inside spotlight
        let opacity = p.baseOpacity;
        if (dist < spotlightRadius) {
          opacity = p.baseOpacity * Math.pow(dist / spotlightRadius, 2);
        }

        // Large soft radial gradient blob
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, `rgba(200, 210, 225, ${opacity})`);
        gradient.addColorStop(0.4, `rgba(200, 210, 225, ${opacity * 0.6})`);
        gradient.addColorStop(1, `rgba(200, 210, 225, 0)`);

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

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2, opacity: 0.85 }}
    />
  );
}