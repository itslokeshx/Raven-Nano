import { useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';

export const useSoundEngine = () => {
  const synthsRef = useRef({});
  const effectsRef = useRef({});
  const isInitializedRef = useRef(false);
  const initAttemptedRef = useRef(false);

  // Initialize audio context on user gesture
  const initialize = useCallback(async () => {
    if (isInitializedRef.current || initAttemptedRef.current) return;

    initAttemptedRef.current = true;

    try {
      await Tone.start();
      console.log('Audio context initialized');
    } catch (e) {
      console.warn('Audio context waiting for user gesture:', e);
      return;
    }

    // Create synths
    synthsRef.current = {
      // Button click synth - high frequency blip
      buttonClick: new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.08,
          sustain: 0,
          release: 0.01,
        },
      }).toDestination(),

      // Button hover synth - softer blip
      buttonHover: new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.04,
          sustain: 0,
          release: 0.01,
        },
      }).toDestination(),

      // Alert synth - pulsing
      alert: new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.2,
        },
      }).toDestination(),

      // Wake up synth - arpeggio
      wakeUp: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 1,
        },
      }).toDestination(),

      // Shutdown synth
      shutdown: new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack: 0.01,
          decay: 2,
          sustain: 0,
          release: 0.5,
        },
      }).toDestination(),

      // Scan ping
      scanPing: new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.2,
          sustain: 0,
          release: 0.2,
        },
      }).toDestination(),

      // Success chime
      success: new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0,
          release: 0.3,
        },
      }).toDestination(),

      // Error sound
      error: new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0,
          release: 0.2,
        },
      }).toDestination(),

      // Speaking hum
      speakingHum: new Tone.Oscillator({
        frequency: 100,
        type: 'sine',
      }).toDestination(),

      // Reactor hum - always on low frequency
      reactorHum: new Tone.Oscillator({
        frequency: 55,
        type: 'sine',
      }).toDestination(),
    };

    // Add reverb for spatial feel
    const reverb = new Tone.Reverb({
      decay: 2,
      wet: 0.3,
    }).toDestination();

    // Connect some synths to reverb
    synthsRef.current.wakeUp.connect(reverb);
    synthsRef.current.shutdown.connect(reverb);
    synthsRef.current.alert.connect(reverb);

    // Set volumes
    synthsRef.current.buttonClick.volume.value = -10;
    synthsRef.current.buttonHover.volume.value = -15;
    synthsRef.current.alert.volume.value = -8;
    synthsRef.current.wakeUp.volume.value = -12;
    synthsRef.current.shutdown.volume.value = -10;
    synthsRef.current.scanPing.volume.value = -12;
    synthsRef.current.success.volume.value = -10;
    synthsRef.current.error.volume.value = -8;
    synthsRef.current.speakingHum.volume.value = -25;
    synthsRef.current.reactorHum.volume.value = -35;

    // Start reactor hum
    synthsRef.current.reactorHum.start();

    isInitializedRef.current = true;
  }, []);

  // Sound effect functions
  const playButtonClick = useCallback(() => {
    if (!isInitializedRef.current) return;
    const synth = synthsRef.current.buttonClick;
    if (synth) {
      synth.triggerAttackRelease('800', '32n');
      synth.frequency.rampTo('1200', 0.05);
    }
  }, []);

  const playButtonHover = useCallback(() => {
    if (!isInitializedRef.current) return;
    const synth = synthsRef.current.buttonHover;
    if (synth) {
      synth.triggerAttackRelease('600', '64n');
    }
  }, []);

  const playAlert = useCallback(() => {
    if (!isInitializedRef.current) return;
    const synth = synthsRef.current.alert;
    if (synth) {
      const now = Tone.now();
      synth.triggerAttackRelease('440', '8n', now);
      synth.triggerAttackRelease('880', '8n', now + 0.2);
      synth.triggerAttackRelease('440', '8n', now + 0.4);
    }
  }, []);

  const playWakeUp = useCallback(() => {
    if (!isInitializedRef.current) return;
    const synth = synthsRef.current.wakeUp;
    if (synth) {
      const now = Tone.now();
      // Cmaj7 arpeggio
      synth.triggerAttackRelease(['C4', 'E4', 'G4', 'B4'], '8n', now);
      synth.triggerAttackRelease(['C5', 'E5', 'G5', 'B5'], '4n', now + 0.1);
    }
  }, []);

  const playShutdown = useCallback(() => {
    if (!isInitializedRef.current) return;
    const synth = synthsRef.current.shutdown;
    if (synth) {
      synth.triggerAttackRelease('C4', '2n');
      synth.frequency.rampTo('C2', 2);
    }
  }, []);

  const playScanPing = useCallback(() => {
    if (!isInitializedRef.current) return;
    const synth = synthsRef.current.scanPing;
    if (synth) {
      synth.triggerAttackRelease('1200', '32n');
    }
  }, []);

  const playSuccess = useCallback(() => {
    if (!isInitializedRef.current) return;
    const synth = synthsRef.current.success;
    if (synth) {
      const now = Tone.now();
      synth.triggerAttackRelease(['C5', 'E5'], '16n', now);
      synth.triggerAttackRelease(['G5'], '8n', now + 0.1);
    }
  }, []);

  const playError = useCallback(() => {
    if (!isInitializedRef.current) return;
    const synth = synthsRef.current.error;
    if (synth) {
      const now = Tone.now();
      synth.triggerAttackRelease('G4', '16n', now);
      synth.triggerAttackRelease('C4', '8n', now + 0.1);
    }
  }, []);

  const startSpeakingHum = useCallback(() => {
    if (!isInitializedRef.current) return;
    const osc = synthsRef.current.speakingHum;
    if (osc && osc.state !== 'started') {
      osc.start();
      // LFO modulation for subtle variation
      const lfo = new Tone.LFO('2n', 90, 110).start();
      lfo.connect(osc.frequency);
    }
  }, []);

  const stopSpeakingHum = useCallback(() => {
    if (!isInitializedRef.current) return;
    const osc = synthsRef.current.speakingHum;
    if (osc && osc.state === 'started') {
      osc.stop();
    }
  }, []);

  const playBootSound = useCallback(() => {
    if (!isInitializedRef.current) return;
    const synth = synthsRef.current.wakeUp;
    if (synth) {
      const now = Tone.now();
      // Low synth sweep ascending
      synth.triggerAttackRelease(['C3', 'E3'], '4n', now);
      synth.triggerAttackRelease(['G3', 'B3'], '4n', now + 0.5);
      synth.triggerAttackRelease(['C4', 'E4', 'G4'], '2n', now + 1);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(synthsRef.current).forEach((synth) => {
        if (synth && typeof synth.dispose === 'function') {
          synth.dispose();
        }
      });
    };
  }, []);

  return {
    initialize,
    playButtonClick,
    playButtonHover,
    playAlert,
    playWakeUp,
    playShutdown,
    playScanPing,
    playSuccess,
    playError,
    startSpeakingHum,
    stopSpeakingHum,
    playBootSound,
    isInitialized: () => isInitializedRef.current,
  };
};
