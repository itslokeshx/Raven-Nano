import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { HologramCore } from './HologramCore';
import { DataRings } from './DataRings';
import { HexGrid } from './HexGrid';
import { ParticleField } from './ParticleField';

const HologramScene = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Ambient lighting */}
          <ambientLight intensity={0.2} />

          {/* Core holographic elements */}
          <HologramCore />
          <DataRings />
          <HexGrid />
          <ParticleField />

          {/* Post-processing effects */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.15}
              luminanceSmoothing={0.4}
              intensity={1.8}
              radius={0.6}
            />
            <ChromaticAberration
              offset={[0.002, 0.002]}
              radialModulation={false}
              modulationOffset={0}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HologramScene;
