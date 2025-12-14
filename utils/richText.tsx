
import React from 'react';

// Regex to find [text](url) patterns
const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

export const parseRichText = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = LINK_REGEX.exec(text)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Push link component
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a 
        key={match.index} 
        href={linkUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-mc-accent hover:text-white hover:underline transition-colors font-semibold"
      >
        {linkText}
      </a>
    );

    lastIndex = LINK_REGEX.lastIndex;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};
