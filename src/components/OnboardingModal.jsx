import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { useSoundEngine } from "../hooks/useSoundEngine";
import { useJarvisVoice } from "../hooks/useJarvisVoice";

export const OnboardingModal = ({ onStart }) => {
  const { initialize: initSound } = useSoundEngine();
  const { initialize: initVoice } = useJarvisVoice();

  const handleClick = useCallback(async () => {
    // Initialize both audio systems on user gesture
    await Promise.all([initSound(), initVoice()]);
    onStart();
  }, [initSound, initVoice, onStart]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-16">
        {/* Logo */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Mark */}
          <div className="relative flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            </motion.div>
          </div>

          {/* Wordmark */}
          <div className="flex flex-col items-center gap-2">
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-[13px] text-white/80 font-medium tracking-[0.5em] uppercase"
            >
              Jarvis
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-[9px] text-white/30 font-medium tracking-[0.3em] uppercase"
            >
              Voice Interface
            </motion.p>
          </div>
        </motion.div>

        {/* Start button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={handleClick}
          className="group flex flex-col items-center gap-4"
        >
          <div className="relative w-14 h-14 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-white/10 transition-colors group-hover:border-white/20" />
            <div className="absolute inset-1 rounded-full border border-white/[0.04]" />
            <svg
              className="relative w-5 h-5 transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
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
          </div>
          <span className="text-[10px] text-white/25 font-medium tracking-[0.2em] uppercase group-hover:text-white/40 transition-colors">
            Tap to begin
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};