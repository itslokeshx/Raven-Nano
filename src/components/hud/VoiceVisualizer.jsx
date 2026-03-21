import React, { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export const VoiceVisualizer = ({ isActive, isSpeaking }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Create smooth waveform data
  const generateWaveform = useCallback((time) => {
    const bars = 24; // 24 bars for symmetric look
    const values = [];

    for (let i = 0; i < bars; i++) {
      // Create smooth wave that goes around the circle
      const angle = (i / bars) * Math.PI * 2;
      const wave1 = Math.sin(time * 0.005 + angle * 3) * 0.5 + 0.5;
      const wave2 = Math.sin(time * 0.003 + angle * 2) * 0.3 + 0.3;
      const noise = Math.random() * 0.15;
      const intensity = isSpeaking ? 0.9 : 0.5;

      // Combine waves for organic but symmetric look
      const value = Math.min(1, (wave1 * 0.6 + wave2 * 0.3 + noise) * intensity);
      values.push(value);
    }

    return values;
  }, [isSpeaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = 200;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      if (!isActive) {
        // Draw idle state - subtle pulse ring
        const pulse = Math.sin(time * 0.002) * 0.1 + 0.2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 50, 0, Math.PI * 2);
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
      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = 55;
      const maxBarLength = 35;
      const barWidth = 4;

      // Draw symmetric circular bars
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2; // Start from top
        const value = values[i];
        const barLength = value * maxBarLength;

        // Calculate start and end points
        const innerX = centerX + Math.cos(angle) * baseRadius;
        const innerY = centerY + Math.sin(angle) * baseRadius;
        const outerX = centerX + Math.cos(angle) * (baseRadius + barLength);
        const outerY = centerY + Math.sin(angle) * (baseRadius + barLength);

        // Draw bar with gradient
        const gradient = ctx.createLinearGradient(innerX, innerY, outerX, outerY);

        if (isSpeaking) {
          gradient.addColorStop(0, `rgba(34, 211, 238, 0.4)`);
          gradient.addColorStop(0.5, `rgba(34, 211, 238, ${0.6 + value * 0.4})`);
          gradient.addColorStop(1, `rgba(34, 211, 238, 0)`);
        } else {
          gradient.addColorStop(0, `rgba(99, 102, 241, 0.3)`);
          gradient.addColorStop(0.5, `rgba(99, 102, 241, ${0.4 + value * 0.3})`);
          gradient.addColorStop(1, `rgba(99, 102, 241, 0)`);
        }

        ctx.beginPath();
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = barWidth;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Draw inner ring (symmetric circle)
      const ringPulse = Math.sin(time * 0.003) * 0.1 + 0.3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${isSpeaking ? ringPulse : ringPulse * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw outer glow ring
      const outerGlowOpacity = isSpeaking ? 0.15 : 0.08;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius + maxBarLength + 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${outerGlowOpacity})`;
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
        <div className="w-20 h-20 rounded-full border border-cyan-400/20" />
      </motion.div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 m-auto"
      style={{
        width: "200px",
        height: "200px",
      }}
    />
  );
};
