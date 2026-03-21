import { useCallback, useEffect, useRef, useState } from 'react';
import { useJarvisStore } from '../store/jarvisStore';

export const useJarvisVoice = () => {
  const currentDialogue = useJarvisStore((state) => state.currentDialogue);
  const setIsSpeaking = useJarvisStore((state) => state.setIsJarvisSpeaking);

  const voicesRef = useRef([]);
  const utteranceRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Load voices on mount
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      voicesRef.current = voices;

      // Find best voice for JARVIS - prioritize neural/high-quality voices
      const preferredVoice = voices.find(v =>
        v.name.includes('Daniel') ||
        v.name.includes('Google UK English Male') ||
        v.name.includes('Microsoft David') ||
        v.name.includes('British') ||
        (v.name.includes('Male') && v.lang.includes('en-GB'))
      ) || voices.find(v => v.lang.includes('en')) || voices[0];

      setSelectedVoice(preferredVoice || null);
      setIsReady(voices.length > 0);
    };

    loadVoices();

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

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

    // JARVIS voice characteristics
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
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      } else {
        console.warn('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }
    };

    // Speak
    window.speechSynthesis.speak(utterance);

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