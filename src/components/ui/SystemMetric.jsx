import React from 'react';
import { motion } from 'framer-motion';

export const SystemMetric = ({
  label,
  value,
  unit = '',
  percentage,
  color = 'primary',
  size = 'md',
  animated = true,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  const colorClasses = {
    primary: 'text-jarvis-primary',
    accent: 'text-jarvis-accent',
    warning: 'text-jarvis-warning',
    critical: 'text-jarvis-critical',
  };

  const strokeColors = {
    primary: '#00D4FF',
    accent: '#00FFCC',
    warning: '#FF6B00',
    critical: '#FF2244',
  };

  const radius = size === 'sm' ? 28 : size === 'md' ? 36 : 52;
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="rgba(0, 212, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke={strokeColors[color]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : false}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 ${strokeWidth}px ${strokeColors[color]})`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold ${size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'} ${colorClasses[color]}`}>
            {value}
          </span>
          {unit && (
            <span className="text-[10px] text-jarvis-secondary font-mono">{unit}</span>
          )}
        </div>
      </div>

      {/* Label */}
      <span className="text-xs font-orbitron text-jarvis-secondary uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};
