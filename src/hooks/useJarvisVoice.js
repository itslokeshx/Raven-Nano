import { useCallback, useEffect, useRef, useState } from 'react';
import { useJarvisStore } from '../store/jarvisStore';

export const useJarvisVoice = () => {
  const speak = useJarvisStore((state) => state.speak);
  const currentDialogue = useJarvisStore((state) => state.currentDialogue);
  const setIsSpeaking = useJarvisStore((state) => state.setIsJarvisSpeaking);

  const voicesRef = useRef([]);
  const utteranceRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Load voices on mount and on user gesture
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      voicesRef.current = voices;

      // Find best voice for JARVIS
      const preferredVoice = voices.find(v =>
        v.name.includes('Daniel') ||
        v.name.includes('Google UK English Male') ||
        v.name.includes('British') ||
        (v.name.includes('Male') && v.lang.includes('en'))
      ) || voices.find(v => v.lang.includes('en')) || voices[0];

      setSelectedVoice(preferredVoice || null);
      setIsReady(voices.length > 0);
    };

    // Load voices immediately
    loadVoices();

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Load voices on user gesture
    const handleUserGesture = () => {
      loadVoices();
      // Resume audio context if suspended
      if (window.speechSynthesis.speaking === false) {
        setIsReady(true);
      }
    };

    document.addEventListener('click', handleUserGesture, { once: false });
    document.addEventListener('keydown', handleUserGesture, { once: false });

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Handle speaking when dialogue changes
  useEffect(() => {
    if (!currentDialogue || !isReady) return;
    if (!('speechSynthesis' in window)) return;

    const { text } = currentDialogue;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Apply selected voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // JARVIS voice characteristics - optimized for better quality
    utterance.pitch = 0.85;
    utterance.rate = 0.9;
    utterance.volume = 1.0;

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };

    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') {
        // Normal interruption, don't log as error
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      } else if (event.error === 'not-allowed') {
        console.warn('Speech synthesis not allowed - user gesture required');
        setIsSpeaking(false);
      } else if (event.error === 'synthesis-failed') {
        console.warn('Speech synthesis failed - retrying...');
        // Retry once after a short delay
        setTimeout(() => {
          try {
            window.speechSynthesis.speak(utterance);
          } catch (e) {
            console.error('Speech synthesis retry failed:', e);
          }
        }, 200);
      } else {
        console.warn('Speech synthesis error:', event.error);
        setIsSpeaking(false);
      }
    };

    // Ensure audio context is ready and speak
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis blocked - waiting for user gesture');
      }
    }, 50);

  }, [currentDialogue, isReady, selectedVoice, setIsSpeaking]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  }, [setIsSpeaking]);

  return {
    currentText: currentDialogue?.text || null,
    isReady,
    selectedVoice,
    stopSpeaking,
    isSpeaking: isSpeakingRef.current,
  };
};
