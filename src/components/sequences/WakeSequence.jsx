import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '../../store/jarvisStore';
import { useSoundEngine } from '../../hooks/useSoundEngine';

export const WakeSequence = () => {
  const systemState = useJarvisStore((state) => state.systemState);

  const { playWakeUp } = useSoundEngine();

  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (systemState === 'active') {
      // Play wake sound
      playWakeUp();

      // Flash effect
      setShowFlash(true);
      const timeout = setTimeout(() => {
        setShowFlash(false);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [systemState, playWakeUp]);

  if (!showFlash) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, times: [0, 0.3, 1] }}
        className="fixed inset-0 z-50 pointer-events-none bg-white"
      />
    </AnimatePresence>
  );
};
