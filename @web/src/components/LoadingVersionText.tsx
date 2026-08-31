// src/components/LoadingVersionText.tsx (Modified)

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePlaybackGate";

interface LoadingVersionTextProps {
  // The format to mimic, e.g., "0.0.0" or "v1.2.3"
  format: string;
}

/**
 * Displays a "glitch text" effect for a loading state, taking styling
 * from its parent element.
 */
export const LoadingVersionText = ({ format }: LoadingVersionTextProps) => {
  const [glitchText, setGlitchText] = useState(format);
  const reduced = usePrefersReducedMotion();
  const placeholderChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"; // Shortened for efficiency

  const generateGlitchText = (targetFormat: string): string => {
    let newText = "";
    for (let i = 0; i < targetFormat.length; i++) {
      const char = targetFormat[i];
      // Keep structural characters (like '.', 'v', or spaces) as they are
      if (char === "." || char === "v" || char === "V" || char === " ") {
        newText += char;
      } else {
        const randomIndex = Math.floor(Math.random() * placeholderChars.length);
        newText += placeholderChars[randomIndex];
      }
    }
    return newText;
  };

  useEffect(() => {
    if (reduced) return;
    const intervalId = setInterval(() => {
      setGlitchText(generateGlitchText(format));
    }, 100);

    return () => clearInterval(intervalId);
  }, [format, reduced]);

  // Notice: No 'font-mc' or other styling is applied here.
  return <>{glitchText}</>;
};

export default LoadingVersionText;
