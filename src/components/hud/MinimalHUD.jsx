import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJarvisStore } from "../../store/jarvisStore";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { useSoundEngine } from "../../hooks/useSoundEngine";

export const MinimalHUD = () => {
  const systemState = useJarvisStore((state) => state.systemState);
  const isJarvisSpeaking = useJarvisStore((state) => state.isJarvisSpeaking);
  const isListening = useJarvisStore((state) => state.isListening);
  const setIsListening = useJarvisStore((state) => state.setIsListening);
  const currentDialogue = useJarvisStore((state) => state.currentDialogue);

  const { playButtonClick } = useSoundEngine();
  const { isSupported, interimTranscript } = useVoiceRecognition();

  const [time, setTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMicToggle = useCallback(() => {
    playButtonClick();
    if (isSupported && systemState === "active") {
      setIsListening(!isListening);
    }
  }, [isListening, isSupported, systemState, playButtonClick, setIsListening]);

  const isActive = systemState === "active";
  const isVoiceActive = isListening || isJarvisSpeaking;

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Top Bar - Ultra minimal */}
      <header className="flex items-center justify-between px-6 py-4">
        {/* Status dot */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{
                backgroundColor: isActive ? "#22d3ee" : "#ffffff33",
                boxShadow: isActive ? "0 0 12px rgba(34,211,238,0.6)" : "none",
              }}
              className="w-2 h-2 rounded-full"
            />
            {isActive && (
              <motion.div
                animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border border-cyan-400/50"
              />
            )}
          </div>
          <span className="text-white/30 text-xs tracking-[0.2em] uppercase font-light">
            {isActive ? "ONLINE" : "STANDBY"}
          </span>
        </div>

        {/* Time */}
        <div className="text-white/20 text-xs font-light tabular-nums tracking-wider">
          {time.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </header>

      {/* Center - Voice Orb */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Outer glow rings */}
          <AnimatePresence>
            {isVoiceActive && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: 0.3 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 -m-12 rounded-full border border-cyan-400/20"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.6, opacity: 0.2 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="absolute inset-0 -m-20 rounded-full border border-cyan-400/10"
                />
              </>
            )}
          </AnimatePresence>

          {/* Main orb */}
          <motion.button
            onClick={handleMicToggle}
            disabled={!isSupported || !isActive}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500"
            style={{
              background: isListening
                ? "radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)"
                : "transparent",
            }}
          >
            {/* Orb border */}
            <div
              className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                isListening
                  ? "border-cyan-400/50"
                  : isJarvisSpeaking
                    ? "border-cyan-400/30"
                    : "border-white/10"
              }`}
            />

            {/* Inner glow */}
            <motion.div
              animate={{
                opacity: isVoiceActive ? 1 : 0.3,
              }}
              className="absolute inset-2 rounded-full bg-gradient-to-b from-white/5 to-transparent"
            />

            {/* Mic icon */}
            <svg
              className={`w-7 h-7 transition-colors duration-300 ${
                isListening
                  ? "text-cyan-400"
                  : isJarvisSpeaking
                    ? "text-cyan-400/70"
                    : "text-white/40"
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

            {/* Pulsing ring when listening */}
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
              />
            )}
          </motion.button>

          {/* Interim transcript - appears above orb */}
          <AnimatePresence>
            {interimTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <p className="text-cyan-400/70 text-sm font-light tracking-wide">
                  {interimTranscript}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current dialogue text - appears below orb */}
          <AnimatePresence>
            {currentDialogue?.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -bottom-20 left-1/2 -translate-x-1/2 max-w-xs"
              >
                <p className="text-white/60 text-sm font-light tracking-wide text-center leading-relaxed">
                  {currentDialogue.text}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom - Hint text */}
      <footer className="flex items-center justify-center pb-8">
        <p className="text-white/15 text-xs tracking-[0.15em] uppercase font-light">
          {isListening
            ? "Listening..."
            : isJarvisSpeaking
              ? "Speaking..."
              : isActive
                ? "Tap to speak"
                : "Say \"Hey Jarvis\""}
        </p>
      </footer>
    </div>
  );
};