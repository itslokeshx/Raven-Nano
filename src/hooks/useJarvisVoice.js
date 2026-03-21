import { useCallback, useEffect, useRef, useState } from 'react';
import { useJarvisStore } from '../store/jarvisStore';

// Kokoro TTS instance (loaded once, shared globally)
let kokoroInstance = null;
let kokoroLoading = false;

export const useJarvisVoice = () => {
  const currentDialogue = useJarvisStore((state) => state.currentDialogue);
  const setIsSpeaking = useJarvisStore((state) => state.setIsJarvisSpeaking);

  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [engine, setEngine] = useState('loading');

  // Initialize TTS engine - Web Speech only for reliability
  useEffect(() => {
    let mounted = true;

    const initTTS = async () => {
      // Try Kokoro first (neural TTS, high quality)
      if (!kokoroLoading && !kokoroInstance) {
        kokoroLoading = true;
        try {
          const module = await import('https://esm.sh/kokoro-js@1.2.1');
          const Kokoro = module.default || module.Kokoro || module;

          if (Kokoro?.from_pretrained) {
            kokoroInstance = await Kokoro.from_pretrained(
              'onnx-community/Kokoro-82M-v1.0-ONNX',
              { dtype: 'q8', device: 'wasm' }
            );
            if (mounted) {
              setEngine('kokoro');
              setIsReady(true);
              console.log('✓ Kokoro TTS loaded (neural voice)');
            }
            return;
          }
        } catch (e) {
          console.log('Kokoro unavailable:', e.message);
        }
        kokoroLoading = false;
      } else if (kokoroInstance) {
        if (mounted) {
          setEngine('kokoro');
          setIsReady(true);
        }
        return;
      }

      // Try Speechma for high-quality voice
      if (mounted) {
        try {
          // Test if Speechma is available with a simple fetch
          const testResponse = await fetch('https://api.speechma.com/v1/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'test', voice: 'kelan', speed: 1.0 }),
          });
          if (testResponse.ok || testResponse.status === 400) { // 400 means API works but bad request
            setEngine('speechma');
            setIsReady(true);
            console.log('✓ Speechma TTS loaded (neural voice)');
            return;
          }
        } catch (e) {
          console.log('Speechma unavailable:', e.message);
        }
      }

      // Fallback to Web Speech API (reliable, no WebSocket issues)
      if (mounted && 'speechSynthesis' in window) {
        setEngine('webspeech');
        setIsReady(true);
        // Warm up voices
        window.speechSynthesis.getVoices();
        console.log('✓ Web Speech API loaded');
      }
    };

    initTTS();

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize audio context (must be called after user gesture)
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
    }
    return audioContextRef.current;
  }, []);

  // Resume audio context after user gesture
  const resumeAudioContext = useCallback(async () => {
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
        console.log('AudioContext resumed');
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
      }
    }
  }, []);

  // Play audio buffer
  const playAudioBuffer = useCallback(async (audioData) => {
    // Ensure context exists
    if (!audioContextRef.current) {
      initAudioContext();
    }

    const ctx = audioContextRef.current;

    // Critical: resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('AudioContext resume failed:', e);
        return;
      }
    }

    // Stop current
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
    }

    return new Promise((resolve) => {
      let bufferPromise;

      if (audioData instanceof AudioBuffer) {
        bufferPromise = Promise.resolve(audioData);
      } else if (audioData?.buffer instanceof ArrayBuffer) {
        bufferPromise = ctx.decodeAudioData(audioData.buffer.slice(0));
      } else if (audioData instanceof ArrayBuffer) {
        bufferPromise = ctx.decodeAudioData(audioData.slice(0));
      } else {
        resolve();
        return;
      }

      bufferPromise.then((buffer) => {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        sourceNodeRef.current = source;
        source.onended = () => { sourceNodeRef.current = null; resolve(); };
        source.start(0);
      }).catch((err) => {
        console.warn('Audio decode failed:', err);
        resolve();
      });
    });
  }, [initAudioContext]);

  // Kokoro synthesis
  const speakKokoro = useCallback(async (text) => {
    if (!kokoroInstance) return false;

    try {
      const result = await kokoroInstance.generate(text, {
        voice: 'am_adam',
        speed: 0.9,
      });

      if (result?.audio) {
        await playAudioBuffer(result.audio);
        return true;
      }
    } catch (e) {
      console.warn('Kokoro error:', e);
    }
    return false;
  }, [playAudioBuffer]);

  // Speechma TTS - High quality neural voice
  const speakSpeechma = useCallback(async (text) => {
    try {
      // Speechma free TTS API
      const response = await fetch('https://api.speechma.com/v1/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice: 'kelan',  // Deep authoritative male voice
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Speechma API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(true);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        };
        audio.play().catch(() => resolve(false));
      });
    } catch (e) {
      console.warn('Speechma error:', e.message);
      return false;
    }
  }, []);

  // Web Speech API with JARVIS-like voice selection
  const speakWeb = useCallback((text) => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(false); return; }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();

      // Prioritize male, authoritative voices
      const voice = voices.find(v =>
        v.name.includes('Google UK English Male') ||
        v.name.includes('Daniel') ||
        v.name.includes('Microsoft David') ||
        v.name.includes('Microsoft Mark') ||
        v.name.includes('Samantha') || // Good quality on Mac
        v.name.includes('Karen') // Good on Mac
      ) || voices.find(v => v.lang.includes('en-GB')) ||
        voices.find(v => v.lang.includes('en-US')) ||
        voices[0];

      if (voice) {
        utterance.voice = voice;
        console.log('Using voice:', voice.name);
      }

      // JARVIS-like settings - deeper, slightly slower
      utterance.pitch = 0.7;  // Lower pitch for authority
      utterance.rate = 0.92; // Slightly slower for clarity
      utterance.volume = 1.0;

      utterance.onend = () => resolve(true);
      utterance.onerror = (e) => {
        console.warn('Speech error:', e);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Speak when dialogue changes
  useEffect(() => {
    if (!currentDialogue || !isReady) return;

    const { text } = currentDialogue;

    const speak = async () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);

      try {
        if (engine === 'kokoro') {
          const ok = await speakKokoro(text);
          if (!ok) {
            // Try Speechma next
            const speechmaOk = await speakSpeechma(text);
            if (!speechmaOk) await speakWeb(text);
          }
        } else if (engine === 'speechma') {
          const ok = await speakSpeechma(text);
          if (!ok) await speakWeb(text);
        } else {
          await speakWeb(text);
        }
      } catch (e) {
        console.warn('Speech error:', e);
      } finally {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      }
    };

    speak();
  }, [currentDialogue, isReady, engine, speakKokoro, speakSpeechma, speakWeb, setIsSpeaking]);

  const stopSpeaking = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }, [setIsSpeaking]);

  // Initialize audio on user gesture (required by browser autoplay policy)
  const initialize = useCallback(async () => {
    // Init audio context
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Warm up Web Speech voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      // Force load voices if empty
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }

    return true;
  }, [initAudioContext]);

  return {
    currentText: currentDialogue?.text || null,
    isReady,
    engine,
    stopSpeaking,
    initialize,
    isSpeaking: isSpeakingRef.current,
  };
};
