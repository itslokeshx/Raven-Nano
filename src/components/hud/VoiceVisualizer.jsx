import React, { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export const VoiceVisualizer = ({ isActive, isSpeaking }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);

  // Create simulated waveform data
  const generateWaveform = useCallback((time) => {
    const bars = 32;
    const values = [];

    for (let i = 0; i < bars; i++) {
      const base = Math.sin(time * 0.003 + i * 0.2) * 0.5 + 0.5;
      const noise = Math.random() * 0.3;
      const intensity = isSpeaking ? 0.8 : 0.4;
      values.push((base + noise) * intensity);
    }

    return values;
  }, [isSpeaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = 160;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      if (!isActive) {
        // Draw idle state - subtle pulse
        const pulse = Math.sin(time * 0.002) * 0.1 + 0.15;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 30, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34, 211, 238, ${pulse})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        time += 16;
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Active visualization
      const values = generateWaveform(time);
      const barCount = values.length;
      const barWidth = 3;
      const gap = 2;
      const radius = 45;

      // Draw circular bars
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
        const value = values[i];
        const barHeight = value * 25 + 5;

        const x = size / 2 + Math.cos(angle) * radius;
        const y = size / 2 + Math.sin(angle) * radius;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);

        // Draw bar
        const gradient = ctx.createLinearGradient(0, 0, 0, barHeight);
        if (isSpeaking) {
          gradient.addColorStop(0, `rgba(34, 211, 238, ${0.8 + value * 0.2})`);
          gradient.addColorStop(1, `rgba(34, 211, 238, 0)`);
        } else {
          gradient.addColorStop(0, `rgba(99, 102, 241, ${0.6 + value * 0.2})`);
          gradient.addColorStop(1, `rgba(99, 102, 241, 0)`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(-barWidth / 2, 0, barWidth, barHeight);

        // Mirror on other side
        ctx.fillRect(-barWidth / 2, -barHeight, barWidth, barHeight);

        ctx.restore();
      }

      // Inner glow ring
      const ringOpacity = isSpeaking
        ? 0.3 + values[0] * 0.3
        : 0.1 + values[0] * 0.2;

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius - 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${ringOpacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      time += 16;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isSpeaking, generateWaveform]);

  if (!isActive) {
    return (
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-16 h-16 rounded-full border border-cyan-400/20" />
      </motion.div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{
        width: "160px",
        height: "160px",
        margin: "auto",
      }}
    />
  );
};
