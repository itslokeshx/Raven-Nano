import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const VoiceWaveform = ({ isActive = false, barCount = 12 }) => {
  const [bars, setBars] = useState(Array(barCount).fill(15));

  useEffect(() => {
    if (!isActive) {
      setBars(Array(barCount).fill(15));
      return;
    }

    const interval = setInterval(() => {
      setBars(
        Array(barCount)
          .fill(0)
          .map(() => Math.random() * 70 + 15)
      );
    }, 80);

    return () => clearInterval(interval);
  }, [isActive, barCount]);

  return (
    <div className="flex items-center justify-center gap-1.5 h-20">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="w-1.5 rounded-full"
          style={{
            background: isActive
              ? 'linear-gradient(180deg, #00D4FF 0%, #0066FF 100%)'
              : 'rgba(0, 212, 255, 0.2)',
            height: isActive ? `${height}%` : '15%',
            boxShadow: isActive
              ? '0 0 8px rgba(0, 212, 255, 0.6), 0 0 16px rgba(0, 212, 255, 0.3)'
              : 'none',
            opacity: isActive ? 1 : 0.4,
          }}
          transition={{
            duration: 0.08,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};
