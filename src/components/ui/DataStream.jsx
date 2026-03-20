import React from 'react';
import { motion } from 'framer-motion';

export const DataStream = ({ data = [], className = '' }) => {
  // Generate random data if none provided
  const displayData = data.length > 0
    ? data
    : Array.from({ length: 20 }, () => ({
        label: `DATA_${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
        value: Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
      }));

  return (
    <div className={`overflow-hidden h-full ${className}`}>
      <motion.div
        className="flex flex-col gap-1"
        animate={{ y: ['0%', '-50%'] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Duplicate data for seamless loop */}
        {[...displayData, ...displayData].map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between font-mono text-xs text-jarvis-secondary/60 px-2 py-1"
          >
            <span>{item.label}</span>
            <span className="text-jarvis-primary/80">{item.value}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
