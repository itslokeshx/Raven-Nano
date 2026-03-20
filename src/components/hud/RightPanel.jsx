import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../ui/GlassPanel';
import { useJarvisStore } from '../../store/jarvisStore';
import { NEWS_TICKER_ITEMS } from '../../data/newsTickerData';
import { generateEnvironmentData, formatCoordinates } from '../../data/systemMetrics';

export const RightPanel = () => {
  const systemState = useJarvisStore((state) => state.systemState);

  const [environment, setEnvironment] = useState({
    temperature: 72,
    humidity: 45,
    pressure: 1013.2,
  });

  const [coordinates, setCoordinates] = useState({
    lat: "34.0259° N",
    lng: "118.7798° W",
  });

  const [newsIndex, setNewsIndex] = useState(0);

  // Update environment data
  useEffect(() => {
    const interval = setInterval(() => {
      setEnvironment(generateEnvironmentData());
      setCoordinates(formatCoordinates());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Rotate news ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % NEWS_TICKER_ITEMS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Simulated comms messages
  const commsMessages = [
    { sender: 'STARK TOWER', message: 'Security scan complete', time: '14:32' },
    { sender: 'MARK VII', message: 'Diagnostics nominal', time: '14:28' },
    { sender: 'R&D LAB', message: 'New prototype ready', time: '14:15' },
    { sender: 'PEPPER', message: 'Meeting in 5 minutes', time: '14:02' },
  ];

  return (
    <GlassPanel className="w-full h-full p-4 flex flex-col gap-4">
      {/* Stark Comms */}
      <div className="flex flex-col gap-2">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Stark Comms
        </span>
        <div className="space-y-2 py-2">
          {commsMessages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-2 text-xs border-l-2 border-jarvis-primary/30 pl-2 hover:border-jarvis-primary transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-jarvis-primary font-orbitron font-semibold">{msg.sender}</span>
                <span className="text-jarvis-secondary font-rajdhani">{msg.message}</span>
              </div>
              <span className="text-jarvis-secondary/60 font-mono ml-auto">{msg.time}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Environment */}
      <div className="flex flex-col gap-2">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Environment
        </span>
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="text-center">
            <span className="text-jarvis-primary font-mono text-lg glow-text">{environment.temperature}°</span>
            <span className="text-jarvis-secondary text-[10px] block font-rajdhani">TEMP</span>
          </div>
          <div className="text-center">
            <span className="text-jarvis-primary font-mono text-lg glow-text">{environment.humidity}%</span>
            <span className="text-jarvis-secondary text-[10px] block font-rajdhani">HUMIDITY</span>
          </div>
          <div className="text-center">
            <span className="text-jarvis-primary font-mono text-lg glow-text">{environment.pressure}</span>
            <span className="text-jarvis-secondary text-[10px] block font-rajdhani">PRESSURE</span>
          </div>
        </div>
      </div>

      {/* Coordinates */}
      <div className="flex flex-col gap-2">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Coordinates
        </span>
        <div className="flex justify-between py-2 font-mono text-sm">
          <div className="text-center">
            <span className="text-jarvis-primary glow-text">{coordinates.lat}</span>
            <span className="text-jarvis-secondary text-[10px] block">LATITUDE</span>
          </div>
          <div className="text-center">
            <span className="text-jarvis-primary glow-text">{coordinates.lng}</span>
            <span className="text-jarvis-secondary text-[10px] block">LONGITUDE</span>
          </div>
        </div>
      </div>

      {/* News Ticker */}
      <div className="flex flex-col gap-2">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Stark Industries News
        </span>
        <div className="overflow-hidden py-2">
          <motion.div
            key={newsIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-xs text-jarvis-secondary font-rajdhani whitespace-nowrap"
          >
            {NEWS_TICKER_ITEMS[newsIndex]}
          </motion.div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="flex flex-col gap-2 flex-1">
        <span className="text-jarvis-secondary text-xs font-orbitron uppercase tracking-wider border-b border-jarvis-primary/20 pb-1">
          Active Alerts
        </span>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-jarvis-accent font-rajdhani text-sm">
            {systemState === 'alert' ? 'THREAT DETECTED' : 'No active alerts'}
          </span>
        </div>
      </div>
    </GlassPanel>
  );
};
