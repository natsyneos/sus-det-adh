import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FogShaderProps {
  spotlightX: number;
  spotlightY: number;
  spotlightRadius: number;
}

function FogMesh({ spotlightX, spotlightY, spotlightRadius }: FogShaderProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, camera } = useThree();

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(size.width, size.height) },
    u_spotlight: { value: new THREE.Vector2(spotlightX, size.height - spotlightY) },
    u_spotlightRadius: { value: spotlightRadius },
  }), []);

  useEffect(() => {
    uniforms.u_resolution.value.set(size.width, size.height);
    // Resize plane to always fill screen
    if (meshRef.current) {
      meshRef.current.scale.set(size.width, size.height, 1);
    }
  }, [size]);

  useFrame((_, delta) => {
    uniforms.u_time.value += delta * 0.25;
    uniforms.u_spotlight.value.set(spotlightX, size.height - spotlightY);
    uniforms.u_spotlightRadius.value = spotlightRadius;
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_spotlight;
    uniform float u_spotlightRadius;
    varying vec2 vUv;

    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.1;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;
      vec2 pixelPos = uv * u_resolution;

      vec2 q = vec2(
        fbm(uv * 2.5 + vec2(0.0, u_time * 0.12)),
        fbm(uv * 2.5 + vec2(1.7, u_time * 0.10))
      );

      vec2 r = vec2(
        fbm(uv * 2.5 + 4.0 * q + vec2(1.7, 9.2) + u_time * 0.08),
        fbm(uv * 2.5 + 4.0 * q + vec2(8.3, 2.8) + u_time * 0.06)
      );

      float f = fbm(uv * 2.5 + 4.0 * r);
      f = f * 0.5 + 0.5;

      float dist = length(pixelPos - u_spotlight);
      float repelZone = u_spotlightRadius * 1.6;
      float spotlightMask = 1.0;

      if (dist < repelZone) {
        float falloff = 1.0 - smoothstep(0.0, repelZone, dist);
        spotlightMask = 1.0 - pow(falloff, 0.6);
        vec2 dir = normalize(pixelPos - u_spotlight);
        vec2 tangent = vec2(-dir.y, dir.x);
        float warpStrength = (1.0 - dist / repelZone) * 0.45;
        f = fbm((uv + tangent * warpStrength) * 2.5 + 4.0 * r);
        f = f * 0.5 + 0.5;
        f *= spotlightMask;
      }

      vec3 fogColor = mix(
  vec3(0.75, 0.75, 0.75),
  vec3(0.92, 0.92, 0.92),
  f
);

      float alpha = f * 0.55 * spotlightMask;
      alpha = clamp(alpha, 0.0, 1.0);

      gl_FragColor = vec4(fogColor, alpha);
    }
  `;

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
  }), []);

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

interface FogLayerProps {
  spotlightX: number;
  spotlightY: number;
  spotlightRadius?: number;
  lightsOn: boolean;
}

export function FogLayer({ spotlightX, spotlightY, spotlightRadius = 280, lightsOn }: FogLayerProps) {
  if (lightsOn) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 100], near: 0.1, far: 1000 }}
        gl={{ alpha: true, antialias: false }}
        style={{ background: 'transparent' }}
      >
        <FogMesh
          spotlightX={spotlightX}
          spotlightY={spotlightY}
          spotlightRadius={spotlightRadius}
        />
      </Canvas>
    </div>
  );
}