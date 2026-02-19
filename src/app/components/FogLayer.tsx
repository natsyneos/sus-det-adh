import { useEffect, useRef } from 'react';

interface FogLayerProps {
  spotlightX: number;
  spotlightY: number;
  spotlightRadius?: number;
  lightsOn: boolean;
}

export function FogLayer({ spotlightX, spotlightY, spotlightRadius = 280, lightsOn }: FogLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const spotlightRef = useRef({ x: spotlightX, y: spotlightY });
  const lightsOnRef = useRef(lightsOn);
  const timeRef = useRef(0);

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

    // Noise function — smooth pseudo-random
    const noise = (x: number, y: number, t: number) => {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const T = Math.floor(t) & 255;
      return (
        Math.sin(X * 0.1 + T * 0.05) *
        Math.cos(Y * 0.1 + T * 0.03) *
        Math.sin((X + Y) * 0.07 + T * 0.04)
      );
    };

    // Smoke puff structure
    interface Puff {
      x: number;
      y: number;
      vx: number;
      vy: number;
      homeX: number;
      homeY: number;
      size: number;
      opacity: number;
      noiseOffsetX: number;
      noiseOffsetY: number;
      rotation: number;
      rotationSpeed: number;
    }

    const puffs: Puff[] = Array.from({ length: 80 }, () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.2,
        homeX: x,
        homeY: y,
        size: Math.random() * 220 + 140,
        opacity: Math.random() * 0.09 + 0.04,
        noiseOffsetX: Math.random() * 100,
        noiseOffsetY: Math.random() * 100,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.003,
      };
    });

    const draw = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timeRef.current += 0.008;
      const t = timeRef.current;

      if (!lightsOnRef.current) {
        const sx = spotlightRef.current.x;
        const sy = spotlightRef.current.y;
        const repelZone = spotlightRadius * 1.8;

        puffs.forEach(p => {
          // Noise-driven organic drift
          const nx = noise(p.noiseOffsetX + t, p.noiseOffsetY, t * 0.5);
          const ny = noise(p.noiseOffsetX, p.noiseOffsetY + t, t * 0.5);
          p.vx += nx * 0.06;
          p.vy += ny * 0.04;

          // Spotlight repulsion with swirl
          const dx = p.x - sx;
          const dy = p.y - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repelZone && dist > 0) {
            const force = Math.pow(1 - dist / repelZone, 1.5) * 4.0;
            const nx2 = dx / dist;
            const ny2 = dy / dist;
            // Tangential swirl component
            const tx = -ny2;
            const ty = nx2;
            p.vx += nx2 * force + tx * force * 0.8;
            p.vy += ny2 * force + ty * force * 0.8;
          }

          // Slow return to home
          p.vx += (p.homeX - p.x) * 0.0006;
          p.vy += (p.homeY - p.y) * 0.0006;

          // Dampen
          p.vx *= 0.96;
          p.vy *= 0.96;

          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;

          // Opacity fade inside spotlight
          let opacity = p.opacity;
          if (dist < spotlightRadius) {
            opacity = p.opacity * Math.pow(dist / spotlightRadius, 2);
          }

          // Draw as rotated ellipse for more organic smoke shape
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          gradient.addColorStop(0, `rgba(210, 218, 230, ${opacity})`);
          gradient.addColorStop(0.3, `rgba(200, 210, 225, ${opacity * 0.7})`);
          gradient.addColorStop(0.7, `rgba(190, 200, 220, ${opacity * 0.3})`);
          gradient.addColorStop(1, `rgba(190, 200, 220, 0)`);

          ctx.scale(1, 0.55); // Flatten into horizontal wisps
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.restore();
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
      style={{ zIndex: 2, opacity: 0.9 }}
    />
  );
}