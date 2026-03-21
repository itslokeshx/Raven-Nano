import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJarvisStore } from "../../store/jarvisStore";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";
import { useSoundEngine } from "../../hooks/useSoundEngine";
import { VoiceVisualizer } from "./VoiceVisualizer";

export const MinimalHUD = () => {
  const systemState = useJarvisStore((state) => state.systemState);
  const isJarvisSpeaking = useJarvisStore((state) => state.isJarvisSpeaking);
  const isListening = useJarvisStore((state) => state.isListening);
  const setIsListening = useJarvisStore((state) => state.setIsListening);
  const currentDialogue = useJarvisStore((state) => state.currentDialogue);

  const { playButtonClick, initialize: initAudio } = useSoundEngine();
  const { isSupported, interimTranscript } = useVoiceRecognition();

  const [displayText, setDisplayText] = useState("");
  const [audioInitialized, setAudioInitialized] = useState(false);
  const typingRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize audio on first interaction
  const initializeAudio = useCallback(async () => {
    if (audioInitialized) return;
    await initAudio();
    setAudioInitialized(true);
    console.log("✓ Audio system initialized");
  }, [audioInitialized, initAudio]);

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

  const handleContainerClick = useCallback(async () => {
    await initializeAudio();

    if (!isSupported || systemState !== "active") return;

    // Toggle listening state (voice recognition hook manages the rest)
    playButtonClick();
    setIsListening(!isListening);
  }, [initializeAudio, isSupported, systemState, isListening, setIsListening, playButtonClick]);

  const isVoiceActive = isListening || isJarvisSpeaking;
  const showIdle = !isVoiceActive && !displayText && !interimTranscript;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col overflow-hidden cursor-pointer"
      onClick={handleContainerClick}
      style={{
        background: "radial-gradient(ellipse at center, #0a1628 0%, #000000 100%)",
      }}
    >
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        animate={{
          opacity: isVoiceActive ? [0.1, 0.2, 0.1] : 0.05,
          scale: isVoiceActive ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 50%)",
        }}
      />

      {/* Secondary ambient */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        animate={{
          opacity: isVoiceActive ? [0.05, 0.15, 0.05] : 0.03,
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 50%)",
        }}
      />

      {/* Top Section - User Input Display */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-8">
        <AnimatePresence mode="wait">
          {interimTranscript && isListening && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center px-8"
            >
              <p className="text-cyan-300/80 text-2xl font-light tracking-wide">
                "{interimTranscript}"
              </p>
            </motion.div>
          )}

          {showIdle && (
            <motion.div
              key="idle-top"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-white/30 text-sm tracking-[0.3em] uppercase font-light">
                Tap anywhere to speak
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center Section - Orb */}
      <div className="relative z-10 flex items-center justify-center py-4">
        <div className="relative">
          {/* Outer glow rings */}
          <AnimatePresence>
            {isVoiceActive && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ scale: 1, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border border-cyan-400/30"
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  exit={{ scale: 1, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 rounded-full border border-cyan-400/20"
                />
              </>
            )}
          </AnimatePresence>

          {/* Main orb */}
          <motion.div
            className="relative w-32 h-32 rounded-full flex items-center justify-center"
            animate={{
              scale: isListening ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 1.2, repeat: isListening ? Infinity : 0 }}
          >
            {/* Orb background */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: isVoiceActive
                  ? "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0.05) 50%, transparent 70%)"
                  : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 50%, transparent 70%)",
                boxShadow: isVoiceActive
                  ? "inset 0 0 60px rgba(34,211,238,0.2), 0 0 80px rgba(34,211,238,0.1)"
                  : "inset 0 0 40px rgba(255,255,255,0.05)",
              }}
            />

            {/* Inner ring */}
            <div
              className="absolute inset-3 rounded-full border opacity-50"
              style={{
                borderColor: isVoiceActive
                  ? "rgba(34,211,238,0.3)"
                  : "rgba(255,255,255,0.1)",
              }}
            />

            {/* Voice visualizer */}
            <VoiceVisualizer isActive={isVoiceActive} isSpeaking={isJarvisSpeaking} />

            {/* Center dot */}
            <motion.div
              className="absolute w-2.5 h-2.5 rounded-full"
              animate={{
                backgroundColor: isVoiceActive
                  ? "rgba(34,211,238,0.9)"
                  : "rgba(255,255,255,0.5)",
                scale: isVoiceActive ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 1, repeat: isVoiceActive ? Infinity : 0 }}
              style={{
                boxShadow: isVoiceActive
                  ? "0 0 20px rgba(34,211,238,0.8)"
                  : "0 0 10px rgba(255,255,255,0.3)",
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom Section - JARVIS Response */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-8 px-8">
        {/* Status indicator */}
        <AnimatePresence mode="wait">
          {showIdle ? (
            <motion.div
              key="idle-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-cyan-400/60 text-xs tracking-[0.3em] uppercase font-light">
                Online
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="active-status"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                animate={{
                  backgroundColor: isVoiceActive ? "#22d3ee" : "rgba(255,255,255,0.3)",
                }}
              />
              <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase">
                {isListening ? "Listening" : isJarvisSpeaking ? "Speaking" : "Ready"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response text */}
        <div className="max-w-2xl text-center">
          <AnimatePresence mode="wait">
            {displayText && (
              <motion.div
                key="response"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-white/90 text-xl md:text-2xl font-light tracking-wide leading-relaxed">
                  {displayText}
                  {isJarvisSpeaking && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-0.5 h-6 ml-1 align-middle bg-cyan-400"
                    />
                  )}
                </p>
              </motion.div>
            )}

            {showIdle && (
              <motion.div
                key="idle-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center mt-4"
              >
                <p className="text-white/20 text-xs tracking-[0.15em]">
                  or say "Hey JARVIS"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l border-t border-white/10" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r border-t border-white/10" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-white/10" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-white/10" />
    </div>
  );
};
