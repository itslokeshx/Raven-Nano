import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSoundEngine } from "../hooks/useSoundEngine";

export const OnboardingModal = ({ onStart }) => {
  const [isPressed, setIsPressed] = useState(false);
  const { initialize } = useSoundEngine();

  const handleClick = useCallback(async () => {
    await initialize();
    onStart();
  }, [initialize, onStart]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-12">
        {/* Orb */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative"
        >
          {/* Outer rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border border-white/[0.03]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 rounded-full border border-white/[0.02]"
          />

          {/* Core orb */}
          <motion.button
            onClick={handleClick}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-28 h-28 rounded-full flex items-center justify-center"
          >
            {/* Border */}
            <div className="absolute inset-0 rounded-full border border-white/10 transition-colors duration-300 hover:border-cyan-400/30" />

            {/* Inner glow */}
            <motion.div
              animate={{
                background: isPressed
                  ? "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
              }}
              className="absolute inset-2 rounded-full"
            />

            {/* Mic icon */}
            <svg
              className="relative w-9 h-9 text-white/25 transition-colors duration-300 hover:text-cyan-400/80"
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
        </motion.div>

        {/* Text */}
        <div className="flex flex-col items-center gap-4">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[15px] text-white/70 font-light tracking-[0.4em] uppercase"
          >
            Jarvis
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] text-white/20 font-medium tracking-[0.25em] uppercase"
          >
            Voice Interface
          </motion.p>
        </div>

        {/* Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-1 rounded-full bg-cyan-400/50"
          />
          <span className="text-[10px] text-white/15 font-medium tracking-[0.2em] uppercase">
            Tap to begin
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};