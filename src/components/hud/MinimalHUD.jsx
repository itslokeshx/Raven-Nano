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
    }, 30);

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
      {/* Top Bar */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-[3px] h-3 bg-white/90 rounded-full" />
            <span className="text-[11px] text-white/70 font-medium tracking-[0.3em] uppercase">
              Jarvis
            </span>
          </div>
        </div>

        {/* Status + Time */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                backgroundColor: isActive ? "#22d3ee" : "rgba(255,255,255,0.2)",
              }}
              className="w-1.5 h-1.5 rounded-full"
            />
            <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase">
              {isActive ? "Active" : "Standby"}
            </span>
          </div>
          <div className="text-[13px] text-white/30 font-light tracking-widest tabular-nums">
            {time.toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </header>

      {/* Center - Voice Interface */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative flex flex-col items-center">
          {/* Ambient glow */}
          <AnimatePresence>
            {isVoiceActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute w-[300px] h-[300px] pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 60%)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Main orb */}
          <motion.button
            onClick={handleMicToggle}
            disabled={!isSupported || !isActive}
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full border transition-colors duration-300"
              style={{
                borderColor: isListening
                  ? "rgba(34,211,238,0.4)"
                  : "rgba(255,255,255,0.08)",
              }}
            />

            {/* Inner ring */}
            <div className="absolute inset-2 rounded-full border border-white/[0.04]" />

            {/* Core */}
            <motion.div
              animate={{
                scale: isListening ? [1, 1.02, 1] : 1,
              }}
              transition={{ duration: 1.5, repeat: isListening ? Infinity : 0 }}
              className="absolute inset-4 rounded-full"
              style={{
                background: isListening
                  ? "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
              }}
            />

            {/* Pulse rings */}
            <AnimatePresence>
              {isListening && (
                <>
                  <motion.div
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border border-cyan-400/20"
                  />
                  <motion.div
                    initial={{ scale: 1, opacity: 0.2 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                    className="absolute inset-0 rounded-full border border-cyan-400/10"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Mic icon */}
            <svg
              className="relative z-10 w-6 h-6 transition-colors duration-300"
              style={{
                color: isListening
                  ? "rgba(34,211,238,0.9)"
                  : isJarvisSpeaking
                    ? "rgba(34,211,238,0.7)"
                    : "rgba(255,255,255,0.35)",
              }}
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
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="mt-8 text-center px-8"
              >
                <p className="text-sm text-cyan-400/60 font-light tracking-wide">
                  "{interimTranscript}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Response */}
          <div className="mt-8 min-h-[3rem] flex items-center justify-center px-8">
            <AnimatePresence mode="wait">
              {displayText && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-center font-light tracking-wide leading-relaxed max-w-lg"
                  style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px" }}
                >
                  {displayText}
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-[2px] h-4 ml-0.5 align-middle"
                    style={{ backgroundColor: "rgba(34,211,238,0.5)" }}
                  />
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <footer className="pb-8 text-center">
        <p
          className="text-[10px] font-medium tracking-[0.25em] uppercase"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
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