import { useCallback, useEffect, useRef, useState } from 'react';
import { useJarvisStore } from '../store/jarvisStore';

export const useJarvisVoice = () => {
  const speak = useJarvisStore((state) => state.speak);
  const currentDialogue = useJarvisStore((state) => state.currentDialogue);
  const setIsSpeaking = useJarvisStore((state) => state.setIsJarvisSpeaking);

  const isSpeakingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize Puter.js
  useEffect(() => {
    const checkPuter = () => {
      if (window.puter?.ai?.txt2speech) {
        setIsReady(true);
      } else {
        // Retry check after a short delay
        setTimeout(checkPuter, 100);
      }
    };
    checkPuter();
  }, []);

  // Handle speaking when dialogue changes
  useEffect(() => {
    if (!currentDialogue || !isReady) return;

    const { text } = currentDialogue;

    const speakText = async () => {
      try {
        isSpeakingRef.current = true;
        setIsSpeaking(true);

        // Use Puter.js for text-to-speech with neural engine
        await window.puter.ai.txt2speech(text, 'neural');

        setIsSpeaking(false);
        isSpeakingRef.current = false;
      } catch (error) {
        console.warn('Puter TTS error:', error);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
    };

    speakText();

    return () => {
      // Cleanup if needed
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };
  }, [currentDialogue, isReady, setIsSpeaking]);

  const stopSpeaking = useCallback(() => {
    // Puter.js doesn't have a stop method, so we just update state
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }, [setIsSpeaking]);

  return {
    currentText: currentDialogue?.text || null,
    isReady,
    stopSpeaking,
    isSpeaking: isSpeakingRef.current,
  };
};