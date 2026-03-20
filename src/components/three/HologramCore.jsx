import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useJarvisStore } from '../../store/jarvisStore';

export const HologramCore = () => {
  const coreRef = useRef();
  const wireframeRef = useRef();
  const innerCoreRef = useRef();
  const lightRef = useRef();
  const glowRef = useRef();

  const systemState = useJarvisStore((state) => state.systemState);
  const isJarvisSpeaking = useJarvisStore((state) => state.isJarvisSpeaking);
  const isListening = useJarvisStore((state) => state.isListening);

  const isActive = isJarvisSpeaking || isListening;

  // Materials
  const coreMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x00D4FF,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.9,
    });
  }, []);

  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x00AADD,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
  }, []);

  const innerCoreMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.8,
    });
  }, []);

  useFrame((state) => {
    const { clock } = state;
    const time = clock.getElapsedTime();

    // Speaking/listening animation intensity
    const intensity = isActive ? 3 : 1;
    const speed = isActive ? 2 : 0.5;

    // Core rotation - faster when active
    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.1 * speed;
      coreRef.current.rotation.z = Math.sin(time * 0.2) * 0.05 * intensity;
    }

    // Wireframe rotation
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = -time * 0.15 * speed;
      wireframeRef.current.rotation.x = Math.sin(time * 0.3) * 0.1 * intensity;
    }

    // Inner core pulsing - much more dramatic when speaking
    if (innerCoreRef.current) {
      const pulseSpeed = isActive ? 8 : 2;
      const pulseScale = isActive ? 0.3 : 0.1;
      const scale = 1 + Math.sin(time * pulseSpeed) * pulseScale;
      innerCoreRef.current.scale.setScalar(scale);
    }

    // Light intensity - brightens when speaking
    if (lightRef.current) {
      const baseIntensity = systemState === 'sleeping' ? 0.2 : 1.5;
      const activeBoost = isActive ? 2 : 0;
      const fluctuation = Math.sin(time * 3) * 0.3 * intensity;
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        baseIntensity + activeBoost + fluctuation,
        0.1
      );
    }

    // Glow sphere scaling when active
    if (glowRef.current) {
      const targetScale = isActive ? 1.5 : 1;
      glowRef.current.scale.setScalar(
        THREE.MathUtils.lerp(glowRef.current.scale.x, targetScale, 0.05)
      );
      glowRef.current.material.opacity = isActive ? 0.3 : 0.1;
    }

    // Material emission intensity
    const targetEmissive = isActive ? 3.0 : systemState === 'sleeping' ? 0.3 : 1.5;
    coreMaterial.emissiveIntensity = THREE.MathUtils.lerp(
      coreMaterial.emissiveIntensity,
      targetEmissive,
      0.05
    );

    // Wireframe opacity
    wireframeMaterial.opacity = THREE.MathUtils.lerp(
      wireframeMaterial.opacity,
      isActive ? 0.6 : 0.25,
      0.05
    );
  });

  return (
    <group>
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color={0x00D4FF}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main core sphere */}
      <Sphere
        ref={coreRef}
        args={[1, 64, 64]}
        material={coreMaterial}
      />

      {/* Wireframe sphere */}
      <Sphere
        ref={wireframeRef}
        args={[1.15, 32, 32]}
        material={wireframeMaterial}
      />

      {/* Inner energy core */}
      <Sphere
        ref={innerCoreRef}
        args={[0.4, 32, 32]}
        material={innerCoreMaterial}
      />

      {/* Central point light */}
      <pointLight
        ref={lightRef}
        args={[0x00D4FF, 1.5, 15, 1.5]}
        position={[0, 0, 0]}
      />

      {/* Ambient light for overall soft illumination */}
      <ambientLight intensity={0.3} color={0x00D4FF} />
    </group>
  );
};
