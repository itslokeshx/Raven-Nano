import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJarvisStore } from '../../store/jarvisStore';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;

  void main() {
    // Simple grid pattern
    float gridX = step(0.98, fract(vUv.x * 20.0));
    float gridY = step(0.98, fract(vUv.y * 20.0));
    float grid = max(gridX, gridY);

    // Fade from center
    float dist = distance(vUv, vec2(0.5));
    float falloff = smoothstep(0.5, 0.0, dist);

    vec3 color = vec3(0.0, 0.83, 1.0); // Cyan
    float alpha = grid * falloff * uOpacity * 0.3;

    gl_FragColor = vec4(color, alpha);
  }
`;

export const HexGrid = () => {
  const meshRef = useRef();

  const systemState = useJarvisStore((state) => state.systemState);
  const isJarvisSpeaking = useJarvisStore((state) => state.isJarvisSpeaking);
  const isListening = useJarvisStore((state) => state.isListening);

  const isActive = isJarvisSpeaking || isListening;

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 0.5 },
  }), []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [uniforms]);

  useFrame((state) => {
    const { clock } = state;

    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime();

      const targetOpacity = isActive ? 0.8 : systemState === 'sleeping' ? 0.1 : 0.4;
      const currentOpacity = meshRef.current.material.uniforms.uOpacity.value;
      meshRef.current.material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        currentOpacity,
        targetOpacity,
        0.03
      );
    }

    // Slow rotation
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.0002;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, -8]}
      rotation={[-Math.PI / 6, 0, 0]}
      material={material}
    >
      <planeGeometry args={[30, 30, 1, 1]} />
    </mesh>
  );
};
