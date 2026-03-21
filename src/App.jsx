import React, { useEffect, useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useJarvisStore } from "./store/jarvisStore";
import { useJarvisVoice } from "./hooks/useJarvisVoice";
import { useSoundEngine } from "./hooks/useSoundEngine";
import { MinimalHUD } from "./components/hud/MinimalHUD";
import { OnboardingModal } from "./components/OnboardingModal";

function App() {
  const systemState = useJarvisStore((state) => state.systemState);
  const setSystemState = useJarvisStore((state) => state.setSystemState);
  const lastInteraction = useJarvisStore((state) => state.lastInteraction);
  const triggerIdleDialogue = useJarvisStore(
    (state) => state.triggerIdleDialogue,
  );
  const { initialize: initSound, playWakeUp } = useSoundEngine();
  const { initialize: initVoice } = useJarvisVoice();

  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    const handleUserGesture = () => {
      initSound();
      initVoice();
    };

    document.addEventListener("click", handleUserGesture, { once: true });
    document.addEventListener("keydown", handleUserGesture, { once: true });

    return () => {
      document.removeEventListener("click", handleUserGesture);
      document.removeEventListener("keydown", handleUserGesture);
    };
  }, [isInitialized, initSound, initVoice]);

  useEffect(() => {
    if (systemState !== "active") return;

    const interval = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastInteraction;
      if (timeSinceInteraction > 30000 && Math.random() > 0.7) {
        triggerIdleDialogue();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [systemState, lastInteraction, triggerIdleDialogue]);

  const handleInitialize = useCallback(async () => {
    // Initialize audio FIRST (user gesture required)
    await Promise.all([initSound(), initVoice()]);

    setShowOnboarding(false);
    setIsInitialized(true);
    setSystemState("booting");

    // Play boot sound
    setTimeout(() => playWakeUp(), 100);

    setTimeout(() => {
      setSystemState("active");
    }, 1500);
  }, [setSystemState, initSound, initVoice, playWakeUp]);

  return (
    <div className="fixed inset-0 bg-black">
      <AnimatePresence mode="wait">
        {showOnboarding ? (
          <OnboardingModal key="onboarding" onStart={handleInitialize} />
        ) : (
          <MinimalHUD key="main" />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;