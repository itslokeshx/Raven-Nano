import { create } from "zustand";
import {
  getRandomDialogue,
  getResponseForCommand,
} from "../data/dialogueLines";

// Llama AI integration
const LLAMA_API_URL =
  "https://answerfinder-ai-proxy.answerfinder.workers.dev/api/query";

let aiAbortController = null;
let lastAIQuerySignature = "";
let lastAIQueryTimestamp = 0;

const queryLlamaAI = async (query, state) => {
  const normalizedQuery = typeof query === "string" ? query.trim() : "";

  if (!normalizedQuery) {
    return null;
  }

  // Abort any ongoing request
  if (aiAbortController) {
    aiAbortController.abort();
  }

  aiAbortController = new AbortController();

  const systemPrompt = `You are JARVIS, an advanced AI assistant created by Tony Stark. You are:
- Intelligent, efficient, and highly capable
- Professional but with subtle wit
- Loyal and dedicated to serving your user
- Concise in responses (1-3 sentences typically)
- British English, calm and composed
- Occasionally show dry humor or technical observations

Current context:
- User: ${state.userName || "Sir"}
- System state: ${state.systemState || "active"}
- Time: ${new Date().toLocaleTimeString()}

Respond as JARVIS would - professional, efficient, with occasional dry wit. Keep responses concise unless technical detail is required.`;

  const requestBody = {
    inputs: `${systemPrompt}\n\nUser: ${normalizedQuery}\nJARVIS:`,
  };

  try {
    const response = await fetch(LLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: aiAbortController.signal,
    });

    const responseText = await response.text();
    let data = {};

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { response: responseText };
      }
    }

    if (!response.ok) {
      throw new Error(data?.error || `API error: ${response.status}`);
    }

    const aiResponse =
      data.generated_text ||
      data.response ||
      data.answer ||
      data.text ||
      data.message ||
      data.result ||
      data.output;

    const cleanedResponse =
      typeof aiResponse === "string"
        ? aiResponse.replace(/^.*JARVIS:\s*/s, "").trim()
        : "";

    return cleanedResponse || aiResponse || "Processing complete, sir.";
  } catch (error) {
    if (error.name === "AbortError") {
      return null;
    }

    console.warn("Llama AI query error:", error.message);
    return "I've processed your request, sir.";
  }
};

export const useJarvisStore = create((set, get) => ({
  // System State
  systemState: "standby",
  bootProgress: 0,

  // Dialogue State
  currentDialogue: null,
  dialogueQueue: [],
  isJarvisSpeaking: false,
  lastSpoken: null,
  aiLoading: false,

  // Voice
  isListening: false,
  transcript: "",
  voiceEnabled: true,

  // User
  userName: "Sir",

  // Last interaction time for idle behavior
  lastInteraction: Date.now(),

  // Actions
  setSystemState: (state) => set({ systemState: state }),
  setBootProgress: (progress) => set({ bootProgress: progress }),

  speak: (text, options = {}) => {
    const { priority = "normal", category = "general", delay = 0 } = options;
    const dialogue = {
      text,
      priority,
      category,
      timestamp: Date.now(),
    };

    setTimeout(() => {
      set({
        currentDialogue: dialogue,
        isJarvisSpeaking: true,
        lastInteraction: Date.now(),
      });

      // Auto-clear speaking state after estimated speech duration
      const duration = text.length * 50 + 1000;
      setTimeout(() => {
        set({ isJarvisSpeaking: false });
      }, duration);
    }, delay);
  },

  clearDialogue: () => set({ currentDialogue: null, isJarvisSpeaking: false }),

  setIsJarvisSpeaking: (speaking) => set({ isJarvisSpeaking: speaking }),

  setIsListening: (listening) => {
    set({
      isListening: listening,
      lastInteraction: Date.now(),
    });
  },

  setTranscript: (transcript) => {
    set({
      transcript,
      lastInteraction: Date.now(),
    });

    // Process command after transcript
    if (transcript.trim()) {
      get().handleVoiceCommand(transcript);
    }
  },

  clearTranscript: () => set({ transcript: "" }),

  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),

  // System control
  triggerAlert: () => {
    const alertLine = getRandomDialogue("ALERTS");
    set({ systemState: "alert", lastInteraction: Date.now() });
    if (alertLine) {
      get().speak(alertLine.text, {
        category: "alert",
        priority: alertLine.priority,
      });
    }

    // Reset to active after alert
    setTimeout(() => {
      set({ systemState: "active" });
    }, 5000);
  },

  handleVoiceCommand: async (command) => {
    if (!command) return;

    const normalizedCommand = command.toLowerCase().replace(/\s+/g, " ").trim();
    const state = get();

    if (normalizedCommand.length < 3) {
      return;
    }

    // Wake words
    if (
      normalizedCommand.includes("hey jarvis") ||
      normalizedCommand === "jarvis"
    ) {
      if (state.systemState !== "active") {
        const wakeLine = getRandomDialogue("WAKE");
        if (wakeLine) {
          get().speak(wakeLine.text, {
            category: "wake",
            priority: wakeLine.priority,
          });
        }
        set({ systemState: "active", lastInteraction: Date.now() });
      }
      return;
    }

    // Sleep words
    if (
      normalizedCommand.includes("sleep") ||
      normalizedCommand.includes("goodnight")
    ) {
      const sleepLine = getRandomDialogue("SLEEP");
      if (sleepLine) {
        get().speak(sleepLine.text, {
          category: "sleep",
          priority: sleepLine.priority,
        });
      }
      set({ systemState: "standby", isListening: false });
      return;
    }

    // Check for predefined responses first (faster)
    const predefinedResponse = getResponseForCommand(normalizedCommand);
    if (predefinedResponse !== "I'm processing that, sir. One moment.") {
      get().speak(predefinedResponse, { category: "response" });
      return;
    }

    // Use Llama AI for intelligent responses
    const querySignature = `${normalizedCommand}|${state.systemState}`;
    const now = Date.now();

    if (
      querySignature === lastAIQuerySignature &&
      now - lastAIQueryTimestamp < 5000
    ) {
      return;
    }

    lastAIQuerySignature = querySignature;
    lastAIQueryTimestamp = now;

    set({ aiLoading: true });

    const aiResponse = await queryLlamaAI(command, state);

    set({ aiLoading: false });

    if (aiResponse) {
      get().speak(aiResponse, { category: "ai_response", priority: "normal" });
    }
  },

  // Idle behavior
  triggerIdleDialogue: () => {
    const idleLine = getRandomDialogue("IDLE");
    if (idleLine) {
      get().speak(idleLine.text, { category: "idle" });
    }
  },

  updateLastInteraction: () => set({ lastInteraction: Date.now() }),

  // AI controls
  cancelAIRequest: () => {
    if (aiAbortController) {
      aiAbortController.abort();
    }
    set({ aiLoading: false });
  },
}));
