import { useCallback, useEffect, useRef, useState } from 'react';
import { useJarvisStore } from '../store/jarvisStore';
import { DIALOGUE } from '../data/dialogueLines';

export const useBootSequence = (onComplete) => {
  const [bootStage, setBootStage] = useState(0);
  const [bootProgress, setBootProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const [showHUD, setShowHUD] = useState(false);
  const [glitching, setGlitching] = useState(false);

  const systemState = useJarvisStore((state) => state.systemState);
  const setSystemState = useJarvisStore((state) => state.setSystemState);
  const speak = useJarvisStore((state) => state.speak);

  const timeoutsRef = useRef([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((fn, delay) => {
    const timeout = setTimeout(fn, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  }, []);

  useEffect(() => {
    if (systemState !== 'booting') return;

    // Boot sequence timing
    // 0-0.5s: Pure black screen
    // 0.5-1.5s: Stark Industries logo fades in
    // 1.5-2s: Logo glitches
    // 2-4s: Scan line sweeps, HUD panels fade in
    // 4-5s: Three.js scene materializes
    // 5-7s: Boot dialogue lines
    // 7s+: Boot complete

    // 0.5s - Show logo
    addTimeout(() => {
      setShowLogo(true);
    }, 500);

    // 1.5s - Glitch effect
    addTimeout(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 300);
    }, 1500);

    // 2s - Start showing HUD
    addTimeout(() => {
      setShowHUD(true);
    }, 2000);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // 4s - Scene ready
    addTimeout(() => {
      setBootStage(1);
    }, 4000);

    // 5s - Start dialogue
    addTimeout(() => {
      setBootStage(2);
      DIALOGUE.BOOT.forEach((line) => {
        addTimeout(() => {
          speak(line.text, { category: 'boot', priority: 'high' });
        }, line.delay);
      });
    }, 5000);

    // 8s - Boot complete
    addTimeout(() => {
      setBootStage(3);
      setSystemState('active');
      if (onComplete) onComplete();
    }, 8000);

    return () => {
      clearInterval(progressInterval);
      clearAllTimeouts();
    };
  }, [systemState, setSystemState, speak, onComplete, addTimeout, clearAllTimeouts]);

  return {
    bootStage,
    bootProgress,
    showLogo,
    showHUD,
    glitching,
    isBooting: systemState === 'booting',
  };
};
