import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HologramScene from './components/three/HologramScene';
import { useJarvisStore } from './store/jarvisStore';
import { useJarvisVoice } from './hooks/useJarvisVoice';
import { MinimalHUD } from './components/hud/MinimalHUD';
import { DialogueOverlay } from './components/dialogue/DialogueOverlay';
import { OnboardingModal } from './components/OnboardingModal';

function App() {
  const systemState = useJarvisStore((state) => state.systemState);
  const setSystemState = useJarvisStore((state) => state.setSystemState);
  const lastInteraction = useJarvisStore((state) => state.lastInteraction);
  const triggerIdleDialogue = useJarvisStore((state) => state.triggerIdleDialogue);

  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useJarvisVoice();

  // Idle behavior
  useEffect(() => {
    if (systemState !== 'active') return;

    const interval = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastInteraction;
      if (timeSinceInteraction > 30000 && Math.random() > 0.7) {
        triggerIdleDialogue();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [systemState, lastInteraction, triggerIdleDialogue]);

  const handleInitialize = useCallback(() => {
    setShowOnboarding(false);
    setIsInitialized(true);
    setSystemState('booting');

    // Simulate boot completion after animation
    setTimeout(() => {
      setSystemState('active');
    }, 3000);
  }, [setSystemState]);

  return (
    <div className="relative w-full h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] via-[#0a0a0f] to-[#050508]" />

      {/* Ambient glow behind hologram */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      {/* 3D Hologram Scene */}
      <HologramScene />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {showOnboarding ? (
          <OnboardingModal key="onboarding" onStart={handleInitialize} />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 w-full h-full"
          >
            <MinimalHUD />
            <DialogueOverlay />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
