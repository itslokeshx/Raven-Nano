import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const generateSmoothHeights = (count, baseHeight = 20) => {
  return Array(count).fill(0).map(() => {
    const noise = Math.sin(Math.random() * Math.PI) * 30;
    return baseHeight + noise + Math.random() * 20;
  });
};

export const VoiceWaveform = ({ isActive = false, barCount = 16 }) => {
  const [bars, setBars] = useState(Array(barCount).fill(20));

  const animateWaveform = useCallback(() => {
    if (!isActive) {
      setBars(Array(barCount).fill(20));
      return;
    }

    setBars(generateSmoothHeights(barCount, 25));
  }, [isActive, barCount]);

  useEffect(() => {
    if (!isActive) {
      setBars(Array(barCount).fill(20));
      return;
    }

    // Smooth animation loop using requestAnimationFrame
    let animationFrameId;
    let lastTime = 0;
    const interval = 100;

    const animate = (time) => {
      if (time - lastTime >= interval) {
        animateWaveform();
        lastTime = time;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, barCount, animateWaveform]);

  return (
    <div className="flex items-center justify-center gap-2 h-24">
      {bars.map((height, index) => (
        <motion.div
          key={index}
          className="w-2 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)',
            height: `${Math.max(8, isActive ? height : 12)}%`,
            opacity: isActive ? 0.9 : 0.3,
            filter: isActive ? 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' : 'none',
          }}
          animate={{
            scaleY: isActive ? [0.8, 1.2, 0.9, 1.1, 1] : 0.6,
          }}
          transition={{
            duration: 0.4,
            ease: 'easeInOut',
            times: [0, 0.25, 0.5, 0.75, 1],
            repeat: isActive ? Infinity : 0,
            repeatDelay: 0.1,
          }}
        />
      ))}
    </div>
  );
};
