import React from "react";
import { motion } from "framer-motion";

export const GlassPanel = ({
  children,
  className = "",
  withCorners = true,
  withGlow = false,
  animated = true,
  ...props
}) => {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const baseClasses = `
    glass-panel
    ${withGlow ? "glow-box" : ""}
    ${className}
  `;

  const content = (
    <div className={baseClasses} {...props}>
      {withCorners && (
        <>
          <div
            className={`corner-bracket corner-tl ${prefersReducedMotion ? "" : "animate-corner-pulse"}`}
          />
          <div
            className={`corner-bracket corner-tr ${prefersReducedMotion ? "" : "animate-corner-pulse"}`}
          />
          <div
            className={`corner-bracket corner-bl ${prefersReducedMotion ? "" : "animate-corner-pulse"}`}
          />
          <div
            className={`corner-bracket corner-br ${prefersReducedMotion ? "" : "animate-corner-pulse"}`}
          />
        </>
      )}
      {children}
    </div>
  );

  if (!animated || prefersReducedMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {content}
    </motion.div>
  );
};
