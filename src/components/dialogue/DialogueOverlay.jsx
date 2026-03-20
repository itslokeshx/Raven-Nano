import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJarvisStore } from "../../store/jarvisStore";
import { VoiceWaveform } from "./VoiceWaveform";

export const DialogueOverlay = () => {
  const currentDialogue = useJarvisStore((state) => state.currentDialogue);
  const isJarvisSpeaking = useJarvisStore((state) => state.isJarvisSpeaking);
  const clearDialogue = useJarvisStore((state) => state.clearDialogue);
  const aiLoading = useJarvisStore((state) => state.aiLoading);

  const [displayText, setDisplayText] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Typewriter effect with smooth easing
  useEffect(() => {
    if (!currentDialogue) {
      setDisplayText("");
      setIsMounted(false);
      return;
    }

    setIsMounted(true);
    const { text } = currentDialogue;
    let currentIndex = 0;
    setDisplayText("");

    const typeInterval = setInterval(
      () => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          // Auto-clear after delay
          setTimeout(() => {
            clearDialogue();
          }, 3500);
        }
      },
      prefersReducedMotion ? 5 : 25,
    );

    return () => clearInterval(typeInterval);
  }, [currentDialogue, clearDialogue, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {isMounted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
        >
          {/* Subtle ambient glow */}
          <div
            className={`absolute ${isMobile ? "w-[300px] h-[300px]" : "w-[600px] h-[600px]"} rounded-full transition-all duration-1000 ${
              isJarvisSpeaking
                ? "bg-gradient-radial from-cyan-500/15 via-cyan-500/5 to-transparent blur-3xl"
                : "bg-gradient-radial from-cyan-500/8 via-transparent to-transparent blur-3xl"
            }`}
          />

          {/* Main content container */}
          <div
            className={`relative flex flex-col items-center max-w-2xl ${isMobile ? "gap-4 px-4" : "gap-8 px-8"}`}
          >
            {/* Waveform display */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative"
            >
              {/* Glow ring behind waveform */}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
                  isJarvisSpeaking ? "opacity-100" : "opacity-40"
                }`}
              >
                <div
                  className={`${isMobile ? "w-32 h-8" : "w-48 h-12"} rounded-full bg-cyan-500/5 blur-xl`}
                />
              </div>

              <VoiceWaveform
                isActive={isJarvisSpeaking}
                barCount={isMobile ? 12 : 16}
              />
            </motion.div>

            {/* Dialogue text panel */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="relative"
            >
              {/* Glass panel */}
              <div
                className={`relative bg-[#0d1117]/60 backdrop-blur-2xl border border-cyan-500/15 rounded-xl ${isMobile ? "px-6 py-4" : "px-10 py-6"} shadow-2xl shadow-cyan-500/5`}
              >
                {/* Subtle top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

                {/* Content wrapper */}
                <div className="relative">
                  {/* JARVIS indicator */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <motion.div
                      animate={{
                        scale:
                          !prefersReducedMotion && isJarvisSpeaking
                            ? [1, 1.1, 1]
                            : 1,
                        opacity:
                          !prefersReducedMotion && isJarvisSpeaking
                            ? [0.6, 1, 0.6]
                            : 0.4,
                      }}
                      transition={{
                        duration: 2,
                        repeat:
                          !prefersReducedMotion && isJarvisSpeaking
                            ? Infinity
                            : 0,
                        ease: "easeInOut",
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    />
                  </div>

                  {/* Text */}
                  <p
                    className={`text-white/85 ${isMobile ? "text-base" : "text-lg"} leading-relaxed font-light tracking-wide text-center ${isMobile ? "min-w-[280px]" : "min-w-[320px]"}`}
                  >
                    {displayText}
                    {isJarvisSpeaking &&
                      displayText.length <
                        (currentDialogue?.text?.length || 0) && (
                        <motion.span
                          animate={{
                            opacity: prefersReducedMotion ? 1 : [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: prefersReducedMotion ? 0 : Infinity,
                          }}
                          className="inline-block w-px h-5 bg-cyan-400/60 ml-0.5"
                        />
                      )}
                  </p>
                </div>

                {/* Subtle bottom gradient line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
              </div>

              {/* Side accent glows */}
              <div
                className={`absolute top-1/2 -left-6 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-cyan-400/20 via-cyan-500/30 to-cyan-400/20 rounded-full blur-sm transition-all duration-700 ${
                  isJarvisSpeaking ? "opacity-80" : "opacity-30"
                }`}
              />
              <div
                className={`absolute top-1/2 -right-6 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-cyan-400/20 via-cyan-500/30 to-cyan-400/20 rounded-full blur-sm transition-all duration-700 ${
                  isJarvisSpeaking ? "opacity-80" : "opacity-30"
                }`}
              />
            </motion.div>

            {/* Status indicator */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`flex items-center ${isMobile ? "gap-2" : "gap-3"}`}
            >
              {/* AI loading spinner */}
              {aiLoading && (
                <motion.div
                  animate={{ rotate: prefersReducedMotion ? 0 : 360 }}
                  transition={{
                    duration: 2,
                    repeat: prefersReducedMotion ? 0 : Infinity,
                    ease: "linear",
                  }}
                  className={`${isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} border border-cyan-500/20 border-t-cyan-400 rounded-full`}
                />
              )}

              {/* Status pill */}
              <div
                className={`flex items-center ${isMobile ? "gap-1.5 px-3 py-1" : "gap-2 px-4 py-1.5"} rounded-full bg-white/5 backdrop-blur-sm border border-white/10`}
              >
                <motion.div
                  animate={{
                    backgroundColor: isJarvisSpeaking ? "#22d3ee" : "#0891b2",
                    scale:
                      !prefersReducedMotion && isJarvisSpeaking
                        ? [1, 1.2, 1]
                        : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat:
                      !prefersReducedMotion && isJarvisSpeaking ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                />
                <span
                  className={`${isMobile ? "text-[10px] tracking-[0.14em]" : "text-xs tracking-widest"} text-cyan-200/60 font-light uppercase`}
                >
                  {aiLoading
                    ? "Processing"
                    : isJarvisSpeaking
                      ? "Speaking"
                      : "Standby"}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
