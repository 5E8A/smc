const VIDEO_EXT_RE = /\.(?:webm|mp4)$/i;

/** True when a markdown media target points at a video file the preview must render via <video>. */
export const isVideoSrc = (src: string): boolean => VIDEO_EXT_RE.test(src);

/** First-frame poster convention shared with uploads: <name>.static.webp next to the video. */
export const videoPosterSrc = (src: string): string => src.replace(/\.[^.]+$/, ".static.webp");
