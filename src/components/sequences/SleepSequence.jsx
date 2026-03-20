import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '../../store/jarvisStore';
import { useSoundEngine } from '../../hooks/useSoundEngine';
import { getRandomDialogue } from '../../data/dialogueLines';

export const SleepSequence = () => {
  const systemState = useJarvisStore((state) => state.systemState);
  const speak = useJarvisStore((state) => state.speak);

  const { playShutdown } = useSoundEngine();

  const [showOverlay, setShowOverlay] = useState(false);
  const [sleepText, setSleepText] = useState('');

  useEffect(() => {
    if (systemState === 'sleeping') {
      // Show sleep overlay
      setShowOverlay(true);

      // Play sleep sound
      playShutdown();

      // Get sleep dialogue
      const sleepLine = getRandomDialogue('SLEEP');
      if (sleepLine) {
        speak(sleepLine.text, { category: 'sleep', priority: sleepLine.priority });
        setSleepText(sleepLine.text);
      }
    } else {
      setShowOverlay(false);
      setSleepText('');
    }
  }, [systemState, speak, playShutdown]);

  if (!showOverlay) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className="fixed inset-0 z-40 pointer-events-none"
      >
        {/* Dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />

        {/* Low power mode text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
        >
          <div className="text-jarvis-secondary/60 font-orbitron text-2xl tracking-[0.5em] mb-4">
            LOW POWER MODE
          </div>
          <div className="text-jarvis-primary/40 font-rajdhani text-lg">
            {sleepText}
          </div>
        </motion.div>

        {/* Corner indicators dimmed */}
        <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-jarvis-primary/20" />
        <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-jarvis-primary/20" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-jarvis-primary/20" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-jarvis-primary/20" />
      </motion.div>
    </AnimatePresence>
  );
};
