import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Torus } from '@react-three/drei';
import * as THREE from 'three';
import { useJarvisStore } from '../../store/jarvisStore';

export const DataRings = () => {
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  const systemState = useJarvisStore((state) => state.systemState);
  const isJarvisSpeaking = useJarvisStore((state) => state.isJarvisSpeaking);
  const isListening = useJarvisStore((state) => state.isListening);

  const isActive = isJarvisSpeaking || isListening;

  const ringMaterial1 = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x00D4FF,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
  }, []);

  const ringMaterial2 = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x00AADD,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
  }, []);

  const ringMaterial3 = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x0088CC,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
  }, []);

  useFrame((state) => {
    const { clock } = state;
    const time = clock.getElapsedTime();

    // Much faster rotation when active
    const speed = isActive ? 4 : 0.5;

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.sin(time * 0.5) * 0.3;
      ring1Ref.current.rotation.y += 0.005 * speed;
      ring1Ref.current.rotation.z = Math.cos(time * 0.3) * 0.1;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = 0.785 + Math.sin(time * 0.4) * 0.2;
      ring2Ref.current.rotation.y -= 0.008 * speed;
      ring2Ref.current.rotation.z += 0.003 * speed;
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = 1.309 + Math.sin(time * 0.6) * 0.15;
      ring3Ref.current.rotation.y += 0.01 * speed;
      ring3Ref.current.rotation.z -= 0.005 * speed;
    }

    // Brighter when active
    const targetOpacity = isActive ? 0.6 : systemState === 'sleeping' ? 0.05 : 0.2;
    ringMaterial1.opacity = THREE.MathUtils.lerp(ringMaterial1.opacity, targetOpacity, 0.05);
    ringMaterial2.opacity = THREE.MathUtils.lerp(ringMaterial2.opacity, targetOpacity * 0.7, 0.05);
    ringMaterial3.opacity = THREE.MathUtils.lerp(ringMaterial3.opacity, targetOpacity * 0.5, 0.05);
  });

  return (
    <group>
      <group ref={ring1Ref}>
        <Torus args={[2.5, 0.015, 8, 100]} material={ringMaterial1} />
      </group>

      <group ref={ring2Ref}>
        <Torus args={[1.8, 0.012, 8, 80]} material={ringMaterial2} />
      </group>

      <group ref={ring3Ref}>
        <Torus args={[1.3, 0.01, 8, 64]} material={ringMaterial3} />
      </group>
    </group>
  );
};
