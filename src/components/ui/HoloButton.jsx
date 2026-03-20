import React from 'react';
import { motion } from 'framer-motion';
import { useSoundEngine } from '../../hooks/useSoundEngine';

export const HoloButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const { playButtonClick, playButtonHover, initialize } = useSoundEngine();

  const handleClick = (e) => {
    initialize();
    playButtonClick();
    if (onClick) onClick(e);
  };

  const handleHover = () => {
    initialize();
    playButtonHover();
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'border-jarvis-primary/50 hover:border-jarvis-primary text-jarvis-primary',
    secondary: 'border-jarvis-secondary/50 hover:border-jarvis-secondary text-jarvis-secondary',
    accent: 'border-jarvis-accent/50 hover:border-jarvis-accent text-jarvis-accent',
    warning: 'border-jarvis-warning/50 hover:border-jarvis-warning text-jarvis-warning',
    critical: 'border-jarvis-critical/50 hover:border-jarvis-critical text-jarvis-critical',
  };

  const baseClasses = `
    relative
    font-orbitron
    font-medium
    uppercase
    tracking-wider
    border
    bg-jarvis-panel
    backdrop-blur-sm
    transition-all
    duration-200
    chromatic-hover
    disabled:opacity-40
    disabled:cursor-not-allowed
    disabled:hover:border-opacity-50
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  return (
    <motion.button
      className={baseClasses}
      onClick={handleClick}
      onMouseEnter={handleHover}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-jarvis-primary/10 via-transparent to-jarvis-primary/10" />
    </motion.button>
  );
};
