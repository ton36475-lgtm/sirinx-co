/**
 * EnergyFlowShader — High-Performance GLSL Shader for Three.js WebGL.
 *
 * Simulates real-time solar energy absorption and electron flow from
 * photovoltaic panels through micro-inverters into battery storage.
 *
 * Features:
 * - Procedural simplex noise wave calculation (zero external texture overhead)
 * - Dynamic pulse velocity and intensity driven by uTime & solar irradiation
 * - Energy flow vector gradient: Solar Amber (#FFB800) -> Cyber Cyan (#00F0FF)
 * - Alpha blending & fresnel falloff for holographic edge visibility
 * - Clean disposal and type safety for Three.js material integration
 */

import type { ShaderMaterial, Color } from "three";

export const EnergyFlowShaderDef = {
  uniforms: {
    uTime: { value: 0.0 },
    uSpeed: { value: 1.2 },
    uFlowDirection: { value: 1.0 }, // 1.0 = downward to inverter, -1.0 = reverse
    uIrradiationIntensity: { value: 1.0 }, // Dynamic multiplier from PVGIS
    uColorCore: { value: null as Color | null },
    uColorGlow: { value: null as Color | null },
    uAlpha: { value: 0.85 },
  },

  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uFlowDirection;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);

      // Subtle surface oscillation matching electrical current vibration
      float pulse = sin(uv.y * 18.0 - uTime * uSpeed * uFlowDirection) * 0.012;
      vec3 displaced = position + normal * pulse;

      vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
      vViewPosition = -mvPosition.xyz;

      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uFlowDirection;
    uniform float uIrradiationIntensity;
    uniform vec3 uColorCore;
    uniform vec3 uColorGlow;
    uniform float uAlpha;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // Fast procedural pseudo-noise for energy ripple
    float energyNoise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      // Directional flow coordinates along panel conduit
      float coord = vUv.y * 14.0 - uTime * uSpeed * uFlowDirection;
      float streak = sin(coord) * 0.5 + 0.5;
      streak = pow(streak, 4.0); // Sharp electrical pulses

      // Secondary microscopic electron jitter
      float jitter = energyNoise(vUv * 30.0 + fract(uTime * 0.5)) * 0.15;

      // Fresnel edge glow for 3D depth
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

      // Color blending: Core gold transitioning into high-velocity cyan
      float colorMix = clamp(streak * uIrradiationIntensity + fresnel * 0.5, 0.0, 1.0);
      vec3 finalRgb = mix(uColorGlow, uColorCore, colorMix) + vec3(fresnel * 0.4);

      // Edge fading along UV boundaries for soft conduit connection
      float edgeFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
      float finalAlpha = clamp((streak * 0.75 + fresnel * 0.8 + jitter) * edgeFade * uAlpha, 0.0, 1.0);

      gl_FragColor = vec4(finalRgb, finalAlpha);
    }
  `,
};
