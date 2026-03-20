import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassPanel } from '../ui/GlassPanel';
import { HoloButton } from '../ui/HoloButton';
import { useJarvisStore } from '../../store/jarvisStore';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useSoundEngine } from '../../hooks/useSoundEngine';

export const BottomBar = () => {
  const systemState = useJarvisStore((state) => state.systemState);
  const setIsListening = useJarvisStore((state) => state.setIsListening);
  const isListening = useJarvisStore((state) => state.isListening);
  const wakeJarvis = useJarvisStore((state) => state.wakeJarvis);
  const sleepJarvis = useJarvisStore((state) => state.sleepJarvis);
  const triggerAlert = useJarvisStore((state) => state.triggerAlert);
  const handleVoiceCommand = useJarvisStore((state) => state.handleVoiceCommand);

  const { toggleListening, isSupported } = useVoiceRecognition();
  const { playAlert } = useSoundEngine();

  const [inputValue, setInputValue] = useState('');

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      handleVoiceCommand(inputValue);
      setInputValue('');
    }
  };

  const handleAlert = () => {
    playAlert();
    triggerAlert();
  };

  return (
    <GlassPanel className="w-full h-16 px-6 flex items-center gap-4" withCorners={false}>
      {/* Microphone Button */}
      <motion.button
        onClick={toggleListening}
        disabled={!isSupported || systemState !== 'active'}
        className={`
          w-12 h-12 rounded-full border-2 flex items-center justify-center
          transition-all duration-300
          ${isListening
            ? 'border-jarvis-critical bg-jarvis-critical/20 animate-pulse'
            : 'border-jarvis-primary hover:border-jarvis-accent'
          }
          ${(!isSupported || systemState !== 'active') && 'opacity-40 cursor-not-allowed'}
        `}
        whileHover={{ scale: isSupported && systemState === 'active' ? 1.05 : 1 }}
        whileTap={{ scale: isSupported && systemState === 'active' ? 0.95 : 1 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-6 h-6 ${isListening ? 'text-jarvis-critical' : 'text-jarvis-primary'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </motion.button>

      {/* Input Field */}
      <form onSubmit={handleInputSubmit} className="flex-1">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Speak or type a command, sir..."
            disabled={systemState !== 'active'}
            className={`
              w-full bg-jarvis-background/50 border border-jarvis-primary/30
              rounded-none px-4 py-2 pl-4 pr-12
              text-jarvis-primary font-rajdhani text-base
              placeholder:text-jarvis-secondary/50
              focus:outline-none focus:border-jarvis-primary focus:shadow-[0_0_15px_rgba(0,212,255,0.3)]
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200
            `}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || systemState !== 'active'}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-jarvis-primary hover:text-jarvis-accent disabled:opacity-40 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        <HoloButton
          onClick={wakeJarvis}
          variant="accent"
          size="md"
          disabled={systemState === 'active'}
        >
          WAKE
        </HoloButton>

        <HoloButton
          onClick={sleepJarvis}
          variant="secondary"
          size="md"
          disabled={systemState !== 'active'}
        >
          SLEEP
        </HoloButton>

        <HoloButton
          onClick={handleAlert}
          variant="critical"
          size="md"
        >
          ALERT
        </HoloButton>
      </div>
    </GlassPanel>
  );
};
