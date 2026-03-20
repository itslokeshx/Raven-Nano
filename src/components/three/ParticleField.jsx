import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useJarvisStore } from '../../store/jarvisStore';

export const ParticleField = () => {
  const pointsRef = useRef();
  const velocitiesRef = useRef([]);

  const systemState = useJarvisStore((state) => state.systemState);
  const isJarvisSpeaking = useJarvisStore((state) => state.isJarvisSpeaking);
  const isListening = useJarvisStore((state) => state.isListening);

  const isActive = isJarvisSpeaking || isListening;

  const { positions, colors } = useMemo(() => {
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    const color = new THREE.Color(0x00D4FF);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 4 + Math.random() * 6;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      velocities.push({
        x: (Math.random() - 0.5) * 0.005,
        y: (Math.random() - 0.5) * 0.005,
        z: (Math.random() - 0.5) * 0.005,
        originalY: positions[i * 3 + 1],
      });

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    velocitiesRef.current = velocities;

    return { positions, colors };
  }, []);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: 0x00D4FF,
      size: 0.02,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((state) => {
    const { clock } = state;
    const time = clock.getElapsedTime();

    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array;
    const speed = isActive ? 5 : 1;

    for (let i = 0; i < velocitiesRef.current.length; i++) {
      const i3 = i * 3;
      const velocity = velocitiesRef.current[i];

      // Update position with increased speed when active
      positions[i3] += velocity.x * speed;
      positions[i3 + 1] += velocity.y * speed + (isActive ? Math.sin(time * 3 + i) * 0.01 : 0);
      positions[i3 + 2] += velocity.z * speed;

      // Wrap around
      const dist = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);

      if (dist > 12) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 4 + Math.random() * 2;

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Opacity changes
    const targetOpacity = isActive ? 0.8 : systemState === 'sleeping' ? 0.1 : 0.4;
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.03);
  });

  return (
    <points ref={pointsRef} material={material}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
    </points>
  );
};
