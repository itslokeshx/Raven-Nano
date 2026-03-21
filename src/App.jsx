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
  const soundEngine = useSoundEngine();

  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useJarvisVoice();

  useEffect(() => {
    if (!isInitialized) return;

    const handleUserGesture = () => {
      soundEngine.initialize();
    };

    document.addEventListener("click", handleUserGesture, { once: true });
    document.addEventListener("keydown", handleUserGesture, { once: true });

    return () => {
      document.removeEventListener("click", handleUserGesture);
      document.removeEventListener("keydown", handleUserGesture);
    };
  }, [isInitialized, soundEngine.initialize]);

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

  const handleInitialize = useCallback(() => {
    setShowOnboarding(false);
    setIsInitialized(true);
    setSystemState("booting");

    setTimeout(() => {
      setSystemState("active");
    }, 1500);
  }, [setSystemState]);

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