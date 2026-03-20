import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '../../store/jarvisStore';
import { VoiceWaveform } from './VoiceWaveform';

export const DialogueOverlay = () => {
  const currentDialogue = useJarvisStore((state) => state.currentDialogue);
  const isJarvisSpeaking = useJarvisStore((state) => state.isJarvisSpeaking);
  const clearDialogue = useJarvisStore((state) => state.clearDialogue);
  const aiLoading = useJarvisStore((state) => state.aiLoading);

  const [displayText, setDisplayText] = useState('');

  // Typewriter effect
  useEffect(() => {
    if (!currentDialogue) {
      setDisplayText('');
      return;
    }

    const { text } = currentDialogue;
    let currentIndex = 0;
    setDisplayText('');

    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        // Auto-clear after delay
        setTimeout(() => {
          clearDialogue();
        }, 4000);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [currentDialogue, clearDialogue]);

  return (
    <AnimatePresence>
      {/* Speaking Indicator - Center Display */}
      {currentDialogue && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
        >
          {/* Ambient glow ring */}
          <div className={`absolute w-[500px] h-[500px] rounded-full transition-all duration-500 ${
            isJarvisSpeaking
              ? 'bg-gradient-radial from-cyan-500/20 via-blue-500/10 to-transparent blur-3xl'
              : 'bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl'
          }`} />

          {/* Main content container */}
          <div className="relative flex flex-col items-center gap-6 max-w-3xl px-8">
            {/* Waveform display */}
            <div className={`transition-all duration-500 ${
              isJarvisSpeaking ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
            }`}>
              <VoiceWaveform isActive={isJarvisSpeaking} barCount={16} />
            </div>

            {/* Dialogue text panel */}
            <div className="relative">
              <div className="bg-[#0d1117]/80 backdrop-blur-2xl border border-cyan-500/20 rounded-2xl px-8 py-5 shadow-2xl shadow-cyan-500/10">
                {/* Top accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                {/* Text content */}
                <p className="text-white/90 text-base leading-relaxed font-light tracking-wide text-center min-w-[300px]"
                >
                  {displayText}
                  {isJarvisSpeaking && displayText.length < (currentDialogue?.text?.length || 0) && (
                    <span className="inline-block w-px h-5 bg-cyan-400/80 ml-0.5 animate-pulse" />
                  )}
                </p>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              </div>

              {/* Side glow accents */}
              <div className={`absolute top-1/2 -left-4 -translate-y-1/2 w-2 h-16 bg-gradient-to-b from-cyan-500/40 to-blue-500/40 rounded-full blur-sm transition-opacity duration-300 ${
                isJarvisSpeaking ? 'opacity-100' : 'opacity-30'
              }`} />
              <div className={`absolute top-1/2 -right-4 -translate-y-1/2 w-2 h-16 bg-gradient-to-b from-cyan-500/40 to-blue-500/40 rounded-full blur-sm transition-opacity duration-300 ${
                isJarvisSpeaking ? 'opacity-100' : 'opacity-30'
              }`} />
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              {aiLoading && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
                />
              )}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 ${
                isJarvisSpeaking ? 'opacity-100' : 'opacity-60'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isJarvisSpeaking ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-500/40'
                }`} />
                <span className="text-xs text-cyan-200/70 font-light tracking-wide">
                  {aiLoading ? 'PROCESSING' : isJarvisSpeaking ? 'SPEAKING' : 'STANDBY'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
