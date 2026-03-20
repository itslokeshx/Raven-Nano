import { useCallback, useEffect, useRef, useState } from 'react';
import { useJarvisStore } from '../store/jarvisStore';

export const useVoiceRecognition = () => {
  const isListening = useJarvisStore((state) => state.isListening);
  const setIsListening = useJarvisStore((state) => state.setIsListening);
  const systemState = useJarvisStore((state) => state.systemState);

  const recognitionRef = useRef(null);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const restartTimeoutRef = useRef(null);
  const errorCountRef = useRef(0);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      errorCountRef.current = 0; // Reset error count on successful start
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');

      // Auto-restart if we're supposed to be listening and system is active
      if (isListening && systemState === 'active') {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.warn('Recognition restart failed:', e);
          }
        }, 100);
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalTranscript) {
        // Process the final transcript
        const store = useJarvisStore.getState();
        store.handleVoiceCommand(finalTranscript);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);

      if (event.error === 'not-allowed') {
        setIsSupported(false);
        setIsListening(false);
        console.warn('Microphone permission denied');
      } else if (event.error === 'network') {
        // Network error - retry with exponential backoff
        errorCountRef.current += 1;
        if (errorCountRef.current < 3 && isListening && systemState === 'active') {
          const retryDelay = Math.min(1000 * Math.pow(2, errorCountRef.current), 5000);
          console.log(`Retrying in ${retryDelay}ms...`);
          restartTimeoutRef.current = setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.warn('Network retry failed:', e);
            }
          }, retryDelay);
        }
      } else if (event.error === 'no-speech') {
        // No speech detected - this is normal, just restart
        if (isListening && systemState === 'active') {
          try {
            recognition.start();
          } catch (e) {
            console.warn('no-speech restart failed:', e);
          }
        }
      } else if (event.error === 'audio-capture') {
        // Audio capture issue - check microphone
        console.warn('Audio capture issue - check microphone connection');
        if (isListening && systemState === 'active') {
          restartTimeoutRef.current = setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.warn('Audio capture retry failed:', e);
            }
          }, 500);
        }
      } else if (event.error === 'aborted') {
        // Aborted - normal behavior, don't restart
        console.log('Recognition aborted');
      }
    };

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      try {
        recognition.stop();
      } catch (e) {
        // Already stopped
      }
    };
  }, [setIsListening, systemState, isListening]);

  // Handle listening state changes
  useEffect(() => {
    if (!recognitionRef.current || !isSupported) return;

    const recognition = recognitionRef.current;

    if (isListening && systemState === 'active') {
      try {
        recognition.start();
      } catch (e) {
        console.warn('Recognition already started');
      }
    } else {
      try {
        recognition.stop();
      } catch (e) {
        console.warn('Recognition already stopped');
      }
    }
  }, [isListening, systemState, isSupported]);

  return {
    isListening,
    isSupported,
    interimTranscript,
  };
};
