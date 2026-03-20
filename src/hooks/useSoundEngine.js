import { useCallback, useEffect } from "react";
import * as Tone from "tone";

const sharedAudioState = {
  synths: null,
  initialized: false,
  initPromise: null,
  speakingHumLfo: null,
};

const createSynths = () => {
  if (sharedAudioState.synths) {
    return sharedAudioState.synths;
  }

  const synths = {
    buttonClick: new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.001,
        decay: 0.08,
        sustain: 0,
        release: 0.01,
      },
    }).toDestination(),

    buttonHover: new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.001,
        decay: 0.04,
        sustain: 0,
        release: 0.01,
      },
    }).toDestination(),

    alert: new Tone.Synth({
      oscillator: { type: "square" },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.2,
      },
    }).toDestination(),

    wakeUp: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination(),

    shutdown: new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: {
        attack: 0.01,
        decay: 2,
        sustain: 0,
        release: 0.5,
      },
    }).toDestination(),

    scanPing: new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.2,
      },
    }).toDestination(),

    success: new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0,
        release: 0.3,
      },
    }).toDestination(),

    error: new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0,
        release: 0.2,
      },
    }).toDestination(),

    speakingHum: new Tone.Oscillator({
      frequency: 100,
      type: "sine",
    }).toDestination(),

    reactorHum: new Tone.Oscillator({
      frequency: 55,
      type: "sine",
    }).toDestination(),
  };

  const reverb = new Tone.Reverb({
    decay: 2,
    wet: 0.3,
  }).toDestination();

  synths.wakeUp.connect(reverb);
  synths.shutdown.connect(reverb);
  synths.alert.connect(reverb);

  synths.buttonClick.volume.value = -10;
  synths.buttonHover.volume.value = -15;
  synths.alert.volume.value = -8;
  synths.wakeUp.volume.value = -12;
  synths.shutdown.volume.value = -10;
  synths.scanPing.volume.value = -12;
  synths.success.volume.value = -10;
  synths.error.volume.value = -8;
  synths.speakingHum.volume.value = -25;
  synths.reactorHum.volume.value = -35;

  synths.reactorHum.start();

  sharedAudioState.synths = synths;
  return synths;
};

export const useSoundEngine = () => {
  // Initialize audio context on user gesture
  const initialize = useCallback(async () => {
    try {
      if (sharedAudioState.initialized) {
        return true;
      }

      if (sharedAudioState.initPromise) {
        return await sharedAudioState.initPromise;
      }

      sharedAudioState.initPromise = (async () => {
        await Tone.start();
        createSynths();
        sharedAudioState.initialized = true;
        console.log("Audio context initialized");
        return true;
      })();

      return await sharedAudioState.initPromise;
    } catch (e) {
      console.warn("Audio context waiting for user gesture:", e);
      sharedAudioState.initPromise = null;
      return false;
    }
  }, []);

  // Sound effect functions
  const playButtonClick = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const synth = sharedAudioState.synths?.buttonClick;
    if (synth) {
      synth.triggerAttackRelease("800", "32n");
      synth.frequency.rampTo("1200", 0.05);
    }
  }, []);

  const playButtonHover = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const synth = sharedAudioState.synths?.buttonHover;
    if (synth) {
      synth.triggerAttackRelease("600", "64n");
    }
  }, []);

  const playAlert = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const synth = sharedAudioState.synths?.alert;
    if (synth) {
      const now = Tone.now();
      synth.triggerAttackRelease("440", "8n", now);
      synth.triggerAttackRelease("880", "8n", now + 0.2);
      synth.triggerAttackRelease("440", "8n", now + 0.4);
    }
  }, []);

  const playWakeUp = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const synth = sharedAudioState.synths?.wakeUp;
    if (synth) {
      const now = Tone.now();
      // Cmaj7 arpeggio
      synth.triggerAttackRelease(["C4", "E4", "G4", "B4"], "8n", now);
      synth.triggerAttackRelease(["C5", "E5", "G5", "B5"], "4n", now + 0.1);
    }
  }, []);

  const playShutdown = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const synth = sharedAudioState.synths?.shutdown;
    if (synth) {
      synth.triggerAttackRelease("C4", "2n");
      synth.frequency.rampTo("C2", 2);
    }
  }, []);

  const playScanPing = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const synth = sharedAudioState.synths?.scanPing;
    if (synth) {
      synth.triggerAttackRelease("1200", "32n");
    }
  }, []);

  const playSuccess = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const synth = sharedAudioState.synths?.success;
    if (synth) {
      const now = Tone.now();
      synth.triggerAttackRelease(["C5", "E5"], "16n", now);
      synth.triggerAttackRelease(["G5"], "8n", now + 0.1);
    }
  }, []);

  const playError = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const synth = sharedAudioState.synths?.error;
    if (synth) {
      const now = Tone.now();
      synth.triggerAttackRelease("G4", "16n", now);
      synth.triggerAttackRelease("C4", "8n", now + 0.1);
    }
  }, []);

  const startSpeakingHum = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const osc = sharedAudioState.synths?.speakingHum;
    if (osc && osc.state !== "started") {
      osc.start();
      if (!sharedAudioState.speakingHumLfo) {
        sharedAudioState.speakingHumLfo = new Tone.LFO("2n", 90, 110).start();
        sharedAudioState.speakingHumLfo.connect(osc.frequency);
      }
    }
  }, []);

  const stopSpeakingHum = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const osc = sharedAudioState.synths?.speakingHum;
    if (osc && osc.state === "started") {
      osc.stop();
    }
    if (sharedAudioState.speakingHumLfo) {
      sharedAudioState.speakingHumLfo.dispose();
      sharedAudioState.speakingHumLfo = null;
    }
  }, []);

  const playBootSound = useCallback(() => {
    if (!sharedAudioState.initialized) return;
    const synth = sharedAudioState.synths?.wakeUp;
    if (synth) {
      const now = Tone.now();
      // Low synth sweep ascending
      synth.triggerAttackRelease(["C3", "E3"], "4n", now);
      synth.triggerAttackRelease(["G3", "B3"], "4n", now + 0.5);
      synth.triggerAttackRelease(["C4", "E4", "G4"], "2n", now + 1);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (sharedAudioState.speakingHumLfo) {
        sharedAudioState.speakingHumLfo.dispose();
        sharedAudioState.speakingHumLfo = null;
      }
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
    isInitialized: () => sharedAudioState.initialized,
  };
};
