import React from 'react';
import { motion } from 'framer-motion';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { BottomBar } from './BottomBar';
import { DialogueOverlay } from '../dialogue/DialogueOverlay';
import { SleepSequence } from '../sequences/SleepSequence';
import { WakeSequence } from '../sequences/WakeSequence';
import { ScanLine } from '../ui/ScanLine';
import { useJarvisStore } from '../../store/jarvisStore';

export const MainHUD = () => {
  const systemState = useJarvisStore((state) => state.systemState);

  return (
    <div className="relative w-full h-full flex flex-col p-4 gap-4">
      {/* Scanline overlay */}
      <ScanLine />

      {/* Sleep/Wake effects */}
      <SleepSequence />
      <WakeSequence />

      {/* Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <TopBar />
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel */}
        <motion.div
          className="w-72 flex-shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: systemState === 'sleeping' ? 0.3 : 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <LeftPanel />
        </motion.div>

        {/* Center - 3D Scene placeholder */}
        <motion.div
          className="flex-1 relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: systemState === 'sleeping' ? 0.3 : 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-16 h-16">
            <div className="absolute top-0 left-0 w-8 h-[2px] bg-jarvis-primary/60" />
            <div className="absolute top-0 left-0 w-[2px] h-8 bg-jarvis-primary/60" />
          </div>
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-0 right-0 w-8 h-[2px] bg-jarvis-primary/60" />
            <div className="absolute top-0 right-0 w-[2px] h-8 bg-jarvis-primary/60" />
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16">
            <div className="absolute bottom-0 left-0 w-8 h-[2px] bg-jarvis-primary/60" />
            <div className="absolute bottom-0 left-0 w-[2px] h-8 bg-jarvis-primary/60" />
          </div>
          <div className="absolute bottom-0 right-0 w-16 h-16">
            <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-jarvis-primary/60" />
            <div className="absolute bottom-0 right-0 w-[2px] h-8 bg-jarvis-primary/60" />
          </div>

          {/* Mini arc reactor indicators at corners */}
          <CornerReactor position="top-left" />
          <CornerReactor position="top-right" />
          <CornerReactor position="bottom-left" />
          <CornerReactor position="bottom-right" />
        </motion.div>

        {/* Right Panel */}
        <motion.div
          className="w-72 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: systemState === 'sleeping' ? 0.3 : 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <RightPanel />
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <BottomBar />
      </motion.div>

      {/* Dialogue Overlay */}
      <DialogueOverlay />
    </div>
  );
};

// Corner reactor mini component
const CornerReactor = ({ position }) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={`absolute ${positionClasses[position]} w-8 h-8`}>
      <div className="relative w-full h-full">
        {/* Outer ring */}
        <div className="absolute inset-0 border-2 border-jarvis-primary/40 rounded-full animate-spin-slow" />

        {/* Inner glow */}
        <div className="absolute inset-2 bg-jarvis-primary/60 rounded-full shadow-[0_0_10px_#00D4FF] animate-pulse" />
      </div>
    </div>
  );
};
