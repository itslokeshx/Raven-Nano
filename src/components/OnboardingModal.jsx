import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useSoundEngine } from "../hooks/useSoundEngine";

export const OnboardingModal = ({ onStart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { initialize } = useSoundEngine();

  const handleClick = useCallback(async () => {
    // Initialize audio context on user gesture
    await initialize();

    // Warm up Puter.js TTS
    if (window.puter?.ai?.txt2speech) {
      // Pre-initialize Puter
    }

    onStart();
  }, [initialize, onStart]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <div className="text-center">
        {/* Orb */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-10"
        >
          <div className="relative w-20 h-20 mx-auto">
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-cyan-400/20"
            />
            {/* Inner ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border border-cyan-400/10"
            />
            {/* Center */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-b from-cyan-400/20 to-transparent flex items-center justify-center">
              <span className="text-2xl text-cyan-400/80">◈</span>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-light text-white/80 tracking-[0.3em] mb-2"
        >
          JARVIS
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/20 text-xs tracking-[0.15em] mb-16"
        >
          VOICE INTERFACE
        </motion.p>

        {/* Start Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
        >
          {/* Button border */}
          <div
            className={`absolute inset-0 rounded-full border transition-all duration-300 ${
              isHovered ? "border-cyan-400/40" : "border-white/10"
            }`}
          />
          {/* Inner glow on hover */}
          <div
            className={`absolute inset-2 rounded-full transition-all duration-300 ${
              isHovered ? "bg-cyan-400/10" : "bg-transparent"
            }`}
          />
          {/* Mic icon */}
          <svg
            className={`w-6 h-6 transition-colors duration-300 ${
              isHovered ? "text-cyan-400" : "text-white/30"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </motion.button>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-white/10 text-xs tracking-wider"
        >
          Tap to begin
        </motion.p>
      </div>
    </motion.div>
  );
};