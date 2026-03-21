import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [displayText, setDisplayText] = useState("");
  const typingRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Typewriter effect for dialogue
  useEffect(() => {
    if (!currentDialogue?.text) {
      setDisplayText("");
      return;
    }

    const text = currentDialogue.text;
    let i = 0;
    setDisplayText("");

    typingRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingRef.current);
      }
    }, 25);

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [currentDialogue]);

  const handleMicToggle = useCallback(() => {
    playButtonClick();
    if (isSupported && systemState === "active") {
      setIsListening(!isListening);
    }
  }, [isListening, isSupported, systemState, playButtonClick, setIsListening]);

  const isActive = systemState === "active";
  const isVoiceActive = isListening || isJarvisSpeaking;

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                scale: isActive ? [1, 1.2, 1] : 1,
                opacity: isActive ? 1 : 0.4,
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-cyan-400"
              style={{ boxShadow: isActive ? "0 0 12px #22d3ee" : "none" }}
            />
          </div>
          <span className="text-[11px] text-white/40 font-medium tracking-[0.25em] uppercase">
            {isActive ? "Online" : "Standby"}
          </span>
        </div>

        <div className="text-[13px] text-white/25 font-light tracking-widest tabular-nums">
          {time.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </header>

      {/* Center - Voice Interface */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-8">
          {/* Glow background */}
          <AnimatePresence>
            {isVoiceActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.4 }}
                className="absolute w-80 h-80 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Orbital rings */}
          <div className="absolute w-72 h-72 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-white/[0.03]"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 rounded-full border border-white/[0.02]"
            />
          </div>

          {/* Main orb */}
          <motion.button
            onClick={handleMicToggle}
            disabled={!isSupported || !isActive}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-24 h-24 rounded-full flex items-center justify-center group"
          >
            {/* Outer ring */}
            <motion.div
              animate={{
                borderColor: isListening
                  ? "rgba(34,211,238,0.4)"
                  : isJarvisSpeaking
                    ? "rgba(34,211,238,0.25)"
                    : "rgba(255,255,255,0.08)",
              }}
              className="absolute inset-0 rounded-full border transition-colors duration-500"
            />

            {/* Inner ring */}
            <div className="absolute inset-3 rounded-full border border-white/[0.05] transition-all duration-500 group-hover:border-white/[0.1]" />

            {/* Core */}
            <motion.div
              animate={{
                background: isListening
                  ? "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)",
              }}
              className="absolute inset-6 rounded-full"
            />

            {/* Pulse rings when active */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-cyan-400/30"
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 rounded-full border border-cyan-400/20"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Mic icon */}
            <svg
              className={`relative z-10 w-8 h-8 transition-all duration-300 ${
                isListening
                  ? "text-cyan-400"
                  : isJarvisSpeaking
                    ? "text-cyan-400/80"
                    : "text-white/30 group-hover:text-white/50"
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

          {/* Interim transcript */}
          <AnimatePresence>
            {interimTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-32 text-center px-6"
              >
                <p className="text-cyan-400/70 text-sm font-light tracking-wide max-w-xs">
                  "{interimTranscript}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Response text */}
          <div className="min-h-[4rem] flex items-center justify-center px-6">
            <AnimatePresence mode="wait">
              {displayText && (
                <motion.p
                  key={displayText}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-white/70 text-center font-light tracking-wide leading-relaxed max-w-md"
                >
                  {displayText}
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-[2px] h-4 bg-cyan-400/50 ml-0.5 align-middle"
                  />
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <footer className="flex flex-col items-center pb-8 gap-3">
        <p className="text-[11px] text-white/20 font-medium tracking-[0.2em] uppercase">
          {isListening
            ? "Listening"
            : isJarvisSpeaking
              ? "Speaking"
              : isActive
                ? "Tap to speak"
                : "Say \"Hey Jarvis\""}
        </p>
      </footer>
    </div>
  );
};