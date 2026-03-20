import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../ui/GlassPanel';
import { useJarvisStore } from '../../store/jarvisStore';

export const TopBar = () => {
  const systemState = useJarvisStore((state) => state.systemState);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statusColors = {
    booting: 'bg-jarvis-warning',
    active: 'bg-green-400',
    sleeping: 'bg-jarvis-secondary',
    alert: 'bg-jarvis-critical animate-pulse',
    shutdown: 'bg-gray-500',
  };

  return (
    <GlassPanel className="w-full h-16 px-6 flex items-center justify-between" withCorners={false}>
      {/* Left - Stark Industries Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-jarvis-primary rounded-sm flex items-center justify-center">
            <span className="text-jarvis-primary font-orbitron font-bold text-lg">◈</span>
          </div>
          <div className="flex flex-col">
            <span className="text-jarvis-primary font-orbitron font-bold text-sm tracking-wider">
              STARK
            </span>
            <span className="text-jarvis-secondary text-[10px] font-rajdhani tracking-widest">
              MARK VII SYSTEMS
            </span>
          </div>
        </div>
      </div>

      {/* Center - JARVIS Title */}
      <div className="flex flex-col items-center">
        <motion.h1
          className="text-jarvis-primary font-orbitron text-2xl font-bold tracking-[0.3em] glow-text"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          J.A.R.V.I.S
        </motion.h1>
        <span className="text-jarvis-secondary text-xs font-mono tracking-widest">
          v4.2.1 // {systemState.toUpperCase()}
        </span>
      </div>

      {/* Right - Clock and Status */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-jarvis-primary font-mono text-lg glow-text">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
          <span className="text-jarvis-secondary text-[10px] font-rajdhani">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-jarvis-secondary text-xs font-rajdhani uppercase">System</span>
          <div className={`w-3 h-3 rounded-full ${statusColors[systemState]} status-pulse shadow-[0_0_10px_currentColor]`} />
        </div>
      </div>
    </GlassPanel>
  );
};
