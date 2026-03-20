import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJarvisStore } from '../../store/jarvisStore';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useSoundEngine } from '../../hooks/useSoundEngine';

export const MinimalHUD = () => {
  const systemState = useJarvisStore((state) => state.systemState);
  const isJarvisSpeaking = useJarvisStore((state) => state.isJarvisSpeaking);
  const isListening = useJarvisStore((state) => state.isListening);
  const setIsListening = useJarvisStore((state) => state.setIsListening);
  const handleVoiceCommand = useJarvisStore((state) => state.handleVoiceCommand);
  const triggerAlert = useJarvisStore((state) => state.triggerAlert);

  const { playButtonClick, playAlert } = useSoundEngine();
  const { isSupported, interimTranscript } = useVoiceRecognition();

  const [inputValue, setInputValue] = useState('');
  const [time, setTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleVoiceCommand(inputValue);
      setInputValue('');
    }
  }, [inputValue, handleVoiceCommand]);

  const handleMicToggle = () => {
    playButtonClick();
    if (isSupported && systemState === 'active') {
      setIsListening(!isListening);
    }
  };

  const handleAlert = () => {
    playAlert();
    triggerAlert();
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Top Bar - Minimal */}
      <header className="flex items-center justify-between px-6 py-4 md:px-8 md:py-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`
              w-2 h-2 rounded-full transition-all duration-500
              ${systemState === 'active' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-white/30'}
            `} />
            {systemState === 'active' && (
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border border-cyan-400/50"
              />
            )}
          </div>
          <span className="text-white/50 text-xs tracking-[0.2em] uppercase">
            {systemState === 'active' ? 'Online' : 'Standby'}
          </span>
        </div>

        <div className="text-white/30 font-light text-sm tabular-nums">
          {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      {/* Center - Hologram placeholder */}
      <div className="flex-1 flex items-center justify-center">
        {/* Status indicator when speaking */}
        <AnimatePresence>
          {(isJarvisSpeaking || isListening) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            >
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: isListening ? [4, 24, 4] : [4, 16 + Math.random() * 16, 4],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="w-0.5 bg-cyan-400/80 rounded-full"
                  />
                ))}
              </div>
              <p className="text-cyan-400/60 text-xs tracking-wider uppercase">
                {isListening ? 'Listening...' : 'Speaking'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom - Input Area */}
      <footer className="px-6 py-6 md:px-8 md:py-8">
        <div className="max-w-2xl mx-auto">
          {/* Interim transcript display */}
          <AnimatePresence>
            {interimTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center mb-4"
              >
                <p className="text-white/40 text-sm">{interimTranscript}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Bar */}
          <form onSubmit={handleSubmit} className="relative">
            <div className={`
              relative flex items-center gap-3
              bg-white/5 backdrop-blur-sm rounded-full
              border transition-all duration-300
              ${isListening ? 'border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'border-white/10 hover:border-white/20'}
            `}>
              {/* Mic Button */}
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={!isSupported}
                className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300 ml-1
                  ${isListening
                    ? 'bg-cyan-400/20 text-cyan-400'
                    : 'hover:bg-white/10 text-white/50 hover:text-white/70'}
                  ${!isSupported && 'opacity-40 cursor-not-allowed'}
                `}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Type a command...'}
                disabled={systemState !== 'active'}
                className="
                  flex-1 bg-transparent py-3 pr-4
                  text-white/80 placeholder:text-white/30
                  text-sm focus:outline-none
                "
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="
                  flex-shrink-0 w-10 h-10 rounded-full
                  flex items-center justify-center
                  text-white/50 hover:text-cyan-400
                  disabled:opacity-30 disabled:cursor-not-allowed
                  transition-all duration-200 mr-1
                "
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </form>

          {/* Quick Actions - Desktop only */}
          <div className="hidden md:flex items-center justify-center gap-2 mt-4">
            <QuickAction label="Status" command="status report" />
            <QuickAction label="Time" command="what's the time" />
            <QuickAction label="Power" command="power levels" />
            <button
              onClick={handleAlert}
              className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30
                         hover:text-red-400 transition-colors border border-white/10
                         hover:border-red-400/30 rounded-full"
            >
              Test Alert
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Quick action button component
const QuickAction = ({ label, command }) => {
  const handleVoiceCommand = useJarvisStore((state) => state.handleVoiceCommand);
  const { playButtonClick } = useSoundEngine();

  const handleClick = () => {
    playButtonClick();
    handleVoiceCommand(command);
  };

  return (
    <button
      onClick={handleClick}
      className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30
                 hover:text-cyan-400 transition-colors border border-white/10
                 hover:border-cyan-400/30 rounded-full"
    >
      {label}
    </button>
  );
};
