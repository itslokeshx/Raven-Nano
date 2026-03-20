import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useSoundEngine } from "../hooks/useSoundEngine";

export const OnboardingModal = ({ onStart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { initialize } = useSoundEngine();

  const handleClick = useCallback(async () => {
    // Initialize audio context on user gesture (fixes Chrome autoplay policy)
    await initialize();

    // Warm up speech synthesis by loading voices
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    onStart();
  }, [initialize, onStart]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]"
    >
      <div className="text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <div className="w-24 h-24 border border-cyan-500/30 rounded-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-t border-cyan-500/50 rounded-full"
              />
              <span className="text-4xl font-light text-cyan-400">◈</span>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-light text-white/90 tracking-[0.2em] mb-2"
        >
          J.A.R.V.I.S
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/40 text-sm tracking-wider mb-12"
        >
          Just A Rather Very Intelligent System
        </motion.p>

        {/* Start Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative px-8 py-3"
        >
          <span
            className={`
            absolute inset-0 border rounded-full transition-all duration-300
            ${isHovered ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/20"}
          `}
          />
          <span className="relative text-white/70 group-hover:text-cyan-300 transition-colors text-sm tracking-wider">
            Tap to Initialize
          </span>
        </motion.button>

        {/* Subtle note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-white/20 text-xs"
        >
          Voice commands enabled • Microphone access required
        </motion.p>
      </div>
    </motion.div>
  );
};
