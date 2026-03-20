import React, { useEffect, useState } from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { SystemMetric } from '../ui/SystemMetric';
import { DataStream } from '../ui/DataStream';
import { RadarSweep } from './RadarSweep';
import { useJarvisStore } from '../../store/jarvisStore';
import {
  generateReactorOutput,
  generateCoreTemp,
  generateShieldStrength,
  generateSuitIntegrity,
} from '../../data/systemMetrics';

export const LeftPanel = () => {
  const systemState = useJarvisStore((state) => state.systemState);

  const [metrics, setMetrics] = useState({
    reactorOutput: 3.0,
    coreTemp: 1472,
    shieldStrength: 94,
    suitIntegrity: 98,
  });

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        reactorOutput: parseFloat(generateReactorOutput()),
        coreTemp: generateCoreTemp(),
        shieldStrength: generateShieldStrength(),
        suitIntegrity: generateSuitIntegrity(),
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const threatLevel = metrics.shieldStrength < 50 ? 'CRITICAL' :
                      metrics.shieldStrength < 80 ? 'ELEVATED' : 'NONE';

  const threatColor = threatLevel === 'CRITICAL' ? 'critical' :
                     threatLevel === 'ELEVATED' ? 'warning' : 'accent';

  return (
    <GlassPanel className="w-full h-full p-4 flex flex-col gap-4">
      {/* Reactor Status */}
      <div className="flex flex-col gap-2">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Arc Reactor
        </span>
        <div className="flex justify-center py-2">
          <SystemMetric
            label="Output"
            value={metrics.reactorOutput.toFixed(2)}
            unit="GJ"
            percentage={(metrics.reactorOutput / 3.5) * 100}
            color="primary"
            size="lg"
          />
        </div>
      </div>

      {/* Suit Integrity */}
      <div className="flex flex-col gap-2">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Suit Integrity
        </span>
        <div className="flex justify-center py-2">
          <SystemMetric
            label="Integrity"
            value={metrics.suitIntegrity}
            unit="%"
            percentage={metrics.suitIntegrity}
            color={metrics.suitIntegrity > 90 ? 'accent' : metrics.suitIntegrity > 70 ? 'warning' : 'critical'}
            size="md"
          />
        </div>
      </div>

      {/* Shield Status */}
      <div className="flex flex-col gap-2">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Shield Strength
        </span>
        <div className="flex justify-center py-2">
          <SystemMetric
            label="Shields"
            value={metrics.shieldStrength}
            unit="%"
            percentage={metrics.shieldStrength}
            color={threatColor}
            size="md"
          />
        </div>
      </div>

      {/* Threat Level */}
      <div className="flex flex-col gap-2">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Threat Level
        </span>
        <div className={`text-center py-3 font-orbitron font-bold text-lg ${
          threatColor === 'critical' ? 'text-jarvis-critical animate-pulse' :
          threatColor === 'warning' ? 'text-jarvis-warning' : 'text-jarvis-accent'
        }`}>
          {threatLevel}
        </div>
      </div>

      {/* Radar */}
      <div className="flex flex-col gap-2">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Perimeter Scan
        </span>
        <div className="flex justify-center py-2">
          <RadarSweep />
        </div>
      </div>

      {/* Data Stream */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          System Data
        </span>
        <div className="flex-1 overflow-hidden">
          <DataStream />
        </div>
      </div>
    </GlassPanel>
  );
};
