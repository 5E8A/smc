import React from "react";

const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Parses rich text, converting Markdown-style links and newline characters (\n)
 * into an array of React Nodes (<a> tags and text/ <br /> tags).
 * * @param text The input string containing rich text elements.
 * @returns An array of React.ReactNode elements.
 */
export const parseRichText = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = LINK_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a key={`link-${match.index}`} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-mc-accent hover:text-white hover:underline transition-colors font-semibold">
        {linkText}
      </a>
    );

    lastIndex = LINK_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  const finalNodes: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (typeof part === "string") {
      const segments = part.split("\n");

      segments.forEach((segment, segmentIndex) => {
        if (segment.length > 0) {
          finalNodes.push(segment);
        }

        if (segmentIndex < segments.length - 1) {
          finalNodes.push(<br key={`br-${index}-${segmentIndex}`} />);
        }
      });
    } else {
      finalNodes.push(part);
    }
  });

  return finalNodes;
};
