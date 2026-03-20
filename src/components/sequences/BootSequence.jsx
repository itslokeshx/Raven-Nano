import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '../../store/jarvisStore';
import { useSoundEngine } from '../../hooks/useSoundEngine';

export const BootSequence = ({ onComplete }) => {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [glitching, setGlitching] = useState(false);

  const setSystemState = useJarvisStore((state) => state.setSystemState);
  const speak = useJarvisStore((state) => state.speak);

  const { playBootSound, initialize } = useSoundEngine();

  useEffect(() => {
    // Initialize audio context
    initialize();

    // Boot sequence timing
    // 0-0.5s: Pure black screen
    // 0.5-1.5s: Stark Industries logo fades in
    // 1.5-2s: Logo glitches
    // 2-4s: Scan line sweeps, progress bar
    // 4-5s: Scene ready
    // 5-7s: Boot dialogue
    // 7s+: Boot complete

    const timeouts = [];

    // 0.5s - Show logo
    timeouts.push(
      setTimeout(() => {
        setShowLogo(true);
        playBootSound();
      }, 500)
    );

    // 1.5s - Glitch effect
    timeouts.push(
      setTimeout(() => {
        setGlitching(true);
        setTimeout(() => setGlitching(false), 300);
      }, 1500)
    );

    // 2s - Start progress
    timeouts.push(
      setTimeout(() => {
        setStage(1);
      }, 2000)
    );

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.5;
      });
    }, 50);

    // 5s - Ready state
    timeouts.push(
      setTimeout(() => {
        setStage(2);
        speak("JARVIS online. All systems initializing.", { category: 'boot', priority: 'high' });
      }, 5000)
    );

    // 6s - More dialogue
    timeouts.push(
      setTimeout(() => {
        speak("Good morning. I've been running diagnostics. You'll be pleased to know everything is functioning at peak efficiency.", { category: 'boot', priority: 'high' });
      }, 6500)
    );

    // 7s - Boot complete
    timeouts.push(
      setTimeout(() => {
        setStage(3);
        setSystemState('active');
        if (onComplete) onComplete();
      }, 8000)
    );

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, [setSystemState, speak, onComplete, playBootSound, initialize]);

  return (
    <AnimatePresence>
      {stage < 3 && (
        <motion.div
          className="fixed inset-0 z-[100] bg-jarvis-background flex flex-col items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <AnimatePresence>
            {showLogo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className={`flex flex-col items-center gap-8 ${glitching ? 'animate-glitch' : ''}`}
              >
                {/* Stark Industries Logo */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 border-4 border-jarvis-primary rounded-lg flex items-center justify-center shadow-[0_0_40px_rgba(0,212,255,0.5)]">
                    <span className="text-jarvis-primary font-orbitron font-bold text-5xl">◈</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-jarvis-primary font-orbitron font-bold text-4xl tracking-wider glow-text">
                      STARK
                    </span>
                    <span className="text-jarvis-secondary text-xl font-rajdhani tracking-[0.5em]">
                      INDUSTRIES
                    </span>
                  </div>
                </div>

                {/* Loading Text */}
                {stage >= 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 w-96"
                  >
                    <div className="flex justify-between w-full text-jarvis-secondary font-mono text-sm">
                      <span>Initializing systems...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-jarvis-panel rounded-full overflow-hidden border border-jarvis-primary/30">
                      <motion.div
                        className="h-full bg-gradient-to-r from-jarvis-primary to-jarvis-accent shadow-[0_0_10px_#00D4FF]"
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>

                    {/* Status Messages */}
                    <div className="h-6">
                      {progress > 20 && progress < 40 && (
                        <span className="text-jarvis-primary/60 font-mono text-xs">Loading core modules...</span>
                      )}
                      {progress >= 40 && progress < 60 && (
                        <span className="text-jarvis-primary/60 font-mono text-xs">Initializing holographic interface...</span>
                      )}
                      {progress >= 60 && progress < 80 && (
                        <span className="text-jarvis-primary/60 font-mono text-xs">Calibrating sensors...</span>
                      )}
                      {progress >= 80 && (
                        <span className="text-jarvis-primary/60 font-mono text-xs">System ready...</span>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Version */}
                <div className="absolute bottom-8 text-jarvis-secondary/40 font-mono text-xs">
                  MARK VII SYSTEMS v4.2.1
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
