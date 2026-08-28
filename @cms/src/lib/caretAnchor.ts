import { CAROUSEL_RE } from "@smc/shared/markdown";

/** Zero-based markdown line the caret sits on, in the coordinate space the preview renders:
 *  processCarousel collapses every carousel block onto a single line before parsing. */
export const toPreviewLine = (value: string, caretIndex: number): number => {
  let line = value.slice(0, caretIndex).split("\n").length - 1;
  for (const match of value.matchAll(CAROUSEL_RE)) {
    const end = (match.index ?? 0) + match[0].length;
    if (end <= caretIndex) line -= match[0].split("\n").length - 1;
  }
  return line;
};

const MIRROR_PROPS = [
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "textIndent",
  "textTransform",
  "whiteSpace",
  "wordBreak",
  "wordSpacing",
  "overflowWrap",
  "hyphens",
  "tabSize",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
] as const;

/** Wrap-aware caret offset (px) from the top of the textarea's viewport, measured with a
 *  mirror div. Returns null when the measurement is unavailable. */
export const caretViewportY = (ta: HTMLTextAreaElement, value: string, caretIndex: number): number | null => {
  const cs = getComputedStyle(ta);
  const mirror = document.createElement("div");
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.boxSizing = "border-box";
  mirror.style.width = `${ta.clientWidth}px`;
  for (const prop of MIRROR_PROPS) mirror.style[prop] = cs[prop];
  mirror.textContent = value.slice(0, caretIndex);
  const pin = document.createElement("span");
  pin.textContent = "\u200B";
  mirror.appendChild(pin);
  document.body.appendChild(mirror);
  try {
    const y =
      pin.getBoundingClientRect().top -
      mirror.getBoundingClientRect().top +
      parseFloat(cs.borderTopWidth) -
      ta.scrollTop;
    return Number.isFinite(y) ? y : null;
  } finally {
    mirror.remove();
  }
};
