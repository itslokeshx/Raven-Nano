import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const RadarSweep = () => {
  const [blips, setBlips] = useState([]);

  // Generate random blips
  useEffect(() => {
    const generateBlips = () => {
      const newBlips = [];
      const numBlips = Math.floor(Math.random() * 3);

      for (let i = 0; i < numBlips; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 40 + 10; // 10-50% from center
        const x = 50 + Math.cos(angle) * distance * 0.5;
        const y = 50 + Math.sin(angle) * distance * 0.5;

        newBlips.push({
          id: i,
          x,
          y,
          size: Math.random() * 4 + 2,
        });
      }

      setBlips(newBlips);
    };

    generateBlips();
    const interval = setInterval(generateBlips, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-32 h-32">
      {/* Radar circles */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r="48%"
          fill="rgba(0, 20, 40, 0.5)"
          stroke="rgba(0, 212, 255, 0.3)"
          strokeWidth="1"
        />

        {/* Range rings */}
        <circle
          cx="50%"
          cy="50%"
          r="35%"
          fill="none"
          stroke="rgba(0, 212, 255, 0.2)"
          strokeWidth="1"
        />
        <circle
          cx="50%"
          cy="50%"
          r="20%"
          fill="none"
          stroke="rgba(0, 212, 255, 0.2)"
          strokeWidth="1"
        />

        {/* Crosshairs */}
        <line
          x1="50%"
          y1="2%"
          x2="50%"
          y2="98%"
          stroke="rgba(0, 212, 255, 0.2)"
          strokeWidth="1"
        />
        <line
          x1="2%"
          y1="50%"
          x2="98%"
          y2="50%"
          stroke="rgba(0, 212, 255, 0.2)"
          strokeWidth="1"
        />
      </svg>

      {/* Sweep line */}
      <div className="absolute inset-0">
        <div className="radar-sweep" />
      </div>

      {/* Blips */}
      {blips.map((blip) => (
        <motion.div
          key={blip.id}
          className="absolute w-2 h-2 bg-jarvis-accent rounded-full shadow-[0_0_10px_#00FFCC]"
          style={{
            left: `${blip.x}%`,
            top: `${blip.y}%`,
            width: blip.size,
            height: blip.size,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 2, times: [0, 0.3, 1] }}
        />
      ))}

      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-jarvis-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#00D4FF]" />
    </div>
  );
};
