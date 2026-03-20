import { useCallback, useRef } from "react";

const LLAMA_API_URL =
  "https://answerfinder-ai-proxy.answerfinder.workers.dev/api/query";

export const useLlamaAI = () => {
  const abortControllerRef = useRef(null);
  const lastRequestRef = useRef(null);

  const queryAI = useCallback(async (query, context = {}) => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Build the prompt with context
    const systemPrompt = `You are JARVIS, an advanced AI assistant created by Tony Stark. You are:
- Intelligent, efficient, and highly capable
- Professional but with subtle wit
- Loyal and dedicated to serving your user
- Concise in responses (1-3 sentences typically)
- British English, calm and composed
- Occasionally show dry humor or technical observations

Current context:
- User: ${context.userName || "Sir"}
- System state: ${context.systemState || "active"}
- Time: ${new Date().toLocaleTimeString()}

Respond as JARVIS would - professional, efficient, with occasional dry wit. Keep responses concise unless technical detail is required.`;

    const userQuery = (query || "Hello").trim();

    const requestBody = {
      inputs: `${systemPrompt}\n\nUser: ${userQuery}\nJARVIS:`,
    };

    try {
      const response = await fetch(LLAMA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract the response text - adjust based on API response structure
      const aiResponse =
        data.generated_text ||
        data.response ||
        data.answer ||
        data.text ||
        data.message ||
        "Processing...";
      const cleanedResponse =
        typeof aiResponse === "string"
          ? aiResponse.replace(/^.*JARVIS:\s*/s, "").trim()
          : "";

      lastRequestRef.current = {
        query,
        response: cleanedResponse || aiResponse,
        timestamp: Date.now(),
        success: true,
      };

      return cleanedResponse || aiResponse;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
        return null;
      }

      console.error("Llama AI query error:", error);
      lastRequestRef.current = {
        query,
        response: null,
        error: error.message,
        timestamp: Date.now(),
        success: false,
      };

      // Fallback response
      return "I'm processing that request, sir. One moment.";
    }
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const getLastRequest = useCallback(() => {
    return lastRequestRef.current;
  }, []);

  return {
    queryAI,
    cancelRequest,
    getLastRequest,
  };
};
